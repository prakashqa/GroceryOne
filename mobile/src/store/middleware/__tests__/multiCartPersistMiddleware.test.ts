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
  updateCartBackendId,
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
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(multiCartPersistMiddleware),
    });
  };

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

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Test Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Test Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalled();
    });

    it('should pass tenant slug to saveMultiCartState', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Test Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Test Cart' }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledWith(
        expect.anything(),
        'test-tenant'
      );
    });

    it('should debounce multiple rapid cart operations', async () => {
      const store = createTestStore();

      // Mock successful API responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Cart 1' }));
      store.dispatch(createCart({ name: 'Cart 2' }));
      store.dispatch(createCart({ name: 'Cart 3' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();

      // Should only save once due to debouncing
      expect(multiCartStorage.saveMultiCartState).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backend sync on cart creation', () => {
    it('should call backend API when a cart is created', async () => {
      const store = createTestStore();

      const mockApiResponse = {
        id: 'backend-uuid-123',
        name: 'Test Cart',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockApiResponse }),
      });

      store.dispatch(createCart({ name: 'Test Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Verify API was called
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts`);
      expect(fetchCall[1].method).toBe('POST');

      // Verify request body
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.name).toBe('Test Cart');
      expect(requestBody.status).toBe('draft');
    });

    it('should include tenant and auth headers in API request', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Test Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Test Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['X-Tenant-ID']).toBe('test-tenant');
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should send tenantId via X-Tenant-ID header, not in request body', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Test Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Test Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const headers = fetchCall[1].headers;

      // tenantId should be in header, NOT in body (backend injects from header)
      expect(headers['X-Tenant-ID']).toBe('test-tenant');
      expect(requestBody.tenantId).toBeUndefined();
    });

    it('should queue cart for retry when API call fails', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      store.dispatch(createCart({ name: 'Offline Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Verify cart is queued for sync
      expect(multiCartStorage.addToPendingSyncQueue).toHaveBeenCalled();
    });

    it('should queue cart when API returns non-ok status', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      store.dispatch(createCart({ name: 'Failed Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Verify cart is queued for sync
      expect(multiCartStorage.addToPendingSyncQueue).toHaveBeenCalled();
    });

    it('should update cart with backend ID after successful sync', async () => {
      const store = createTestStore();

      const mockApiResponse = {
        id: 'backend-uuid-456',
        name: 'Synced Cart',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockApiResponse }),
      });

      store.dispatch(createCart({ name: 'Synced Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Check that cart has backend ID
      const state = store.getState();
      const cart = state.multiCart.carts.find((c) => c.name === 'Synced Cart');
      expect(cart?.backendId).toBe('backend-uuid-456');
    });

    it('should remove from pending queue after successful sync', async () => {
      const store = createTestStore();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-id', name: 'Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Cart' }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

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

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(warnSpy).toHaveBeenCalledWith(
        '[MultiCartSync] Failed to sync cart:',
        'Network request failed'
      );
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[MultiCartSync] Failed to sync cart'),
        expect.anything()
      );

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Cart data integrity', () => {
    it('should not duplicate cart in backend when already synced', async () => {
      const store = createTestStore();

      // First cart creation with successful sync
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-uuid-789', name: 'First Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'First Cart' }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Clear mock to track new calls
      (global.fetch as jest.Mock).mockClear();

      // Second cart creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-uuid-new', name: 'Second Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Second Cart' }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should only have one API call for the second cart
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify the call was for the second cart
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.name).toBe('Second Cart');
    });
  });

  describe('Backend sync on payment', () => {
    const mockItem = {
      id: 'item-1',
      categoryId: 'cat-1',
      name: 'Tomato',
      unit: 'kg' as const,
      defaultQuantity: 1,
      price: 40,
    };

    const createCartWithBackendId = async (store: ReturnType<typeof createTestStore>) => {
      // Create cart and simulate backend sync
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-cart-uuid', name: 'Payment Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Payment Cart' }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Clear mocks for next assertions
      (global.fetch as jest.Mock).mockClear();

      return store;
    };

    it('should sync payment status to backend when cart is marked as paid', async () => {
      const store = createTestStore();
      await createCartWithBackendId(store);

      // Add item to cart first
      store.dispatch(addItemToActiveCart({ item: mockItem, quantity: 2 }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      (global.fetch as jest.Mock).mockClear();

      // Mock successful payment sync
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-cart-uuid', name: 'Payment Cart', status: 'paid' },
        }),
      });

      // Mark cart as paid
      store.dispatch(markActiveCartAsPaid({
        amount: 80,
        paymentInfo: { method: 'cash', receivedAmount: 100, changeGiven: 20 },
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Verify PUT was called with payment data
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT'
      );
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.status).toBe('paid');
      expect(requestBody.paidAmount).toBe(80);
      expect(requestBody.paidAt).toBeDefined();
    });

    it('should send PUT request to correct backend cart URL', async () => {
      const store = createTestStore();
      await createCartWithBackendId(store);

      // Add item
      store.dispatch(addItemToActiveCart({ item: mockItem, quantity: 1 }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      (global.fetch as jest.Mock).mockClear();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-cart-uuid', status: 'paid' },
        }),
      });

      store.dispatch(markActiveCartAsPaid({
        amount: 40,
        paymentInfo: { method: 'cash', receivedAmount: 50, changeGiven: 10 },
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT'
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-cart-uuid`);
    });
  });

  describe('Backend sync on item addition', () => {
    const mockItem = {
      id: 'item-2',
      categoryId: 'cat-1',
      name: 'Onion',
      unit: 'kg' as const,
      defaultQuantity: 1,
      price: 30,
    };

    it('should sync item to backend when added to a cart with backendId', async () => {
      const store = createTestStore();

      // Create cart with backend sync
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'backend-cart-uuid-items', name: 'Item Cart', status: 'draft' },
        }),
      });

      store.dispatch(createCart({ name: 'Item Cart' }));
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      (global.fetch as jest.Mock).mockClear();

      // Mock successful item sync
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'cart-item-uuid', itemId: 'item-2', quantity: 1 },
        }),
      });

      // Add item to cart
      store.dispatch(addItemToActiveCart({ item: mockItem, quantity: 1 }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Verify POST was called to add item
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'POST'
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-cart-uuid-items/items`);
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.itemId).toBe('item-2');
      expect(requestBody.quantity).toBe(1);
    });
  });

  // ============================================
  // Shared helper: create a cart with backendId and items
  // ============================================
  const mockItem = {
    id: 'item-sync',
    categoryId: 'cat-1',
    name: 'Potato',
    unit: 'kg' as const,
    defaultQuantity: 1,
    price: 25,
  };

  const setupCartWithBackendAndItems = async (store: ReturnType<typeof createTestStore>) => {
    // Create cart
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { id: 'backend-sync-uuid', name: 'Sync Cart', status: 'draft' },
      }),
    });
    store.dispatch(createCart({ name: 'Sync Cart' }));
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Add item (mock the item sync)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'ci-1' } }),
    });
    store.dispatch(addItemToActiveCart({ item: mockItem, quantity: 3 }));
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    (global.fetch as jest.Mock).mockClear();
    return store;
  };

  describe('Backend sync on cart deletion', () => {
    it('should send DELETE to backend when a cart with backendId is deleted', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      const cartId = store.getState().multiCart.activeCartId!;
      store.dispatch(deleteCart(cartId));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'DELETE' &&
          (call[0] as string).includes('/carts/backend-sync-uuid') &&
          !(call[0] as string).includes('/items')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
    });
  });

  describe('Backend sync on cart rename', () => {
    it('should send PUT with new name when a cart with backendId is renamed', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'backend-sync-uuid' } }),
      });

      const cartId = store.getState().multiCart.activeCartId!;
      store.dispatch(renameCart({ cartId, name: 'Renamed Cart' }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT'
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.name).toBe('Renamed Cart');
    });
  });

  describe('Backend sync on item removal', () => {
    it('should send DELETE item to backend when item is removed from a cart with backendId', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      store.dispatch(removeItemFromActiveCart('item-sync'));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'DELETE' &&
          (call[0] as string).includes('/items/')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items/item-sync`);
    });
  });

  describe('Backend sync on item quantity update', () => {
    it('should send PUT with updated quantity when item quantity changes', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      store.dispatch(updateItemQuantityInActiveCart({ itemId: 'item-sync', quantity: 5 }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT' &&
          (call[0] as string).includes('/items/')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items/item-sync`);
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.quantity).toBe(5);
    });

    it('should send PUT with incremented quantity via incrementItemInActiveCart', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      store.dispatch(incrementItemInActiveCart('item-sync'));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT' &&
          (call[0] as string).includes('/items/')
      );
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall[1].body);
      // Original quantity was 3, increment by defaultQuantity (1) = 4
      expect(requestBody.quantity).toBe(4);
    });

    it('should send PUT or DELETE when item is decremented via decrementItemInActiveCart', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      store.dispatch(decrementItemInActiveCart('item-sync'));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Item had qty 3, decrement by 1 = 2, so should PUT with quantity 2
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT' &&
          (call[0] as string).includes('/items/')
      );
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.quantity).toBe(2);
    });
  });

  describe('Backend sync on clear cart', () => {
    it('should send DELETE items to backend when cart is cleared', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      store.dispatch(clearActiveCart());

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should call DELETE /carts/:backendId/items
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'DELETE' &&
          (call[0] as string).endsWith('/items')
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid/items`);
    });
  });

  describe('Backend sync on status change', () => {
    it('should send PUT with new status when cart status changes', async () => {
      const store = createTestStore();
      await setupCartWithBackendAndItems(store);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      store.dispatch(setActiveCartStatus('printed'));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: unknown[]) => (call[1] as { method: string }).method === 'PUT'
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[0]).toBe(`${API_CONFIG.BASE_URL}/carts/backend-sync-uuid`);
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.status).toBe('printed');
    });
  });
});
