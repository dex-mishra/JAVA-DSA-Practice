# Start the DSA tracker and the local Skraple stack, skipping anything that is
# already running. Run with -Stop to shut it all down again.
#
#   powershell -ExecutionPolicy Bypass -File tools\start-local.ps1 [-Stop]
#
# Pieces:
#   Redis     Ubuntu (WSL) runs redis-server as a service; a hidden `sleep`
#             session keeps the distro, and so Redis, alive.
#   Tracker   wrangler dev: the page plus its /api and a local database
#             (.wrangler/state), so progress saves and the dsa-planner MCP
#             server has something to talk to       http://localhost:8000
#   API       Skraple server (node src/index.js)     http://localhost:5010
#   Worker    Skraple worker: sending, reply polling, schedules (no port)
#   Client    Skraple UI (vite)                      http://localhost:3888
#
# Logs go to %LOCALAPPDATA%\dsa-helper-local\logs.
param([switch]$Stop)

$ErrorActionPreference = 'Stop'
$Root    = Split-Path -Parent $PSScriptRoot
$Skraple = Join-Path $Root 'SKRAPLE_THE-EMAIL-MARKETING-PROJECT-main'
$Server  = Join-Path $Skraple 'server'
$Client  = Join-Path $Skraple 'client'
$Logs    = Join-Path $env:LOCALAPPDATA 'dsa-helper-local\logs'
New-Item -ItemType Directory -Force $Logs | Out-Null

function Test-Port([int]$Port) {
  [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

# wslrelay keeps listening on 6379 even when Redis inside WSL is gone, so an
# open port proves nothing: ask Redis itself.
function Test-Redis {
  try {
    $tcp = New-Object Net.Sockets.TcpClient('127.0.0.1', 6379)
    $stream = $tcp.GetStream()
    $bytes = [Text.Encoding]::ASCII.GetBytes("PING`r`n")
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.ReadTimeout = 2000
    $buf = New-Object byte[] 16
    $n = $stream.Read($buf, 0, 16)
    $tcp.Close()
    return ([Text.Encoding]::ASCII.GetString($buf, 0, $n) -like '+PONG*')
  } catch { return $false }
}

# node processes this script started, matched on their script path.
function Get-StackProcess([string]$Pattern) {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Replace('/', '\') -like "*$Pattern*" }
}

function Start-Hidden([string]$Name, [string]$Exe, [string[]]$ArgList, [string]$Cwd) {
  Start-Process -FilePath $Exe -ArgumentList $ArgList -WorkingDirectory $Cwd -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $Logs "$Name.log") -RedirectStandardError (Join-Path $Logs "$Name.err.log")
  Write-Host "  started $Name"
}

$stack = @(
  @{ Name = 'tracker'; Port = 8000; Match = 'wrangler.js';      Cwd = $Root;   Args = @('node_modules\wrangler\bin\wrangler.js', 'dev', '--port', '8000', '--ip', '127.0.0.1') },
  @{ Name = 'api';     Port = 5010; Match = 'src\index.js';     Cwd = $Server; Args = @('src/index.js') },
  @{ Name = 'worker';  Port = $null; Match = 'worker\index.js'; Cwd = $Server; Args = @('src/worker/index.js') },
  # Relative paths only: Start-Process does not quote arguments, and the repo
  # path has spaces in it.
  @{ Name = 'client';  Port = 3888; Match = 'vite.js';          Cwd = $Client; Args = @('..\node_modules\vite\bin\vite.js', '--port', '3888', '--strictPort') }
)

if ($Stop) {
  foreach ($s in $stack) {
    # /T takes the children too: wrangler runs the Worker in a workerd child
    # that would otherwise keep port 8000.
    foreach ($p in (Get-StackProcess $s.Match)) { taskkill /PID $p.ProcessId /T /F | Out-Null; Write-Host "  stopped $($s.Name)" }
  }
  Get-CimInstance Win32_Process -Filter "Name='wsl.exe'" |
    Where-Object { $_.CommandLine -like '*sleep infinity*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host '  stopped redis keep-alive' }
  return
}

Write-Host 'Redis'
# Always make sure the keep-alive exists: Redis can still be answering from a
# distro that is about to idle out and take it down.
$keepAlive = Get-CimInstance Win32_Process -Filter "Name='wsl.exe'" |
  Where-Object { $_.CommandLine -like '*sleep infinity*' }
if (-not $keepAlive) {
  Start-Process -FilePath 'wsl.exe' -ArgumentList '-d', 'Ubuntu', '--', 'sleep', 'infinity' -WindowStyle Hidden
  Write-Host '  started keep-alive'
}
$deadline = (Get-Date).AddSeconds(30)
while (-not (Test-Redis) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
if (-not (Test-Redis)) { throw 'Redis did not answer within 30s. Check `wsl -d Ubuntu -- systemctl status redis-server`.' }
Write-Host '  ready'

Write-Host 'Services'
foreach ($s in $stack) {
  $running = if ($s.Port) { Test-Port $s.Port } else { [bool](Get-StackProcess $s.Match) }
  if ($running) { Write-Host "  $($s.Name) already running"; continue }
  Start-Hidden $s.Name 'node.exe' $s.Args $s.Cwd
}

Write-Host 'Waiting for the API...'
$deadline = (Get-Date).AddSeconds(60)
$healthy = $false
while (-not $healthy -and (Get-Date) -lt $deadline) {
  try { $healthy = (Invoke-RestMethod -Uri 'http://localhost:5010/api/health' -TimeoutSec 5).dependencies.database.ready } catch { }
  if (-not $healthy) { Start-Sleep -Seconds 2 }
}
if ($healthy) { Write-Host '  API healthy' } else { Write-Host "  API not healthy yet; see $Logs\api.err.log" }

Write-Host ''
Write-Host 'Tracker  http://localhost:8000'
Write-Host 'Skraple  http://localhost:3888'
Start-Process 'http://localhost:8000'
