# ============================================================
#  GroOne - Start All Services
# ============================================================
#  Opens three terminal windows, one per service:
#    1. Backend   (NestJS, http://localhost:3000)
#    2. Web       (Next.js, http://localhost:3001)
#    3. Mobile    (Expo dev server, http://localhost:8081)
#
#  Usage:
#    .\run_all.ps1                  # start everything
#    .\run_all.ps1 -SkipMobile      # backend + web only
#    .\run_all.ps1 -SkipWeb         # backend + mobile only
#    .\run_all.ps1 -SkipBackend     # web + mobile only
#
#  Stop everything:  .\stop.ps1
# ============================================================

param(
    [switch]$SkipBackend,
    [switch]$SkipWeb,
    [switch]$SkipMobile
)

$ErrorActionPreference = 'Stop'
$ROOT = $PSScriptRoot
Set-Location $ROOT

function Write-Header([string]$text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  $text" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
}

function Start-ServiceWindow([string]$title, [string]$workDir, [string]$command) {
    if (-not (Test-Path $workDir)) {
        Write-Host "  [SKIP] $title - directory not found: $workDir" -ForegroundColor Yellow
        return
    }
    Write-Host "  [OK]   Starting $title..." -ForegroundColor Cyan

    # Build the cmd.exe command string with inner quotes doubled so PowerShell
    # does not mis-tokenize on backtick escaping (PS 5.1 quirk).
    $quotedDir = '"' + $workDir + '"'
    $inner = 'title ' + $title + ' && cd /d ' + $quotedDir + ' && ' + $command
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $inner -WorkingDirectory $workDir | Out-Null
}

Write-Header "GroOne - Starting All Services"

# ---------- Pre-flight checks ----------
Write-Host ""
Write-Host "  Pre-flight checks:" -ForegroundColor White

try {
    $nodeVersion = & node -v 2>$null
    Write-Host "    [OK] Node.js $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "    [FAIL] Node.js not found in PATH. Install Node 20+ first." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = & npm -v 2>$null
    Write-Host "    [OK] npm v$npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "    [FAIL] npm not found." -ForegroundColor Red
    exit 1
}

# Postgres - non-fatal, informational only
& pg_isready -h localhost -p 5433 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    [OK] PostgreSQL on localhost:5433" -ForegroundColor Cyan
} else {
    Write-Host "    [WARN] PostgreSQL not responding on :5433 - backend may fail to connect." -ForegroundColor Yellow
    Write-Host "           Start it with: docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
}

# Auto-sync LAN IP into mobile/.env so physical devices can reach the backend
# after WiFi changes. Finds the first non-loopback / non-APIPA IPv4 address.
try {
    $lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
        Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VMware|WSL' -and $_.IPAddress -notmatch '^169\.254' } |
        Select-Object -First 1).IPAddress
    if ($lanIp) {
        $envPath = Join-Path $ROOT 'mobile\.env'
        if (Test-Path $envPath) {
            $content = Get-Content $envPath -Raw
            if ($content -match 'LOCAL_API_IP=(\S+)') {
                $current = $Matches[1]
                if ($current -ne $lanIp) {
                    $new = $content -replace 'LOCAL_API_IP=\S+', "LOCAL_API_IP=$lanIp"
                    Set-Content -Path $envPath -Value $new -NoNewline
                    Write-Host "    [OK] Updated mobile/.env LOCAL_API_IP: $current -> $lanIp" -ForegroundColor Cyan
                } else {
                    Write-Host "    [OK] mobile/.env LOCAL_API_IP already $lanIp" -ForegroundColor Cyan
                }
            }
        }
    } else {
        Write-Host "    [WARN] Could not detect LAN IP. Mobile device may not reach backend." -ForegroundColor Yellow
    }
} catch {
    Write-Host "    [WARN] IP auto-detect failed: $_" -ForegroundColor Yellow
}

# node_modules check
if (-not (Test-Path (Join-Path $ROOT 'node_modules'))) {
    Write-Host "    [WARN] node_modules missing at root. Running npm install..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    [FAIL] npm install failed." -ForegroundColor Red
        exit 1
    }
}

# ---------- Launch services ----------
Write-Host ""
Write-Host "  Launching services (each in its own window):" -ForegroundColor White

if (-not $SkipBackend) {
    Start-ServiceWindow -title "GroOne Backend (NestJS :3000)" -workDir (Join-Path $ROOT 'backend') -command "npm run start:dev"
} else {
    Write-Host "    [SKIP] Backend (-SkipBackend)" -ForegroundColor DarkGray
}

if (-not $SkipWeb) {
    Start-ServiceWindow -title "GroOne Web (Next.js :3001)" -workDir (Join-Path $ROOT 'web') -command "npm run dev"
} else {
    Write-Host "    [SKIP] Web (-SkipWeb)" -ForegroundColor DarkGray
}

if (-not $SkipMobile) {
    Start-ServiceWindow -title "GroOne Mobile (Expo :8081)" -workDir (Join-Path $ROOT 'mobile') -command "npm start"
} else {
    Write-Host "    [SKIP] Mobile (-SkipMobile)" -ForegroundColor DarkGray
}

# ---------- Summary ----------
Write-Header "All services launched"
Write-Host ""
Write-Host "  Backend API :  http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host "  Web App     :  http://localhost:3001" -ForegroundColor White
Write-Host "  Expo DevTool:  http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "  To stop everything:  .\stop.ps1" -ForegroundColor Yellow
Write-Host "  Tip: each service runs in its own window - close to stop individually." -ForegroundColor DarkGray
Write-Host ""
