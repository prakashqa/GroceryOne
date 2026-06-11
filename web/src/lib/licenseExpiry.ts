/**
 * Desktop license expiry helper (web side).
 *
 * The Electron shell exposes the stored license's `expiresAt` via
 * `window.groone.license.info()`. This pure helper decides whether/what the
 * in-app renewal banner should show. Cloud builds have no bridge, so the
 * banner never renders there.
 */

export interface DesktopLicenseInfo {
  customer: string;
  plan: string;
  expiresAt: string; // ISO
}

export interface LicenseWarning {
  /** Show the banner? */
  show: boolean;
  /** Whole days until expiry (negative if already past). */
  days: number;
  /** Already expired. */
  expired: boolean;
}

export function licenseWarning(
  expiresAt: string,
  now: number,
  warnWithinDays = 14,
): LicenseWarning {
  const exp = Date.parse(expiresAt);
  if (Number.isNaN(exp)) return { show: false, days: 0, expired: false };
  const days = Math.ceil((exp - now) / 86_400_000);
  const expired = exp <= now;
  return { show: expired || days <= warnWithinDays, days, expired };
}

/** Runtime license status returned by the desktop `groone.license.status()`. */
export type DesktopLicenseStatus =
  | { state: 'valid'; customer?: string; expiresAt?: string }
  | { state: 'missing' }
  | { state: 'invalid'; code?: string };

/** Pure: should the desktop guard allow the app, or block (route to renewal)? */
export function licenseGuardAction(status: DesktopLicenseStatus): 'allow' | 'block' {
  return status.state === 'valid' ? 'allow' : 'block';
}
