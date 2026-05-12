/**
 * Employees API client (web)
 *
 * Thin fetch wrappers for the owner-only employee endpoints. The backend
 * derives tenantId from the JWT, so the client never needs to send it.
 * We do pass the standard X-Tenant-ID header (used by tenant middleware)
 * and the bearer token from per-tenant localStorage.
 *
 *   POST   /auth/employees                — create cashier
 *   GET    /auth/employees                — list employees in caller tenant
 *   PATCH  /auth/employees/:id/deactivate — soft-disable login
 */

import { loadPersistedTokens } from '@/lib/auth/authStorage';

export interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName?: string;
  phone: string;
  pin: string;
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

/**
 * Custom error type so the UI can branch on status code (e.g. 409 → duplicate).
 */
export class EmployeesApiError extends Error {
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
    throw new EmployeesApiError(
      res.status,
      data?.message || `Request failed with ${res.status}`,
      data,
    );
  }
  return data as T;
}

export async function listEmployees(tenantSlug: string): Promise<Employee[]> {
  const res = await fetch(`${apiBase()}/auth/employees`, {
    method: 'GET',
    headers: authHeaders(tenantSlug),
  });
  return handle<Employee[]>(res);
}

export async function createEmployee(
  tenantSlug: string,
  body: CreateEmployeeRequest,
): Promise<Employee> {
  const res = await fetch(`${apiBase()}/auth/employees`, {
    method: 'POST',
    headers: authHeaders(tenantSlug),
    body: JSON.stringify(body),
  });
  return handle<Employee>(res);
}

export async function deactivateEmployee(
  tenantSlug: string,
  id: string,
): Promise<Employee> {
  const res = await fetch(`${apiBase()}/auth/employees/${id}/deactivate`, {
    method: 'PATCH',
    headers: authHeaders(tenantSlug),
  });
  return handle<Employee>(res);
}
