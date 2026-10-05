@echo off
chcp 65001 >nul
title Hass Panel - Launcher
cd /d "%~dp0"

echo Starting backend and frontend in two windows...
echo.

start "Hass Panel - Backend" cmd /c start-backend.bat
timeout /t 6 >nul
start "Hass Panel - Frontend" cmd /c start-frontend.bat

echo Waiting for the frontend to compile (about 60 seconds)...
timeout /t 60 >nul

start "" http://127.0.0.1:3000
echo Browser opened. If the page is blank, wait a bit and refresh.
timeout /t 5 >nul
