[CmdletBinding()]
param(
    [string]$LockFile,
    [string]$TargetPath,
    [switch]$Json,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $LockFile) { $LockFile = Join-Path $repoRoot 'devkit.lock.json' }
. (Join-Path $PSScriptRoot 'native_command.ps1')

function Complete-DevkitResult {
    param(
        [ValidateSet('PASS', 'WARN', 'FAIL')][string]$Status,
        [string]$Message,
        [string]$Remediation,
        [int]$ExitCode,
        [object]$Lock,
        [string]$ResolvedTarget
    )
    $result = [ordered]@{
        version = 1
        status = $Status
        devkitPath = $ResolvedTarget
        repository = if ($Lock) { $Lock.repository } else { $null }
        release = if ($Lock) { $Lock.release } else { $null }
        commit = if ($Lock) { $Lock.commit } else { $null }
        message = $Message
        remediation = $Remediation
    }
    if ($Json) { $result | ConvertTo-Json -Depth 5 } else { Write-Host "[$Status] $Message"; if ($Remediation) { Write-Host $Remediation } }
    exit $ExitCode
}

function Normalize-RemoteUrl {
    param([string]$Value)
    $normalized = [string]$Value
    $normalized = $normalized.Trim().Replace('\', '/')
    $normalized = $normalized -replace '^git@github\.com:', 'https://github.com/'
    $normalized = $normalized -replace '\.git$', ''
    return $normalized.TrimEnd('/').ToLowerInvariant()
}

try {
    if (-not (Test-Path -LiteralPath $LockFile -PathType Leaf)) { throw "Devkit lock is missing: $LockFile" }
    $lock = Get-Content -Raw -LiteralPath $LockFile | ConvertFrom-Json
    if ($lock.schemaVersion -ne 1) { throw 'Unsupported devkit lock schema.' }
    if ($lock.productContractVersion -ne 1) { throw 'Unsupported product/devkit contract version.' }
    if ([string]$lock.repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$') { throw 'Devkit repository must use owner/name form.' }
    if ([string]$lock.siblingDirectory -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Devkit siblingDirectory must be one directory name.' }
    if ([string]$lock.commit -notmatch '^[0-9a-f]{40}$') { throw 'Devkit lock commit must be a full 40-character SHA.' }
    if ([string]$lock.release -notmatch '^v\d+\.\d+\.\d+$') { throw 'Devkit lock release must be a semantic vX.Y.Z tag.' }

    if (-not $TargetPath) {
        if ($env:ADOBE_CEP_DEVKIT_HOME) {
            $TargetPath = $env:ADOBE_CEP_DEVKIT_HOME
        } else {
            $TargetPath = Join-Path (Split-Path $repoRoot -Parent) ([string]$lock.siblingDirectory)
        }
    }
    $TargetPath = [System.IO.Path]::GetFullPath($TargetPath)

    if (-not (Test-Path -LiteralPath $TargetPath)) {
        if ($DryRun) {
            Complete-DevkitResult WARN "Devkit would be cloned to $TargetPath." 'Authenticate GitHub CLI and rerun without --dry-run.' 0 $lock $TargetPath
        }
        if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
            Complete-DevkitResult FAIL 'GitHub CLI is required to clone the private devkit.' 'Run scripts\bootstrap-machine.ps1.' 1 $lock $TargetPath
        }
        & gh auth status *> $null
        if ($LASTEXITCODE -ne 0) {
            Complete-DevkitResult FAIL 'GitHub CLI is not authenticated.' 'Run gh auth login --web --scopes repo,workflow.' 1 $lock $TargetPath
        }
        $parent = Split-Path $TargetPath -Parent
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
        $cloneResult = Invoke-NativeCaptured -FilePath 'gh' -Arguments @('repo', 'clone', ([string]$lock.repository), $TargetPath)
        if ($cloneResult.ExitCode -ne 0) {
            Complete-DevkitResult FAIL 'Private devkit clone failed.' ([string]($cloneResult.Output | Select-Object -Last 1)) 1 $lock $TargetPath
        }
    }

    $inside = (& git -C $TargetPath rev-parse --is-inside-work-tree 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $inside -ne 'true') {
        Complete-DevkitResult FAIL "Devkit target is not a Git repository: $TargetPath" 'Move the conflicting path aside and rerun.' 1 $lock $TargetPath
    }

    $remote = (& git -C $TargetPath remote get-url origin 2>$null | Out-String).Trim()
    $expectedRemote = "https://github.com/$($lock.repository)"
    if ((Normalize-RemoteUrl $remote) -ne (Normalize-RemoteUrl $expectedRemote)) {
        Complete-DevkitResult FAIL "Devkit origin is unexpected: $remote" "Expected $expectedRemote." 1 $lock $TargetPath
    }

    $dirty = (& git -C $TargetPath status --porcelain --untracked-files=normal | Out-String).Trim()
    if ($dirty) {
        Complete-DevkitResult FAIL 'Devkit has local changes; refusing to change its checkout.' 'Commit, stash, or move the devkit changes intentionally, then rerun.' 1 $lock $TargetPath
    }

    $current = (& git -C $TargetPath rev-parse HEAD 2>$null | Out-String).Trim()
    if ($current -ne [string]$lock.commit) {
        if ($DryRun) {
            Complete-DevkitResult WARN "Devkit would move from $current to $($lock.commit)." 'Rerun without --dry-run.' 0 $lock $TargetPath
        }
        $fetchResult = Invoke-NativeCaptured -FilePath 'git' -Arguments @('-C', $TargetPath, 'fetch', '--tags', '--prune', 'origin')
        if ($fetchResult.ExitCode -ne 0) {
            Complete-DevkitResult FAIL 'Could not fetch the pinned devkit commit.' ([string]($fetchResult.Output | Select-Object -Last 1)) 1 $lock $TargetPath
        }
        & git -C $TargetPath cat-file -e "$($lock.commit)^{commit}" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Complete-DevkitResult FAIL 'Pinned devkit commit does not exist on origin.' 'Publish the devkit release before updating devkit.lock.json.' 1 $lock $TargetPath
        }
        $switchResult = Invoke-NativeCaptured -FilePath 'git' -Arguments @('-C', $TargetPath, 'switch', '--detach', ([string]$lock.commit))
        if ($switchResult.ExitCode -ne 0) {
            Complete-DevkitResult FAIL 'Could not checkout the pinned devkit commit.' ([string]($switchResult.Output | Select-Object -Last 1)) 1 $lock $TargetPath
        }
    }

    $tags = @(& git -C $TargetPath tag --points-at ([string]$lock.commit) 2>$null)
    if ($tags -notcontains [string]$lock.release) {
        if ($DryRun) {
            Complete-DevkitResult WARN "Devkit tag $($lock.release) would be fetched and verified." 'Rerun without --dry-run.' 0 $lock $TargetPath
        }
        $tagFetchResult = Invoke-NativeCaptured -FilePath 'git' -Arguments @('-C', $TargetPath, 'fetch', '--tags', '--prune', 'origin')
        if ($tagFetchResult.ExitCode -ne 0) {
            Complete-DevkitResult FAIL "Could not fetch devkit tag $($lock.release)." ([string]($tagFetchResult.Output | Select-Object -Last 1)) 1 $lock $TargetPath
        }
        $tags = @(& git -C $TargetPath tag --points-at ([string]$lock.commit) 2>$null)
        if ($tags -notcontains [string]$lock.release) {
            Complete-DevkitResult FAIL "Pinned commit is not tagged $($lock.release)." 'Publish the immutable devkit tag, then rerun.' 1 $lock $TargetPath
        }
    }
    Complete-DevkitResult PASS "Devkit $($lock.release) is ready at $TargetPath." '' 0 $lock $TargetPath
} catch {
    Complete-DevkitResult FAIL $_.Exception.Message 'Inspect devkit.lock.json and the sibling checkout.' 2 $null $TargetPath
}
