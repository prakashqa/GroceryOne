/**
 * Embedded PostgreSQL lifecycle for the offline desktop app.
 *
 * Each install runs its own private Postgres cluster under
 * %APPDATA%/GroOne/pgdata. We initialise it once (first run), start it on
 * every launch, ensure the `groone` database exists, and stop it gracefully
 * on quit so the data files are never corrupted.
 *
 * The NestJS backend (spawned separately, see ./backend) connects to this
 * cluster on 127.0.0.1:DB_PORT with the credentials returned here.
 */

import { app } from 'electron';
import type EmbeddedPostgres from 'embedded-postgres';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';

// embedded-postgres is ESM-only. The desktop main process is CommonJS, so a
// plain `require`/static import fails at runtime (ERR_REQUIRE_ESM). Load it
// via a real dynamic import() that TypeScript won't downlevel to require()
// (the `new Function` wrapper hides it from the compiler).
const importEsm = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
let EmbeddedPostgresCtor: typeof EmbeddedPostgres | null = null;
async function loadEmbeddedPostgres(): Promise<typeof EmbeddedPostgres> {
  if (!EmbeddedPostgresCtor) {
    const mod = await importEsm('embedded-postgres');
    EmbeddedPostgresCtor = (mod.default || mod) as typeof EmbeddedPostgres;
  }
  return EmbeddedPostgresCtor;
}

export const DB_PORT = 47632;
export const DB_USER = 'groone';
export const DB_PASSWORD = 'groone-local'; // local loopback only; never exposed off-box
export const DB_NAME = 'groone';

let pg: EmbeddedPostgres | null = null;

export interface DbConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function dataDir(): string {
  return path.join(app.getPath('userData'), 'pgdata');
}

/** A cluster is "initialised" once initdb has populated PG_VERSION. */
function isInitialised(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'PG_VERSION'));
}

/**
 * Pure decision: a `postmaster.pid` is stale (safe to delete) when the lock
 * file exists but nothing is actually listening on the PG port — i.e. a
 * previous run was killed/crashed without cleaning up. If a server IS
 * listening, the lock is live (another instance) and must NOT be removed.
 */
export function shouldRemoveStaleLock(pidFileExists: boolean, serverListening: boolean): boolean {
  return pidFileExists && !serverListening;
}

/** Is something accepting TCP connections on host:port right now? */
function portInUse(port: number, host = '127.0.0.1', timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    const finish = (v: boolean) => { sock.destroy(); resolve(v); };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('timeout', () => finish(false));
    sock.once('error', () => finish(false));
    sock.connect(port, host);
  });
}

/** Parse the postmaster PID from a pgdata lock file's first line. Pure. */
export function parsePostmasterPid(contents: string | null | undefined): number | null {
  if (!contents) return null;
  const first = contents.split(/\r?\n/)[0]?.trim();
  const pid = Number(first);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function readPostmasterPid(dir: string): number | null {
  try {
    return parsePostmasterPid(fs.readFileSync(path.join(dir, 'postmaster.pid'), 'utf8'));
  } catch {
    return null;
  }
}

/** Run a Windows helper and capture stdout; '' on any failure. */
function runWin(cmd: string, args: string[]): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const r = require('child_process').spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true });
    return (r && typeof r.stdout === 'string') ? r.stdout : '';
  } catch {
    return '';
  }
}

/** Parse `netstat -ano -p tcp` output for PIDs LISTENING on the given port. Pure. */
export function parseNetstatListenerPids(stdout: string, port: number): number[] {
  const pids = new Set<number>();
  for (const raw of (stdout || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!/^TCP/i.test(line) || !/LISTENING/i.test(line)) continue;
    const cols = line.split(/\s+/);
    const local = cols[1] || '';
    const pid = Number(cols[cols.length - 1]);
    if (local.endsWith(`:${port}`) && Number.isInteger(pid) && pid > 0) pids.add(pid);
  }
  return [...pids];
}

/** Parse a newline-separated list of PIDs (PowerShell output). Pure. */
export function parsePidList(stdout: string): number[] {
  const pids = new Set<number>();
  for (const tok of (stdout || '').split(/\r?\n/)) {
    const pid = Number(tok.trim());
    if (Number.isInteger(pid) && pid > 0) pids.add(pid);
  }
  return [...pids];
}

/** PIDs currently LISTENING on the port (Windows). */
function findListenerPids(port: number): number[] {
  if (process.platform !== 'win32') return [];
  return parseNetstatListenerPids(runWin('netstat', ['-ano', '-p', 'tcp']), port);
}

