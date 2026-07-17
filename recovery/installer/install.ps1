[CmdletBinding()]
param(
    [string]$ExtensionsRoot = (Join-Path $env:APPDATA 'Adobe\CEP\extensions'),
    [string]$StateRoot = (Join-Path $env:LOCALAPPDATA 'DinhSon\CEP'),
    [switch]$SkipHostCheck,
    [switch]$SkipProcessCheck,
    [switch]$SkipRegistry,
    [switch]$SimulateIllustratorRunning,
    [string]$FailAfterExtension = ''
)

$ErrorActionPreference = 'Stop'
$PackageRoot = Split-Path -Parent $PSScriptRoot
$ExtensionIds = @('com.dinhson.imposition', 'com.dinhson.weddingscripter', 'com.dinhson.toolkit')
$PreservedRelativePaths = @('data\presets.json', 'data\presets.usage.json')
$LogPath = $null

function Throw-InstallError([int]$Code, [string]$Message) {
    $exception = New-Object System.Exception($Message)
    $exception.Data['ExitCode'] = $Code
    throw $exception
}

function Write-InstallLog([string]$Message) {
    $line = "{0} {1}" -f ([DateTime]::UtcNow.ToString('o')), $Message
    if ($LogPath) { Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8 }
    Write-Host $Message
}

function Get-Sha256([string]$LiteralPath) {
    $algorithm = [Security.Cryptography.SHA256]::Create()
    $stream = $null
    try {
        $stream = [IO.File]::OpenRead($LiteralPath)
        $bytes = $algorithm.ComputeHash($stream)
        return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    } finally {
        if ($stream) { $stream.Dispose() }
        $algorithm.Dispose()
    }
}

function Remove-EntryNoFollow([string]$LiteralPath) {
    if (-not (Test-Path -LiteralPath $LiteralPath)) { return }
    $attributes = [IO.File]::GetAttributes($LiteralPath)
    if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        if ([IO.Directory]::Exists($LiteralPath)) { [IO.Directory]::Delete($LiteralPath, $false) }
        else { [IO.File]::Delete($LiteralPath) }
    } elseif ([IO.Directory]::Exists($LiteralPath)) {
        foreach ($child in (Get-ChildItem -LiteralPath $LiteralPath -Force)) {
            Remove-EntryNoFollow $child.FullName
        }
        Remove-Item -LiteralPath $LiteralPath -Force
    } else {
        Remove-Item -LiteralPath $LiteralPath -Force
    }
}

function Assert-SafeRelativePath([string]$RelativePath) {
    if ([IO.Path]::IsPathRooted($RelativePath) -or $RelativePath -match '(^|[\\/])\.\.([\\/]|$)') {
        Throw-InstallError 10 "Unsafe checksum path: $RelativePath"
    }
}

function Get-PayloadFilesNoLinks([string]$Root, [string]$Current = '') {
    $currentPath = if ($Current) { Join-Path $Root $Current } else { $Root }
    $results = New-Object System.Collections.Generic.List[string]
    foreach ($entry in (Get-ChildItem -LiteralPath $currentPath -Force)) {
        $relative = if ($Current) { Join-Path $Current $entry.Name } else { $entry.Name }
        if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            Throw-InstallError 10 "Payload links are forbidden: $relative"
        }
        if ($entry.PSIsContainer) {
            foreach ($nested in (Get-PayloadFilesNoLinks $Root $relative)) { $results.Add($nested) }
        } else {
            $results.Add($relative)
        }
    }
    return $results
}

