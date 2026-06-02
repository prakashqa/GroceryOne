/**
 * Tests for the license validator's HTTP → error-code mapping and request
 * normalization. fetch + machineId are mocked so no network / OS access.
 */

jest.mock('./machineId', () => ({
  getRawMachineId: () => 'RAW-MACHINE-ID',
}));

import { activate, validate, LicenseError } from './validator';

const realFetch = global.fetch;

function mockFetchOnce(status: number, body: unknown) {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  });
}

function mockFetchReject(err: Error) {
  (global as any).fetch = jest.fn().mockRejectedValue(err);
}

afterEach(() => {
  (global as any).fetch = realFetch;
});

describe('activate() request shaping', () => {
  it('normalizes key to UPPER, slug to lower, and sends the raw machineId', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ key: 'GROD-AAAA-BBBB-CCCC-DDDD', plan: 'desktop_yearly' }),
    });
    (global as any).fetch = fetchMock;

    await activate('  grod-aaaa-bbbb-cccc-dddd  ', '  SIRI-General-Stores  ');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/licenses/activate');
    const sent = JSON.parse(opts.body);
    expect(sent.key).toBe('GROD-AAAA-BBBB-CCCC-DDDD');
    expect(sent.tenantSlug).toBe('siri-general-stores');
    expect(sent.machineId).toBe('RAW-MACHINE-ID');
  });

  it('returns the parsed JSON on success', async () => {
    mockFetchOnce(200, { key: 'GROD-A', plan: 'desktop_yearly', status: 'active' });
    const res = await activate('GROD-AAAA-BBBB-CCCC-DDDD', 'siri');
    expect(res.plan).toBe('desktop_yearly');
  });
});

describe('error-code mapping', () => {
  const cases: Array<[number, string, LicenseError['code']]> = [
    [404, 'License key not recognised', 'NOT_FOUND'],
    [401, 'License has been revoked', 'REVOKED'],
    [410, 'License has expired', 'EXPIRED'],
    [409, 'Already activated on another machine', 'MACHINE_LOCKED'],
    [403, 'License is bound to a different machine', 'MACHINE_LOCKED'],
    [403, 'License does not belong to that tenant', 'TENANT_MISMATCH'],
    [400, 'machineId must be longer', 'VALIDATION'],
    [500, 'Internal error', 'UNKNOWN'],
  ];

  it.each(cases)('HTTP %i "%s" → %s', async (status, message, expectedCode) => {
    mockFetchOnce(status, { message });
    await expect(validate('GROD-AAAA-BBBB-CCCC-DDDD')).rejects.toMatchObject({
      code: expectedCode,
      httpStatus: status,
    });
  });

  it('maps a fetch rejection (no network) to NETWORK', async () => {
    mockFetchReject(new Error('getaddrinfo ENOTFOUND'));
    await expect(validate('GROD-AAAA-BBBB-CCCC-DDDD')).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('disambiguates 403: machine wording stays MACHINE_LOCKED, tenant wording becomes TENANT_MISMATCH', async () => {
    mockFetchOnce(403, { message: 'License is bound to a different machine' });
    await expect(validate('GROD-AAAA-BBBB-CCCC-DDDD')).rejects.toMatchObject({ code: 'MACHINE_LOCKED' });

    mockFetchOnce(403, { message: 'License does not belong to your tenant' });
    await expect(validate('GROD-AAAA-BBBB-CCCC-DDDD')).rejects.toMatchObject({ code: 'TENANT_MISMATCH' });
  });
});
