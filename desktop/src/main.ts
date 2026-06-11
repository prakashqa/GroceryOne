/**
 * Electron main process — offline, self-contained desktop app.
 *
 * Boot flow:
 *   1. Load the stored license token → verify OFFLINE (Ed25519 sig + expiry).
 *      - valid   → start the app (Postgres → backend → UI → window).
 *      - missing/invalid/expired → show the license gate.
 *   2. Gate: user pastes/imports a license → verify → store → start the app.
 *
 * Everything runs locally on 127.0.0.1: embedded Postgres, the bundled
 * NestJS backend, and the bundled Next.js UI. No network, no Vultr.
 */

// Must be installed BEFORE any local module that could spawn an unpacked
// binary (embedded-postgres). Keep this import first.
import { installAsarSpawnFix } from './asar-spawn-fix';
installAsarSpawnFix();

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import { initLogger, tailLog, getLogPath, buildErrorDetail } from './log';
import { isClockRolledBack, readLastSeen, recordSeen, CLOCK_TOLERANCE_MS } from './clockGuard';
import { loadLicense, saveLicense, clearLicense } from './license/store';
import { verifyLicense, LicenseError, LicensePayload } from './license/validator';
import { startLocalWebServer, stopLocalWebServer } from './server';
import { startPostgres, stopPostgres } from './db';
import { startBackend, stopBackend } from './backend';

const WEB_URL_OVERRIDE = process.env.GROONE_WEB_URL || ''; // dev-only

let gateWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let started = false; // app stack started (guards double-start)

// ─── Windows ─────────────────────────────────────────────────────────

function openGateWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 560,
    height: 600,
    resizable: false,
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
  if (process.env.GROONE_DEVTOOLS === '1') w.webContents.openDevTools({ mode: 'detach' });
  w.on('closed', () => {
    gateWindow = null;
    if (!mainWindow && !splashWindow) app.quit();
  });
  return w;
}

function openSplash(): BrowserWindow {
  const w = new BrowserWindow({
    width: 420,
    height: 240,
    frame: false,
    resizable: false,
    center: true,
    title: 'GroOne',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  w.removeMenu();
  const html =
    `<!doctype html><meta charset="utf-8"><style>` +
    `html,body{margin:0;height:100%;font-family:Segoe UI,Arial,sans-serif;background:#2e7d32;color:#fff;` +
    `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}` +
    `.logo{font-size:30px;font-weight:700;letter-spacing:.5px}.msg{opacity:.9;font-size:14px}` +
    `.bar{width:160px;height:4px;border-radius:2px;background:rgba(255,255,255,.3);overflow:hidden}` +
    `.bar::before{content:"";display:block;height:100%;width:40%;background:#fff;animation:s 1.1s infinite}` +
    `@keyframes s{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}</style>` +
    `<div class="logo">GroOne</div><div class="msg">Starting up…</div><div class="bar"></div>`;
  w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  w.on('closed', () => {
    splashWindow = null;
  });
  return w;
}

function openMainWindow(url: string): BrowserWindow {
  const w = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: 'GroOne',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Grant ONLY camera/microphone ('media') so the in-app barcode scanner
  // (html5-qrcode getUserMedia) works in the packaged build. The window only
  // ever loads the local app origin (http://127.0.0.1), so this is safe; every
  // other permission (geolocation, notifications, …) stays denied by default.
  w.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media');
  });

  w.loadURL(url);
  w.once('ready-to-show', () => {
    w.show();
    splashWindow?.close();
    gateWindow?.close();
  });
  w.on('closed', () => {
    mainWindow = null;
  });
  return w;
}

// ─── App stack orchestration ─────────────────────────────────────────

