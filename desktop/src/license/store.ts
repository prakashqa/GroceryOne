/**
 * Encrypted license storage.
 *
 * The license blob lives in `app.getPath('userData')/license.dat`,
 * encrypted with Electron's safeStorage (uses Windows DPAPI under the
 * hood — the file is bound to the OS user account that wrote it).
 *
 * Shape of the stored blob:
 *   {
 *     key: 'GROD-XXXX-...',         // user's license key
 *     tenantSlug: 'siri-general-stores',
 *     plan: 'desktop_yearly',
 *     activatedAt: ISO string,
 *     lastValidatedAt: ISO string,
 *     validUntil: ISO string         // expiresAt from backend on last validation
 *   }
 */

import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface LicenseBlob {
  /** The full signed license token (offline-verifiable). */
  token: string;
  customer: string;
  plan: string;
  /** ISO expiry, mirrored from the token payload for quick display. */
  expiresAt: string;
}

const FILE_NAME = 'license.dat';

function blobPath(): string {
  return path.join(app.getPath('userData'), FILE_NAME);
}

export function loadLicense(): LicenseBlob | null {
  const p = blobPath();
  if (!fs.existsSync(p)) return null;
  try {
    const enc = fs.readFileSync(p);
    if (!safeStorage.isEncryptionAvailable()) {
      // First-boot Windows occasionally reports unavailable until the
      // session key is initialized. Treat as missing.
      return null;
    }
    const json = safeStorage.decryptString(enc);
    return JSON.parse(json) as LicenseBlob;
  } catch (e) {
    console.error('Failed to load license blob:', e);
    return null;
  }
}

export function saveLicense(blob: LicenseBlob): void {
  const json = JSON.stringify(blob);
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is unavailable — cannot persist license');
  }
  const enc = safeStorage.encryptString(json);
  fs.writeFileSync(blobPath(), enc, { mode: 0o600 });
}

export function clearLicense(): void {
  const p = blobPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
