@echo off
setlocal

set "SCRIPT=%~dp0export_excel_to_indesign_csv.ps1"

if "%~1"=="" (
    echo Drag an Excel file or a folder onto this CMD, or paste a path below.
    set /p "TARGET=Excel file or folder path: "
) else (
    set "TARGET=%~1"
)

if "%TARGET%"=="" (
    echo No path provided.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Path "%TARGET%"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
    echo Done.
) else (
    echo Failed with exit code %EXIT_CODE%.
)
pause
exit /b %EXIT_CODE%
