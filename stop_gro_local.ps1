Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Stopping GroOne (Local Mode)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# ================================================
# Step 1: Stop PowerShell Background Jobs
# ================================================
Write-Host "[1/4] Stopping PowerShell background jobs..." -ForegroundColor Yellow

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
# Step 2: Stop Local PostgreSQL Service
# ================================================
Write-Host "[2/4] Checking PostgreSQL service..." -ForegroundColor Yellow

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "  PostgreSQL service is running" -ForegroundColor Gray

    $response = Read-Host "  Do you want to stop PostgreSQL service? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Stop-Service $pgService.Name
        Write-Host "  PostgreSQL service stopped" -ForegroundColor Green
    }
    else {
        Write-Host "  PostgreSQL service left running" -ForegroundColor Gray
    }
}
elseif ($pgService) {
    Write-Host "  PostgreSQL service is already stopped" -ForegroundColor Green
}
else {
    Write-Host "  PostgreSQL service not found, skipping" -ForegroundColor Gray
}

Write-Host ""

# ================================================
# Step 3: Stop Local Redis Service
# ================================================
Write-Host "[3/4] Checking Redis service..." -ForegroundColor Yellow

$redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
if ($redisService -and $redisService.Status -eq "Running") {
    Write-Host "  Redis service is running" -ForegroundColor Gray

    $response = Read-Host "  Do you want to stop Redis service? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Stop-Service $redisService.Name
        Write-Host "  Redis service stopped" -ForegroundColor Green
    }
    else {
        Write-Host "  Redis service left running" -ForegroundColor Gray
    }
}
elseif ($redisService) {
    Write-Host "  Redis service is already stopped" -ForegroundColor Green
}
else {
    Write-Host "  Redis service not found" -ForegroundColor Gray

    $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if ($redisProcess) {
        Write-Host "  Found redis-server process running" -ForegroundColor Gray

        $response = Read-Host "  Do you want to stop redis-server process? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            $redisProcess | Stop-Process -Force
            Write-Host "  redis-server process stopped" -ForegroundColor Green
        }
        else {
            Write-Host "  redis-server process left running" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  No Redis process found" -ForegroundColor Green
    }
}

Write-Host ""

# ================================================
# Step 4: Clean up ADB Reverse
# ================================================
Write-Host "[4/4] Cleaning up ADB reverse..." -ForegroundColor Yellow

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
Write-Host "   Local Services Management Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Service Status:" -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "  PostgreSQL: $($pgService.Status)" -ForegroundColor Gray
}

$redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
if ($redisService) {
    Write-Host "  Redis:      $($redisService.Status)" -ForegroundColor Gray
}

$jobs = Get-Job
if ($jobs) {
    Write-Host "  Jobs:       $($jobs.Count) running" -ForegroundColor Yellow
}
else {
    Write-Host "  Jobs:       None running" -ForegroundColor Gray
}
Write-Host ""

Write-Host "To restart services, run:" -ForegroundColor Cyan
Write-Host "  .\start_gro_local.ps1" -ForegroundColor White
Write-Host ""
