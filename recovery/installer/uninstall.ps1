[CmdletBinding()]
param(
    [string]$ExtensionsRoot = (Join-Path $env:APPDATA 'Adobe\CEP\extensions'),
    [string]$StateRoot = (Join-Path $env:LOCALAPPDATA 'DinhSon\CEP'),
    [switch]$SkipProcessCheck,
    [switch]$SimulateIllustratorRunning
)

$ErrorActionPreference = 'Stop'
$ExtensionIds = @('com.dinhson.imposition', 'com.dinhson.weddingscripter', 'com.dinhson.toolkit')

function Remove-EntryNoFollow([string]$LiteralPath) {
    if (-not (Test-Path -LiteralPath $LiteralPath)) { return }
    $attributes = [IO.File]::GetAttributes($LiteralPath)
    if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        if ([IO.Directory]::Exists($LiteralPath)) { [IO.Directory]::Delete($LiteralPath, $false) }
        else { [IO.File]::Delete($LiteralPath) }
    }
    elseif ([IO.Directory]::Exists($LiteralPath)) {
        foreach ($child in (Get-ChildItem -LiteralPath $LiteralPath -Force)) { Remove-EntryNoFollow $child.FullName }
        Remove-Item -LiteralPath $LiteralPath -Force
    }
    else { Remove-Item -LiteralPath $LiteralPath -Force }
}

try {
    if ($env:OS -ne 'Windows_NT') { exit 40 }
    if ($SimulateIllustratorRunning -or (-not $SkipProcessCheck -and (Get-Process -Name Illustrator -ErrorAction SilentlyContinue))) { exit 20 }
    New-Item -ItemType Directory -Path $StateRoot -Force | Out-Null
    $preservedRoot = Join-Path $StateRoot 'preserved-user-data\com.dinhson.imposition\data'
    New-Item -ItemType Directory -Path $preservedRoot -Force | Out-Null
    $symbolRoot = Join-Path $ExtensionsRoot 'com.dinhson.imposition\data'
    foreach ($name in @('presets.json', 'presets.usage.json')) {
        $source = Join-Path $symbolRoot $name
        if (Test-Path -LiteralPath $source -PathType Leaf) { Copy-Item -LiteralPath $source -Destination (Join-Path $preservedRoot $name) -Force }
    }
    foreach ($id in $ExtensionIds) { Remove-EntryNoFollow (Join-Path $ExtensionsRoot $id) }
    Remove-Item -LiteralPath (Join-Path $StateRoot 'install-state.json') -Force -ErrorAction SilentlyContinue
    exit 0
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 30
}