/** postgres.exe PIDs launched from OUR bundled binary (under @embedded-postgres). */
function findOurPostgresPids(): number[] {
  if (process.platform !== 'win32') return [];
  const ps =
    "Get-CimInstance Win32_Process -Filter \"Name='postgres.exe'\" | " +
    "Where-Object { $_.ExecutablePath -like '*@embedded-postgres*' } | " +
    'ForEach-Object { $_.ProcessId }';
  return parsePidList(runWin('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]));
}

/** Force-terminate a process tree (Windows taskkill /T; POSIX SIGKILL). */
function killProcessTree(pid: number): void {
  try {
    if (process.platform === 'win32') {
      // /T also kills the child postgres workers; /F forces it.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('child_process').spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
  } catch (e) {
    console.error('[pg] failed to terminate orphaned process', pid, e);
  }
}

/** Poll until nothing is listening on the port (or timeout). */
async function waitForPortFree(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await portInUse(port))) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return !(await portInUse(port));
}

/**
 * Recover a data dir whose previous Postgres didn't shut down cleanly.
 *
 * Startup is only reached after acquiring the single-instance APP lock, so any
 * Postgres still listening on our fixed port is an ORPHAN from a prior run
 * (e.g. the installer replaced a still-running copy, or the app was killed).
 * Terminate the cluster our own postmaster.pid points at, wait for the port to
 * free, then drop the lock so start() can proceed. A stale lock with no live
 * server is simply removed. We never kill a process we don't own.
 */
export interface RecoveryInputs {
  /** A postmaster.pid lock file exists in the data dir. */
  hasPidFile: boolean;
  /** Something is currently accepting connections on DB_PORT. */
  listening: boolean;
  /** PIDs found LISTENING on DB_PORT (netstat). */
  listenerPids: number[];
  /** postgres.exe PIDs running from our bundled @embedded-postgres binary. */
  ourPids: number[];
  /** PID recorded in our postmaster.pid (may be stale). */
  pidFromFile: number | null;
}

export interface RecoveryPlan {
  /** Remove a stale lock file (only when nothing is live on the port). */
  removeLock: boolean;
  /** Distinct PIDs to force-terminate to free the port. */
  kill: number[];
  /** Port is held but no PID is attributable to us — refuse to kill anything. */
  abortUnknownOwner: boolean;
}

/**
 * Pure recovery decision (no fs / no process kills) so the dangerous "what do we
 * terminate" logic is unit-testable. The imperative wrapper supplies the inputs
 * and performs the side effects.
 *
 * Safety invariant: when the port is held but we cannot attribute ANY pid to our
 * own cluster (no listener pid, no bundled-postgres pid, no lock-file pid), we
 * return `abortUnknownOwner` and an EMPTY kill set — we never kill a process we
 * can't prove is ours.
 */
export function planRecovery(i: RecoveryInputs): RecoveryPlan {
  if (!i.listening) {
    // Nothing live on the port: a leftover lock is stale and safe to remove.
    return { removeLock: i.hasPidFile, kill: [], abortUnknownOwner: false };
  }
  const targets = new Set<number>([...i.listenerPids, ...i.ourPids]);
  if (i.pidFromFile) targets.add(i.pidFromFile);
  if (targets.size === 0) {
    return { removeLock: false, kill: [], abortUnknownOwner: true };
  }
  return { removeLock: false, kill: [...targets], abortUnknownOwner: false };
}

async function recoverStuckCluster(dir: string): Promise<void> {
  const pidFile = path.join(dir, 'postmaster.pid');
  const hasPidFile = fs.existsSync(pidFile);
  const listening = await portInUse(DB_PORT);

  const plan = planRecovery({
    hasPidFile,
    listening,
    listenerPids: listening ? findListenerPids(DB_PORT) : [],
    ourPids: listening ? findOurPostgresPids() : [],
    pidFromFile: readPostmasterPid(dir),
  });

  if (plan.removeLock) {
    console.warn('[pg] stale postmaster.pid (no live server on', DB_PORT, ') — removing to recover');
    try { fs.rmSync(pidFile, { force: true }); } catch (e) { console.error('[pg] could not remove stale lock:', e); }
    return;
  }
  if (plan.abortUnknownOwner) {
    console.error('[pg] a Postgres is listening on', DB_PORT, 'but its PID could not be found — another app may own the port');
    return; // leave the lock; the port guard in startPostgres surfaces a clear error
  }
  if (plan.kill.length === 0) return; // not listening, no lock — nothing to do

  // A live orphan we own (we hold the single-instance app lock). Terminate the
  // whole set; killing the postmaster tree also releases the shared-memory
  // segment that would otherwise block a fresh start.
  for (const pid of plan.kill) {
    console.warn('[pg] terminating orphaned Postgres pid', pid, 'to free', DB_PORT);
    killProcessTree(pid);
  }

  if (await waitForPortFree(DB_PORT, 10000)) {
    if (hasPidFile) { try { fs.rmSync(pidFile, { force: true }); } catch { /* ignore */ } }
    console.log('[pg] orphaned cluster cleared; continuing startup');
  } else {
    console.error('[pg] port', DB_PORT, 'still busy after terminating', plan.kill.join(', '));
  }
}

/**
 * Initialise (first run only), start the cluster, and ensure the app
 * database exists. Returns the connection params for the backend.
 */
export async function startPostgres(): Promise<DbConnection> {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });

  const EmbeddedPostgresClass = await loadEmbeddedPostgres();
  pg = new EmbeddedPostgresClass({
    databaseDir: dir,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    authMethod: 'password',
    persistent: true,
    // Force UTF8 so emoji (e.g. the 📁 category icon default) and ₹/Telugu
    // text store correctly. Windows initdb otherwise defaults to WIN1252,
    // which rejects multibyte chars. --locale=C sidesteps Windows locale
    // quirks while keeping UTF8 encoding.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: (m: string) => console.log('[pg]', m),
    onError: (m: string | Error | unknown) => console.error('[pg]', m),
  });

  if (!isInitialised(dir)) {
    console.log('[pg] initialising new cluster at', dir);
    await pg.initialise();
  } else {
    // Recover from an unclean previous shutdown (crash/kill/forced reinstall
    // while running) — including an orphaned Postgres still holding our port.
    await recoverStuckCluster(dir);
  }

  // If the port is STILL occupied (a process we couldn't terminate, or one we
  // don't own), fail with an actionable message rather than the cryptic
  // "shared memory block is still in use" / undefined that initdb returns.
  if (await portInUse(DB_PORT)) {
    throw new Error(
      `the database port ${DB_PORT} is still in use by a leftover process. ` +
        `Close any other copy of GroOne, or restart Windows to clear it, then open GroOne again.`,
    );
  }

  try {
    await pg.start();
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    throw new Error(
      `Embedded database failed to start: ${msg}. ` +
        `Make sure no other copy of GroOne is running, then try again ` +
        `(a restart of Windows clears any leftover database process).`,
    );
  }

  // Ensure the app database exists. createDatabase throws if it already
  // exists, so swallow that specific case.
  try {
    await pg.createDatabase(DB_NAME);
    console.log('[pg] created database', DB_NAME);
  } catch (e) {
    const msg = (e as Error)?.message || '';
    if (!/already exists/i.test(msg)) {
      // Re-throw genuine failures; ignore "already exists".
      if (!/duplicate/i.test(msg)) throw e;
    }
  }

  await reconcileLicenseKeysColumn();

  return {
    host: '127.0.0.1',
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
}