function Test-PackageIntegrity([string]$Root) {
    $sumFile = Join-Path $Root 'SHA256SUMS.txt'
    if (-not (Test-Path -LiteralPath $sumFile)) { Throw-InstallError 10 'SHA256SUMS.txt is missing.' }
    $seen = @{}
    foreach ($line in (Get-Content -LiteralPath $sumFile -Encoding UTF8)) {
        if (-not $line) { continue }
        if ($line -notmatch '^([0-9a-fA-F]{64}) \*(.+)$') { Throw-InstallError 10 "Invalid checksum line: $line" }
        $expected = $Matches[1].ToLowerInvariant()
        $relative = $Matches[2].Replace('/', '\')
        Assert-SafeRelativePath $relative
        if ($seen.ContainsKey($relative)) { Throw-InstallError 10 "Duplicate checksum path: $relative" }
        $seen[$relative] = $true
        $target = Join-Path $Root $relative
        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { Throw-InstallError 10 "Payload file is missing: $relative" }
        $actual = Get-Sha256 $target
        if ($actual -ne $expected) { Throw-InstallError 10 "Payload hash mismatch: $relative" }
    }
    $actualFiles = @(Get-PayloadFilesNoLinks $Root | Where-Object { $_ -ne 'SHA256SUMS.txt' } | Sort-Object)
    $expectedFiles = @($seen.Keys | Sort-Object)
    if (($actualFiles -join "`n") -ne ($expectedFiles -join "`n")) {
        Throw-InstallError 10 'Payload contains an unlisted or missing file.'
    }
    $actualIds = @(Get-ChildItem -LiteralPath (Join-Path $Root 'extensions') -Force -Directory | ForEach-Object { $_.Name } | Sort-Object)
    $expectedIds = @($ExtensionIds | Sort-Object)
    if (($actualIds -join "`n") -ne ($expectedIds -join "`n")) {
        Throw-InstallError 10 'Payload must contain exactly the three production extension IDs.'
    }
    foreach ($id in $ExtensionIds) {
        if (-not (Test-Path -LiteralPath (Join-Path $Root "extensions\$id\CSXS\manifest.xml") -PathType Leaf)) {
            Throw-InstallError 10 "Production extension payload is missing: $id"
        }
    }
}

function Assert-SupportedEnvironment {
    if ($env:OS -ne 'Windows_NT') { Throw-InstallError 40 'This recovery package supports Windows only.' }
    if ($SimulateIllustratorRunning -or (-not $SkipProcessCheck -and (Get-Process -Name Illustrator -ErrorAction SilentlyContinue))) {
        Throw-InstallError 20 'Adobe Illustrator is running. Close it and run the installer again.'
    }
    if ($SkipHostCheck) { return }
    $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ }
    $found = $false
    foreach ($root in $roots) {
        foreach ($year in @('2025', '2026')) {
            if (Test-Path -LiteralPath (Join-Path $root "Adobe\Adobe Illustrator $year")) { $found = $true }
        }
    }
    if (-not $found) { Throw-InstallError 40 'Adobe Illustrator 2025 or 2026 was not detected.' }
}

function Enable-CepDebugMode {
    if ($SkipRegistry) { return }
    foreach ($version in @('CSXS.11', 'CSXS.12')) {
        $key = "HKCU:\Software\Adobe\$version"
        New-Item -Path $key -Force | Out-Null
        New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
    }
}

function Save-UserData([string]$SourceRoot, [string]$DestinationRoot) {
    foreach ($relative in $PreservedRelativePaths) {
        $source = Join-Path $SourceRoot $relative
        if (Test-Path -LiteralPath $source -PathType Leaf) {
            $target = Join-Path $DestinationRoot $relative
            New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
            Copy-Item -LiteralPath $source -Destination $target -Force
        }
    }
}

function Restore-UserData([string]$DestinationRoot, [string[]]$CandidateRoots) {
    foreach ($relative in $PreservedRelativePaths) {
        foreach ($candidateRoot in $CandidateRoots) {
            $source = Join-Path $candidateRoot $relative
            if (Test-Path -LiteralPath $source -PathType Leaf) {
                $target = Join-Path $DestinationRoot $relative
                New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
                Copy-Item -LiteralPath $source -Destination $target -Force
                break
            }
        }
    }
}

$stageRoot = $null
$rollbackRoot = Join-Path $StateRoot 'rollback\previous'
$preservedRoot = Join-Path $StateRoot 'preserved-user-data\com.dinhson.imposition'
$replacedIds = New-Object System.Collections.Generic.List[string]

