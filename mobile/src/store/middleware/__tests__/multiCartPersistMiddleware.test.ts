/**
 * Multi-Cart Persist Middleware Tests
 * TDD tests for cart persistence and backend sync
 */

import { configureStore } from '@reduxjs/toolkit';
import multiCartReducer, {
  createCart,
  deleteCart,
  renameCart,
  addItemToActiveCart,
  removeItemFromActiveCart,
  updateItemQuantityInActiveCart,
  incrementItemInActiveCart,
  decrementItemInActiveCart,
  clearActiveCart,
  setActiveCartStatus,
  markActiveCartAsPaid,
  syncCartsFromBackend,
  refreshActiveCartPrices,
} from '../../slices/multiCartSlice';
import { multiCartPersistMiddleware } from '../multiCartPersistMiddleware';
import * as multiCartStorage from '../../../utils/storage/multiCartStorage';
import { API_CONFIG } from '../../../core/config/api.config';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the storage functions
jest.mock('../../../utils/storage/multiCartStorage', () => ({
  saveMultiCartState: jest.fn(() => Promise.resolve()),
  loadMultiCartState: jest.fn(() => Promise.resolve(null)),
  clearMultiCartState: jest.fn(() => Promise.resolve()),
  savePendingSyncQueue: jest.fn(() => Promise.resolve()),
  loadPendingSyncQueue: jest.fn(() => Promise.resolve([])),
  clearPendingSyncQueue: jest.fn(() => Promise.resolve()),
  addToPendingSyncQueue: jest.fn(() => Promise.resolve()),
  removeFromPendingSyncQueue: jest.fn(() => Promise.resolve()),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('multiCartPersistMiddleware', () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        multiCart: multiCartReducer,
        tenant: () => ({ tenant: { id: 'tenant-uuid-123', slug: 'test-tenant' } }),
        auth: () => ({ accessToken: 'test-token' }),
      },
      middleware: (getDefaultMiddleware: any) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(multiCartPersistMiddleware),
    });
  };

  // === Helpers ===
  /** Advance debounce timer and flush async operations */
  const advanceAndFlush = async (flushCount = 3) => {
    jest.advanceTimersByTime(500);
    for (let i = 0; i < flushCount; i++) await Promise.resolve();
  };

  /** Mock a successful API response */
  const mockApiSuccess = (data: Record<string, unknown>) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data }),
    });
  };

  /** Find a fetch call by HTTP method and optional path pattern */
  const getFetchCall = (method: string, pathPattern?: string) =>
    (global.fetch as jest.Mock).mock.calls.find(
      (call: unknown[]) =>
        (call[1] as { method: string }).method === method &&
        (!pathPattern || (call[0] as string).includes(pathPattern))
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AsyncStorage persistence', () => {
    it('should persist cart state to AsyncStorage when cart is created', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-id', name: 'Test Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Test Cart' }));
      await advanceAndFlush(1);

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalled();
    });

    it('should pass tenant slug to saveMultiCartState', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-id', name: 'Test Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Test Cart' }));
      await advanceAndFlush(1);

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledWith(
        expect.anything(),
        'test-tenant'
      );
    });

    it('should debounce multiple rapid cart operations', async () => {
      const store = createTestStore();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'backend-id', name: 'Cart', status: 'draft' } }),
      });

      store.dispatch(createCart({ name: 'Cart 1' }));
      store.dispatch(createCart({ name: 'Cart 2' }));
      store.dispatch(createCart({ name: 'Cart 3' }));
      await advanceAndFlush(1);

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backend sync on cart creation', () => {
    it('should call backend API when a cart is created', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-uuid-123', name: 'Test Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Test Cart' }));
      await advanceAndFlush();

      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts`);
      expect(fetchCall[1].method).toBe('POST');
      expect(JSON.parse(fetchCall[1].body)).toMatchObject({ name: 'Test Cart', status: 'draft' });
    });

    it('should include tenant and auth headers in API request', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-id', name: 'Test Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Test Cart' }));
      await advanceAndFlush();

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers['X-Tenant-ID']).toBe('test-tenant');
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should send tenantId via X-Tenant-ID header, not in request body', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-id', name: 'Test Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Test Cart' }));
      await advanceAndFlush();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['X-Tenant-ID']).toBe('test-tenant');
      expect(JSON.parse(fetchCall[1].body).tenantId).toBeUndefined();
    });

    it('should queue cart for retry when API call fails', async () => {
      const store = createTestStore();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      store.dispatch(createCart({ name: 'Offline Cart' }));
      await advanceAndFlush();

      expect(multiCartStorage.addToPendingSyncQueue).toHaveBeenCalled();
    });

    it('should queue cart when API returns non-ok status', async () => {
      const store = createTestStore();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false, status: 500, json: () => Promise.resolve({ message: 'Server error' }),
      });

      store.dispatch(createCart({ name: 'Failed Cart' }));
      await advanceAndFlush();

      expect(multiCartStorage.addToPendingSyncQueue).toHaveBeenCalled();
    });

    it('should update cart with backend ID after successful sync', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-uuid-456', name: 'Synced Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Synced Cart' }));
      await advanceAndFlush(4);

      const cart = store.getState().multiCart.carts.find((c) => c.name === 'Synced Cart');
      expect(cart?.backendId).toBe('backend-uuid-456');
    });

    it('should remove from pending queue after successful sync', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-id', name: 'Cart', status: 'draft' });

      store.dispatch(createCart({ name: 'Cart' }));
      await advanceAndFlush();

      expect(multiCartStorage.removeFromPendingSyncQueue).toHaveBeenCalled();
    });
  });

  describe('Network failure logging', () => {
    it('should log warning (not error) when cart sync fails due to network', async () => {
      const store = createTestStore();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

      store.dispatch(createCart({ name: 'Offline Cart' }));
      await advanceAndFlush();

      expect(warnSpy).toHaveBeenCalledWith('[MultiCartSync] Failed to sync cart:', 'Network request failed');
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[MultiCartSync] Failed to sync cart'), expect.anything()
      );

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Cart data integrity', () => {
    it('should not duplicate cart in backend when already synced', async () => {
      const store = createTestStore();

      mockApiSuccess({ id: 'backend-uuid-789', name: 'First Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'First Cart' }));
      await advanceAndFlush();
      (global.fetch as jest.Mock).mockClear();

      mockApiSuccess({ id: 'backend-uuid-new', name: 'Second Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'Second Cart' }));
      await advanceAndFlush();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).name).toBe('Second Cart');
    });
  });

  describe('Backend sync on payment', () => {
    const paymentItem = { id: 'item-1', categoryId: 'cat-1', name: 'Tomato', unit: 'kg' as const, defaultQuantity: 1, price: 40 };

    const createCartWithBackendId = async (store: ReturnType<typeof createTestStore>) => {
      mockApiSuccess({ id: 'backend-cart-uuid', name: 'Payment Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'Payment Cart' }));
      await advanceAndFlush(4);
      (global.fetch as jest.Mock).mockClear();
      return store;
    };

    it('should sync payment status to backend when cart is marked as paid', async () => {
      const store = createTestStore();
      await createCartWithBackendId(store);

      store.dispatch(addItemToActiveCart({ item: paymentItem, quantity: 2 }));
      await advanceAndFlush();
      (global.fetch as jest.Mock).mockClear();

      mockApiSuccess({ id: 'backend-cart-uuid', name: 'Payment Cart', status: 'paid' });
      store.dispatch(markActiveCartAsPaid({
        amount: 80, paymentInfo: { method: 'cash', details: { method: 'cash' }, confirmedAt: new Date().toISOString() },
      }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT');
      expect(fetchCall).toBeDefined();
      const body = JSON.parse(fetchCall[1].body);
      expect(body.status).toBe('paid');
      expect(body.paidAmount).toBe(80);
      expect(body.paidAt).toBeDefined();
    });

    it('should send PUT request to correct backend cart URL', async () => {
      const store = createTestStore();
      await createCartWithBackendId(store);

      store.dispatch(addItemToActiveCart({ item: paymentItem, quantity: 1 }));
      await advanceAndFlush();
      (global.fetch as jest.Mock).mockClear();

      mockApiSuccess({ id: 'backend-cart-uuid', status: 'paid' });
      store.dispatch(markActiveCartAsPaid({
        amount: 40, paymentInfo: { method: 'cash', details: { method: 'cash' }, confirmedAt: new Date().toISOString() },
      }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-cart-uuid`);
    });
  });

  describe('Backend sync on item addition', () => {
    const onionItem = { id: 'item-2', categoryId: 'cat-1', name: 'Onion', unit: 'kg' as const, defaultQuantity: 1, price: 30 };

    it('should sync item to backend when added to a cart with backendId', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-cart-uuid-items', name: 'Item Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'Item Cart' }));
      await advanceAndFlush(4);
      (global.fetch as jest.Mock).mockClear();

      mockApiSuccess({ id: 'cart-item-uuid', itemId: 'item-2', quantity: 1 });
      store.dispatch(addItemToActiveCart({ item: onionItem, quantity: 1 }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('POST');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-cart-uuid-items/items`);
      expect(JSON.parse(fetchCall[1].body)).toMatchObject({ itemId: 'item-2', quantity: 1 });
    });
  });

  describe('Backend sync uses backendId for item API calls', () => {
    const itemWithBackendId = {
      id: 'onion-1kg', backendId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      categoryId: 'cat-1', name: 'Onion', unit: 'kg' as const, defaultQuantity: 1, price: 30,
    };

    it('should send item.backendId (not slug) as itemId when adding item to cart', async () => {
      const store = createTestStore();
      mockApiSuccess({ id: 'backend-cart-uuid', name: 'BackendId Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'BackendId Cart' }));
      await advanceAndFlush(4);
      (global.fetch as jest.Mock).mockClear();

      mockApiSuccess({ id: 'cart-item-uuid', itemId: itemWithBackendId.backendId, quantity: 1 });
      store.dispatch(addItemToActiveCart({ item: itemWithBackendId, quantity: 1 }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('POST');
      expect(fetchCall).toBeDefined();
      expect(JSON.parse(fetchCall[1].body).itemId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  // === Shared helper: create a cart with backendId and items ===
  const syncItem = { id: 'item-sync', categoryId: 'cat-1', name: 'Potato', unit: 'kg' as const, defaultQuantity: 1, price: 25 };

  const setupCartWithBackendAndItems = async (store: ReturnType<typeof createTestStore>) => {
    mockApiSuccess({ id: 'backend-sync-uuid', name: 'Sync Cart', status: 'draft' });
    store.dispatch(createCart({ name: 'Sync Cart' }));
    await advanceAndFlush(4);

    mockApiSuccess({ id: 'ci-1' });
    store.dispatch(addItemToActiveCart({ item: syncItem, quantity: 3 }));
    await advanceAndFlush();

    (global.fetch as jest.Mock).mockClear();
    return store;
  };

  describe('Backend sync on cart deletion', () => {
    it('should send DELETE to backend when a cart with backendId is deleted', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      store.dispatch(deleteCart(store.getState().multiCart.activeCartId!));
      await advanceAndFlush();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'DELETE' &&
          (call[0] as string).includes('/carts/backend-sync-uuid') && !(call[0] as string).includes('/items')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
    });
  });

  describe('Backend sync on cart rename', () => {
    it('should send PUT with new name when a cart with backendId is renamed', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      mockApiSuccess({ id: 'backend-sync-uuid' });
      store.dispatch(renameCart({ cartId: store.getState().multiCart.activeCartId!, name: 'Renamed Cart' }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
      expect(JSON.parse(fetchCall[1].body).name).toBe('Renamed Cart');
    });
  });

  describe('Backend sync on item removal', () => {
    it('should send DELETE item to backend when item is removed from a cart with backendId', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      store.dispatch(removeItemFromActiveCart('item-sync'));
      await advanceAndFlush();

      const fetchCall = getFetchCall('DELETE', '/items/');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items/item-sync`);
    });
  });

  describe('Backend sync on item quantity update', () => {
    it('should send PUT with updated quantity when item quantity changes', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      mockApiSuccess({});
      store.dispatch(updateItemQuantityInActiveCart({ itemId: 'item-sync', quantity: 5 }));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT', '/items/');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items/item-sync`);
      expect(JSON.parse(fetchCall[1].body).quantity).toBe(5);
    });

    it('should send PUT with incremented quantity via incrementItemInActiveCart', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      mockApiSuccess({});
      store.dispatch(incrementItemInActiveCart('item-sync'));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT', '/items/');
      expect(fetchCall).toBeDefined();
      // Original quantity was 3, increment by defaultQuantity (1) = 4
      expect(JSON.parse(fetchCall[1].body).quantity).toBe(4);
    });

    it('should send DELETE when item is removed via decrementItemInActiveCart (minus = remove)', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      store.dispatch(decrementItemInActiveCart('item-sync'));
      await advanceAndFlush();

      // Decrement now removes the item entirely, so middleware sends DELETE
      const fetchCall = getFetchCall('DELETE', '/items/item-sync');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items/item-sync`);
    });
  });

  describe('Backend sync on clear cart', () => {
    it('should send DELETE items to backend when cart is cleared', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      store.dispatch(clearActiveCart());
      await advanceAndFlush();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'DELETE' && (call[0] as string).endsWith('/items')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items`);
    });
  });

  describe('Backend sync on status change', () => {
    it('should send PUT with new status when cart status changes', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      mockApiSuccess({});
      store.dispatch(setActiveCartStatus('printed'));
      await advanceAndFlush();

      const fetchCall = getFetchCall('PUT');
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
      expect(JSON.parse(fetchCall[1].body).status).toBe('printed');
    });
  });

  describe('AsyncStorage persistence for backend-synced carts', () => {
    it('should persist state when backend carts are synced via syncCartsFromBackend', async () => {
      const store = createTestStore();

      // Dispatch syncCartsFromBackend on a fresh store (no prior actions = no stale timers)
      store.dispatch(syncCartsFromBackend({
        carts: [{
          id: 'backend-uuid-historical',
          name: 'Yesterday Cart',
          status: 'paid',
          createdAt: '2026-02-26T10:00:00Z',
          updatedAt: '2026-02-26T10:00:00Z',
          items: [],
        }],
        replaceAll: false,
      }));
      await advanceAndFlush(1);

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledWith(
        expect.objectContaining({
          carts: expect.arrayContaining([
            expect.objectContaining({ name: 'Yesterday Cart' }),
          ]),
        }),
        'test-tenant'
      );
    });

    it('should persist state when cart prices are refreshed via refreshActiveCartPrices', async () => {
      const store = createTestStore();
      const pricedItem = {
        id: 'item-price', categoryId: 'cat-1', name: 'Tomato',
        unit: 'kg' as const, defaultQuantity: 1, price: 40,
      };

      mockApiSuccess({ id: 'backend-id', name: 'Price Cart', status: 'draft' });
      store.dispatch(createCart({ name: 'Price Cart' }));
      await advanceAndFlush(4);

      mockApiSuccess({ id: 'ci-1' });
      store.dispatch(addItemToActiveCart({ item: pricedItem, quantity: 1 }));
      await advanceAndFlush();
      (multiCartStorage.saveMultiCartState as jest.Mock).mockClear();

      // Dispatch refreshActiveCartPrices
      store.dispatch(refreshActiveCartPrices([
        { ...pricedItem, price: 50 },
      ]));
      await advanceAndFlush(1);

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledWith(
        expect.anything(),
        'test-tenant'
      );
    });
  });
});
