# Google Stitch MCP — fresh setup

The old Stitch MCP config was removed. Follow these steps when you have a **new** API key.

## 1. Create a new API key

1. Open https://stitch.withgoogle.com/settings  
2. Under **API Keys**, click **Create API Key**  
3. Copy the new key

## 2. Set the environment variable (Windows)

In PowerShell (replace with your new key):

```powershell
[Environment]::SetEnvironmentVariable("STITCH_API_KEY", "YOUR_NEW_KEY_HERE", "User")
$env:STITCH_API_KEY = "YOUR_NEW_KEY_HERE"
```

Optional: add the same line to `.env` (gitignored):

```
STITCH_API_KEY=YOUR_NEW_KEY_HERE
```

## 3. Enable Stitch MCP in this project

Copy the example config:

```powershell
Copy-Item .cursor\mcp.json.example .cursor\mcp.json
```

Or create `%USERPROFILE%\.cursor\mcp.json` with the same contents for all projects.

## 4. Restart Cursor

Quit Cursor completely and reopen. Then check **Settings → Features → MCP** — **stitch** should appear and be enabled.

## Config reference

`.cursor/mcp.json.example`:

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "${env:STITCH_API_KEY}"
      }
    }
  }
}
```
