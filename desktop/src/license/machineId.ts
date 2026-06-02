/**
 * Machine identifier wrapper.
 *
 * Uses node-machine-id, which on Windows reads HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid
 * — stable across reboots, distinct per OS install, NOT per user account.
 *
 * We never send the raw value to the backend. The backend SHA-256s it
 * server-side too (per LicenseKey.machineIdHash docs) and we double-check
 * here by also exposing the hashed form for diagnostics.
 */

import { machineIdSync } from 'node-machine-id';
import { createHash } from 'crypto';

let cached: string | null = null;

export function getRawMachineId(): string {
  if (cached) return cached;
  // `original: false` returns a normalized hash. Sufficient for our use
  // (we just need stability + uniqueness, not raw HW info).
  cached = machineIdSync(false);
  return cached;
}

export function getMachineIdShortHash(): string {
  return createHash('sha256').update(getRawMachineId()).digest('hex').slice(0, 12);
}
