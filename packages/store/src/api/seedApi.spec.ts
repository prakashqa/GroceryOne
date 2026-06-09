/**
 * seedApi — admin/test endpoints (sample data + test barcodes) on baseApi.
 *
 * These ride baseApi so they share the same in-memory token + auto-refresh as
 * every other mutation (fixing the bug where the old manual-fetch seed client
 * sent a stale localStorage token with no refresh and 401'd after ~1h).
 */
import { configureStore } from '@reduxjs/toolkit';
import { baseApi, setApiConfig } from './baseApi';
import { seedApi } from './seedApi';

function mockResponse(body: unknown): any {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    clone() {
      return mockResponse(body);
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function makeStore() {
  setApiConfig({ baseUrl: 'http://test.local/api/v1', version: '1.0' });
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: (s: any = { accessToken: 'tok' }) => s,
      tenant: (s: any = { tenant: { slug: 'shop' }, currentLanguage: 'en' }) => s,
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe('seedApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes assignTestBarcodes + seedSampleData mutation hooks', () => {
    expect(typeof seedApi.useAssignTestBarcodesMutation).toBe('function');
    expect(typeof seedApi.useSeedSampleDataMutation).toBe('function');
  });

  it('assignTestBarcodes POSTs /admin/seeds/test-barcodes through baseApi (auto-refresh auth)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ success: true, data: { updated: 2, skipped: 0, assignments: [] } }),
    );
    (global as any).fetch = fetchMock;
    const store = makeStore();

    const res: any = await store.dispatch(seedApi.endpoints.assignTestBarcodes.initiate());

    expect(res.data).toEqual({ updated: 2, skipped: 0, assignments: [] });
    const req = fetchMock.mock.calls[0][0];
    const url = typeof req === 'string' ? req : req.url;
    const method = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.method : req.method;
    expect(url).toContain('/admin/seeds/test-barcodes');
    expect(method).toBe('POST');
  });

  it('seedSampleData POSTs /admin/seeds/sample through baseApi', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ success: true, data: { alreadySeeded: false, categories: 9, items: 88 } }),
    );
    (global as any).fetch = fetchMock;
    const store = makeStore();

    const res: any = await store.dispatch(seedApi.endpoints.seedSampleData.initiate());

    expect(res.data).toEqual({ alreadySeeded: false, categories: 9, items: 88 });
    const req = fetchMock.mock.calls[0][0];
    const url = typeof req === 'string' ? req : req.url;
    expect(url).toContain('/admin/seeds/sample');
  });
});
