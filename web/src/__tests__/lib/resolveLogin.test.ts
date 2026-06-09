/**
 * @jest-environment jsdom
 */

import {
  resolveTenantForIdentifier,
  classifyLogin,
  looksLikeCompleteIdentifier,
} from '@/lib/auth/resolveLogin';

const API = 'http://localhost:47600/api/v1';

function mockFetchOnce(impl: (url: string, init: any) => Partial<Response> & { json?: () => any }) {
  return jest.fn(async (url: any, init: any) => {
    const r = impl(String(url), init);
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: r.json ?? (async () => ({})),
    } as Response;
  }) as unknown as typeof fetch;
}

describe('resolveTenantForIdentifier — tenant is derived from the TYPED identifier', () => {
  it('returns the tenant for an identifier that has an account', async () => {
    const fetchImpl = mockFetchOnce((url, init) => {
      expect(url).toBe(`${API}/auth/resolve-tenant`);
      // The identifier the user typed must be what we resolve on — not a
      // cached/stale value.
      expect(JSON.parse(init.body).identifier).toBe('9290031421');
      return {
        ok: true,
        json: async () => ({
          data: { tenantSlug: 'test2-business', tenantName: 'Test2 Business', userFirstName: 'Test' },
        }),
      };
    });

    const res = await resolveTenantForIdentifier('9290031421', API, fetchImpl);
    expect(res).toEqual({
      tenantSlug: 'test2-business',
      tenantName: 'Test2 Business',
      userFirstName: 'Test',
    });
  });

  it('trims whitespace before resolving', async () => {
    const fetchImpl = mockFetchOnce((_url, init) => {
      expect(JSON.parse(init.body).identifier).toBe('owner@store.com');
      return { ok: true, json: async () => ({ data: { tenantSlug: 'a', tenantName: 'A' } }) };
    });
    const res = await resolveTenantForIdentifier('  owner@store.com  ', API, fetchImpl);
    expect(res?.tenantSlug).toBe('a');
  });

  it('returns null for an empty identifier without calling the API', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    expect(await resolveTenantForIdentifier('   ', API, fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null when no account exists (non-2xx)', async () => {
    const fetchImpl = mockFetchOnce(() => ({ ok: false, status: 404, json: async () => ({}) }));
    expect(await resolveTenantForIdentifier('nobody@nowhere.com', API, fetchImpl)).toBeNull();
  });

  it('returns null on a network error (offline)', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await resolveTenantForIdentifier('9290031421', API, fetchImpl)).toBeNull();
  });

  it('returns null when the body lacks a tenantSlug', async () => {
    const fetchImpl = mockFetchOnce(() => ({ ok: true, json: async () => ({ data: {} }) }));
    expect(await resolveTenantForIdentifier('x@y.com', API, fetchImpl)).toBeNull();
  });
});

describe('classifyLogin — honest, distinguishable outcomes', () => {
  const tenant = { tenantSlug: 'test2-business', tenantName: 'Test2 Business' };

  it('NO_ACCOUNT when the identifier resolves to nothing', () => {
    expect(classifyLogin({ resolved: null, loginStatus: 401 })).toBe('NO_ACCOUNT');
  });

  it('SUCCESS on a 2xx login', () => {
    expect(classifyLogin({ resolved: tenant, loginStatus: 200 })).toBe('SUCCESS');
  });

  it('INVALID_PIN when the account exists but login is 401 (wrong PIN, not "no store")', () => {
    expect(classifyLogin({ resolved: tenant, loginStatus: 401 })).toBe('INVALID_PIN');
  });

  it('GENERIC for other server errors', () => {
    expect(classifyLogin({ resolved: tenant, loginStatus: 500 })).toBe('GENERIC');
  });

  it('GENERIC when no login was attempted (status undefined)', () => {
    expect(classifyLogin({ resolved: tenant })).toBe('GENERIC');
  });
});

describe('looksLikeCompleteIdentifier — when to live-resolve as the user types', () => {
  it('is false for empty/half-typed input (no premature lookups)', () => {
    expect(looksLikeCompleteIdentifier('')).toBe(false);
    expect(looksLikeCompleteIdentifier('   ')).toBe(false);
    expect(looksLikeCompleteIdentifier('92900')).toBe(false);
    expect(looksLikeCompleteIdentifier('owner@')).toBe(false);
    expect(looksLikeCompleteIdentifier('owner@store')).toBe(false);
  });

  it('is true for a 10-digit phone (the employee case)', () => {
    expect(looksLikeCompleteIdentifier('9290031421')).toBe(true);
  });

  it('is true for a phone with +91, spaces or dashes once normalised', () => {
    expect(looksLikeCompleteIdentifier('+91 92900 31421')).toBe(true);
    expect(looksLikeCompleteIdentifier('+91-9290031421')).toBe(true);
  });

  it('is true for a plausible email', () => {
    expect(looksLikeCompleteIdentifier('owner@store.com')).toBe(true);
  });
});
