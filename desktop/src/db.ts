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

/**
 * If a stale postmaster.pid is blocking startup (unclean shutdown), remove it
 * so the cluster can start. If a server is genuinely live on the port, leave
 * it — that's a real "already running" situation surfaced to the user.
 */
async function clearStaleLockIfAny(dir: string): Promise<void> {
  const pidFile = path.join(dir, 'postmaster.pid');
  const exists = fs.existsSync(pidFile);
  if (!exists) return;
  const listening = await portInUse(DB_PORT);
  if (shouldRemoveStaleLock(exists, listening)) {
    console.warn('[pg] stale postmaster.pid (no live server on', DB_PORT, ') — removing to recover');
    try {
      fs.rmSync(pidFile, { force: true });
    } catch (e) {
      console.error('[pg] could not remove stale lock:', e);
    }
  } else {
    console.error('[pg] a Postgres is already listening on', DB_PORT, '— another GroOne may be running');
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
    // while running) that left a lock file behind.
    await clearStaleLockIfAny(dir);
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
