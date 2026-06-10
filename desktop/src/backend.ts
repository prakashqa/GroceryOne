/**
 * Local NestJS backend launcher.
 *
 * Spawns the bundled backend (backend-bundle/dist/main.js) with Electron's own
 * Node (ELECTRON_RUN_AS_NODE), pointed at the embedded Postgres on 127.0.0.1.
 * Local-mode flags turn off Redis + subscription enforcement and force schema
 * sync so the embedded DB builds itself on first run.
 *
 * bcrypt (native) loads fine under Electron's Node ABI (verified), so no
 * rebuild is needed.
 */

import { app, safeStorage } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as crypto from 'crypto';
import type { DbConnection } from './db';

export const BACKEND_PORT = 47600;
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}/api/v1`;

let backendProcess: ChildProcess | null = null;

/** Resolve the bundled backend entry in dev + packaged layouts. */
function resolveBackendEntry(): string {
  const candidates = [
    process.resourcesPath && path.join(process.resourcesPath, 'backend-bundle', 'dist', 'main.js'),
    path.join(app.getAppPath(), 'backend-bundle', 'dist', 'main.js'),
    path.join(__dirname, '..', 'backend-bundle', 'dist', 'main.js'),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`Bundled backend not found. Looked in:\n  ${candidates.join('\n  ')}`);
}

/**
 * Get-or-create a per-install JWT secret, persisted (encrypted) under
 * userData so issued tokens survive restarts.
 */
function getOrCreateJwtSecret(): string {
  const p = path.join(app.getPath('userData'), 'jwt.secret');
  try {
    if (fs.existsSync(p) && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(fs.readFileSync(p));
    }
  } catch {
    /* fall through and regenerate */
  }
  const secret = crypto.randomBytes(48).toString('hex');
  try {
    if (safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(p, safeStorage.encryptString(secret), { mode: 0o600 });
    }
  } catch {
    /* non-fatal: a non-persisted secret still works for this session */
  }
  return secret;
}

/** Last lines of backend stderr, for surfacing a real cause on failure. */
const backendErrTail: string[] = [];
function pushErrTail(chunk: string): void {
  for (const line of chunk.split('\n')) {
    const t = line.trim();
    if (t) {
      backendErrTail.push(t);
      if (backendErrTail.length > 40) backendErrTail.shift();
    }
  }
}

function waitForHealth(timeoutMs = 90000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`${BACKEND_URL}/health`, { timeout: 2000 }, (res) => {
        res.destroy();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() > deadline) reject(new Error('Backend did not become healthy in time'));
      else setTimeout(tick, 400);
    };
    tick();
  });
}

/** Start the bundled backend against the given local Postgres. Resolves when healthy. */
export async function startBackend(db: DbConnection): Promise<string> {
  const entry = resolveBackendEntry();

  backendProcess = spawn(process.execPath, [entry], {
    cwd: path.dirname(path.dirname(entry)), // backend-bundle/
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(BACKEND_PORT),
      // Local DB
      DB_HOST: db.host,
      DB_PORT: String(db.port),
      DB_USERNAME: db.user,
      DB_PASSWORD: db.password,
      DB_NAME: db.database,
      DB_SSL: 'false',
      // Local-mode flags (Phase 1)
      DB_SYNCHRONIZE: 'true',
      REDIS_DISABLED: 'true',
      SUBSCRIPTION_ENFORCED: 'false',
      // Offline desktop is a single-operator test/sales tool: enable the
      // "Generate test barcodes" admin helper (gated off in the cloud product).
      TEST_TOOLS_ENABLED: 'true',
      // Auth
      JWT_SECRET: getOrCreateJwtSecret(),
      // Desktop renderer is the only client; allow it.
      CORS_ORIGIN: '*',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout?.on('data', (d) => console.log('[backend]', d.toString().trim()));
  backendProcess.stderr?.on('data', (d) => {
    const s = d.toString();
    console.error('[backend]', s.trim());
    pushErrTail(s);
  });
  let exitInfo: string | null = null;
  backendProcess.on('exit', (code) => {
    exitInfo = `backend process exited early with code ${code}`;
    console.error(exitInfo);
    backendProcess = null;
  });

  try {
    await waitForHealth();
  } catch {
    const tail = backendErrTail.slice(-12).join('\n');
    const hint = backendErrTail.some((l) => /EADDRINUSE/i.test(l))
      ? 'A previous GroOne backend is still using the port — close any running copy (or restart Windows) and try again.'
      : exitInfo || 'The backend did not respond in time.';
    throw new Error(`Backend did not become healthy in time. ${hint}\n${tail}`.trim());
  }
  return BACKEND_URL;
}

export function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}
