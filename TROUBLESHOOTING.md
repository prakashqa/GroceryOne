# GroOne Troubleshooting Guide

## 🔴 "Failed to connect" Error in Mobile App

This is the most common issue and occurs when the mobile app cannot reach the backend API. Follow these steps to resolve:

### Quick Fix (Most Common Solution)

**The issue:** Your Android device cannot access `localhost:3000` because "localhost" on the device refers to the device itself, not your computer.

**The solution:** Run ADB reverse to forward the port:

```powershell
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

This makes `localhost:3000` on your Android device point to `localhost:3000` on your computer.

### Step-by-Step Diagnosis

#### Step 1: Verify Backend is Running

```powershell
# Check Docker containers
docker-compose ps

# Expected output: backend should show "Up (healthy)"
```

#### Step 2: Test Backend API from Computer

```powershell
# Test health endpoint
curl http://localhost:3000/api/v1/health

# Or open in browser:
# http://localhost:3000/api/v1/docs
```

**Expected result:** You should see a JSON response or the Swagger documentation page.

❌ **If this fails:** Your backend is not running properly.
- Run: `docker-compose logs backend`
- Check for errors in the logs
- Try: `docker-compose restart backend`

#### Step 3: Check Device Connection

```powershell
adb devices
```

**Expected output:**
```
List of devices attached
RZCX6206F4R	device
```

❌ **If device not listed:**
- Reconnect USB cable
- Enable USB debugging on device:
  - Settings → About Phone → Tap "Build Number" 7 times
  - Settings → Developer Options → Enable USB Debugging
- Run `adb devices` again

#### Step 4: Configure ADB Reverse

```powershell
# Forward backend API port
adb reverse tcp:3000 tcp:3000

# Forward Metro bundler port
adb reverse tcp:8081 tcp:8081

# Verify it worked
adb reverse --list
```

**Expected output:**
```
(reverse) tcp:3000 tcp:3000
(reverse) tcp:8081 tcp:8081
```

#### Step 5: Test Connection from Device

Open a terminal/cmd and run:

```powershell
# Test if device can reach backend
adb shell curl http://localhost:3000/api/v1/health
```

**Expected result:** You should see the health check JSON response.

✅ **If this works:** Your device can now reach the backend!
❌ **If this fails:** See "Alternative Solutions" below.

#### Step 6: Restart the Mobile App

After configuring ADB reverse, restart the app:
- Close the app completely on your device
- Reopen it

The "Failed to connect" error should be gone!

---

## Alternative Solutions

If ADB reverse doesn't work or you prefer a different approach:

### Option 1: Use Your Computer's IP Address

1. **Find your computer's IP address:**
   ```powershell
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. **Update mobile app configuration:**
   Edit: `mobile\src\core\config\api.config.ts`

   ```typescript
   BASE_URL: __DEV__
     ? 'http://192.168.1.100:3000/api/v1' // Replace with YOUR IP
     : 'https://api.groceryone.com/api/v1',
   ```

3. **Ensure both devices are on same WiFi network**

4. **Rebuild the app:**
   ```powershell
   cd mobile
   npx expo run:android
   ```

### Option 2: Use Android Emulator Instead

The Android emulator has special IP address `10.0.2.2` that always points to the host machine:

1. **Update config:**
   ```typescript
   BASE_URL: __DEV__
     ? 'http://10.0.2.2:3000/api/v1'
     : 'https://api.groceryone.com/api/v1',
   ```

2. **Start emulator:**
   - Open Android Studio
   - Launch an emulator
   - Run: `npx expo run:android`

---

## 🐞 Other Common Issues

### Metro Bundler Connection Failed

**Symptoms:** App shows red screen "Could not connect to development server"

**Solution:**
```powershell
# Configure ADB reverse for Metro
adb reverse tcp:8081 tcp:8081

# Or restart Metro with cache clear
cd mobile
npx expo start --clear
```

### Backend Health Check Fails

**Symptoms:** `http://localhost:3000/api/v1/health` returns error

**Check logs:**
```powershell
docker-compose logs backend
```

**Common causes:**
1. **Database not ready:** Wait 30 seconds after starting services
2. **Environment variables missing:** Check `.env` file
3. **Port already in use:**
   ```powershell
   netstat -ano | findstr :3000
   # If something else is using port 3000, stop it
   ```

### PostgreSQL Connection Error

**Symptoms:** Backend logs show "ECONNREFUSED" or "password authentication failed"

**Solution:**
```powershell
# Check PostgreSQL status
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Redis Connection Error

**Symptoms:** Backend logs show Redis connection errors

**Solution:**
```powershell
# Check Redis status
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

### Build Fails on Android

**Symptoms:** Gradle build errors or "Could not resolve dependencies"

**Solution:**
```powershell
cd mobile/android
./gradlew clean

cd ..
rm -rf node_modules
npm install

npx expo run:android
```

### App Crashes on Startup

**Check device logs:**
```powershell
adb logcat | Select-String "GroOne|ReactNative|ERROR"
```

**Common causes:**
1. Missing native dependencies - run `npm install` in mobile folder
2. Out of sync - restart Metro bundler
3. Corrupted build - run `cd mobile/android && ./gradlew clean`

---

## 🔍 Diagnostic Commands

### Check All Services Status

```powershell
# Docker services
docker-compose ps

# PowerShell jobs
Get-Job

# Device connection
adb devices

# Port forwarding
adb reverse --list
```

### View All Logs

```powershell
# Backend logs
docker-compose logs -f backend

# PostgreSQL logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# Device logs (filtered)
adb logcat -s ReactNative:* ReactNativeJS:* GroOne:*

# Metro bundler logs
Receive-Job <MetroJobId> -Keep
```

### Test Network Connectivity

```powershell
# From your computer
curl http://localhost:3000/api/v1/health

# From the device
adb shell curl http://localhost:3000/api/v1/health

# Check if port is open
Test-NetConnection -ComputerName localhost -Port 3000
```

---

## 📋 Pre-Flight Checklist

Before reporting an issue, verify:

- [ ] Docker Desktop is running
- [ ] All Docker containers are "Up (healthy)": `docker-compose ps`
- [ ] Backend API responds: `curl http://localhost:3000/api/v1/health`
- [ ] Device is connected: `adb devices`
- [ ] ADB reverse is configured: `adb reverse --list`
- [ ] Metro bundler is running (check with `Get-Job`)
- [ ] Device and computer are on same network (if using IP address method)

---

## 🆘 Still Having Issues?

If none of these solutions work:

1. **Collect logs:**
   ```powershell
   docker-compose logs > docker-logs.txt
   adb logcat -d > device-logs.txt
   ```

2. **Check service health:**
   ```powershell
   docker-compose exec backend wget -q -O- http://localhost:3000/api/v1/health
   ```

3. **Complete reset:**
   ```powershell
   .\stop_gro.ps1
   docker-compose down -v
   cd mobile/android
   ./gradlew clean
   cd ../..
   .\start_gro.ps1
   ```

4. **Report the issue** with:
   - Error message (exact text)
   - Logs from above
   - Steps you've already tried
   - Your environment (Windows version, Node version, etc.)
