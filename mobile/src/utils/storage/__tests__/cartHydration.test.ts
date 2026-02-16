/**
 * Cart Hydration Tests
 * TDD tests for loading carts from AsyncStorage cache and fetching from backend
 */

import {
  loadOrFetchCarts,
  fetchCartsFromBackend,
  CartHydrationResult,
} from '../cartHydration';
import { loadMultiCartState } from '../multiCartStorage';
import { API_CONFIG } from '../../../core/config/api.config';

// Mock multiCartStorage
jest.mock('../multiCartStorage', () => ({
  loadMultiCartState: jest.fn(),
}));

// Mock API config
jest.mock('../../../core/config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'http://test-api.com/api/v1',
    VERSION: '1.0',
    TIMEOUT: 30000,
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TENANT_SLUG = 'quickbasket';
const ACCESS_TOKEN = 'test-jwt-token';

// Sample cached cart data (ManagedCart format from AsyncStorage)
const cachedCartData = {
  carts: [
    {
      id: 'cart-123-abc',
      name: 'Morning Cart',
      items: [
        {
          item: {
            id: 'atta-1',
            categoryId: 'atta-rice',
            name: 'Aashirvaad Atta',
            unit: 'kg' as const,
            defaultQuantity: 5,
            price: 48.0,
          },
          quantity: 5,
          addedAt: '2026-01-31T06:00:00.000Z',
          priceSnapshot: 48.0,
        },
      ],
      createdAt: '2026-01-31T06:00:00.000Z',
      updatedAt: '2026-01-31T06:00:00.000Z',
      status: 'draft' as const,
    },
  ],
  activeCartId: 'cart-123-abc',
  lastSyncedAt: '2026-01-31T06:00:00.000Z',
};

// Sample backend response (Cart entity format from GET /carts)
const backendCartsResponse = {
  success: true,
  data: [
    {
      id: 'b1a2c3d4-uuid',
      name: 'Morning Cart',
      tenantId: 'tenant-uuid',
      status: 'draft',
      createdAt: '2026-01-31T06:00:00.000Z',
      updatedAt: '2026-01-31T06:00:00.000Z',
      paidAt: null,
      paidAmount: null,
      items: [
        {
          id: 'cart-item-uuid-1',
          cartId: 'b1a2c3d4-uuid',
          itemId: 'atta-1-uuid',
          quantity: 5,
          priceSnapshot: 48.0,
          addedAt: '2026-01-31T06:00:00.000Z',
          item: {
            id: 'atta-1-uuid',
            categoryId: 'atta-rice-uuid',
            category: { slug: 'atta-rice' },
            name: 'Aashirvaad Atta',
            nameTe: 'ఆశీర్వాద్ ఆటా',
            unit: 'kg',
            defaultQuantity: 5,
            price: 48.0,
          },
        },
      ],
    },
  ],
};

describe('cartHydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('loadOrFetchCarts', () => {
    it('should return AsyncStorage data when available (fromCache: true)', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(cachedCartData);

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.fromCache).toBe(true);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual(cachedCartData.carts);
      expect(result.activeCartId).toBe('cart-123-abc');
      expect(result.lastSyncedAt).toBe('2026-01-31T06:00:00.000Z');
      expect(loadMultiCartState).toHaveBeenCalledWith(TENANT_SLUG);
      // Should NOT call fetch when cache is available
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch from backend when AsyncStorage is empty (fromBackend: true)', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(true);
      expect(result.carts.length).toBe(1);
      expect(result.carts[0].name).toBe('Morning Cart');
      expect(result.carts[0].id).toBe('b1a2c3d4-uuid');
      expect(result.carts[0].items.length).toBe(1);
      expect(result.carts[0].items[0].item.name).toBe('Aashirvaad Atta');
      expect(result.carts[0].items[0].quantity).toBe(5);
      expect(result.carts[0].items[0].priceSnapshot).toBe(48.0);
    });

    it('should return empty result when both sources are empty', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
      expect(result.activeCartId).toBeNull();
    });

    it('should handle backend fetch failure gracefully', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
      expect(result.activeCartId).toBeNull();
    });

    it('should handle backend non-ok response gracefully', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
    });

    it('should skip backend fetch when no accessToken is provided', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);

      const result = await loadOrFetchCarts(TENANT_SLUG, null);

      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return backendSkipped: true when no accessToken and cache is empty', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);

      const result = await loadOrFetchCarts(TENANT_SLUG, null);

      expect(result.backendSkipped).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return backendSkipped: false when token is available but backend returns empty', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.backendSkipped).toBe(false);
      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
      expect(result.carts).toEqual([]);
    });

    it('should return backendSkipped: false when carts loaded from cache', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(cachedCartData);

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.backendSkipped).toBe(false);
      expect(result.fromCache).toBe(true);
    });

    it('should pass signal through to backend fetch when cache is empty', async () => {
      const controller = new AbortController();
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/carts`,
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });

    it('should return empty result when aborted during backend fetch', async () => {
      const controller = new AbortController();
      controller.abort(); // Abort before calling

      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(result.carts).toEqual([]);
      expect(result.fromCache).toBe(false);
      expect(result.fromBackend).toBe(false);
    });

    it('should NOT log console.error when aborted (AbortError is expected cleanup)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const controller = new AbortController();
      controller.abort();

      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

      await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should still log console.error for real errors during hydration', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (loadMultiCartState as jest.Mock).mockRejectedValue(new Error('AsyncStorage failed'));

      await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CartHydration] Error during cart hydration:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should return backendSkipped: false when carts fetched from backend', async () => {
      (loadMultiCartState as jest.Mock).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      const result = await loadOrFetchCarts(TENANT_SLUG, ACCESS_TOKEN);

      expect(result.backendSkipped).toBe(false);
      expect(result.fromBackend).toBe(true);
      expect(result.carts.length).toBe(1);
    });
  });

  describe('fetchCartsFromBackend', () => {
    it('should correctly transform backend response to ManagedCart format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts.length).toBe(1);

      const cart = result!.carts[0];
      expect(cart.id).toBe('b1a2c3d4-uuid');
      expect(cart.name).toBe('Morning Cart');
      expect(cart.status).toBe('draft');
      expect(cart.createdAt).toBe('2026-01-31T06:00:00.000Z');
      expect(cart.items.length).toBe(1);

      const item = cart.items[0];
      expect(item.item.id).toBe('atta-1-uuid');
      expect(item.item.categoryId).toBe('atta-rice');
      expect(item.item.name).toBe('Aashirvaad Atta');
      expect(item.item.nameTe).toBe('ఆశీర్వాద్ ఆటా');
      expect(item.item.unit).toBe('kg');
      expect(item.item.defaultQuantity).toBe(5);
      expect(item.item.price).toBe(48.0);
      expect(item.quantity).toBe(5);
      expect(item.priceSnapshot).toBe(48.0);
      expect(item.addedAt).toBe('2026-01-31T06:00:00.000Z');
    });

    it('should send correct headers (X-Tenant-ID, Authorization, X-API-Version)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/carts`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Tenant-ID': TENANT_SLUG,
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'X-API-Version': API_CONFIG.VERSION,
          }),
        })
      );
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).toBeNull();
    });

    it('should return null on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).toBeNull();
    });

    it('should filter out cart items without nested item data', async () => {
      const responseWithMissingItems = {
        success: true,
        data: [
          {
            id: 'cart-uuid',
            name: 'Test Cart',
            status: 'draft',
            createdAt: '2026-01-31T06:00:00.000Z',
            updatedAt: '2026-01-31T06:00:00.000Z',
            paidAt: null,
            paidAmount: null,
            items: [
              {
                id: 'item-1',
                cartId: 'cart-uuid',
                itemId: 'atta-uuid',
                quantity: 5,
                priceSnapshot: 48.0,
                addedAt: '2026-01-31T06:00:00.000Z',
                item: {
                  id: 'atta-uuid',
                  categoryId: 'cat-uuid',
                  name: 'Atta',
                  unit: 'kg',
                  defaultQuantity: 5,
                  price: 48.0,
                },
              },
              {
                // Item with no nested item (deleted product)
                id: 'item-2',
                cartId: 'cart-uuid',
                itemId: 'deleted-uuid',
                quantity: 2,
                priceSnapshot: 30.0,
                addedAt: '2026-01-31T06:00:00.000Z',
                item: null,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithMissingItems),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts[0].items.length).toBe(1); // Only the item with valid nested data
      expect(result!.carts[0].items[0].item.name).toBe('Atta');
    });

    it('should handle unwrapped response format (no success/data wrapper)', async () => {
      // Some endpoints might return array directly without wrapper
      const unwrappedResponse = [
        {
          id: 'cart-uuid',
          name: 'Direct Cart',
          status: 'draft',
          createdAt: '2026-01-31T06:00:00.000Z',
          updatedAt: '2026-01-31T06:00:00.000Z',
          paidAt: null,
          paidAmount: null,
          items: [],
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unwrappedResponse),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts.length).toBe(1);
      expect(result!.carts[0].name).toBe('Direct Cart');
    });

    it('should set activeCartId to first cart ID when backend has carts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.activeCartId).toBe('b1a2c3d4-uuid');
    });

    it('should pass AbortSignal to fetch when signal is provided', async () => {
      const controller = new AbortController();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(backendCartsResponse),
      });

      await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/carts`,
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });

    it('should return null when aborted', async () => {
      const controller = new AbortController();
      controller.abort(); // Abort before calling

      mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(result).toBeNull();
    });

    it('should NOT log console.error when aborted (AbortError is expected cleanup)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

      await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN, controller.signal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should still log console.error for real network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValue(new Error('Network error'));

      await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CartHydration] Failed to fetch carts from backend:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should preserve paidAt and paidAmount from backend response', async () => {
      const paidCartResponse = {
        success: true,
        data: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            status: 'paid',
            createdAt: '2026-01-31T06:00:00.000Z',
            updatedAt: '2026-01-31T08:00:00.000Z',
            paidAt: '2026-01-31T07:30:00.000Z',
            paidAmount: 422.0,
            items: [],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paidCartResponse),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts[0].status).toBe('paid');
      expect(result!.carts[0].paidAt).toBe('2026-01-31T07:30:00.000Z');
      expect(result!.carts[0].paidAmount).toBe(422.0);
    });

    it('should use category slug as categoryId when category relation is present', async () => {
      // Backend response includes category object with slug
      const responseWithCategory = {
        success: true,
        data: [
          {
            id: 'cart-uuid',
            name: 'Test Cart',
            status: 'draft',
            createdAt: '2026-01-31T06:00:00.000Z',
            updatedAt: '2026-01-31T06:00:00.000Z',
            paidAt: null,
            paidAmount: null,
            items: [
              {
                id: 'ci-1',
                cartId: 'cart-uuid',
                itemId: 'item-uuid',
                quantity: 2,
                priceSnapshot: 60.0,
                addedAt: '2026-01-31T06:00:00.000Z',
                item: {
                  id: 'item-uuid',
                  categoryId: '1f21cd9a-6f62-49a1-81d5-4e825545e262',
                  category: { slug: 'atta-rice' },
                  name: 'Wheat Flour',
                  unit: 'kg',
                  defaultQuantity: 5,
                  price: 48.0,
                },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCategory),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts[0].items[0].item.categoryId).toBe('atta-rice');
    });

    it('should fallback to raw categoryId when category relation is missing', async () => {
      // Backend response without category object (edge case)
      const responseWithoutCategory = {
        success: true,
        data: [
          {
            id: 'cart-uuid',
            name: 'Test Cart',
            status: 'draft',
            createdAt: '2026-01-31T06:00:00.000Z',
            updatedAt: '2026-01-31T06:00:00.000Z',
            paidAt: null,
            paidAmount: null,
            items: [
              {
                id: 'ci-1',
                cartId: 'cart-uuid',
                itemId: 'item-uuid',
                quantity: 2,
                priceSnapshot: 30.0,
                addedAt: '2026-01-31T06:00:00.000Z',
                item: {
                  id: 'item-uuid',
                  categoryId: 'some-uuid-fallback',
                  name: 'Test Item',
                  unit: 'kg',
                  defaultQuantity: 1,
                  price: 30.0,
                },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutCategory),
      });

      const result = await fetchCartsFromBackend(TENANT_SLUG, ACCESS_TOKEN);

      expect(result).not.toBeNull();
      expect(result!.carts[0].items[0].item.categoryId).toBe('some-uuid-fallback');
    });
  });
});
