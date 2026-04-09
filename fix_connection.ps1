# ================================================
# GroOne - Fix "Failed to connect" Error
# ================================================
# This script diagnoses and fixes the connection
# issue between mobile app and backend API
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   GroOne Connection Troubleshooter" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# ================================================
# Step 1: Check Backend API
# ================================================
Write-Host "[1/5] Checking Backend API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend API is running and healthy" -ForegroundColor Green
        Write-Host "    Response: $($response.Content.Substring(0, [Math]::Min(50, $response.Content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Backend responded with status $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ Backend API is not responding" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false

    Write-Host ""
    Write-Host "  Attempting to start backend services..." -ForegroundColor Yellow
    docker-compose up -d

    Write-Host "  Waiting 15 seconds for services to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 15

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 5 -UseBasicParsing
        Write-Host "  ✓ Backend is now running" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Backend still not responding" -ForegroundColor Red
        Write-Host "  Please check Docker logs: docker-compose logs backend" -ForegroundColor Yellow
    }
}

Write-Host ""

# ================================================
# Step 2: Check Docker Services
# ================================================
Write-Host "[2/5] Checking Docker services..." -ForegroundColor Yellow

$dockerStatus = docker-compose ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker containers status:" -ForegroundColor Gray
    docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

    # Check if backend is healthy
    $backendHealthy = docker-compose ps --filter "name=backend" --filter "status=running" --format "{{.Status}}" | Select-String "healthy"
    if ($backendHealthy) {
        Write-Host "  ✓ Backend container is healthy" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Backend container may not be healthy" -ForegroundColor Yellow
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ Docker Compose not available or no services running" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# ================================================
# Step 3: Check Android Device Connection
# ================================================
Write-Host "[3/5] Checking Android device connection..." -ForegroundColor Yellow

$devices = adb devices 2>&1
$deviceConnected = $false

if ($devices -match "device$") {
    $deviceConnected = $true
    $deviceId = ($devices | Select-String "device$").Line.Split("`t")[0]
    Write-Host "  ✓ Android device connected: $deviceId" -ForegroundColor Green
} else {
    Write-Host "  ✗ No Android device connected" -ForegroundColor Red
    Write-Host "    Please connect your device and enable USB debugging" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# ================================================
# Step 4: Configure ADB Reverse (THE FIX!)
# ================================================
if ($deviceConnected) {
    Write-Host "[4/5] Configuring ADB reverse (connecting device to backend)..." -ForegroundColor Yellow

    # Remove existing reverse forwarding
    adb reverse --remove-all 2>&1 | Out-Null

    # Set up reverse forwarding for backend API
    Write-Host "  Setting up port forwarding: device:3000 -> computer:3000" -ForegroundColor Gray
    $result1 = adb reverse tcp:3000 tcp:3000 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Backend port forwarded (tcp:3000)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to forward backend port" -ForegroundColor Red
        Write-Host "    Error: $result1" -ForegroundColor Red
        $allPassed = $false
    }

    # Set up reverse forwarding for Metro bundler
    Write-Host "  Setting up port forwarding: device:8081 -> computer:8081" -ForegroundColor Gray
    $result2 = adb reverse tcp:8081 tcp:8081 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Metro bundler port forwarded (tcp:8081)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Failed to forward Metro port (not critical)" -ForegroundColor Yellow
    }

    # Verify forwarding is active
    Write-Host ""
    Write-Host "  Active port forwarding:" -ForegroundColor Gray
    adb reverse --list
} else {
    Write-Host "[4/5] Skipping ADB reverse (no device connected)" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Step 5: Test Connection from Device
# ================================================
if ($deviceConnected) {
    Write-Host "[5/5] Testing connection FROM device to backend..." -ForegroundColor Yellow

    # Test if device can reach backend
    Write-Host "  Running: adb shell curl http://localhost:3000/api/v1/health" -ForegroundColor Gray
    $deviceTest = adb shell "curl -s -m 5 http://localhost:3000/api/v1/health" 2>&1

    if ($deviceTest -match "status|ok|healthy") {
        Write-Host "  ✓ Device can successfully reach backend!" -ForegroundColor Green
        Write-Host "    Response: $($deviceTest.Substring(0, [Math]::Min(50, $deviceTest.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Device cannot reach backend" -ForegroundColor Red
        Write-Host "    Response: $deviceTest" -ForegroundColor Red
        $allPassed = $false

        Write-Host ""
        Write-Host "  Alternative solution: Use your computer's IP address" -ForegroundColor Yellow

        # Get computer's IP address
        $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"})[0].IPAddress

        if ($ipAddress) {
            Write-Host "  Your computer's IP address: $ipAddress" -ForegroundColor Cyan
            Write-Host "  Update mobile\src\core\config\api.config.ts:" -ForegroundColor Yellow
            Write-Host "    BASE_URL: 'http://${ipAddress}:3000/api/v1'" -ForegroundColor White
        }
    }
} else {
    Write-Host "[5/5] Skipping device connection test (no device connected)" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Summary & Next Steps
# ================================================
Write-Host "================================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "   ✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your mobile app should now be able to connect to the backend." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open the app on your device" -ForegroundColor White
    Write-Host "  2. The 'Failed to connect' error should be gone" -ForegroundColor White
    Write-Host "  3. If still having issues, restart the app completely" -ForegroundColor White
} else {
    Write-Host "   ⚠ SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Start backend services:" -ForegroundColor Cyan
    Write-Host "     docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Ensure device is connected:" -ForegroundColor Cyan
    Write-Host "     adb devices" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Run this script again:" -ForegroundColor Cyan
    Write-Host "     .\fix_connection.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  4. For detailed troubleshooting:" -ForegroundColor Cyan
    Write-Host "     See TROUBLESHOOTING.md" -ForegroundColor White
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
