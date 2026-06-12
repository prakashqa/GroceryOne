/**
 * ordersApi — POS checkout endpoint on baseApi.
 *
 * `checkout` is the only path that moves inventory on a web/desktop sale (the
 * POS is otherwise 100% local). These tests pin the contract that makes that
 * safe and tenant-isolated:
 *   - POSTs to /orders/checkout with the {itemId, quantity} line items,
 *   - rides the in-memory bearer token (works on desktop where localStorage is
 *     empty),
 *   - carries tenant scope ONLY in the X-Tenant-ID header, never the body
 *     (the backend derives tenantId from the JWT), and
 *   - invalidates Product:LIST so the Inventory UI refetches the reduced stock.
 */
import { configureStore } from '@reduxjs/toolkit';
import { baseApi, setApiConfig } from './baseApi';
import { ordersApi } from './ordersApi';
import { productApi } from './productApi';

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

function makeStore(accessToken: string | null = 'tok', tenantSlug = 'shop') {
  setApiConfig({ baseUrl: 'http://test.local/api/v1', version: '1.0' });
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: (s: any = { accessToken }) => s,
      tenant: (s: any = { tenant: { slug: tenantSlug }, currentLanguage: 'en' }) => s,
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

const ORDER = {
  id: 'o1',
  orderNumber: 'ORD-20260612-ABCDE',
  paymentStatus: 'paid',
  totalAmount: 400,
  clientRef: 'cart-1',
  items: [{ id: 'oi1', itemId: 'potato', productName: 'Potato', quantity: 10, unitPrice: 40, totalPrice: 400 }],
};

async function readReq(fetchMock: jest.Mock) {
  const req = fetchMock.mock.calls[0][0];
  const init = fetchMock.mock.calls[0][1];
  const url = typeof req === 'string' ? req : req.url;
  const method = typeof req === 'string' ? init?.method : req.method;
  const headers = typeof req === 'string' ? init?.headers : req.headers;
  const auth = headers?.get ? headers.get('authorization') : headers?.Authorization;
  const tenant = headers?.get ? headers.get('x-tenant-id') : headers?.['X-Tenant-ID'];
  // RTK builds a Request whose body is a stream — read it via .text(). For the
  // (url, init) shape the body is already a serialized string.
  let bodyText: string | undefined;
  if (typeof req !== 'string' && typeof req.text === 'function') {
    bodyText = await req.clone().text();
  } else if (typeof init?.body === 'string') {
    bodyText = init.body;
  }
  const body = bodyText ? JSON.parse(bodyText) : undefined;
  return { url, method, body, auth, tenant };
}

describe('ordersApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the checkout hook', () => {
    expect(typeof ordersApi.useCheckoutMutation).toBe('function');
  });

  it('checkout POSTs /orders/checkout with the cart line items, bearer token, and tenant header', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse({ success: true, data: ORDER }));
    (global as any).fetch = fetchMock;
    const store = makeStore('tok');

    const payload = {
      items: [{ itemId: 'potato', quantity: 10 }],
      paymentMethod: 'cash',
      paidAmount: 400,
      clientRef: 'cart-1',
    };
    const res: any = await store.dispatch(ordersApi.endpoints.checkout.initiate(payload));

    expect(res.data.id).toBe('o1');
    const { url, method, body, auth, tenant } = await readReq(fetchMock);
    expect(url).toContain('/orders/checkout');
    expect(method).toBe('POST');
    // The in-memory token authorizes the request even with empty localStorage
    // (the offline-desktop case).
    expect(auth).toBe('Bearer tok');
    // Tenant scope rides the header, never the body.
    expect(tenant).toBe('shop');
    expect(body.items).toEqual([{ itemId: 'potato', quantity: 10 }]);
    expect(body.clientRef).toBe('cart-1');
    // The body must NOT carry a tenant id — the backend derives it from the JWT.
    expect(body.tenantId).toBeUndefined();
  });

  it('scopes by the CALLER tenant header only — a tenant-b store sends a tenant-b header and no tenant in the body', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse({ success: true, data: ORDER }));
    (global as any).fetch = fetchMock;
    const store = makeStore('tok', 'tenant-b');

    await store.dispatch(
      ordersApi.endpoints.checkout.initiate({ items: [{ itemId: 'potato', quantity: 1 }] }),
    );

    const { tenant, body } = await readReq(fetchMock);
    expect(tenant).toBe('tenant-b');
    expect(body.tenantId).toBeUndefined();
  });

  it('checkout invalidates Product:LIST so a subscribed getItems query refetches the reduced stock', async () => {
    // A successful checkout must drive the Inventory UI to refresh. getItems
    // provides Product:LIST and useCatalogHydration subscribes to it, so
    // invalidating Product:LIST is exactly what triggers the refetch →
    // mergeCatalogFromBackend → reduced stock on screen.
    const itemsBody = { success: true, data: [{ id: 'potato', name: 'Potato', stockQuantity: 100 }] };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockResponse(itemsBody)) // initial getItems
      .mockResolvedValueOnce(mockResponse({ success: true, data: ORDER })) // checkout
      .mockResolvedValueOnce(mockResponse(itemsBody)); // refetch after invalidation
    (global as any).fetch = fetchMock;
    const store = makeStore('tok');

    // Subscribe to getItems (kept alive so invalidation refetches rather than
    // dropping the cache entry).
    const sub = store.dispatch(productApi.endpoints.getItems.initiate({ tenantSlug: 'shop' }));
    await sub;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await store.dispatch(
      ordersApi.endpoints.checkout.initiate({ items: [{ itemId: 'potato', quantity: 10 }] }),
    );

    // The checkout POST + the invalidation-driven getItems refetch.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const refetchUrl = fetchMock.mock.calls[2][0];
    expect(typeof refetchUrl === 'string' ? refetchUrl : refetchUrl.url).toContain('/items');

    sub.unsubscribe();
  });
});
