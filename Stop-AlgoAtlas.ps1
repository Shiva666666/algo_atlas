$ErrorActionPreference = 'Stop'
$AtlasRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $AtlasRoot '.local\server.pid'
$VenvPython = [IO.Path]::GetFullPath((Join-Path $AtlasRoot '.venv\Scripts\python.exe'))

if (-not (Test-Path -LiteralPath $PidFile)) {
  Write-Host 'Algo Atlas is not running.'
  exit 0
}

$PidText = (Get-Content -LiteralPath $PidFile -Raw).Trim()
$AtlasPid = 0
if (-not [int]::TryParse($PidText, [ref]$AtlasPid)) {
  throw 'The Algo Atlas PID file is invalid; no process was stopped.'
}
$OwnedProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $AtlasPid" -ErrorAction SilentlyContinue
if (-not $OwnedProcess) {
  Remove-Item -LiteralPath $PidFile -Force
  Write-Host 'Algo Atlas was already stopped.'
  exit 0
}
$UsesCheckoutPython = $OwnedProcess.CommandLine -and $OwnedProcess.CommandLine.IndexOf($VenvPython, [StringComparison]::OrdinalIgnoreCase) -ge 0
$ExpectedCommand = $OwnedProcess.CommandLine -match '(^|\s)-m\s+uvicorn(\s|$)' -and $OwnedProcess.CommandLine -match 'algo_atlas\.main:app'
if (-not $UsesCheckoutPython -or -not $ExpectedCommand) {
  throw "PID $AtlasPid does not belong to this Algo Atlas checkout; no process was stopped."
}

Stop-Process -Id $AtlasPid
Wait-Process -Id $AtlasPid -Timeout 10 -ErrorAction SilentlyContinue
if (Get-Process -Id $AtlasPid -ErrorAction SilentlyContinue) {
  throw "Algo Atlas server PID $AtlasPid did not stop."
}
Remove-Item -LiteralPath $PidFile -Force
Write-Host 'Algo Atlas stopped.' -ForegroundColor Cyan
