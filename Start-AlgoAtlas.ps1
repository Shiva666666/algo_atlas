param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$AtlasRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $AtlasRoot

if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
  python -m venv .venv
}
.\.venv\Scripts\python.exe -m pip install -e .
if (-not (Test-Path -LiteralPath 'node_modules')) { npm install }
if (-not (Test-Path -LiteralPath 'dist\index.html')) { npm run build }

New-Item -ItemType Directory -Force -Path '.local' | Out-Null
try {
  $health = Invoke-RestMethod -TimeoutSec 1 'http://127.0.0.1:8000/api/health'
} catch { $health = $null }

if (-not $health) {
  .\.venv\Scripts\python.exe -m algo_atlas.bootstrap
  $process = Start-Process -FilePath '.\.venv\Scripts\python.exe' -ArgumentList '-m','uvicorn','algo_atlas.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $AtlasRoot -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath '.local\server.pid' -Value $process.Id
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    try { $health = Invoke-RestMethod -TimeoutSec 1 'http://127.0.0.1:8000/api/health'; $ready = $true; break } catch {}
  }
  if (-not $ready) { throw 'Algo Atlas did not start. Run this script from PowerShell to see diagnostics.' }
}

if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:8000/' }
Write-Host 'Algo Atlas is running at http://127.0.0.1:8000/' -ForegroundColor Cyan
