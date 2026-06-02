/**
 * Offline-grace freshness check.
 *
 * Extracted from main.ts so it can be unit-tested without booting Electron.
 *
 * A cached license is "fresh" (app may launch offline) when BOTH:
 *   1. the license has not expired (validUntil is strictly in the future), AND
 *   2. it was last validated against the backend within the grace window.
 *
 * Either condition failing → not fresh → fail closed (force re-validation /
 * gate). Unparseable timestamps are treated as not-fresh.
 */

/** 7-day offline grace window. */
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export interface FreshnessInput {
  /** ISO timestamp — the license's own expiry (from the backend). */
  validUntil: string;
  /** ISO timestamp — when we last successfully validated against the backend. */
  lastValidatedAt: string;
}

export function isCachedLicenseFresh(blob: FreshnessInput, now: number = Date.now()): boolean {
  const validUntil = Date.parse(blob.validUntil);
  const lastValidatedAt = Date.parse(blob.lastValidatedAt);
  if (Number.isNaN(validUntil) || Number.isNaN(lastValidatedAt)) return false;
  if (validUntil <= now) return false;
  if (now - lastValidatedAt > OFFLINE_GRACE_MS) return false;
  return true;
}
