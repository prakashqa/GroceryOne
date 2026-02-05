# ================================================
# GroceryOne - Start All Services
# ================================================
# This script starts all required services for GroceryOne:
# - PostgreSQL Database
# - Redis Cache
# - Backend API (NestJS)
# - Mobile App (React Native/Expo)
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting GroceryOne Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# ================================================
# Step 1: Start Docker Services (PostgreSQL, Redis, Backend)
# ================================================
Write-Host "[1/3] Starting Docker services (PostgreSQL, Redis, Backend)..." -ForegroundColor Yellow

# Check if Docker is running
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "  ✓ Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Docker is not running" -ForegroundColor Red
}

if ($dockerRunning) {
    Write-Host "  Starting Docker containers..." -ForegroundColor Gray
    docker-compose up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Docker services started successfully" -ForegroundColor Green

        # Wait for services to be healthy
        Write-Host "  Waiting for services to be healthy (this may take 30-60 seconds)..." -ForegroundColor Gray
        Start-Sleep -Seconds 10

        # Check service health
        Write-Host "  Checking service status..." -ForegroundColor Gray
        docker-compose ps

        Write-Host ""
        Write-Host "  Service URLs:" -ForegroundColor Cyan
        Write-Host "    - Backend API:    http://localhost:3000/api/v1" -ForegroundColor White
        Write-Host "    - API Docs:       http://localhost:3000/api/v1/docs" -ForegroundColor White
        Write-Host "    - PostgreSQL:     localhost:5432" -ForegroundColor White
        Write-Host "    - Redis:          localhost:6379" -ForegroundColor White
    } else {
        Write-Host "  ✗ Failed to start Docker services" -ForegroundColor Red
        Write-Host "  Please check Docker logs: docker-compose logs" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  ⚠ Skipping Docker services - Docker is not running" -ForegroundColor Yellow
    Write-Host "  To start Docker services, please:" -ForegroundColor Yellow
    Write-Host "    1. Start Docker Desktop" -ForegroundColor Yellow
    Write-Host "    2. Run: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Step 2: Start Backend in Development Mode (Optional Alternative)
# ================================================
# Uncomment this section if you want to run backend without Docker
# Write-Host "[2/3] Starting Backend API (Development Mode)..." -ForegroundColor Yellow
# Write-Host "  Note: Make sure PostgreSQL and Redis are running" -ForegroundColor Gray
#
# $backendJob = Start-Job -ScriptBlock {
#     Set-Location "D:\my app\application-grocery\GroceryOne\backend"
#     npm run start:dev
# }
#
# Write-Host "  ✓ Backend API started in background (Job ID: $($backendJob.Id))" -ForegroundColor Green
# Write-Host "    - View logs: Receive-Job $($backendJob.Id) -Keep" -ForegroundColor Gray
# Write-Host ""

# ================================================
# Step 3: Start Metro Bundler for Mobile App
# ================================================
Write-Host "[2/3] Starting Metro Bundler (React Native)..." -ForegroundColor Yellow

$metroJob = Start-Job -ScriptBlock {
    Set-Location "D:\my app\application-grocery\GroceryOne\mobile"
    npx expo start --clear
}

Write-Host "  ✓ Metro Bundler started in background (Job ID: $($metroJob.Id))" -ForegroundColor Green
Write-Host "    - View logs: Receive-Job $($metroJob.Id) -Keep" -ForegroundColor Gray
Write-Host "    - Access at: http://localhost:8081" -ForegroundColor White

Start-Sleep -Seconds 3
Write-Host ""

# ================================================
# Step 4: Start Mobile App on Android Device
# ================================================
Write-Host "[3/3] Checking for connected Android devices..." -ForegroundColor Yellow

$devices = adb devices 2>&1
if ($devices -match "device$") {
    Write-Host "  ✓ Android device detected" -ForegroundColor Green

    # Configure ADB reverse for localhost access
    Write-Host "  Configuring ADB reverse for API access..." -ForegroundColor Gray
    adb reverse tcp:3000 tcp:3000 2>&1 | Out-Null
    adb reverse tcp:8081 tcp:8081 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ ADB reverse configured (device can now access localhost:3000)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ ADB reverse failed - device may not reach backend" -ForegroundColor Yellow
    }

    Write-Host "  Starting app on device..." -ForegroundColor Gray

    Set-Location "$projectRoot\mobile"
    $buildJob = Start-Job -ScriptBlock {
        Set-Location "D:\my app\application-grocery\GroceryOne\mobile"
        npx expo run:android
    }

    Write-Host "  ✓ Building and installing app (Job ID: $($buildJob.Id))" -ForegroundColor Green
    Write-Host "    - View logs: Receive-Job $($buildJob.Id) -Keep" -ForegroundColor Gray
} else {
    Write-Host "  ⚠ No Android device detected" -ForegroundColor Yellow
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
Write-Host "   All Services Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running Jobs:" -ForegroundColor Cyan
Get-Job | Format-Table -AutoSize
Write-Host ""

Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  View Metro logs:     Receive-Job $($metroJob.Id) -Keep" -ForegroundColor White
if ($buildJob) {
    Write-Host "  View build logs:     Receive-Job $($buildJob.Id) -Keep" -ForegroundColor White
}
Write-Host "  Stop Metro:          Stop-Job $($metroJob.Id)" -ForegroundColor White
Write-Host "  Stop all jobs:       Get-Job | Stop-Job" -ForegroundColor White
Write-Host "  View Docker logs:    docker-compose logs -f backend" -ForegroundColor White
Write-Host "  Stop Docker:         docker-compose down" -ForegroundColor White
Write-Host ""

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Backend API:         http://localhost:3000/api/v1" -ForegroundColor White
Write-Host "  API Documentation:   http://localhost:3000/api/v1/docs" -ForegroundColor White
Write-Host "  Metro Bundler:       http://localhost:8081" -ForegroundColor White
Write-Host ""

Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  1. Stop PowerShell jobs:  Get-Job | Stop-Job | Remove-Job" -ForegroundColor Gray
Write-Host "  2. Stop Docker:           docker-compose down" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Ctrl+C to stop monitoring. Services will continue running in background." -ForegroundColor Gray
Write-Host ""

# Keep script running to show job updates
# Users can press Ctrl+C to exit (jobs continue in background)
try {
    while ($true) {
        Start-Sleep -Seconds 5
        $jobStates = Get-Job | Select-Object Id, Name, State
        $failedJobs = $jobStates | Where-Object { $_.State -eq "Failed" }

        if ($failedJobs) {
            Write-Host "⚠ Warning: Some jobs have failed:" -ForegroundColor Red
            $failedJobs | Format-Table -AutoSize
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped. Services are still running in background." -ForegroundColor Yellow
    Write-Host "Use 'Get-Job' to check status." -ForegroundColor Gray
}
