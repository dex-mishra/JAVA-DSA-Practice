# Register the DSA planner and Skraple MCP servers with Claude Code at user
# scope, so every Claude Code session on this PC (the desktop app's Code tab
# included) can use them. Safe to re-run: existing entries are replaced.
#
#   powershell -ExecutionPolicy Bypass -File tools\connect-claude.ps1
#
# Both servers talk to the local apps, so start those first (Start Local.cmd).
# The planner server is registered as "dsa-planner", not "launch-console": the
# repo's .mcp.json still carries a launch-console entry with another machine's
# paths, and a project entry would win over a user one of the same name.

$ErrorActionPreference = 'Stop'
$Root    = Split-Path -Parent $PSScriptRoot
$Python  = Join-Path $Root 'mcp\.venv\Scripts\python.exe'
$Planner = Join-Path $Root 'mcp\server.py'
$Skraple = Join-Path $Root 'SKRAPLE_THE-EMAIL-MARKETING-PROJECT-main\server\src\mcp\server.js'

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  throw 'The claude command was not found. Install Claude Code first: https://claude.com/claude-code'
}
if (-not (Test-Path $Python)) {
  Write-Host 'Setting up the planner MCP environment (one time)...'
  python -m venv (Join-Path $Root 'mcp\.venv')
  & $Python -m pip install -q -r (Join-Path $Root 'mcp\requirements.txt')
}

# Nothing to remove on a first run is fine; PowerShell 5.1 would otherwise
# turn claude's "No MCP server named ..." on stderr into a terminating error.
foreach ($name in 'dsa-planner', 'skraple') {
  try { claude mcp remove $name --scope user *> $null } catch { }
}
# --env takes several values, so it goes after the name or it swallows it.
claude mcp add --scope user dsa-planner --env CONSOLE_URL=http://localhost:8000 -- $Python $Planner
claude mcp add --scope user skraple -- node $Skraple

Write-Host ''
Write-Host 'Registered. Restart Claude Code (or open a new session) to load them.'
claude mcp list
