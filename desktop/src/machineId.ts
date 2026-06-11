/**
 * Stable per-machine identifier for offline license binding.
 *
 * `node-machine-id` returns the OS machine GUID (Windows reg / Linux
 * /etc/machine-id / macOS IOPlatformUUID). We hash it with a fixed app salt so
 * the raw OS id never leaves the device and the value is namespaced to GroOne.
 * The full hash is embedded in the signed license token; a short, human-
 * readable form is shown to the customer so they can send it to support.
 *
 * Runs in the Electron MAIN process (it shells out to `reg`/`ioreg`). If that
 * ever fails in a packaged build, we fall back to a host/CPU-derived id so
 * activation never hard-crashes.
 */

import * as crypto from 'crypto';
import * as os from 'os';

const SALT = 'groone-desktop-v1:';

/** Pure: hash a raw OS id into the app-scoped machine id (64 hex chars). */
export function computeMachineId(rawOsId: string): string {
  return crypto.createHash('sha256').update(SALT + rawOsId).digest('hex');
}

/** Pure: short, grouped display form (first 12 hex → "AAAA-BBBB-CCCC"). */
export function shortMachineId(fullId: string): string {
  const hex = (fullId || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
  return (hex.match(/.{1,4}/g) || []).join('-');
}

/** Resolve this machine's id (with a safe fallback). */
export function getMachineId(): string {
  let raw: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { machineIdSync } = require('node-machine-id');
    raw = machineIdSync(true);
  } catch {
    // Fallback: stable-ish per-host signature (hostname + first CPU model + arch).
    const cpu = os.cpus()?.[0]?.model || 'cpu';
    raw = `fallback:${os.hostname()}:${cpu}:${os.arch()}`;
  }
  return computeMachineId(raw);
}
