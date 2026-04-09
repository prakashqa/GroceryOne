# ============================================================
#  GroOne - Smart Store Management Platform
# ============================================================
#  Usage:
#    .\start.ps1              - Build and run all services
#    .\start.ps1 -RunOnly     - Skip build, just start servers
#    .\start.ps1 -SkipSeed    - Skip database seeding
# ============================================================

param(
    [switch]$SkipSeed,
    [switch]$RunOnly
)

$ROOT = $PSScriptRoot
Set-Location $ROOT

function Run-Step($label, $cmd, $dir) {
    Write-Host "  $label" -ForegroundColor White
    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c $cmd" `
        -WorkingDirectory $dir `
        -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput "NUL" `
        -RedirectStandardError "NUL"
    return $proc.ExitCode
}

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host "   GroOne - Smart Store Management Platform" -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host ""

# Checks
$nv = & node -v 2>$null; Write-Host "  [OK] Node.js $nv" -ForegroundColor Cyan
$nv = & npm -v 2>$null; Write-Host "  [OK] npm v$nv" -ForegroundColor Cyan
& pg_isready -h localhost -p 5433 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  [OK] PostgreSQL on localhost:5433" -ForegroundColor Cyan }
else { Write-Host "  [WARN] PostgreSQL not responding on port 5433" -ForegroundColor Yellow }
Write-Host ""

if (-not $RunOnly) {
    # Step 1: Install
    Run-Step "[1/5] Installing dependencies..." "npm install --legacy-peer-deps 2>NUL" $ROOT | Out-Null
    Write-Host "  [OK] Dependencies installed." -ForegroundColor Green; Write-Host ""

    # Step 2: Build shared
    Write-Host "  [2/5] Building shared packages..." -ForegroundColor White
    Run-Step "       - @groceryone/shared" "npm run build 2>NUL" "$ROOT\packages\shared" | Out-Null
    Run-Step "       - @groceryone/store" "npm run build 2>NUL" "$ROOT\packages\store" | Out-Null
    Write-Host "  [OK] Shared packages built." -ForegroundColor Green; Write-Host ""

    # Step 3: Build backend
    Run-Step "[3/5] Building backend..." "npx nest build 2>NUL" "$ROOT\backend" | Out-Null
    Write-Host "  [OK] Backend built." -ForegroundColor Green; Write-Host ""

    # Step 4: Build web
    Run-Step "[4/5] Building web app..." "npx next build 2>NUL" "$ROOT\web" | Out-Null
    Write-Host "  [OK] Web app built." -ForegroundColor Green; Write-Host ""

    # Step 5: Seed
    if ($SkipSeed) {
        Write-Host "  [5/5] Skipping seed (-SkipSeed)" -ForegroundColor Yellow
    } else {
        Write-Host "  [5/5] Seeding database..." -ForegroundColor White
        Run-Step "       Seeding tenants..." "npm run seed:tenants 2>NUL" "$ROOT\backend" | Out-Null
        Run-Step "       Seeding data..." "npm run seed 2>NUL" "$ROOT\backend" | Out-Null
        Write-Host "  [OK] Database seeded." -ForegroundColor Green
    }
    Write-Host ""
}

# ============================================================
#  START SERVICES
# ============================================================
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host "   Starting services..." -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host ""

# Backend
Write-Host "  Starting Backend API..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title GroOne Backend && cd /d `"$ROOT\backend`" && node dist\main.js"
Write-Host "  [OK] Backend started." -ForegroundColor Green

Start-Sleep -Seconds 8

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 5 | Out-Null
    Write-Host "  [OK] Backend API healthy." -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Backend may still be starting..." -ForegroundColor Yellow
}

# Web
Write-Host "  Starting Web App..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title GroOne Web && cd /d `"$ROOT\web`" && npx next dev -p 3001"
Write-Host "  [OK] Web app started." -ForegroundColor Green

Start-Sleep -Seconds 10

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host "   All services running!" -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend API  : http://localhost:3000/api/v1" -ForegroundColor Cyan
Write-Host "   Swagger Docs : http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host "   Web App      : http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Tenant: freshmart | Admin: admin@freshmart.com | PIN: 1234"
Write-Host ""
Write-Host "   Close the Backend/Web terminal windows to stop." -ForegroundColor Gray
Write-Host "  ============================================================" -ForegroundColor Green

Start-Process "http://localhost:3001"
