/**
 * Tests for the web licenses API client. fetch + authStorage are mocked.
 * Mirrors the employees.ts client contract: {data} unwrap, typed errors,
 * tenant-scoped auth headers.
 */

jest.mock('@/lib/auth/authStorage', () => ({
  loadPersistedTokens: jest.fn(() => ({
    accessToken: 'jwt-abc',
    refreshToken: 'r-1',
    tenantSlug: 'siri-general-stores',
  })),
}));

import {
  generateLicense,
  deactivateLicense,
  LicensesApiError,
} from '@/lib/api/licenses';

const realFetch = global.fetch;

function mockFetch(status: number, body: unknown) {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  return global.fetch as jest.Mock;
}

afterEach(() => {
  (global as any).fetch = realFetch;
  jest.clearAllMocks();
});

describe('generateLicense', () => {
  it('unwraps the {data} envelope on success', async () => {
    mockFetch(201, {
      data: {
        id: 'lk-1',
        key: 'GROD-AAAA-BBBB-CCCC-DDDD',
        tenantSlug: 'siri-general-stores',
        plan: 'desktop_yearly',
        status: 'pending',
        issuedAt: '2026-06-01T00:00:00.000Z',
        expiresAt: '2027-06-01T00:00:00.000Z',
      },
    });

    const res = await generateLicense('siri-general-stores', {
      tenantSlug: 'siri-general-stores',
      plan: 'desktop_yearly',
      paymentRef: 'manual-UPI-2026-05-15',
    });

    expect(res.key).toBe('GROD-AAAA-BBBB-CCCC-DDDD');
    expect(res.status).toBe('pending');
  });

  it('sends tenant + bearer headers and POSTs to /licenses/generate', async () => {
    const fetchMock = mockFetch(201, { data: { key: 'GROD-X' } });
    await generateLicense('siri-general-stores', {
      tenantSlug: 'siri-general-stores',
      plan: 'desktop_yearly',
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/licenses/generate');
    expect(opts.method).toBe('POST');
    expect(opts.headers['X-Tenant-ID']).toBe('siri-general-stores');
    expect(opts.headers.Authorization).toBe('Bearer jwt-abc');
    expect(JSON.parse(opts.body).plan).toBe('desktop_yearly');
  });

  it('throws LicensesApiError with status 403 on cross-tenant mint', async () => {
    mockFetch(403, { message: 'Admin cannot mint a license for a different tenant' });
    await expect(
      generateLicense('siri-general-stores', {
        tenantSlug: 'someone-else',
        plan: 'desktop_yearly',
      }),
    ).rejects.toMatchObject({
      name: 'Error', // LicensesApiError extends Error
      status: 403,
    });
  });

  it('surfaces the server message on the thrown error', async () => {
    mockFetch(403, { message: 'Admin cannot mint a license for a different tenant' });
    try {
      await generateLicense('siri-general-stores', {
        tenantSlug: 'someone-else',
        plan: 'desktop_yearly',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(LicensesApiError);
      expect((e as LicensesApiError).message).toMatch(/different tenant/i);
      expect((e as LicensesApiError).status).toBe(403);
    }
  });

  it('falls back to a generic message when the body has none', async () => {
    mockFetch(500, {});
    await expect(
      generateLicense('siri-general-stores', {
        tenantSlug: 'siri-general-stores',
        plan: 'desktop_yearly',
      }),
    ).rejects.toMatchObject({ status: 500, message: 'Request failed with 500' });
  });
});

describe('deactivateLicense', () => {
  it('POSTs the key to /licenses/deactivate and unwraps data', async () => {
    const fetchMock = mockFetch(200, {
      data: { id: 'lk-1', key: 'GROD-AAAA-BBBB-CCCC-DDDD', status: 'active' },
    });
    const res = await deactivateLicense('siri-general-stores', 'GROD-AAAA-BBBB-CCCC-DDDD');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/licenses/deactivate');
    expect(JSON.parse(opts.body).key).toBe('GROD-AAAA-BBBB-CCCC-DDDD');
    expect(res.status).toBe('active');
  });
});
