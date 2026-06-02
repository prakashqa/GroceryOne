/**
 * `@groone:last_login` — a GLOBAL (non-tenant-scoped) localStorage hint that
 * remembers the tenantSlug + identifier (email or phone) the user last
 * successfully signed in with on this device.
 *
 * It's written by the PIN-login + signup pages after a successful response,
 * and read by the PIN-login page on mount when Redux has no tenant context
 * yet (e.g. after a logout that cleared the session). The helper lets us
 * auto-resolve the tenant via /auth/resolve-tenant before the user even
 * touches the keypad — one-tap re-login.
 *
 * The `performLogout` helper (lib/auth/logoutClient.ts) deliberately
 * PRESERVES this entry so re-login is seamless.
 *
 * It is NOT a session token — it's just a name + identifier. Equivalent to
 * remembering "this PC last belonged to FreshMart, signed in as owner@…".
 */

const KEY = '@groone:last_login';

export interface LastLoginHint {
  tenantSlug: string;
  identifier: string;
  /** ISO timestamp of when this entry was written. */
  savedAt: string;
}

export function saveLastLogin(hint: { tenantSlug: string; identifier: string }): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const payload: LastLoginHint = {
    tenantSlug: hint.tenantSlug,
    identifier: hint.identifier,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota / private-mode — non-fatal */
  }
}

export function loadLastLogin(): LastLoginHint | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LastLoginHint>;
    if (!parsed?.tenantSlug || !parsed?.identifier) return null;
    return {
      tenantSlug: parsed.tenantSlug,
      identifier: parsed.identifier,
      savedAt: parsed.savedAt || new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearLastLogin(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(KEY);
}
