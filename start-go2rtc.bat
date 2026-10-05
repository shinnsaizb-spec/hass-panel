@echo off
chcp 65001 >nul
title Hass Panel - go2rtc (RTSP -> WebRTC/HLS)
cd /d "%~dp0data\hass-panel-dev"

if not exist "go2rtc\go2rtc.exe" (
  echo [ERROR] go2rtc.exe not found at data\hass-panel-dev\go2rtc\
  echo         Please re-download go2rtc_win64.zip and extract it there.
  pause
  exit /b 1
)

echo ============================================
echo   Starting go2rtc  -^>  http://127.0.0.1:5125/go2rtc
echo   Needed by the Camera card to play RTSP streams.
echo   Keep this window OPEN while using cameras.
echo ============================================
echo.

go2rtc\go2rtc.exe -c go2rtc.yaml

echo.
echo go2rtc has stopped.
pause >nul
