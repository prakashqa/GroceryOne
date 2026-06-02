/**
 * TDD spec for the offline-grace freshness check — written BEFORE the
 * module exists. This is the security-critical boundary: a cached license
 * must keep the app usable while offline, but only up to the grace window,
 * and never past the license's own expiry.
 */

import { isCachedLicenseFresh, OFFLINE_GRACE_MS } from './freshness';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-06-01T00:00:00.000Z');

function blob(validUntilOffsetDays: number, lastValidatedOffsetDays: number) {
  return {
    validUntil: new Date(NOW + validUntilOffsetDays * DAY).toISOString(),
    lastValidatedAt: new Date(NOW + lastValidatedOffsetDays * DAY).toISOString(),
  };
}

describe('OFFLINE_GRACE_MS', () => {
  it('is exactly 7 days', () => {
    expect(OFFLINE_GRACE_MS).toBe(7 * DAY);
  });
});

describe('isCachedLicenseFresh', () => {
  it('is fresh when license valid and validated just now', () => {
    expect(isCachedLicenseFresh(blob(+30, 0), NOW)).toBe(true);
  });

  it('is fresh when validated 6 days ago (within grace)', () => {
    expect(isCachedLicenseFresh(blob(+30, -6), NOW)).toBe(true);
  });

  it('is fresh at exactly the 7-day grace boundary', () => {
    expect(isCachedLicenseFresh(blob(+30, -7), NOW)).toBe(true);
  });

  it('is STALE just past the 7-day grace (validated 7 days + 1ms ago)', () => {
    const b = {
      validUntil: new Date(NOW + 30 * DAY).toISOString(),
      lastValidatedAt: new Date(NOW - OFFLINE_GRACE_MS - 1).toISOString(),
    };
    expect(isCachedLicenseFresh(b, NOW)).toBe(false);
  });

  it('is STALE when the license itself has expired, even if validated recently', () => {
    // validUntil in the past → fail closed regardless of grace.
    expect(isCachedLicenseFresh(blob(-1, 0), NOW)).toBe(false);
  });

  it('is STALE at the exact expiry instant (validUntil == now)', () => {
    const b = {
      validUntil: new Date(NOW).toISOString(),
      lastValidatedAt: new Date(NOW).toISOString(),
    };
    expect(isCachedLicenseFresh(b, NOW)).toBe(false);
  });

  it('is STALE when validUntil is unparseable', () => {
    expect(isCachedLicenseFresh({ validUntil: 'garbage', lastValidatedAt: new Date(NOW).toISOString() }, NOW)).toBe(
      false,
    );
  });

  it('is STALE when lastValidatedAt is unparseable', () => {
    expect(isCachedLicenseFresh({ validUntil: new Date(NOW + DAY).toISOString(), lastValidatedAt: 'nope' }, NOW)).toBe(
      false,
    );
  });

  it('defaults `now` to the current time when omitted', () => {
    // A blob valid far in the future + validated now should be fresh
    // without passing an explicit now.
    const b = {
      validUntil: new Date(Date.now() + 30 * DAY).toISOString(),
      lastValidatedAt: new Date(Date.now()).toISOString(),
    };
    expect(isCachedLicenseFresh(b)).toBe(true);
  });
});
