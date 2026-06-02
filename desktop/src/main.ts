/**
 * Electron main process.
 *
 * Boot flow:
 *   1. App ready → load cached license (if any).
 *   2. If cached license is fresh (validUntil > now + small margin) AND
 *      we can heartbeat the backend successfully → open main window.
 *   3. If cached license is fresh but heartbeat fails with NETWORK → open
 *      main window anyway (offline grace).
 *   4. Otherwise → show the license-gate window.
 *   5. After successful activate from the gate → swap to main window.
 *
 * The main window currently points at WEB_URL (default
 * https://app.groone.in). When the standalone-bundled /web is added
 * later, swap to a localhost express in Phase 1.5.
 */

import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import {
  loadLicense,
  saveLicense,
  clearLicense,
  LicenseBlob,
} from './license/store';
import { activate, validate, LicenseError } from './license/validator';
import { getMachineIdShortHash } from './license/machineId';
import { isCachedLicenseFresh } from './license/freshness';

const WEB_URL = process.env.GROONE_WEB_URL || 'https://app.groone.in';

// 24h heartbeat cadence while main window is open.
const HEARTBEAT_INTERVAL_MS = 24 * 60 * 60 * 1000;

let gateWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

function openGateWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 520,
    height: 560,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'GroOne — License Activation',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  w.removeMenu();
  w.loadFile(path.join(__dirname, 'windows', 'license-gate.html'));
  // Helpful in dev. Remove for production builds via electron-builder.
  if (process.env.GROONE_DEVTOOLS === '1') w.webContents.openDevTools({ mode: 'detach' });
  w.on('closed', () => {
    gateWindow = null;
    // If the gate is closed before a main window opens, quit the app.
    if (!mainWindow) app.quit();
  });
  return w;
}

function openMainWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 600,
    title: 'GroOne',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  w.loadURL(WEB_URL);
  w.on('closed', () => {
    mainWindow = null;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  });
  return w;
}

async function tryHeartbeat(blob: LicenseBlob): Promise<{ ok: boolean; networkError: boolean }> {
  try {
    const result = await validate(blob.key);
    blob.lastValidatedAt = new Date().toISOString();
    blob.validUntil = result.validUntil;
    saveLicense(blob);
    return { ok: true, networkError: false };
  } catch (e) {
    const err = e as LicenseError;
    if (err.code === 'NETWORK') {
      return { ok: false, networkError: true };
    }
    return { ok: false, networkError: false };
  }
}

async function bootSequence(): Promise<void> {
  const blob = loadLicense();
  if (!blob) {
    gateWindow = openGateWindow();
    return;
  }
  // Try fresh heartbeat first so a revoked license is caught immediately
  // even if our local cache says it's fresh.
  const hb = await tryHeartbeat(blob);
  if (hb.ok) {
    mainWindow = openMainWindow();
    startHeartbeatLoop();
    return;
  }
  if (hb.networkError && isCachedLicenseFresh(blob)) {
    // Offline grace path: backend unreachable but cache is fresh.
    mainWindow = openMainWindow();
    startHeartbeatLoop();
    return;
  }
  // Otherwise (revoked, expired, machine moved, or grace expired) → gate.
  clearLicense();
  gateWindow = openGateWindow();
}

function startHeartbeatLoop(): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    const blob = loadLicense();
    if (!blob) return;
    const hb = await tryHeartbeat(blob);
    if (!hb.ok && !hb.networkError) {
      // Hard failure — license is no longer valid. Drop back to gate.
      clearLicense();
      if (mainWindow) mainWindow.close();
      gateWindow = openGateWindow();
    }
  }, HEARTBEAT_INTERVAL_MS);
  // Don't keep the process alive solely because of the interval.
  heartbeatTimer.unref?.();
}

// ─── IPC handlers from the license-gate renderer ─────────────────────

ipcMain.handle('groone:license:getMachineHash', () => getMachineIdShortHash());

ipcMain.handle(
  'groone:license:activate',
  async (
    _event,
    payload: { key: string; tenantSlug: string },
  ): Promise<
    { ok: true } | { ok: false; code: LicenseError['code']; message: string }
  > => {
    try {
      const result = await activate(payload.key, payload.tenantSlug);
      const now = new Date().toISOString();
      saveLicense({
        key: result.key,
        tenantSlug: result.tenantSlug,
        plan: result.plan,
        activatedAt: result.activatedAt || now,
        lastValidatedAt: now,
        validUntil: result.validUntil,
      });
      // Swap windows.
      mainWindow = openMainWindow();
      startHeartbeatLoop();
      gateWindow?.close();
      return { ok: true };
    } catch (e) {
      const err = e as LicenseError;
      return { ok: false, code: err.code, message: err.message };
    }
  },
);

ipcMain.handle('groone:app:openExternal', async (_event, url: string) => {
  const { shell } = await import('electron');
  if (/^https?:\/\//.test(url)) await shell.openExternal(url);
});

// ─── App lifecycle ──────────────────────────────────────────────────

app.whenReady().then(() => {
  // Lock down navigation: only allow our web origin in main window.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
    cb({});
  });

  // electron-updater fires automatically (no-op if not packaged).
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((e) => {
      // Updater errors are non-fatal — log + carry on.
      console.error('Auto-update check failed:', e);
    });
  }

  bootSequence().catch((e) => {
    console.error('Boot sequence failed:', e);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootSequence().catch(() => app.quit());
  }
});
