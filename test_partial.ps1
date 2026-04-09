# ================================================
# GroOne - Start All Services
# ================================================
# This script starts all required services for GroOne:
# - PostgreSQL Database
# - Redis Cache
# - Backend API (NestJS)
# - Mobile App (React Native/Expo)
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting GroOne Services" -ForegroundColor Cyan
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
        Write-Host "  âœ“ Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  âœ— Docker is not running" -ForegroundColor Red
}

if ($dockerRunning) {
    Write-Host "  Starting Docker containers..." -ForegroundColor Gray
    docker-compose up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  âœ“ Docker services started successfully" -ForegroundColor Green

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
        Write-Host "  âœ— Failed to start Docker services" -ForegroundColor Red
        Write-Host "  Please check Docker logs: docker-compose logs" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  âš  Skipping Docker services - Docker is not running" -ForegroundColor Yellow
    Write-Host "  To start Docker services, please:" -ForegroundColor Yellow
    Write-Host "    1. Start Docker Desktop" -ForegroundColor Yellow
    Write-Host "    2. Run: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""
