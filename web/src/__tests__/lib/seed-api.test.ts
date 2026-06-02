/**
 * Tests for the seed API client. fetch + authStorage mocked.
 */

jest.mock('@/lib/auth/authStorage', () => ({
  loadPersistedTokens: jest.fn(() => ({
    accessToken: 'jwt-abc',
    refreshToken: 'r-1',
    tenantSlug: 'test-shop',
  })),
}));

import { seedSampleData, SeedApiError } from '@/lib/api/seed';

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

describe('seedSampleData', () => {
  it('returns the seed result on 200', async () => {
    mockFetch(200, { data: { alreadySeeded: false, categories: 9, items: 113 } });
    const res = await seedSampleData('test-shop');
    expect(res).toEqual({ alreadySeeded: false, categories: 9, items: 113 });
  });

  it('returns alreadySeeded:true when the tenant is already populated', async () => {
    mockFetch(200, { data: { alreadySeeded: true, categories: 0, items: 0 } });
    const res = await seedSampleData('test-shop');
    expect(res.alreadySeeded).toBe(true);
  });

  it('sends tenant + bearer headers and POSTs to /admin/seeds/sample', async () => {
    const fetchMock = mockFetch(200, { data: { alreadySeeded: false, categories: 9, items: 113 } });
    await seedSampleData('test-shop');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/admin/seeds/sample');
    expect(opts.method).toBe('POST');
    expect(opts.headers['X-Tenant-ID']).toBe('test-shop');
    expect(opts.headers.Authorization).toBe('Bearer jwt-abc');
  });

  it('throws SeedApiError with status 403 on non-admin', async () => {
    mockFetch(403, { message: 'Insufficient permissions' });
    await expect(seedSampleData('test-shop')).rejects.toMatchObject({
      name: 'Error',
      status: 403,
    });
  });
});
