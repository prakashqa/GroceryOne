Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting GroceryOne (Local Setup)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# ================================================
# Step 1: Check Local PostgreSQL Service
# ================================================
Write-Host "[1/4] Checking PostgreSQL service..." -ForegroundColor Yellow

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "  PostgreSQL is running" -ForegroundColor Green
    }
    else {
        Write-Host "  Starting PostgreSQL service..." -ForegroundColor Gray
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "  PostgreSQL started" -ForegroundColor Green
    }
}
else {
    Write-Host "  PostgreSQL service not found" -ForegroundColor Yellow
    Write-Host "  Please ensure PostgreSQL is installed and running on localhost:5433" -ForegroundColor Yellow
    Write-Host "  You can install PostgreSQL from: https://www.postgresql.org/download/" -ForegroundColor Gray
}

Write-Host ""

# ================================================
# Step 2: Check Local Redis Service
# ================================================
Write-Host "[2/4] Checking Redis service..." -ForegroundColor Yellow

$redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
if ($redisService) {
    if ($redisService.Status -eq "Running") {
        Write-Host "  Redis is running" -ForegroundColor Green
    }
    else {
        Write-Host "  Starting Redis service..." -ForegroundColor Gray
        Start-Service $redisService.Name
        Start-Sleep -Seconds 2
        Write-Host "  Redis started" -ForegroundColor Green
    }
}
else {
    Write-Host "  Redis service not found" -ForegroundColor Yellow
    Write-Host "  Checking if Redis is running as a process..." -ForegroundColor Gray

    $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if ($redisProcess) {
        Write-Host "  Redis is running as a process" -ForegroundColor Green
    }
    else {
        Write-Host "  Redis is not running" -ForegroundColor Yellow
        Write-Host "  Please ensure Redis is installed and running on localhost:6379" -ForegroundColor Yellow
        Write-Host "  You can install Redis from: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
    }
}

Write-Host ""

# ================================================
# Step 3: Start Backend in Development Mode
# ================================================
Write-Host "[3/4] Starting Backend API (Development Mode)..." -ForegroundColor Yellow

$backendPath = "$projectRoot\backend"
if (Test-Path $backendPath) {
    Write-Host "  Starting backend from: $backendPath" -ForegroundColor Gray

    $backendJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npm run start:dev
    } -ArgumentList $backendPath

    Write-Host "  Backend API started (Job ID: $($backendJob.Id))" -ForegroundColor Green
    Write-Host "    - View logs: Receive-Job $($backendJob.Id) -Keep" -ForegroundColor Gray
    Write-Host "    - Backend API:  http://localhost:3000/api/v1" -ForegroundColor White
    Write-Host "    - API Docs:     http://localhost:3000/api/v1/docs" -ForegroundColor White

    Write-Host "  Waiting for backend to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
else {
    Write-Host "  Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ================================================
# Step 4: Start Metro Bundler for Mobile App
# ================================================
Write-Host "[4/4] Starting Metro Bundler (React Native)..." -ForegroundColor Yellow

$mobilePath = "$projectRoot\mobile"
if (Test-Path $mobilePath) {
    $metroJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npx expo start --clear
    } -ArgumentList $mobilePath

    Write-Host "  Metro Bundler started (Job ID: $($metroJob.Id))" -ForegroundColor Green
    Write-Host "    - View logs: Receive-Job $($metroJob.Id) -Keep" -ForegroundColor Gray
    Write-Host "    - Access at: http://localhost:8081" -ForegroundColor White

    Start-Sleep -Seconds 3
}
else {
    Write-Host "  Mobile directory not found at: $mobilePath" -ForegroundColor Red
}

Write-Host ""

# ================================================
# Step 5: Configure Android Device
# ================================================
Write-Host "Checking for connected Android devices..." -ForegroundColor Yellow

