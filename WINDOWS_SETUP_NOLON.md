# TradingView MCP — Windows Setup (nolon's machine)

## What Makes This Setup Different

Two issues specific to this machine that required workarounds:

1. **TradingView is installed via Windows Store (MSIX)** — not the direct installer.
   The exe lives in a protected folder and can't be launched the normal way.
   → Solution: launch the exe directly with a debug port flag.

2. **Lenovo Vantage already owns port 9222** — the default CDP port.
   → Solution: use port **9223** instead. This is baked into the MCP config.

---

## One-Time Setup (already done)

| What | Where |
|---|---|
| Repo cloned | `C:\Users\nolon\tradingview-mcp-jackson` |
| MCP config | `C:\Users\nolon\.claude\mcp.json` |
| TradingView exe | `C:\Program Files\WindowsApps\TradingView.Desktop_3.1.0.7818_x64__n534cwy3pjxzj\TradingView.exe` |
| CDP port | **9223** (not 9222 — Lenovo Vantage uses that) |

The `mcp.json` already has `TV_CDP_PORT=9223` set:

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["C:\\Users\\nolon\\tradingview-mcp-jackson\\src\\server.js"],
      "env": { "TV_CDP_PORT": "9223" }
    }
  }
}
```

---

## Every Session — Start TradingView with CDP

TradingView must be launched with the debug port **every time**. The normal shortcut does NOT enable CDP.

### Option A — PowerShell (most reliable)

Open PowerShell and run:

```powershell
$tvExe = "C:\Program Files\WindowsApps\TradingView.Desktop_3.1.0.7818_x64__n534cwy3pjxzj\TradingView.exe"
taskkill /F /IM TradingView.exe 2>$null
Start-Sleep -Seconds 2
Start-Process -FilePath $tvExe -ArgumentList "--remote-debugging-port=9223"
```

Wait ~8 seconds for TradingView to fully load.

### Option B — Bat script

```
C:\Users\nolon\tradingview-mcp-jackson\scripts\launch_tv_debug_msix.bat
```

### Verify CDP is live

```powershell
curl http://localhost:9223/json/version
```

You should see `"TradingView/3.1.0"` in the response. If you do, you're ready.

---

## Verify Connection

From terminal:
```bash
TV_CDP_PORT=9223 tv status
```

Expected output:
```json
{
  "success": true,
  "cdp_connected": true,
  "chart_symbol": "...",
  "api_available": true
}
```

Or in Claude Code after restarting it:
> *"Use tv_health_check to verify TradingView is connected"*

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `cdp_connected: false` | TradingView isn't running with debug port — redo the PowerShell launch above |
| `fetch failed` / port not responding | Same as above — relaunch TradingView |
| Port 9223 taken by something else | Check with `netstat -ano \| findstr :9223`, kill that PID, relaunch |
| MCP tools not showing in Claude Code | Restart Claude Code **after** TradingView is already running with CDP |
| TradingView opens but no CDP | Make sure you killed the old instance first (`taskkill /F /IM TradingView.exe`) |

---

## Daily Workflow

1. Open PowerShell → run the 4-line launch block above
2. Wait for TradingView to load (~8 sec)
3. Open Claude Code
4. Start chatting — e.g. *"What's on my chart right now?"*

---

## Useful CLI Commands

```bash
TV_CDP_PORT=9223 tv status                 # check connection
TV_CDP_PORT=9223 tv quote                  # current price
TV_CDP_PORT=9223 tv timeframe 60           # switch to 1H
TV_CDP_PORT=9223 tv timeframe 15           # switch to 15m
TV_CDP_PORT=9223 tv symbol BTCUSDT         # change symbol
TV_CDP_PORT=9223 tv brief                  # morning bias scan
TV_CDP_PORT=9223 tv ohlcv --summary        # price summary
```

---

*Last updated: 2026-05-13*
*Setup completed with Claude Code*
