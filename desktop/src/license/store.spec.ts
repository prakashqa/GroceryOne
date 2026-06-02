/**
 * Tests for encrypted license persistence. `electron` is mocked: app.getPath
 * points at a real temp dir and safeStorage is a reversible passthrough, so
 * we exercise the real fs + JSON round-trip and error branches without DPAPI.
 */

jest.mock('electron', () => {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(os.tmpdir(), 'groone-store-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  return {
    app: { getPath: () => dir },
    safeStorage: {
      isEncryptionAvailable: jest.fn(() => true),
      encryptString: (s: string) => Buffer.from(s, 'utf8'),
      decryptString: (buf: Buffer) => Buffer.from(buf).toString('utf8'),
    },
  };
});

import * as fs from 'fs';
import * as path from 'path';
import { app, safeStorage } from 'electron';
import { loadLicense, saveLicense, clearLicense, LicenseBlob } from './store';

const datPath = () => path.join(app.getPath('userData'), 'license.dat');

const sample: LicenseBlob = {
  key: 'GROD-AAAA-BBBB-CCCC-DDDD',
  tenantSlug: 'siri-general-stores',
  plan: 'desktop_yearly',
  activatedAt: '2026-06-01T00:00:00.000Z',
  lastValidatedAt: '2026-06-01T00:00:00.000Z',
  validUntil: '2027-06-01T00:00:00.000Z',
};

afterEach(() => {
  if (fs.existsSync(datPath())) fs.unlinkSync(datPath());
  (safeStorage.isEncryptionAvailable as jest.Mock).mockReturnValue(true);
});

describe('save + load round-trip', () => {
  it('persists and reads back an identical blob', () => {
    saveLicense(sample);
    expect(fs.existsSync(datPath())).toBe(true);
    expect(loadLicense()).toEqual(sample);
  });
});

describe('loadLicense edge cases', () => {
  it('returns null when no file exists', () => {
    expect(loadLicense()).toBeNull();
  });

  it('returns null when the blob is corrupt (decrypts to non-JSON)', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fs.writeFileSync(datPath(), Buffer.from('NOT-JSON-AT-ALL{', 'utf8'));
    expect(loadLicense()).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('returns null when OS encryption is unavailable', () => {
    saveLicense(sample); // write while available
    (safeStorage.isEncryptionAvailable as jest.Mock).mockReturnValue(false);
    expect(loadLicense()).toBeNull();
  });
});

describe('saveLicense guard', () => {
  it('throws when OS encryption is unavailable', () => {
    (safeStorage.isEncryptionAvailable as jest.Mock).mockReturnValue(false);
    expect(() => saveLicense(sample)).toThrow(/encryption is unavailable/i);
  });
});

describe('clearLicense', () => {
  it('removes the file so a subsequent load is null', () => {
    saveLicense(sample);
    clearLicense();
    expect(fs.existsSync(datPath())).toBe(false);
    expect(loadLicense()).toBeNull();
  });

  it('is a no-op when there is nothing to clear', () => {
    expect(() => clearLicense()).not.toThrow();
  });
});
