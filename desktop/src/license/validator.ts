/**
 * Offline license verification.
 *
 * A license token is `base64url(payloadJSON) + "." + base64url(ed25519_sig)`,
 * minted by the vendor's gen.js with the private key. The app verifies the
 * signature against the embedded public key and checks expiry — entirely
 * offline, no network, no machine binding (keys work on any PC).
 *
 * Payload shape:
 *   { customer: string, plan: 'desktop_yearly', issuedAt: ISO, expiresAt: ISO, v: 1 }
 */

import * as crypto from 'crypto';
import { LICENSE_PUBLIC_KEY_PEM } from './publicKey';

export interface LicensePayload {
  customer: string;
  plan: string;
  issuedAt: string;
  expiresAt: string;
  v?: number;
}

export interface LicenseError {
  code: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED';
  message: string;
}

function fail(code: LicenseError['code'], message: string): never {
  const err: LicenseError = { code, message };
  throw err;
}

function fromB64url(s: string): Buffer {
  // Restore padding + url-safe → standard base64.
  const std = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = std.length % 4 === 0 ? '' : '='.repeat(4 - (std.length % 4));
  return Buffer.from(std + pad, 'base64');
}

/**
 * Verify a pasted/imported license token. Returns the validated payload or
 * throws a typed LicenseError.
 */
export function verifyLicense(rawToken: string): LicensePayload {
  const token = (rawToken || '').trim();
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    fail('MALFORMED', 'License is not in the expected format.');
  }
  const [payloadB64, sigB64] = parts;

  // Verify the Ed25519 signature over the payload-b64 bytes.
  let signatureOk = false;
  try {
    signatureOk = crypto.verify(
      null,
      Buffer.from(payloadB64),
      LICENSE_PUBLIC_KEY_PEM,
      fromB64url(sigB64),
    );
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) {
    fail('BAD_SIGNATURE', 'License signature is invalid.');
  }

  // Decode + parse the payload.
  let payload: LicensePayload;
  try {
    payload = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch {
    fail('MALFORMED', 'License payload could not be read.');
  }
  if (!payload || typeof payload.customer !== 'string' || typeof payload.expiresAt !== 'string') {
    fail('MALFORMED', 'License payload is missing required fields.');
  }

  // Enforce expiry.
  const expiresAt = Date.parse(payload.expiresAt);
  if (Number.isNaN(expiresAt)) {
    fail('MALFORMED', 'License expiry date is invalid.');
  }
  if (expiresAt <= Date.now()) {
    fail('EXPIRED', 'License has expired.');
  }

  return payload;
}
