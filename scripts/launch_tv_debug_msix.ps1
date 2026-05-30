# TradingView MSIX workaround — two methods tried in order
# Method 1: Direct exe launch with --remote-debugging-port
# Method 2: Set ELECTRON_EXTRA_LAUNCH_ARGS env var then launch via shell AUMID

param([int]$Port = 9223)

$tvExe = "C:\Program Files\WindowsApps\TradingView.Desktop_3.1.0.7818_x64__n534cwy3pjxzj\TradingView.exe"
$aumid  = "TradingView.Desktop_n534cwy3pjxzj!TradingView.Desktop"

# Kill existing instance
Get-Process -Name "TradingView" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Trying Method 1: direct exe with --remote-debugging-port=$Port ..."
Start-Process -FilePath $tvExe -ArgumentList "--remote-debugging-port=$Port"
Start-Sleep -Seconds 8

# Check if CDP responded
try {
    $r = Invoke-WebRequest "http://localhost:$Port/json/version" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "`nMethod 1 worked! CDP is live at http://localhost:$Port"
    Write-Host $r.Content
    exit 0
} catch { }

Write-Host "Method 1 did not open CDP. Trying Method 2: ELECTRON_EXTRA_LAUNCH_ARGS ..."

# Kill the instance launched without CDP
Get-Process -Name "TradingView" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Set the env var at user level so it persists across launches
[Environment]::SetEnvironmentVariable("ELECTRON_EXTRA_LAUNCH_ARGS", "--remote-debugging-port=$Port", "User")
$env:ELECTRON_EXTRA_LAUNCH_ARGS = "--remote-debugging-port=$Port"

Write-Host "ELECTRON_EXTRA_LAUNCH_ARGS set. Launching TradingView via shell AUMID..."
Start-Process "explorer.exe" "shell:AppsFolder\$aumid"
Start-Sleep -Seconds 10

for ($i = 0; $i -lt 10; $i++) {
    try {
        $r = Invoke-WebRequest "http://localhost:$Port/json/version" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "`nMethod 2 worked! CDP is live at http://localhost:$Port"
        Write-Host $r.Content
        exit 0
    } catch {
        Write-Host "Still waiting... ($i)"
        Start-Sleep -Seconds 2
    }
}

Write-Host "`nNeither method opened CDP port $Port."
Write-Host "TradingView (MSIX) may not support remote debugging."
Write-Host "Recommended fix: download the direct installer from tradingview.com/desktop"
