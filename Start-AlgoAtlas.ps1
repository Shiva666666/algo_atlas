param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$AtlasRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $AtlasRoot

function Assert-LastExit([string]$Action) {
  if ($LASTEXITCODE -ne 0) { throw "$Action failed with exit code $LASTEXITCODE." }
}

if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
  python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)"
  Assert-LastExit 'Python version check'
  python -m venv .venv
  Assert-LastExit 'Python environment creation'
}
$VenvPython = [IO.Path]::GetFullPath((Join-Path $AtlasRoot '.venv\Scripts\python.exe'))

function Test-AtlasProcess($ProcessInfo) {
  if (-not $ProcessInfo -or -not $ProcessInfo.CommandLine) { return $false }
  $UsesCheckoutPython = $ProcessInfo.CommandLine.IndexOf($VenvPython, [StringComparison]::OrdinalIgnoreCase) -ge 0
  $RunsAtlas = $ProcessInfo.CommandLine -match '(^|\s)-m\s+uvicorn(\s|$)' -and $ProcessInfo.CommandLine -match 'algo_atlas\.main:app'
  return $UsesCheckoutPython -and $RunsAtlas
}

& $VenvPython -m pip install -e .
Assert-LastExit 'Python dependency installation'

node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>22||(major===22&&minor>=13)?0:1)"
Assert-LastExit 'Node.js 22.13 or newer check'

$DependencyState = & $VenvPython -m algo_atlas.launcher dependency-status
Assert-LastExit 'Dependency freshness check'
if ($DependencyState -eq 'stale') {
  npm ci
  Assert-LastExit 'Frontend dependency installation'
  & $VenvPython -m algo_atlas.launcher mark-dependencies | Out-Null
  Assert-LastExit 'Dependency state recording'
}

$FrontendState = & $VenvPython -m algo_atlas.launcher frontend-status
Assert-LastExit 'Frontend freshness check'
if ($FrontendState -eq 'stale') {
  npm run build
  Assert-LastExit 'Frontend build'
  & $VenvPython -m algo_atlas.launcher mark-frontend | Out-Null
  Assert-LastExit 'Frontend build state recording'
}

New-Item -ItemType Directory -Force -Path '.local' | Out-Null
$PidFile = Join-Path $AtlasRoot '.local\server.pid'
if (Test-Path -LiteralPath $PidFile) {
  $PidText = (Get-Content -LiteralPath $PidFile -Raw).Trim()
  $AtlasPid = 0
  if (-not [int]::TryParse($PidText, [ref]$AtlasPid)) {
    throw 'The Algo Atlas PID file is invalid. Remove .local\server.pid only after verifying no Algo Atlas server is running.'
  }
  $OwnedProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $AtlasPid" -ErrorAction SilentlyContinue
  if ($OwnedProcess) {
    if (-not (Test-AtlasProcess $OwnedProcess)) {
      throw "PID $AtlasPid does not belong to this Algo Atlas checkout. No process was stopped."
    }
    Stop-Process -Id $AtlasPid
    Wait-Process -Id $AtlasPid -Timeout 10 -ErrorAction SilentlyContinue
    if (Get-Process -Id $AtlasPid -ErrorAction SilentlyContinue) {
      throw "Algo Atlas server PID $AtlasPid did not stop."
    }
  }
  Remove-Item -LiteralPath $PidFile -Force
}

$PortState = & $VenvPython -m algo_atlas.launcher port-status --port 8000
Assert-LastExit 'Port availability check'
if ($PortState -ne 'free') {
  throw 'Port 8000 is already used by another process. Algo Atlas did not stop or replace that process.'
}

$BootstrapResult = & $VenvPython -m algo_atlas.bootstrap
Assert-LastExit 'Database migration and synchronization'
$Bootstrap = $BootstrapResult | ConvertFrom-Json
if ($Bootstrap.conflicts -gt 0) {
  Write-Warning "$($Bootstrap.conflicts) algorithm sync conflict(s) need review in Settings & Sync. Local data was preserved."
}

$ServerLog = Join-Path $AtlasRoot '.local\server.log'
$ServerErrorLog = Join-Path $AtlasRoot '.local\server-error.log'
$process = Start-Process -FilePath $VenvPython -ArgumentList '-m','uvicorn','algo_atlas.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $AtlasRoot -WindowStyle Hidden -RedirectStandardOutput $ServerLog -RedirectStandardError $ServerErrorLog -PassThru

$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  Start-Sleep -Milliseconds 250
  $HealthState = & $VenvPython -m algo_atlas.launcher health-status
  if ($HealthState -eq 'ready') { $ready = $true; break }
}
if (-not $ready) {
  if (-not $process.HasExited) { Stop-Process -Id $process.Id -ErrorAction SilentlyContinue }
  $FailedConnection = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($FailedConnection) {
    $FailedServer = Get-CimInstance Win32_Process -Filter "ProcessId = $($FailedConnection.OwningProcess)" -ErrorAction SilentlyContinue
    if (Test-AtlasProcess $FailedServer) { Stop-Process -Id $FailedConnection.OwningProcess -ErrorAction SilentlyContinue }
  }
  $RecentError = if (Test-Path -LiteralPath $ServerErrorLog) { (Get-Content -LiteralPath $ServerErrorLog -Tail 30) -join [Environment]::NewLine } else { 'No server error log was written.' }
  throw "Algo Atlas did not start. Recent server output:`n$RecentError"
}

$ServerConnection = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$ServerProcess = if ($ServerConnection) { Get-CimInstance Win32_Process -Filter "ProcessId = $($ServerConnection.OwningProcess)" -ErrorAction SilentlyContinue } else { $null }
if (-not (Test-AtlasProcess $ServerProcess)) {
  throw 'The healthy process on port 8000 could not be verified as this Algo Atlas checkout. No PID was recorded.'
}
Set-Content -LiteralPath $PidFile -Value $ServerConnection.OwningProcess

if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:8000/' }
Write-Host 'Algo Atlas is running with the latest pulled UI and algorithms at http://127.0.0.1:8000/' -ForegroundColor Cyan
