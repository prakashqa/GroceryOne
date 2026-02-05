Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Stopping GroceryOne Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# ================================================
# Step 1: Stop PowerShell Background Jobs
# ================================================
Write-Host "[1/3] Stopping PowerShell background jobs..." -ForegroundColor Yellow

$jobs = Get-Job
if ($jobs) {
    Write-Host "  Found $($jobs.Count) running job(s)" -ForegroundColor Gray

    foreach ($job in $jobs) {
        Write-Host "  Stopping Job $($job.Id) ($($job.Name))..." -ForegroundColor Gray
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "  All background jobs stopped" -ForegroundColor Green
}
else {
    Write-Host "  No background jobs running" -ForegroundColor Green
}

Write-Host ""

# ================================================
# Step 2: Stop Docker Services
# ================================================
Write-Host "[2/3] Stopping Docker services..." -ForegroundColor Yellow

$dockerRunning = $false
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
}
catch {
    Write-Host "  Docker is not running" -ForegroundColor Gray
}

if ($dockerRunning) {
    Write-Host "  Stopping containers..." -ForegroundColor Gray
    docker-compose down

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker services stopped successfully" -ForegroundColor Green
    }
    else {
        Write-Host "  Failed to stop Docker services" -ForegroundColor Red
    }
}
else {
    Write-Host "  Docker is not running (nothing to stop)" -ForegroundColor Green
}

Write-Host ""

# ================================================
# Step 3: Clean up ADB Reverse
# ================================================
Write-Host "[3/3] Cleaning up ADB reverse..." -ForegroundColor Yellow

$devices = adb devices 2>&1
if ($devices -match "device$") {
    Write-Host "  Android device detected, removing ADB reverse" -ForegroundColor Gray
    adb reverse --remove tcp:3000 2>&1 | Out-Null
    adb reverse --remove tcp:8081 2>&1 | Out-Null
    Write-Host "  ADB reverse removed" -ForegroundColor Green
}
else {
    Write-Host "  No Android device detected, skipping" -ForegroundColor Green
}

Write-Host ""

# ================================================
# Optional: Kill Node/Expo Processes
# ================================================
Write-Host "Checking for remaining Node/Expo processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node", "expo" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Found $($nodeProcesses.Count) Node/Expo process(es) still running" -ForegroundColor Gray

    $response = Read-Host "  Do you want to terminate these processes? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        $nodeProcesses | Stop-Process -Force
        Write-Host "  Processes terminated" -ForegroundColor Green
    }
    else {
        Write-Host "  Skipped" -ForegroundColor Gray
    }
}
else {
    Write-Host "  No Node/Expo processes running" -ForegroundColor Green
}

Write-Host ""

# ================================================
# Summary
# ================================================
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   All Services Stopped!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To restart services, run:" -ForegroundColor Cyan
Write-Host "  Docker mode:  .\start_gro_simple.ps1" -ForegroundColor White
Write-Host "  Local mode:   .\start_gro_local.ps1" -ForegroundColor White
Write-Host ""