/** Start Postgres → backend → UI, then open the main window. */
async function startApp(): Promise<void> {
  if (started) return;

  // Anti-rollback: offline expiry trusts the system clock, so refuse to start
  // if the clock was set earlier than the furthest time we've seen (a likely
  // attempt to outrun a yearly expiry). Recoverable — the user fixes the date.
  const now = Date.now();
  if (isClockRolledBack(now, readLastSeen(), CLOCK_TOLERANCE_MS)) {
    console.error('[clock] system clock is earlier than last-seen high-water mark — refusing to start');
    dialog.showErrorBox(
      'Check your computer clock',
      "GroOne can't start because your computer's date appears to be set earlier than expected.\n\n" +
        'Please correct the system date & time, then open GroOne again.\n\n' +
        'If the date is correct and this keeps happening, contact support@groone.in.',
    );
    app.quit();
    return;
  }

  started = true;
  recordSeen(now);
  if (!gateWindow) splashWindow = openSplash();
  try {
    const db = await startPostgres();
    await startBackend(db);
    const url = WEB_URL_OVERRIDE || (await startLocalWebServer());
    mainWindow = openMainWindow(url);
  } catch (e) {
    started = false;
    const msg = (e as Error)?.message || String(e);
    console.error('startApp failed:', e);
    splashWindow?.close();
    dialog.showErrorBox(
      'GroOne could not start',
      buildErrorDetail(msg, tailLog(15), getLogPath()),
    );
    app.quit();
  }
}

// ─── Boot ────────────────────────────────────────────────────────────

function verifyStored(): LicensePayload | null {
  const blob = loadLicense();
  if (!blob?.token) return null;
  try {
    return verifyLicense(blob.token);
  } catch {
    clearLicense();
    return null;
  }
}

async function bootSequence(): Promise<void> {
  const valid = verifyStored();
  if (valid) {
    await startApp();
  } else {
    gateWindow = openGateWindow();
  }
}

// ─── IPC (license gate) ──────────────────────────────────────────────

ipcMain.handle(
  'groone:license:submit',
  async (
    _e,
    token: string,
  ): Promise<{ ok: true; customer: string; expiresAt: string } | { ok: false; code: string; message: string }> => {
    try {
      const payload = verifyLicense(token);
      saveLicense({
        token: token.trim(),
        customer: payload.customer,
        plan: payload.plan,
        expiresAt: payload.expiresAt,
      });
      // Boot the app stack (gate window stays until the main window is ready).
      startApp();
      return { ok: true, customer: payload.customer, expiresAt: payload.expiresAt };
    } catch (e) {
      const err = e as LicenseError;
      return { ok: false, code: err.code || 'UNKNOWN', message: err.message || 'Invalid license' };
    }
  },
);

ipcMain.handle('groone:license:importFile', async (): Promise<string | null> => {
  const res = await dialog.showOpenDialog({
    title: 'Select your GroOne license (.lic)',
    filters: [{ name: 'License', extensions: ['lic', 'txt'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  try {
    return fs.readFileSync(res.filePaths[0], 'utf8');
  } catch {
    return null;
  }
});

ipcMain.handle('groone:app:openExternal', async (_e, url: string) => {
  const { shell } = await import('electron');
  if (/^(https?|mailto):/.test(url)) await shell.openExternal(url);
});

// Stored license summary for the in-app expiry banner (renderer is the local
// app origin only). Returns null when no license is stored.
ipcMain.handle('groone:license:info', () => {
  const blob = loadLicense();
  return blob ? { customer: blob.customer, plan: blob.plan, expiresAt: blob.expiresAt } : null;
});

// ─── Lifecycle ───────────────────────────────────────────────────────

// Single-instance lock: a second copy would collide with the first on the
// fixed Postgres (47632) / backend (47600) ports and fail to start. Refuse to
// run twice; focus the existing window instead. This also covers the common
// "launched the updated app while the old one was still closing" case.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = mainWindow || gateWindow || splashWindow;
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    initLogger();
    console.log('[app] starting GroOne', app.getVersion());
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify().catch((e) => console.error('Auto-update check failed:', e));
    }
    bootSequence().catch((e) => {
      console.error('Boot sequence failed:', e);
      app.quit();
    });
  });
}

// Graceful shutdown: UI → backend → Postgres (data integrity).
let quitting = false;
app.on('before-quit', () => {
  // Capture the latest time this session ran so a later rollback is detected.
  recordSeen(Date.now());
  stopLocalWebServer();
  stopBackend();
});
app.on('will-quit', (e) => {
  if (quitting) return; // allow the forced exit below to proceed
  quitting = true;
  e.preventDefault();
  // Stop Postgres cleanly, but never hang the quit longer than 6s.
  const done = () => app.exit(0);
  const timer = setTimeout(done, 6000);
  stopPostgres().finally(() => {
    clearTimeout(timer);
    done();
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
