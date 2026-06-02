/**
 * Local Next.js standalone server launcher.
 *
 * The desktop app bundles the web UI's Next standalone output (server.js +
 * traced node_modules + static assets). On launch we spawn that server with
 * Electron's own Node runtime (ELECTRON_RUN_AS_NODE) bound to 127.0.0.1 on a
 * free port, then point the main BrowserWindow at it. No external web host,
 * no manual `next start`.
 *
 * The client bundle has NEXT_PUBLIC_API_URL baked to https://api.groone.in
 * at build time, so the UI talks to the cloud API directly — only the HTML/JS
 * is served locally.
 */

import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

let serverProcess: ChildProcess | null = null;

/** Resolve the bundled web server.js, in both dev and packaged layouts. */
export function resolveServerEntry(): string {
  const candidates = [
    // Packaged: electron-builder extraResources → resources/web-bundle
    process.resourcesPath && path.join(process.resourcesPath, 'web-bundle', 'web', 'server.js'),
    // Dev: desktop/web-bundle produced by `npm run bundle:web`
    path.join(app.getAppPath(), 'web-bundle', 'web', 'server.js'),
    path.join(__dirname, '..', 'web-bundle', 'web', 'server.js'),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `Bundled web server not found. Looked in:\n  ${candidates.join('\n  ')}\n` +
      `Run "npm run bundle:web" (or build with the dist script).`,
  );
}

/** Ask the OS for a free ephemeral port on the loopback interface. */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error('Could not determine a free port')));
      }
    });
  });
}

/** Poll until the local server answers, or time out. */
function waitForServer(port: number, timeoutMs = 20000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1500 }, (res) => {
        res.destroy();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) reject(new Error('Local UI server did not start in time'));
        else setTimeout(tick, 300);
      });
      req.on('timeout', () => {
        req.destroy();
        if (Date.now() > deadline) reject(new Error('Local UI server did not start in time'));
        else setTimeout(tick, 300);
      });
    };
    tick();
  });
}

/**
 * Start the bundled UI server. Returns the URL to load in the BrowserWindow.
 * Idempotent-ish: if already started, returns the existing URL.
 */
export async function startLocalWebServer(): Promise<string> {
  const serverEntry = resolveServerEntry();
  const port = await findFreePort();

  serverProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
    // server.js resolves assets relative to its own dir; cwd there keeps
    // .next/static + public lookups correct.
    cwd: path.dirname(serverEntry),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout?.on('data', (d) => console.log('[web]', d.toString().trim()));
  serverProcess.stderr?.on('data', (d) => console.error('[web]', d.toString().trim()));
  serverProcess.on('exit', (code) => {
    console.error(`Local web server exited with code ${code}`);
    serverProcess = null;
  });

  await waitForServer(port);
  return `http://127.0.0.1:${port}`;
}

export function stopLocalWebServer(): void {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// Make sure we don't leave an orphaned server process behind.
app.on('before-quit', stopLocalWebServer);
app.on('will-quit', stopLocalWebServer);
