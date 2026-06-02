/**
 * Licenses API client (web)
 *
 * Admin-only fetch wrappers for minting + listing desktop license keys.
 * The backend derives tenantId from the JWT and additionally cross-checks
 * the tenantSlug in the body, so an admin can only mint for their own
 * tenant. Mirrors the pattern in employees.ts.
 *
 *   POST   /licenses/generate    — mint a new key (admin)
 *   POST   /licenses/deactivate  — clear machine binding (admin)
 *
 * (activate/validate are called by the desktop app, not the web admin.)
 */

import { loadPersistedTokens } from '@/lib/auth/authStorage';

export type LicensePlan = 'desktop_yearly';
export type LicenseStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface GeneratedLicense {
  id: string;
  key: string;
  tenantSlug: string;
  plan: LicensePlan;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  paymentRef?: string;
}

export interface GenerateLicenseRequest {
  tenantSlug: string;
  plan: LicensePlan;
  paymentRef?: string;
  /** ISO-8601. Defaults server-side to now + 365 days when omitted. */
  expiresAt?: string;
}

const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function authHeaders(tenantSlug: string): HeadersInit {
  const tokens = loadPersistedTokens(tenantSlug);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0',
    'X-Tenant-ID': tenantSlug,
  };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return headers;
}

export class LicensesApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({} as any));
  const data = json?.data ?? json;
  if (!res.ok) {
    throw new LicensesApiError(
      res.status,
      data?.message || `Request failed with ${res.status}`,
      data,
    );
  }
  return data as T;
}

export async function generateLicense(
  tenantSlug: string,
  body: GenerateLicenseRequest,
): Promise<GeneratedLicense> {
  const res = await fetch(`${apiBase()}/licenses/generate`, {
    method: 'POST',
    headers: authHeaders(tenantSlug),
    body: JSON.stringify(body),
  });
  return handle<GeneratedLicense>(res);
}

export async function deactivateLicense(
  tenantSlug: string,
  key: string,
): Promise<{ id: string; key: string; status: LicenseStatus }> {
  const res = await fetch(`${apiBase()}/licenses/deactivate`, {
    method: 'POST',
    headers: authHeaders(tenantSlug),
    body: JSON.stringify({ key }),
  });
  return handle<{ id: string; key: string; status: LicenseStatus }>(res);
}
