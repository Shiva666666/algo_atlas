$ErrorActionPreference = 'Stop'
$AtlasRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $AtlasRoot '.local\server.pid'
if (Test-Path -LiteralPath $PidFile) {
  $AtlasPid = [int](Get-Content -LiteralPath $PidFile -Raw)
  $process = Get-Process -Id $AtlasPid -ErrorAction SilentlyContinue
  if ($process) { Stop-Process -Id $AtlasPid }
  Remove-Item -LiteralPath $PidFile -Force
  Write-Host 'Algo Atlas stopped.' -ForegroundColor Cyan
} else { Write-Host 'Algo Atlas is not running.' }