try {
    New-Item -ItemType Directory -Path $StateRoot -Force | Out-Null
    $logDir = Join-Path $StateRoot 'logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $LogPath = Join-Path $logDir ("install-{0}.log" -f ([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')))
    Write-InstallLog 'Verifying recovery package integrity.'
    Test-PackageIntegrity $PackageRoot
    Assert-SupportedEnvironment

    $manifest = Get-Content -LiteralPath (Join-Path $PackageRoot 'release-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.schemaVersion -ne 1 -or $manifest.extensions.Count -ne 3) { Throw-InstallError 10 'Release manifest contract is invalid.' }
    $manifestIds = @($manifest.extensions | ForEach-Object { $_.id } | Sort-Object)
    if (($manifestIds -join "`n") -ne (@($ExtensionIds | Sort-Object) -join "`n")) { Throw-InstallError 10 'Release manifest extension IDs are invalid.' }

    New-Item -ItemType Directory -Path $ExtensionsRoot -Force | Out-Null
    $stageRoot = Join-Path $ExtensionsRoot ('.dinhson-recovery-staging-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
    foreach ($id in $ExtensionIds) {
        Copy-Item -LiteralPath (Join-Path $PackageRoot "extensions\$id") -Destination (Join-Path $stageRoot $id) -Recurse -Force
    }
    foreach ($line in (Get-Content -LiteralPath (Join-Path $PackageRoot 'SHA256SUMS.txt') -Encoding UTF8)) {
        if ($line -match '^([0-9a-fA-F]{64}) \*extensions[\\/](.+)$') {
            $expected = $Matches[1].ToLowerInvariant()
            $stagedPath = Join-Path $stageRoot $Matches[2].Replace('/', '\')
            if (-not (Test-Path -LiteralPath $stagedPath -PathType Leaf) -or (Get-Sha256 $stagedPath) -ne $expected) {
                Throw-InstallError 30 "Staged copy integrity failed: $($Matches[2])"
            }
        }
    }

    Remove-EntryNoFollow $rollbackRoot
    New-Item -ItemType Directory -Path $rollbackRoot -Force | Out-Null
    $existingPresetRoot = Join-Path $ExtensionsRoot 'com.dinhson.imposition'
    Save-UserData $existingPresetRoot $preservedRoot

    foreach ($id in $ExtensionIds) {
        $destination = Join-Path $ExtensionsRoot $id
        $previous = Join-Path $rollbackRoot $id
        if (Test-Path -LiteralPath $destination) {
            Move-Item -LiteralPath $destination -Destination $previous
        }
        try {
            Move-Item -LiteralPath (Join-Path $stageRoot $id) -Destination $destination
        } catch {
            if (Test-Path -LiteralPath $previous) { Move-Item -LiteralPath $previous -Destination $destination }
            throw
        }
        $replacedIds.Add($id)
        if ($FailAfterExtension -eq $id) { Throw-InstallError 30 "Simulated copy failure after $id." }
    }

    Restore-UserData (Join-Path $ExtensionsRoot 'com.dinhson.imposition') @(
        $preservedRoot,
        (Join-Path $rollbackRoot 'com.dinhson.imposition')
    )
    Enable-CepDebugMode

    $state = [ordered]@{
        schemaVersion = 1
        release = $manifest.release
        version = $manifest.version
        commit = $manifest.commit
        installedAt = [DateTime]::UtcNow.ToString('o')
        extensionsRoot = $ExtensionsRoot
        extensionIds = $ExtensionIds
        rollbackPath = $rollbackRoot
        manifestSha256 = Get-Sha256 (Join-Path $PackageRoot 'release-manifest.json')
    }
    $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $StateRoot 'install-state.json') -Encoding UTF8
    Write-InstallLog "Installed $($manifest.release) successfully."
    exit 0
} catch {
    $exitCode = 50
    if ($_.Exception.Data -and $_.Exception.Data.Contains('ExitCode')) { $exitCode = [int]$_.Exception.Data['ExitCode'] }
    if ($exitCode -eq 50 -and $replacedIds.Count -gt 0) { $exitCode = 30 }
    for ($index = $replacedIds.Count - 1; $index -ge 0; $index--) {
        $id = $replacedIds[$index]
        $destination = Join-Path $ExtensionsRoot $id
        $previous = Join-Path $rollbackRoot $id
        try {
            Remove-EntryNoFollow $destination
            if (Test-Path -LiteralPath $previous) { Move-Item -LiteralPath $previous -Destination $destination }
        } catch {
            $exitCode = 30
        }
    }
    [Console]::Error.WriteLine($_.Exception.Message)
    exit $exitCode
} finally {
    if ($stageRoot) { try { Remove-EntryNoFollow $stageRoot } catch { } }
}
