/**
 * employeeApi — owner-only employee endpoints on baseApi.
 *
 * Rides baseApi so it shares the same in-memory token + auto-refresh as every
 * other mutation. This is the fix for the "Request failed with 401" on the
 * Employees page: the old manual-fetch client read the token from localStorage
 * (never populated on desktop) and sent no Authorization header.
 */
import { configureStore } from '@reduxjs/toolkit';
import { baseApi, setApiConfig } from './baseApi';
import { employeeApi } from './employeeApi';

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

function makeStore(accessToken: string | null = 'tok') {
  setApiConfig({ baseUrl: 'http://test.local/api/v1', version: '1.0' });
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: (s: any = { accessToken }) => s,
      tenant: (s: any = { tenant: { slug: 'shop' }, currentLanguage: 'en' }) => s,
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe('employeeApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the employee hooks', () => {
    expect(typeof employeeApi.useGetEmployeesQuery).toBe('function');
    expect(typeof employeeApi.useCreateEmployeeMutation).toBe('function');
    expect(typeof employeeApi.useDeactivateEmployeeMutation).toBe('function');
  });

  it('getEmployees GETs /auth/employees with the in-memory bearer token + tenant header (no localStorage)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ success: true, data: [{ id: 'e1', role: 'cashier', status: 'active', createdAt: '', phone: '999' }] }),
    );
    (global as any).fetch = fetchMock;
    const store = makeStore('tok');

    const res: any = await store.dispatch(employeeApi.endpoints.getEmployees.initiate());

    expect(res.data).toEqual([
      { id: 'e1', role: 'cashier', status: 'active', createdAt: '', phone: '999' },
    ]);
    const req = fetchMock.mock.calls[0][0];
    const url = typeof req === 'string' ? req : req.url;
    const headers = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.headers : req.headers;
    const auth = headers?.get ? headers.get('authorization') : headers?.Authorization;
    const tenant = headers?.get ? headers.get('x-tenant-id') : headers?.['X-Tenant-ID'];
    expect(url).toContain('/auth/employees');
    // The bearer token comes from Redux (in-memory), so the request is authorized
    // even when localStorage is empty (the desktop case).
    expect(auth).toBe('Bearer tok');
    // Tenant scoping is carried by the X-Tenant-ID header (from Redux tenant),
    // never the request body — the backend derives tenantId from the JWT.
    expect(tenant).toBe('shop');
  });

  it('scopes by the CALLER tenant header only — never sends a tenant id in the body (cross-tenant isolation)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse({ success: true, data: [] }));
    (global as any).fetch = fetchMock;
    // A store whose Redux tenant is "tenant-b" must produce a tenant-b header and
    // NO body — proving a tenant-A admin can't ask for tenant-B employees by body.
    setApiConfig({ baseUrl: 'http://test.local/api/v1', version: '1.0' });
    const store = configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        auth: (s: any = { accessToken: 'tok' }) => s,
        tenant: (s: any = { tenant: { slug: 'tenant-b' }, currentLanguage: 'en' }) => s,
      },
      middleware: (gdm) => gdm().concat(baseApi.middleware),
    });

    await store.dispatch(employeeApi.endpoints.getEmployees.initiate());

    const req = fetchMock.mock.calls[0][0];
    const headers = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.headers : req.headers;
    const tenant = headers?.get ? headers.get('x-tenant-id') : headers?.['X-Tenant-ID'];
    const body = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.body : req.body;
    expect(tenant).toBe('tenant-b');
    expect(body == null || body === undefined).toBe(true); // GET carries no body
  });

  it('createEmployee POSTs /auth/employees with the payload body', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ success: true, data: { id: 'e2', role: 'cashier', status: 'active', createdAt: '' } }),
    );
    (global as any).fetch = fetchMock;
    const store = makeStore('tok');

    const body = { firstName: 'Asha', phone: '9876543210', pin: '1234' };
    const res: any = await store.dispatch(employeeApi.endpoints.createEmployee.initiate(body));

    expect(res.data.id).toBe('e2');
    const req = fetchMock.mock.calls[0][0];
    const url = typeof req === 'string' ? req : req.url;
    const method = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.method : req.method;
    expect(url).toContain('/auth/employees');
    expect(method).toBe('POST');
  });

  it('deactivateEmployee PATCHes /auth/employees/:id/deactivate', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ success: true, data: { id: 'e3', role: 'cashier', status: 'inactive', createdAt: '' } }),
    );
    (global as any).fetch = fetchMock;
    const store = makeStore('tok');

    const res: any = await store.dispatch(employeeApi.endpoints.deactivateEmployee.initiate('e3'));

    expect(res.data.status).toBe('inactive');
    const req = fetchMock.mock.calls[0][0];
    const url = typeof req === 'string' ? req : req.url;
    const method = typeof req === 'string' ? fetchMock.mock.calls[0][1]?.method : req.method;
    expect(url).toContain('/auth/employees/e3/deactivate');
    expect(method).toBe('PATCH');
  });
});
