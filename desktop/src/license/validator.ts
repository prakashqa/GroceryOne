/**
 * License validator — talks to api.groone.in /licenses/{activate,validate}.
 *
 * Errors surface as { code, message } where `code` is one of:
 *   NOT_FOUND        – key not recognised (HTTP 404)
 *   REVOKED          – key was revoked (HTTP 401)
 *   EXPIRED          – key validity past (HTTP 410)
 *   MACHINE_LOCKED   – key bound to another machine (HTTP 403 or 409)
 *   TENANT_MISMATCH  – key/tenantSlug mismatch (HTTP 403)
 *   NETWORK          – fetch failed (no internet, DNS, etc.)
 *   VALIDATION       – DTO rejected by backend (HTTP 400)
 *   UNKNOWN          – anything else
 *
 * The license gate UI reads `code` to render a tailored message.
 */

import { getRawMachineId } from './machineId';

const DEFAULT_API_URL = 'https://api.groone.in/api/v1';

export interface ActivateResult {
  key: string;
  plan: string;
  status: string;
  validUntil: string;
  activatedAt: string;
  tenantSlug: string;
}

export interface ValidateResult {
  status: string;
  validUntil: string;
}

export interface LicenseError {
  code:
    | 'NOT_FOUND'
    | 'REVOKED'
    | 'EXPIRED'
    | 'MACHINE_LOCKED'
    | 'TENANT_MISMATCH'
    | 'NETWORK'
    | 'VALIDATION'
    | 'UNKNOWN';
  message: string;
  httpStatus?: number;
}

function apiUrl(): string {
  // GROONE_API_URL overrides at runtime for staging/test environments.
  return process.env.GROONE_API_URL || DEFAULT_API_URL;
}

function statusToCode(status: number): LicenseError['code'] {
  switch (status) {
    case 401:
      return 'REVOKED';
    case 403:
      // Could be tenant mismatch OR machine mismatch — server message
      // distinguishes; default to MACHINE_LOCKED for UI simplicity, the
      // caller can re-classify by inspecting `message`.
      return 'MACHINE_LOCKED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'MACHINE_LOCKED';
    case 410:
      return 'EXPIRED';
    case 400:
      return 'VALIDATION';
    default:
      return 'UNKNOWN';
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err: LicenseError = {
      code: 'NETWORK',
      message: (e as Error).message || 'Network request failed',
    };
    throw err;
  }
  if (!res.ok) {
    let serverMsg = res.statusText;
    try {
      const json: any = await res.json();
      serverMsg = json?.message || json?.error || serverMsg;
    } catch {
      /* not JSON */
    }
    const code = statusToCode(res.status);
    // Disambiguate 403 tenant vs machine
    const final: LicenseError['code'] =
      code === 'MACHINE_LOCKED' && /tenant/i.test(serverMsg) ? 'TENANT_MISMATCH' : code;
    const err: LicenseError = { code: final, message: serverMsg, httpStatus: res.status };
    throw err;
  }
  return (await res.json()) as T;
}

export async function activate(key: string, tenantSlug: string): Promise<ActivateResult> {
  return post<ActivateResult>('/licenses/activate', {
    key: key.trim().toUpperCase(),
    machineId: getRawMachineId(),
    tenantSlug: tenantSlug.trim().toLowerCase(),
  });
}

export async function validate(key: string): Promise<ValidateResult> {
  return post<ValidateResult>('/licenses/validate', {
    key: key.trim().toUpperCase(),
    machineId: getRawMachineId(),
  });
}