/**
 * Pre-sync migration shim for the desktop's embedded DB.
 *
 * The backend boots with TypeORM `synchronize=true`. When the shared
 * `LicenseKey.key` column was widened (varchar(35) → varchar(512)) and the
 * existing `license_keys` table already had rows — or was left half-migrated
 * by an earlier failed boot — TypeORM emits a destructive
 * `ALTER TABLE license_keys ADD "key" varchar(512) NOT NULL`, which Postgres
 * rejects with "column key … contains null values", so the app never starts.
 *
 * Desktop `license_keys` rows are NOT used by the offline license gate (it
 * verifies the signed token in license.dat), so here we make the column match
 * the entity in-place — add it if missing, backfill any nulls, widen, set NOT
 * NULL — BEFORE the backend runs synchronize. That turns the sync into a
 * no-op for this column and lets startup proceed. Idempotent + best-effort;
 * never blocks startup.
 */
async function reconcileLicenseKeysColumn(): Promise<void> {
  if (!pg) return;
  let client: { connect(): Promise<void>; query(q: string): Promise<unknown>; end(): Promise<void> } | undefined;
  try {
    client = pg.getPgClient(DB_NAME, '127.0.0.1') as typeof client;
    await client!.connect();
    await client!.query(`
      DO $$
      BEGIN
        IF to_regclass('public.license_keys') IS NOT NULL THEN
          ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS "key" varchar(512);
          UPDATE license_keys SET "key" = 'legacy-' || id::text WHERE "key" IS NULL;
          ALTER TABLE license_keys ALTER COLUMN "key" TYPE varchar(512);
          ALTER TABLE license_keys ALTER COLUMN "key" SET NOT NULL;
        END IF;
      END $$;
    `);
    console.log('[pg] reconciled license_keys.key for safe schema sync');
  } catch (e) {
    console.error('[pg] license_keys reconcile skipped:', (e as Error)?.message || e);
  } finally {
    try { await client?.end(); } catch { /* ignore */ }
  }
}

export async function stopPostgres(): Promise<void> {
  if (pg) {
    try {
      await pg.stop();
      console.log('[pg] stopped cleanly');
    } catch (e) {
      console.error('[pg] stop failed', e);
    } finally {
      pg = null;
    }
  }
}
