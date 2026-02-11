@echo off
echo.
echo ========================================================
echo   WEDDING SCRIPTER - DEV INSTALLER (SYMLINK)
echo ========================================================
echo.
echo   This script will link the current project to Adobe CEP.
echo.

cd /d "%~dp0"
node scripts/install.js

echo.
if %errorlevel% neq 0 (
    echo ❌ Installation Failed!
    echo    Please check privileges or Node.js installation.
) else (
    echo ✅ Installation Complete!
    echo    Restart Adobe Illustrator to see the extension.
)
echo.
pause
