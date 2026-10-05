@echo off
chcp 65001 >nul
title Hass Panel - Backend (port 5124)
cd /d "%~dp0backend"

echo ============================================
echo   Starting backend  -^>  http://127.0.0.1:5124
echo   Keep this window OPEN while using the app
echo ============================================
echo.

.venv\Scripts\python.exe hass_panel\main.py

echo.
echo Backend has stopped.
pause >nul
