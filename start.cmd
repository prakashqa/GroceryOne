@echo off
REM ============================================================
REM  GroOne - Complete Build & Run Script
REM ============================================================
REM
REM  Usage:
REM    start.cmd              - Install, build, seed, and run
REM    start.cmd --skip-seed  - Skip database seeding
REM    start.cmd --build-only - Only build, don't start servers
REM    start.cmd --run-only   - Only start servers (skip build)
REM
REM  Services:
REM    Backend API : http://localhost:3000/api/v1
REM    Web App     : http://localhost:3001
REM ============================================================

setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set SKIP_SEED=0
set BUILD_ONLY=0
set RUN_ONLY=0

:parse_args
if "%~1"=="" goto :after_args
if /i "%~1"=="--skip-seed" set SKIP_SEED=1
if /i "%~1"=="--build-only" set BUILD_ONLY=1
if /i "%~1"=="--run-only" set RUN_ONLY=1
shift
goto :parse_args
:after_args

echo.
echo  ============================================================
echo   GroOne - Smart Store Management Platform
echo  ============================================================
echo.

REM ---- Check Node.js ----
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Install Node.js ^>= 20.
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo  [OK] npm v%NPM_VER%

where pg_isready >nul 2>&1
if %errorlevel% equ 0 (
    pg_isready -h localhost -p 5433 >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] PostgreSQL on localhost:5433
    ) else (
        echo  [WARN] PostgreSQL not responding on port 5433
    )
) else (
    echo  [INFO] pg_isready not found - skipping PostgreSQL check
)

echo.

if %RUN_ONLY% equ 1 goto :start_services

REM ============================================================
REM  STEP 1: Install Dependencies
REM ============================================================
echo  [1/5] Installing dependencies...
call npm install --legacy-peer-deps 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    exit /b 1
)
echo  [OK] Dependencies installed.
echo.

REM ============================================================
REM  STEP 2: Build Shared Packages
REM ============================================================
echo  [2/5] Building shared packages...

echo        - @groceryone/shared
cd /d "%ROOT_DIR%packages\shared"
call npm run build 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] @groceryone/shared build failed.
    exit /b 1
)

echo        - @groceryone/store
cd /d "%ROOT_DIR%packages\store"
call npm run build 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] @groceryone/store build failed.
    exit /b 1
)

cd /d "%ROOT_DIR%"
echo  [OK] Shared packages built.
echo.

REM ============================================================
REM  STEP 3: Build Backend
REM ============================================================
echo  [3/5] Building backend...
cd /d "%ROOT_DIR%backend"
call npx nest build 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Backend build failed.
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo  [OK] Backend built.
echo.

REM ============================================================
REM  STEP 4: Build Web App
REM ============================================================
echo  [4/5] Building web app...
cd /d "%ROOT_DIR%web"
call npx next build 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Web app build failed.
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo  [OK] Web app built.
echo.

REM ============================================================
REM  STEP 5: Seed Database (optional)
REM ============================================================
if %SKIP_SEED% equ 1 (
    echo  [5/5] Skipping database seed (--skip-seed)
) else (
    echo  [5/5] Seeding database...
    cd /d "%ROOT_DIR%backend"
    call npm run seed:tenants 2>nul
    call npm run seed 2>nul
    cd /d "%ROOT_DIR%"
    echo  [OK] Database seeding complete.
)
echo.

if %BUILD_ONLY% equ 1 (
    echo  Build complete! Use 'start.cmd --run-only' to start servers.
    exit /b 0
)

REM ============================================================
REM  START SERVICES
REM ============================================================
:start_services
cd /d "%ROOT_DIR%"

echo  ============================================================
echo   Starting services...
echo  ============================================================
echo.

REM ---- Create launcher scripts (avoids nested quote issues) ----
echo @echo off > "%ROOT_DIR%_run_backend.cmd"
echo title GroOne Backend API >> "%ROOT_DIR%_run_backend.cmd"
echo cd /d "%ROOT_DIR%backend" >> "%ROOT_DIR%_run_backend.cmd"
echo node dist/main.js >> "%ROOT_DIR%_run_backend.cmd"
echo echo. >> "%ROOT_DIR%_run_backend.cmd"
echo echo Backend stopped. Press any key to close. >> "%ROOT_DIR%_run_backend.cmd"
echo pause ^>nul >> "%ROOT_DIR%_run_backend.cmd"

echo @echo off > "%ROOT_DIR%_run_web.cmd"
echo title GroOne Web App >> "%ROOT_DIR%_run_web.cmd"
echo cd /d "%ROOT_DIR%web" >> "%ROOT_DIR%_run_web.cmd"
echo node "%ROOT_DIR%node_modules\next\dist\bin\next" dev -p 3001 >> "%ROOT_DIR%_run_web.cmd"
echo echo. >> "%ROOT_DIR%_run_web.cmd"
echo echo Web app stopped. Press any key to close. >> "%ROOT_DIR%_run_web.cmd"
echo pause ^>nul >> "%ROOT_DIR%_run_web.cmd"

REM ---- Start Backend API ----
echo  Starting Backend API on http://localhost:3000/api/v1 ...
start "GroOne-Backend" cmd /c "%ROOT_DIR%_run_backend.cmd"

timeout /t 8 /nobreak >nul

REM Verify backend started
curl -s http://localhost:3000/api/v1/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Backend API started.
) else (
    echo  [WARN] Backend may still be starting - wait a moment.
)

REM ---- Start Web App ----
echo  Starting Web App on http://localhost:3001 ...
start "GroOne-Web" cmd /c "%ROOT_DIR%_run_web.cmd"

timeout /t 8 /nobreak >nul

echo.
echo  ============================================================
echo   All services started!
echo  ============================================================
echo.
echo   Backend API  : http://localhost:3000/api/v1
echo   Swagger Docs : http://localhost:3000/docs
echo   Web App      : http://localhost:3001
echo.
echo   Default tenant: freshmart
echo   Admin login  : admin@freshmart.com / Admin@FM123 / PIN: 1234
echo.
echo   To stop: close the "GroOne Backend API" and
echo            "GroOne Web App" terminal windows.
echo  ============================================================
echo.

REM Open web app in default browser
timeout /t 3 /nobreak >nul
start http://localhost:3001

REM Cleanup launcher scripts after a delay
timeout /t 5 /nobreak >nul
del "%ROOT_DIR%_run_backend.cmd" 2>nul
del "%ROOT_DIR%_run_web.cmd" 2>nul

endlocal
