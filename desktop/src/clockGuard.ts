/**
 * Clock-rollback guard.
 *
 * Offline license expiry trusts the system clock, so a customer could keep an
 * expired license alive by setting the PC date back. We persist the furthest-
 * forward time the app has ever seen (encrypted, like the license blob) and
 * refuse to start if the current clock is earlier than that high-water mark
 * beyond a tolerance — i.e. the clock was rolled back.
 *
 * Tolerance is generous (48h) so genuine minor clock corrections / timezone
 * shifts never lock anyone out; a real rollback to bypass a yearly expiry is
 * far larger than that.
 */

import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const FILE_NAME = 'clock.dat';

/** Default tolerance: 48 hours. */
export const CLOCK_TOLERANCE_MS = 48 * 60 * 60 * 1000;

function filePath(): string {
  return path.join(app.getPath('userData'), FILE_NAME);
}

/**
 * Pure decision: is `now` earlier than the recorded high-water mark by more
 * than `toleranceMs`? No prior record → never a rollback (first run).
 */
export function isClockRolledBack(now: number, lastSeen: number | null, toleranceMs = CLOCK_TOLERANCE_MS): boolean {
  if (lastSeen == null) return false;
  return now < lastSeen - toleranceMs;
}

/** Read the encrypted high-water mark, or null if absent/unreadable. */
export function readLastSeen(): number | null {
  try {
    const p = filePath();
    if (!fs.existsSync(p) || !safeStorage.isEncryptionAvailable()) return null;
    const v = parseInt(safeStorage.decryptString(fs.readFileSync(p)), 10);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Advance the high-water mark to max(existing, now). Best-effort. */
export function recordSeen(now: number): void {
  try {
    if (!safeStorage.isEncryptionAvailable()) return;
    const hw = Math.max(readLastSeen() ?? 0, now);
    fs.writeFileSync(filePath(), safeStorage.encryptString(String(hw)), { mode: 0o600 });
  } catch {
    /* best-effort — never block startup on a logging/persist failure */
  }
}