$devices = adb devices 2>&1
if ($devices -match "device$") {
    Write-Host "  Android device detected" -ForegroundColor Green

    Write-Host "  Configuring ADB reverse..." -ForegroundColor Gray
    adb reverse tcp:3000 tcp:3000 2>&1 | Out-Null
    adb reverse tcp:8081 tcp:8081 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ADB reverse configured" -ForegroundColor Green
    }
    else {
        Write-Host "  ADB reverse failed" -ForegroundColor Yellow
    }

    Write-Host "  Starting app on device..." -ForegroundColor Gray
    Set-Location "$projectRoot\mobile"
    $buildJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npx expo run:android
    } -ArgumentList $mobilePath

    Write-Host "  Building and installing app (Job ID: $($buildJob.Id))" -ForegroundColor Green
    Write-Host "    - View logs: Receive-Job $($buildJob.Id) -Keep" -ForegroundColor Gray
}
else {
    Write-Host "  No Android device detected" -ForegroundColor Yellow
    Write-Host "  To run on device:" -ForegroundColor Yellow
    Write-Host "    1. Connect your Android device via USB" -ForegroundColor Yellow
    Write-Host "    2. Enable USB debugging" -ForegroundColor Yellow
    Write-Host "    3. Run: adb devices" -ForegroundColor Yellow
    Write-Host "    4. Run: adb reverse tcp:3000 tcp:3000" -ForegroundColor Yellow
    Write-Host "    5. Run: cd mobile && npx expo run:android" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Summary
# ================================================
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   All Services Started (Local Mode)!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running Jobs:" -ForegroundColor Cyan
Get-Job | Format-Table -AutoSize
Write-Host ""

Write-Host "Quick Commands:" -ForegroundColor Cyan
if ($backendJob) {
    Write-Host "  View backend logs:   Receive-Job $($backendJob.Id) -Keep" -ForegroundColor White
}
Write-Host "  View Metro logs:     Receive-Job $($metroJob.Id) -Keep" -ForegroundColor White
if ($buildJob) {
    Write-Host "  View build logs:     Receive-Job $($buildJob.Id) -Keep" -ForegroundColor White
}
Write-Host "  Stop all jobs:       Get-Job | Stop-Job" -ForegroundColor White
Write-Host ""

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Backend API:         http://localhost:3000/api/v1" -ForegroundColor White
Write-Host "  API Documentation:   http://localhost:3000/api/v1/docs" -ForegroundColor White
Write-Host "  Metro Bundler:       http://localhost:8081" -ForegroundColor White
Write-Host "  PostgreSQL:          localhost:5433" -ForegroundColor White
Write-Host "  Redis:               localhost:6379" -ForegroundColor White
Write-Host ""

Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "  PostgreSQL: " -NoNewline -ForegroundColor Gray
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "Running" -ForegroundColor Green
}
else {
    Write-Host "Check manually" -ForegroundColor Yellow
}

Write-Host "  Redis:      " -NoNewline -ForegroundColor Gray
if ($redisService -and $redisService.Status -eq "Running") {
    Write-Host "Running" -ForegroundColor Green
}
elseif ($redisProcess) {
    Write-Host "Running (process)" -ForegroundColor Green
}
else {
    Write-Host "Check manually" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "To stop all services, run:" -ForegroundColor Yellow
Write-Host "  .\stop_gro_local.ps1  (stops jobs + asks about PostgreSQL/Redis)" -ForegroundColor Gray
Write-Host "  .\stop_gro_clean.ps1  (stops jobs only, leaves DB services running)" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Ctrl+C to stop monitoring. Services will continue in background." -ForegroundColor Gray
Write-Host ""

# Keep script running to monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 5
        $jobStates = Get-Job | Select-Object Id, Name, State
        $failedJobs = $jobStates | Where-Object { $_.State -eq "Failed" }

        if ($failedJobs) {
            Write-Host "Warning: Some jobs have failed:" -ForegroundColor Red
            $failedJobs | Format-Table -AutoSize

            Write-Host "View logs with: Receive-Job <JobId> -Keep" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host ""
    Write-Host "Monitoring stopped. Services are still running in background." -ForegroundColor Yellow
    Write-Host "Use 'Get-Job' to check status." -ForegroundColor Gray
}
