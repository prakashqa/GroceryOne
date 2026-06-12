/**
 * Offline license verification tests.
 *
 * The verifier checks an Ed25519 signature against the embedded public key
 * and enforces expiry — no network. We mock ./publicKey so the spec is
 * self-contained: an ephemeral keypair signs fixtures and we inject its
 * public key as "the embedded key".
 */

import * as crypto from 'crypto';

// Ephemeral keypair for the whole suite.
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const PUB_PEM = publicKey.export({ type: 'spki', format: 'pem' }).toString();

jest.mock('./publicKey', () => ({ LICENSE_PUBLIC_KEY_PEM: PUB_PEM }));

import { verifyLicense, LicenseError } from './validator';

const b64url = (b: Buffer | string) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Mint a token the same way gen.js does, with a chosen key + payload. */
function mint(payload: object, key: crypto.KeyObject = privateKey): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = crypto.sign(null, Buffer.from(payloadB64), key);
  return `${payloadB64}.${b64url(sig)}`;
}

const future = () => new Date(Date.now() + 365 * 24 * 3600_000).toISOString();
const past = () => new Date(Date.now() - 24 * 3600_000).toISOString();
const validPayload = () => ({
  customer: 'Test Shop',
  plan: 'desktop_yearly',
  issuedAt: new Date().toISOString(),
  expiresAt: future(),
  v: 1,
});

describe('verifyLicense', () => {
  it('accepts a valid, signed, unexpired token and returns the customer + expiry', () => {
    const res = verifyLicense(mint(validPayload()));
    expect(res.customer).toBe('Test Shop');
    expect(res.plan).toBe('desktop_yearly');
    expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered payload (signature no longer matches) → BAD_SIGNATURE', () => {
    const token = mint(validPayload());
    const [payloadB64, sig] = token.split('.');
    // Flip the customer name but keep the original signature.
    const tampered =
      b64url(JSON.stringify({ ...validPayload(), customer: 'Pirate Shop' })) + '.' + sig;
    expect(() => verifyLicense(tampered)).toThrow();
    try {
      verifyLicense(tampered);
    } catch (e) {
      expect((e as LicenseError).code).toBe('BAD_SIGNATURE');
    }
    // sanity: the untampered token still verifies
    expect(verifyLicense(payloadB64 + '.' + sig).customer).toBe('Test Shop');
  });

  it('rejects an expired token → EXPIRED', () => {
    const token = mint({ ...validPayload(), expiresAt: past() });
    try {
      verifyLicense(token);
      fail('should have thrown');
    } catch (e) {
      expect((e as LicenseError).code).toBe('EXPIRED');
    }
  });

  it('checks the signature BEFORE expiry: a tampered AND expired token → BAD_SIGNATURE (not EXPIRED)', () => {
    // Security ordering: a forged token must always report the forgery, never
    // leak that it "would have been expired anyway". Sign a valid (but expired)
    // payload, then tamper the payload while keeping the original signature.
    const token = mint({ ...validPayload(), expiresAt: past() });
    const [, sig] = token.split('.');
    const tamperedExpired =
      b64url(JSON.stringify({ ...validPayload(), expiresAt: past(), customer: 'Forger' })) + '.' + sig;
    expect.assertions(1);
    try {
      verifyLicense(tamperedExpired);
    } catch (e) {
      expect((e as LicenseError).code).toBe('BAD_SIGNATURE');
    }
  });

  it('rejects a token signed by a DIFFERENT private key → BAD_SIGNATURE', () => {
    const other = crypto.generateKeyPairSync('ed25519').privateKey;
    const token = mint(validPayload(), other);
    try {
      verifyLicense(token);
      fail('should have thrown');
    } catch (e) {
      expect((e as LicenseError).code).toBe('BAD_SIGNATURE');
    }
  });

  it('rejects malformed input (no dot, garbage) → MALFORMED', () => {
    for (const bad of ['', 'garbage', 'only-one-part', 'a.b.c.d', '.', 'x.']) {
      try {
        verifyLicense(bad);
        fail(`should have thrown for "${bad}"`);
      } catch (e) {
        expect((e as LicenseError).code).toBe('MALFORMED');
      }
    }
  });

  it('rejects a token whose payload is valid-signed but not JSON → MALFORMED', () => {
    // Sign a non-JSON payload with the real key.
    const payloadB64 = b64url('not json at all');
    const sig = crypto.sign(null, Buffer.from(payloadB64), privateKey);
    const token = `${payloadB64}.${b64url(sig)}`;
    try {
      verifyLicense(token);
      fail('should have thrown');
    } catch (e) {
      expect((e as LicenseError).code).toBe('MALFORMED');
    }
  });

  it('trims surrounding whitespace/newlines from a pasted token', () => {
    const token = mint(validPayload());
    expect(verifyLicense(`\n  ${token}  \n`).customer).toBe('Test Shop');
  });

  describe('machine binding', () => {
    const bound = (machineId: string) => mint({ ...validPayload(), machineId });

    it('accepts a machine-bound key on the matching machine', () => {
      const res = verifyLicense(bound('machine-A'), { expectedMachineId: 'machine-A' });
      expect(res.machineId).toBe('machine-A');
    });

    it('rejects a machine-bound key on a different machine → WRONG_MACHINE', () => {
      try {
        verifyLicense(bound('machine-A'), { expectedMachineId: 'machine-B' });
        fail('should have thrown');
      } catch (e) {
        expect((e as LicenseError).code).toBe('WRONG_MACHINE');
      }
    });

    it('rejects a machine-bound key when no expected machine is supplied → WRONG_MACHINE', () => {
      try {
        verifyLicense(bound('machine-A'));
        fail('should have thrown');
      } catch (e) {
        expect((e as LicenseError).code).toBe('WRONG_MACHINE');
      }
    });

    it('accepts an UNBOUND key with or without an expected machine (back-compat)', () => {
      expect(verifyLicense(mint(validPayload())).customer).toBe('Test Shop');
      expect(verifyLicense(mint(validPayload()), { expectedMachineId: 'machine-A' }).customer).toBe('Test Shop');
    });

    it('expiry is checked before the machine binding', () => {
      const token = mint({ ...validPayload(), expiresAt: past(), machineId: 'machine-A' });
      try {
        verifyLicense(token, { expectedMachineId: 'machine-B' });
        fail('should have thrown');
      } catch (e) {
        expect((e as LicenseError).code).toBe('EXPIRED');
      }
    });
  });
});
