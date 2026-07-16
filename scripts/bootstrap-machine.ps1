[CmdletBinding()]
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent

function Refresh-ProcessPath {
    $env:Path = @(
        [Environment]::GetEnvironmentVariable('Path', 'Machine'),
        [Environment]::GetEnvironmentVariable('Path', 'User')
    ) -join ';'
}

function Ensure-WinGet {
    if (Get-Command winget -ErrorAction SilentlyContinue) { return }
    Write-Host '[bootstrap] Register Microsoft App Installer.'
    if ($DryRun) { return }
    try {
        Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe -ErrorAction Stop
    } catch {
        Write-Warning $_.Exception.Message
    }
    Refresh-ProcessPath
    if (Get-Command winget -ErrorAction SilentlyContinue) { return }
    $bundle = Join-Path $env:TEMP 'Microsoft.DesktopAppInstaller.msixbundle'
    Invoke-WebRequest -Uri 'https://aka.ms/getwinget' -OutFile $bundle
    $signature = Get-AuthenticodeSignature -LiteralPath $bundle
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft') {
        throw 'App Installer bundle does not have a valid Microsoft signature.'
    }
    Add-AppxPackage -Path $bundle
    Refresh-ProcessPath
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'WinGet remains unavailable.' }
}

if ($env:OS -ne 'Windows_NT') { throw 'Windows is required.' }
Ensure-WinGet

if ($DryRun) {
    Write-Host '[bootstrap] Would install bootstrap Git and GitHub CLI through WinGet.'
} else {
    foreach ($package in @('Git.Git', 'GitHub.cli')) {
        & winget install --id $package --exact --source winget --accept-source-agreements --accept-package-agreements --disable-interactivity
        if ($LASTEXITCODE -ne 0) { throw "WinGet could not install $package." }
    }
    Refresh-ProcessPath
}

if (-not $DryRun) {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI is missing after bootstrap.' }
    & gh auth status *> $null
    if ($LASTEXITCODE -ne 0) {
        & gh auth login --web --scopes 'repo,workflow'
        if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI authentication failed.' }
    }
}

$ensureArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'ensure-devkit.ps1'), '-Json')
if ($DryRun) { $ensureArgs += '-DryRun' }
$raw = & powershell @ensureArgs
$ensureExit = $LASTEXITCODE
$report = ($raw | Out-String) | ConvertFrom-Json
$raw | Write-Output
if ($ensureExit -ne 0) { exit $ensureExit }
if ($DryRun -and $report.status -eq 'WARN') { exit 0 }

$devkitBootstrap = Join-Path ([string]$report.devkitPath) 'bootstrap.ps1'
if (-not (Test-Path -LiteralPath $devkitBootstrap -PathType Leaf)) { throw "Devkit bootstrap is missing: $devkitBootstrap" }
$devkitArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $devkitBootstrap, '-ProductPath', $repoRoot)
if ($DryRun) { $devkitArgs += '-DryRun' }
& powershell @devkitArgs
exit $LASTEXITCODE
