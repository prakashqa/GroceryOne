import * as crypto from 'crypto';
import { signLicenseToken, LicenseTokenPayload } from './license-token.util';

/**
 * The token must be verifiable by the EXACT check the Windows desktop gate
 * performs (desktop/src/license/validator.ts): split on '.', then
 * crypto.verify(null, Buffer(payloadB64), publicKey, sig).
 */

function fromB64url(s: string): Buffer {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

describe('signLicenseToken', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  const payload: LicenseTokenPayload = {
    customer: 'Siri General Stores',
    plan: 'desktop_yearly',
    issuedAt: '2026-06-10T00:00:00.000Z',
    expiresAt: '2027-06-10T00:00:00.000Z',
    v: 1,
  };

  it('produces a two-part token whose signature verifies with the matching public key', () => {
    const token = signLicenseToken(payload, privatePem);
    const parts = token.split('.');
    expect(parts).toHaveLength(2);

    const [payloadB64, sigB64] = parts;
    const ok = crypto.verify(null, Buffer.from(payloadB64), publicKey, fromB64url(sigB64));
    expect(ok).toBe(true);
  });

  it('round-trips the payload (desktop reads customer/plan/expiresAt)', () => {
    const token = signLicenseToken(payload, privatePem);
    const decoded = JSON.parse(fromB64url(token.split('.')[0]).toString('utf8'));
    expect(decoded).toEqual(payload);
  });

  it('fails verification when signed with a DIFFERENT key (forgery rejected)', () => {
    const other = crypto.generateKeyPairSync('ed25519');
    const otherPem = other.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const forged = signLicenseToken(payload, otherPem);
    const [payloadB64, sigB64] = forged.split('.');
    const ok = crypto.verify(null, Buffer.from(payloadB64), publicKey, fromB64url(sigB64));
    expect(ok).toBe(false);
  });
});
