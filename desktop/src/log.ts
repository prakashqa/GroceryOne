/**
 * Startup logger — tees console output to a file under userData so a failed
 * launch on a customer machine can be diagnosed (the packaged app has no
 * visible console). Truncated on each launch; also keeps the last N lines in
 * memory for surfacing in the error dialog.
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const MAX_BUFFER = 500;
const ring: string[] = [];
let logFilePath = '';

/** Decide what the error dialog shows: prefer captured detail, else a hint. */
export function buildErrorDetail(message: string, tail: string, logPath: string): string {
  const parts = [message.trim()];
  if (tail.trim()) parts.push('— Details —\n' + tail.trim());
  if (logPath) parts.push('Log file: ' + logPath);
  parts.push('If this keeps happening, please contact support@groone.in.');
  return parts.join('\n\n');
}

export function initLogger(): void {
  try {
    const dir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    logFilePath = path.join(dir, 'startup.log');
    fs.writeFileSync(logFilePath, `=== GroOne launch ${new Date().toISOString()} (v${app.getVersion()}) ===\n`);
  } catch {
    /* logging is best-effort — never block startup */
  }

  const tee = (orig: (...a: unknown[]) => void) =>
    (...args: unknown[]) => {
      orig(...args);
      const line = `[${new Date().toISOString()}] ${args.map((a) => (a instanceof Error ? a.stack || a.message : String(a))).join(' ')}`;
      ring.push(line);
      if (ring.length > MAX_BUFFER) ring.shift();
      if (logFilePath) {
        try { fs.appendFileSync(logFilePath, line + '\n'); } catch { /* ignore */ }
      }
    };

  /* eslint-disable no-console */
  console.log = tee(console.log.bind(console));
  console.warn = tee(console.warn.bind(console));
  console.error = tee(console.error.bind(console));
  /* eslint-enable no-console */
}

export function getLogPath(): string {
  return logFilePath;
}

export function tailLog(n = 20): string {
  return ring.slice(-n).join('\n');
}
