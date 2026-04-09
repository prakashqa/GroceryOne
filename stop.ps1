# GroOne - Stop All Services
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = "$ROOT_DIR\.groone_pids"

Write-Host ""
Write-Host "  Stopping GroOne services..." -ForegroundColor Yellow

if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    foreach ($pid in $pids) {
        $pid = $pid.Trim()
        if ($pid) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped PID $pid" -ForegroundColor Gray
        }
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}

# Also kill any remaining node processes on our ports
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped process on port $port" -ForegroundColor Gray
    }
}

Write-Host "  [OK] All services stopped." -ForegroundColor Green
Write-Host ""
