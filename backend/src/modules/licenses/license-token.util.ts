/**
 * Offline license-token signing (vendor side).
 *
 * Produces the exact token format the Windows desktop app verifies offline
 * (`desktop/src/license/validator.ts` against its embedded Ed25519 public
 * key, same scheme as the `desktop/tools/license-gen/gen.js` CLI):
 *
 *   token = b64url(JSON(payload)) + '.' + b64url(ed25519_sign(payloadB64))
 *
 * The PRIVATE key never ships with the desktop app — it is supplied to the
 * vendor's backend via the LICENSE_PRIVATE_KEY_B64 env (base64 of the PEM).
 */

import * as crypto from 'crypto';

export interface LicenseTokenPayload {
  customer: string;
  plan: string;
  issuedAt: string;
  expiresAt: string;
  /** Optional: bind the key to one machine (offline PC-lock). */
  machineId?: string;
  v: 1;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function signLicenseToken(payload: LicenseTokenPayload, privateKeyPem: string): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = crypto.sign(null, Buffer.from(payloadB64), privateKey);
  return `${payloadB64}.${b64url(sig)}`;
}
