jest.mock('electron', () => {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(os.tmpdir(), 'groone-clock-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  return {
    app: { getPath: () => dir },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s: string) => Buffer.from(s, 'utf8'),
      decryptString: (buf: Buffer) => Buffer.from(buf).toString('utf8'),
    },
  };
});

import { isClockRolledBack, readLastSeen, recordSeen, CLOCK_TOLERANCE_MS } from './clockGuard';

const DAY = 24 * 60 * 60 * 1000;

describe('isClockRolledBack', () => {
  it('is false on first run (no high-water mark)', () => {
    expect(isClockRolledBack(Date.now(), null)).toBe(false);
  });

  it('is false when the clock moved forward', () => {
    const base = Date.parse('2027-01-01T00:00:00Z');
    expect(isClockRolledBack(base + 10 * DAY, base)).toBe(false);
  });

  it('is false for a small backward drift within tolerance', () => {
    const base = Date.parse('2027-01-01T00:00:00Z');
    expect(isClockRolledBack(base - 1 * DAY, base)).toBe(false); // 24h < 48h tolerance
  });

  it('is true for a large rollback (license-bypass attempt)', () => {
    const base = Date.parse('2027-06-10T00:00:00Z');
    expect(isClockRolledBack(base - 30 * DAY, base)).toBe(true);
  });

  it('respects a custom tolerance', () => {
    expect(isClockRolledBack(100, 200, 50)).toBe(true); // 100 < 200-50
    expect(isClockRolledBack(160, 200, 50)).toBe(false); // 160 > 150
  });
});

describe('recordSeen / readLastSeen', () => {
  it('persists and only advances the high-water mark', () => {
    const t1 = Date.parse('2026-06-10T00:00:00Z');
    recordSeen(t1);
    expect(readLastSeen()).toBe(t1);

    // A later time advances it.
    const t2 = t1 + 5 * DAY;
    recordSeen(t2);
    expect(readLastSeen()).toBe(t2);

    // An earlier time does NOT lower it (rolled-back clock can't reset the mark).
    recordSeen(t1 - 100 * DAY);
    expect(readLastSeen()).toBe(t2);
  });

  it('uses a 48h default tolerance', () => {
    expect(CLOCK_TOLERANCE_MS).toBe(48 * 60 * 60 * 1000);
  });
});
