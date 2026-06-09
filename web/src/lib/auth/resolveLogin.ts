/**
 * Login helpers shared by the PIN-login screen.
 *
 * The login screen must be authoritative on the IDENTIFIER the user actually
 * typed — not on a stale Redux/localStorage tenant left behind by whoever
 * logged in last. On a shared shop device (owner + cashiers), trusting the
 * previous tenant + pre-filled identifier silently logs the wrong account or
 * shows a misleading "Invalid PIN". So at submit time we resolve the tenant
 * fresh from the typed identifier, then classify the outcome honestly.
 *
 * `resolveTenantForIdentifier` is a thin wrapper over POST /auth/resolve-tenant
 * (cross-tenant, no X-Tenant-ID needed). It returns the store the identifier
 * belongs to, or null if no account exists for it anywhere reachable.
 */

export interface ResolvedTenant {
  tenantSlug: string;
  tenantName: string;
  userFirstName?: string;
}

export async function resolveTenantForIdentifier(
  identifier: string,
  apiUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedTenant | null> {
  const id = identifier.trim();
  if (!id) return null;
  try {
    const res = await fetchImpl(`${apiUrl}/auth/resolve-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
      body: JSON.stringify({ identifier: id }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({} as any));
    const data = json?.data ?? json;
    if (!data?.tenantSlug) return null;
    return {
      tenantSlug: data.tenantSlug,
      tenantName: data.tenantName || data.tenantSlug,
      userFirstName: data.userFirstName,
    };
  } catch {
    return null;
  }
}

/**
 * Classify a PIN-login outcome into a user-facing message key. Keeping this
 * pure makes the decision unit-testable without rendering the page.
 *
 * - resolve returned null  → the identifier has no account → NO_ACCOUNT.
 *   (We can say this safely because resolve-tenant only reveals existence of
 *   a store for that identifier, never anything sensitive.)
 * - resolve ok, login 2xx  → SUCCESS.
 * - resolve ok, login 401  → wrong PIN → INVALID_PIN (honest, not "no store").
 * - resolve ok, other non-2xx → GENERIC.
 */
export type LoginOutcome = 'NO_ACCOUNT' | 'SUCCESS' | 'INVALID_PIN' | 'GENERIC';

/**
 * True when the typed identifier looks "complete enough" to resolve against
 * the backend — a plausible email, or a phone with at least 10 digits. Used
 * to drive live tenant/account confirmation as the user types, so an employee
 * sees "Signing in to <Store>" (or "No account found") BEFORE committing a
 * PIN — instead of discovering the problem only after entering 4 digits.
 *
 * Pure + conservative: we never fire a lookup on a half-typed value.
 */
export function looksLikeCompleteIdentifier(identifier: string): boolean {
  const id = identifier.trim();
  if (!id) return false;
  // Email shape: something@something.tld
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return true;
  // Phone shape: 10+ digits once non-digits are stripped (handles +91, spaces,
  // dashes). Employees are created with phone-only, so this is the common path.
  const digits = id.replace(/[^0-9]/g, '');
  return digits.length >= 10;
}

export function classifyLogin(params: {
  resolved: ResolvedTenant | null;
  loginStatus?: number;
}): LoginOutcome {
  if (!params.resolved) return 'NO_ACCOUNT';
  const status = params.loginStatus;
  if (status === undefined) return 'GENERIC';
  if (status >= 200 && status < 300) return 'SUCCESS';
  if (status === 401) return 'INVALID_PIN';
  return 'GENERIC';
}
