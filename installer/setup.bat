@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================================
:: CEP Monorepo - Universal Installer
:: Author: DinhSon
:: Version: 2.0
:: ============================================================================

title Adobe Illustrator Extensions - Cai Dat

cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║     🚀  ADOBE ILLUSTRATOR EXTENSIONS - Universal Installer  🚀  ║
echo  ║                                                                ║
echo  ║     Tac gia: DinhSon                                           ║
echo  ║     Phien ban: 2.0 (Monorepo)                                  ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

:: ============================================================================
:: KIEM TRA QUYEN ADMIN
:: ============================================================================
echo  [*] Dang kiem tra quyen Administrator...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  ╔════════════════════════════════════════════════════════════════╗
    echo  ║  ⚠️  LOI: Can chay voi quyen Administrator!                    ║
    echo  ║                                                                ║
    echo  ║  Cach lam:                                                     ║
    echo  ║  1. Dong cua so nay                                            ║
    echo  ║  2. Chuot phai vao file setup.bat                              ║
    echo  ║  3. Chon "Run as administrator"                                ║
    echo  ╚════════════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)
echo  [OK] Dang chay voi quyen Administrator.
echo.

:: ============================================================================
:: MENU CHON DU AN
:: ============================================================================
:SELECT_PROJECT
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                   CHON DU AN MUON CAI DAT                      ║
echo  ╠════════════════════════════════════════════════════════════════╣
echo  ║                                                                ║
echo  ║  [1] Wedding Scripter (Project: wedding-cep)                   ║
echo  ║  [2] Imposition Panel (Project: symbol-cep)                    ║
echo  ║  [3] Thoat                                                     ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
set /p p_choice="  Nhap lua chon (1, 2, hoac 3): "

if "%p_choice%"=="1" (
    set TARGET_PROJECT=Wedding
    goto MENU
)
if "%p_choice%"=="2" (
    set TARGET_PROJECT=Symbol
    goto MENU
)
if "%p_choice%"=="3" goto EXIT

echo.
echo  [!] Lua chon khong hop le.
goto SELECT_PROJECT

:: ============================================================================
:: MENU CHON CHE DO
:: ============================================================================
:MENU
cls
echo.
echo  ================================================================
echo   Dang thiet lap cho: %TARGET_PROJECT%
echo  ================================================================
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                    CHON CHE DO CAI DAT                         ║
echo  ╠════════════════════════════════════════════════════════════════╣
echo  ║                                                                ║
echo  ║  [1] Developer Mode (SYMLINK)                                  ║
echo  ║      - Danh cho may cua ban (may chinh)                        ║
echo  ║      - Code cap nhat tu dong khi sua                           ║
echo  ║                                                                ║
echo  ║  [2] Deployment Mode (COPY)                                    ║
echo  ║      - Danh cho may tram, may in, may nhan vien                ║
echo  ║      - Copy file doc lap                                       ║
echo  ║                                                                ║
echo  ║  [3] Quay lai chon Project                                     ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
set /p choice="  Nhap lua chon (1, 2, hoac 3): "

if "%choice%"=="1" goto INSTALL_SYMLINK
if "%choice%"=="2" goto INSTALL_COPY
if "%choice%"=="3" goto SELECT_PROJECT

echo.
echo  [!] Lua chon khong hop le.
goto MENU

:: ============================================================================
:: CAI DAT SYMLINK MODE
:: ============================================================================
:INSTALL_SYMLINK
echo.
echo  ========================================
echo   Dang cai dat Developer Mode (Symlink)
echo  ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" -Mode Symlink -Project %TARGET_PROJECT%
if %errorLevel% neq 0 (
    echo.
    echo  [X] Cai dat that bai! Vui long kiem tra lai.
    goto END
)
goto SUCCESS

:: ============================================================================
:: CAI DAT COPY MODE
:: ============================================================================
:INSTALL_COPY
echo.
echo  ========================================
echo   Dang cai dat Deployment Mode (Copy)
echo  ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" -Mode Copy -Project %TARGET_PROJECT%
if %errorLevel% neq 0 (
    echo.
    echo  [X] Cai dat that bai! Vui long kiem tra lai.
    goto END
)
goto SUCCESS

:: ============================================================================
:: THANH CONG
:: ============================================================================
:SUCCESS
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║  ✅  CAI DAT THANH CONG!                                       ║
echo  ║                                                                ║
echo  ║  Buoc tiep theo:                                               ║
echo  ║  1. Khoi dong lai Adobe Illustrator                            ║
echo  ║  2. Vao menu: Window - Extensions                              ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

set /p again="  Ban co muon cai project khac khong? (C/K): "
if /i "%again%"=="C" goto SELECT_PROJECT
goto EXIT

:: ============================================================================
:: THOAT
:: ============================================================================
:EXIT
echo.
echo  Tam biet! Hen gap lai.
echo.
timeout /t 3
exit /b 0

:END
echo.
echo  Nhan phim bat ky để dong...
pause >nul
exit /b 0
