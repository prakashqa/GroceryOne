/**
 * Tenant-scoped persistence of auth tokens and last-used identifier.
 *
 * Why per-tenant:
 *   localStorage is shared across browser tabs but the user may switch
 *   tenants on the same machine. Storing tokens under a single global key
 *   would let one tenant's session resurrect inside another tenant's
 *   workspace on hydration. Namespacing by tenant slug eliminates that.
 *
 * Why we persist the identifier (email/phone), not just tokens:
 *   PIN-login on the backend requires `{ identifier, pin }`. Without a
 *   remembered identifier the user has to retype their email on every
 *   PIN-login screen. We cache it after a successful login (or signup);
 *   the user can still edit it.
 *
 * Nothing here is "secure storage" — it's localStorage. Tokens are
 * limited-lifetime JWTs and the backend already supports refresh.
 */

const TOKENS_KEY = (tenantSlug: string) => `@auth_tokens_${tenantSlug}`;
const IDENTIFIER_KEY = (tenantSlug: string) => `@last_identifier_${tenantSlug}`;

export interface PersistedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number; // optional; unix seconds
  tenantSlug: string; // pin tenant in payload to defend against drift
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function savePersistedTokens(tenantSlug: string, payload: PersistedTokens): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(TOKENS_KEY(tenantSlug), JSON.stringify(payload));
  } catch {
    // quota / privacy mode — non-fatal
  }
}

export function loadPersistedTokens(tenantSlug: string): PersistedTokens | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(TOKENS_KEY(tenantSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Defensive tenant-binding check: ignore tokens whose embedded tenantSlug
    // does not match the namespace they were loaded from. Also ignore tokens
    // for any tenant other than the one the caller asked about.
    if (
      parsed &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string' &&
      parsed.tenantSlug === tenantSlug
    ) {
      return parsed as PersistedTokens;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPersistedTokens(tenantSlug: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(TOKENS_KEY(tenantSlug));
  } catch {
    // non-fatal
  }
}

export function saveLastIdentifier(tenantSlug: string, identifier: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(IDENTIFIER_KEY(tenantSlug), identifier);
  } catch {
    // non-fatal
  }
}

export function loadLastIdentifier(tenantSlug: string): string | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    return storage.getItem(IDENTIFIER_KEY(tenantSlug));
  } catch {
    return null;
  }
}
