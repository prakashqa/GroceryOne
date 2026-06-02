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
import EmbeddedPostgres from 'embedded-postgres';
import * as path from 'path';
import * as fs from 'fs';

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
 * Initialise (first run only), start the cluster, and ensure the app
 * database exists. Returns the connection params for the backend.
 */
export async function startPostgres(): Promise<DbConnection> {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });

  pg = new EmbeddedPostgres({
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
  }

  await pg.start();

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

  return {
    host: '127.0.0.1',
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
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
