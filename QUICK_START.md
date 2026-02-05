# GroceryOne Quick Start Guide

## 🚀 Starting All Services

To start all GroceryOne services (Database, Redis, Backend API, and Mobile App), simply run:

```powershell
.\start_gro.ps1
```

### What This Does

The `start_gro.ps1` script will:

1. **Start Docker Services** (PostgreSQL, Redis, Backend API)
   - PostgreSQL database on port 5432
   - Redis cache on port 6379
   - NestJS Backend API on port 3000

2. **Start Metro Bundler** (React Native development server)
   - Runs on port 8081
   - Clears cache automatically

3. **Build & Deploy Mobile App** (if Android device is connected)
   - Detects connected Android devices
   - Builds and installs the app automatically

### Requirements

Before running the script, ensure you have:

- ✅ Docker Desktop installed and running
- ✅ Node.js (v20+) and npm (v10+) installed
- ✅ Android device connected (optional, for mobile app)
- ✅ USB debugging enabled on Android device (optional)

## 🛑 Stopping All Services

To stop all running services:

```powershell
.\stop_gro.ps1
```

This will:
- Stop all PowerShell background jobs (Metro bundler, builds)
- Stop all Docker containers
- Optionally terminate remaining Node/Expo processes

## 🔍 Checking Service Status

### Docker Services

```powershell
docker-compose ps
```

### Background Jobs

```powershell
Get-Job
```

### View Logs

```powershell
# Docker logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# PowerShell job logs
Receive-Job <JobId> -Keep
```

## 🌐 Service URLs

Once started, access your services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000/api/v1 | REST API endpoints |
| **API Docs** | http://localhost:3000/api/v1/docs | Swagger documentation |
| **Metro Bundler** | http://localhost:8081 | React Native dev server |
| **PostgreSQL** | localhost:5432 | Database (user: postgres) |
| **Redis** | localhost:6379 | Cache server |

## 📱 Running Mobile App

### On Connected Device

If you have an Android device connected with USB debugging enabled, the app will install automatically.

### Manual Installation

```powershell
cd mobile
npx expo run:android
```

### Using Expo Go (Alternative)

1. Install Expo Go app from Play Store
2. Start Metro bundler: `cd mobile && npx expo start`
3. Scan QR code with Expo Go app

## 🔧 Troubleshooting

### "Failed to connect" Error in Mobile App

This error usually means the mobile app can't reach the backend API. Try:

1. **Check Backend is Running**
   ```powershell
   docker-compose ps
   # Backend should show "Up" status
   ```

2. **Check Backend Logs**
   ```powershell
   docker-compose logs -f backend
   ```

3. **Check if Services are Healthy**
   ```powershell
   docker-compose exec backend wget -q -O- http://localhost:3000/api/v1/health
   ```

4. **Verify Network Configuration**
   - Make sure your Android device can reach `localhost:3000`
   - If using a physical device, you may need to use your computer's IP instead
   - Update the API URL in mobile app configuration

5. **Restart Services**
   ```powershell
   .\stop_gro.ps1
   .\start_gro.ps1
   ```

### Docker Not Starting

1. Ensure Docker Desktop is running
2. Check Docker logs: `docker-compose logs`
3. Try rebuilding: `docker-compose up -d --build`

### Metro Bundler Issues

1. Clear Metro cache:
   ```powershell
   cd mobile
   npx expo start --clear
   ```

2. Clear watchman cache:
   ```powershell
   watchman watch-del-all
   ```

3. Reset node modules:
   ```powershell
   cd mobile
   rm -rf node_modules
   npm install
   ```

### Port Already in Use

If you get "port already in use" errors:

```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8081
netstat -ano | findstr :5432

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes**
   - Backend runs with hot-reload enabled
   - Changes are automatically reflected
   - Check logs: `docker-compose logs -f backend`

2. **Mobile Changes**
   - Metro bundler auto-reloads on file changes
   - Shake device or press `r` in terminal to reload manually

3. **Database Changes**
   ```powershell
   # Run migrations
   docker-compose exec backend npm run migration:run

   # Seed data
   docker-compose exec backend npm run seed
   ```

### Running Tests

```powershell
# Backend tests
docker-compose exec backend npm test

# Mobile tests
cd mobile
npm test
```

## 📦 Environment Variables

Create a `.env` file in the project root to customize settings:

```env
# Database
DB_NAME=gro_one
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Backend
BACKEND_PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development

# Auto-seed data on startup
AUTO_SEED=true
```

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- View job status: `Get-Job`
- See running containers: `docker ps`
- Check connected devices: `adb devices`

For more detailed documentation, see [README.md](./README.md)
