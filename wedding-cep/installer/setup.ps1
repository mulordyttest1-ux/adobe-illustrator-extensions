[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("Symlink", "Copy")]
    [string]$Mode
)

# Set UTF-8 encoding for Vietnamese
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================
$ExtensionId = "com.dinhson.weddingscripter"
$ExtensionName = "Wedding Scripter"

# Source: go up from 'installer' folder, then into 'cep'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourcePath = Join-Path (Split-Path -Parent $ScriptDir) "cep"
$DestRoot = "$env:APPDATA\Adobe\CEP\extensions"
$DestPath = "$DestRoot\$ExtensionId"

Write-Host ""
Write-Host "  [INFO] Extension: $ExtensionName" -ForegroundColor Cyan
Write-Host "  [INFO] Mode: $Mode" -ForegroundColor Cyan
Write-Host "  [INFO] Source: $SourcePath" -ForegroundColor Gray
Write-Host "  [INFO] Dest: $DestPath" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# STEP 1: REGISTRY - Enable Debug Mode
# ============================================================================
Write-Host "  [1/4] Cau hinh Registry (PlayerDebugMode)..." -ForegroundColor Yellow

$CsxsVersions = @("9", "10", "11", "12", "13", "14", "15", "16")
$regSuccess = 0

foreach ($ver in $CsxsVersions) {
    $regPath = "HKCU:\Software\Adobe\CSXS.$ver"
    try {
        if (!(Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        Set-ItemProperty -Path $regPath -Name "PlayerDebugMode" -Value "1" -Type String -Force
        $regSuccess++
    }
    catch {
        # Ignore errors for missing CSXS versions
    }
}

Write-Host "        Da enable debug cho $regSuccess phien ban CSXS." -ForegroundColor Green

# ============================================================================
# STEP 2: Verify Source Exists
# ============================================================================
Write-Host ""
Write-Host "  [2/4] Kiem tra thu muc nguon..." -ForegroundColor Yellow

if (!(Test-Path $SourcePath)) {
    Write-Host "        [LOI] Khong tim thay thu muc: $SourcePath" -ForegroundColor Red
    Write-Host "        Vui long dam bao thu muc 'cep' ton tai trong project." -ForegroundColor Red
    exit 1
}

# Check for essential files
$requiredFiles = @("index.html", "CSXS\manifest.xml")
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $SourcePath $file
    if (!(Test-Path $fullPath)) {
        Write-Host "        [LOI] Thieu file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "        Thu muc nguon hop le." -ForegroundColor Green

# ============================================================================
# STEP 3: Prepare Destination
# ============================================================================
Write-Host ""
Write-Host "  [3/4] Chuan bi thu muc dich..." -ForegroundColor Yellow

# Ensure destination root exists
if (!(Test-Path $DestRoot)) {
    New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null
    Write-Host "        Da tao thu muc: $DestRoot" -ForegroundColor Green
}

# Remove existing extension if present
if (Test-Path $DestPath) {
    Write-Host "        Phat hien phien ban cu, dang xoa..." -ForegroundColor Gray
    try {
        $item = Get-Item $DestPath -Force
        if ($item.Attributes -match "ReparsePoint") {
            # It's a symlink/junction
            cmd /c "rmdir `"$DestPath`"" 2>$null
        }
        else {
            # It's a regular folder
            Remove-Item -Path $DestPath -Recurse -Force
        }
        Write-Host "        Da xoa phien ban cu." -ForegroundColor Green
    }
    catch {
        Write-Host "        [LOI] Khong the xoa phien ban cu: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# STEP 4: Install Extension
# ============================================================================
Write-Host ""
Write-Host "  [4/4] Cai dat Extension..." -ForegroundColor Yellow

if ($Mode -eq "Symlink") {
    try {
        New-Item -ItemType SymbolicLink -Path $DestPath -Target $SourcePath | Out-Null
        Write-Host "        SYMLINK da duoc tao thanh cong!" -ForegroundColor Green
    }
    catch {
        Write-Host "        [LOI] Khong the tao Symlink: $_" -ForegroundColor Red
        Write-Host "        Thu chay lai voi quyen Administrator." -ForegroundColor Yellow
        exit 1
    }
}
else {
    # Copy Mode
    try {
        Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
        Write-Host "        Da copy file thanh cong!" -ForegroundColor Green
    }
    catch {
        Write-Host "        [LOI] Khong the copy file: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# VERIFICATION
# ============================================================================
Write-Host ""
Write-Host "  [*] Kiem tra ket qua..." -ForegroundColor Yellow

if (Test-Path "$DestPath\index.html") {
    Write-Host "        Extension da duoc cai dat thanh cong!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   Duong dan: $DestPath" -ForegroundColor White
    Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Cyan
}
else {
    Write-Host "        [CANH BAO] Khong tim thay index.html trong thu muc dich." -ForegroundColor Yellow
}

Write-Host ""
exit 0
