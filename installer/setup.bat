@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================================
:: Wedding Scripter - CEP Panel Installer
:: Author: DinhSon
:: Version: 1.0
:: ============================================================================

title Wedding Scripter - Cai Dat

cls
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║     🎊  WEDDING SCRIPTER - CEP Panel Installer  🎊            ║
echo  ║                                                                ║
echo  ║     Tac gia: DinhSon                                           ║
echo  ║     Phien ban: 1.0                                             ║
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
:: MENU CHON CHE DO
:: ============================================================================
:MENU
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                    CHON CHE DO CAI DAT                         ║
echo  ╠════════════════════════════════════════════════════════════════╣
echo  ║                                                                ║
echo  ║  [1] Developer Mode (SYMLINK)                                  ║
echo  ║      - Danh cho may cua ban (may chinh)                        ║
echo  ║      - Code cap nhat tu dong khi sua                           ║
echo  ║      - Can giu nguyen thu muc Google Drive                     ║
echo  ║                                                                ║
echo  ║  [2] Deployment Mode (COPY)                                    ║
echo  ║      - Danh cho may tram, may in, may nhan vien                ║
echo  ║      - Copy file doc lap, khong can Google Drive               ║
echo  ║      - Can chay lai neu co cap nhat moi                        ║
echo  ║                                                                ║
echo  ║  [3] Thoat                                                     ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.
set /p choice="  Nhap lua chon cua ban (1, 2, hoac 3): "

if "%choice%"=="1" goto INSTALL_SYMLINK
if "%choice%"=="2" goto INSTALL_COPY
if "%choice%"=="3" goto EXIT
echo.
echo  [!] Lua chon khong hop le. Vui long nhap 1, 2 hoac 3.
echo.
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
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" -Mode Symlink
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
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" -Mode Copy
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
echo  ║  2. Vao menu: Window  - Extensions - Wedding Scripter          ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
goto END

:: ============================================================================
:: THOAT
:: ============================================================================
:EXIT
echo.
echo  Tam biet! Hen gap lai.
echo.
exit /b 0

:END
echo.
echo  Nhan phim bat ky de dong cua so nay...
pause >nul
exit /b 0
