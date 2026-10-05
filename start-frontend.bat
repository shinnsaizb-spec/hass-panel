@echo off
chcp 65001 >nul
title Hass Panel - Frontend (port 3000)
cd /d "%~dp0frontend"

set BROWSER=none
set HOST=127.0.0.1
set PORT=3000

echo ============================================
echo   Starting frontend -^>  http://127.0.0.1:3000
echo   First run needs 1-3 minutes to compile.
echo   Wait until you see "Compiled successfully!"
echo   Keep this window OPEN while using the app
echo ============================================
echo.

npm start

echo.
echo Frontend has stopped.
pause >nul
