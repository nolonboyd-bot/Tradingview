@echo off
REM Launch TradingView Desktop (Windows Store/MSIX version) with Chrome DevTools Protocol enabled

set PORT=9223
set "TV_EXE=C:\Program Files\WindowsApps\TradingView.Desktop_3.1.0.7818_x64__n534cwy3pjxzj\TradingView.exe"

REM Kill any existing TradingView instances first
taskkill /F /IM TradingView.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting TradingView with --remote-debugging-port=%PORT%...
start "" "%TV_EXE%" --remote-debugging-port=%PORT%

echo Waiting for TradingView to start...
timeout /t 8 /nobreak >nul

:check
curl -s http://localhost:%PORT%/json/version >nul 2>&1
if %errorlevel% neq 0 (
    echo Still waiting for CDP...
    timeout /t 2 /nobreak >nul
    goto check
)

echo.
echo CDP is live at http://localhost:%PORT%
curl -s http://localhost:%PORT%/json/version
echo.
echo You can now use tv_health_check in Claude Code.
