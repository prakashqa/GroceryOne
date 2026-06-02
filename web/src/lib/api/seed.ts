/**
 * Seed API client (web)
 *
 * Thin fetch wrapper for the per-tenant sample-data endpoint. Used by the
 * "Load sample data" button on the empty Categories/Items pages. The backend
 * (POST /admin/seeds/sample) reads tenantId from the JWT — we still send
 * X-Tenant-ID for tenant middleware consistency, but the seed is bound to
 * the admin's own tenant regardless.
 */

import { loadPersistedTokens } from '@/lib/auth/authStorage';

export interface SeedSampleResult {
  alreadySeeded: boolean;
  categories: number;
  items: number;
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

export class SeedApiError extends Error {
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
    const raw = json?.message ?? data?.message ?? data?.error?.message;
    const msg = Array.isArray(raw) ? raw.join('; ') : raw;
    throw new SeedApiError(res.status, msg || `Request failed with ${res.status}`, data);
  }
  return data as T;
}

export async function seedSampleData(tenantSlug: string): Promise<SeedSampleResult> {
  const res = await fetch(`${apiBase()}/admin/seeds/sample`, {
    method: 'POST',
    headers: authHeaders(tenantSlug),
  });
  return handle<SeedSampleResult>(res);
}
