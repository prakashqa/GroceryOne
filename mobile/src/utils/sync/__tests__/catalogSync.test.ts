/**
 * Catalog Sync Tests
 * TDD tests for backend-to-mobile field mapping (compareAtPrice → mrp)
 */

import {
  fetchItemsFromBackend,
  fetchCategoriesFromBackend,
  syncCategoryToBackend,
  syncItemToBackend,
  resolveCategoryBackendId,
  syncBackendToLocal,
} from '../catalogSync';

// Mock API config
jest.mock('../../../core/config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000/api/v1',
    TIMEOUT: 30000,
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('catalogSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('fetchItemsFromBackend', () => {
    const mockBackendItem = {
      id: 'uuid-1',
      slug: 'bv-001',
      name: 'Loose Tea Leaves',
      nameTe: 'టీ పొడి',
      categoryId: 'cat-uuid-1',
      category: { slug: 'beverages' },
      unit: 'gm',
      defaultQuantity: '500.00',
      price: '440.00',
      compareAtPrice: '440.00',
    };

    it('should map compareAtPrice from backend to mrp on mobile', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items).toHaveLength(1);
      expect(items[0].mrp).toBe(440);
    });

    it('should map price field correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].price).toBe(440);
    });

    it('should fall back to price when compareAtPrice is null', async () => {
      const itemWithNullMrp = { ...mockBackendItem, compareAtPrice: null };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithNullMrp] }),
      });

      const items = await fetchItemsFromBackend();

      // Falls back to price (440) when compareAtPrice is null
      expect(items[0].mrp).toBe(440);
    });

    it('should fall back to price when compareAtPrice is undefined', async () => {
      const { compareAtPrice, ...itemWithoutMrp } = mockBackendItem;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithoutMrp] }),
      });

      const items = await fetchItemsFromBackend();

      // Falls back to price (440) when compareAtPrice is undefined
      expect(items[0].mrp).toBe(440);
    });

    it('should default mrp to 0 when both compareAtPrice and price are missing', async () => {
      const { compareAtPrice, price, ...itemWithoutPrices } = mockBackendItem;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithoutPrices] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].mrp).toBe(0);
    });

    it('should parse string compareAtPrice values', async () => {
      const itemWithStringMrp = { ...mockBackendItem, compareAtPrice: '99.50' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithStringMrp] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].mrp).toBe(99.5);
    });

    it('should parse numeric compareAtPrice values', async () => {
      const itemWithNumericMrp = { ...mockBackendItem, compareAtPrice: 150 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithNumericMrp] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].mrp).toBe(150);
    });

    it('should use slug as id for compatibility', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].id).toBe('bv-001');
    });

    it('should use category slug as categoryId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].categoryId).toBe('beverages');
    });

    it('should parse string defaultQuantity', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].defaultQuantity).toBe(500);
    });

    it('should include tenantId header when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchItemsFromBackend({ tenantId: 'quickbasket' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['X-Tenant-ID']).toBe('quickbasket');
    });

    it('should map sortOrder from backend', async () => {
      const itemWithSortOrder = { ...mockBackendItem, sortOrder: 5 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [itemWithSortOrder] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].sortOrder).toBe(5);
    });

    it('should default sortOrder to 0 when missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendItem] }),
      });

      const items = await fetchItemsFromBackend();

      expect(items[0].sortOrder).toBe(0);
    });

    it('should throw on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchItemsFromBackend()).rejects.toThrow('Failed to fetch items: 500');
    });

    it('should include URL in error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(fetchItemsFromBackend()).rejects.toThrow(/http:\/\/localhost:3000\/api\/v1\/items/);
    });

    it('should pass abort signal to fetch for timeout', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchItemsFromBackend();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBeDefined();
      expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('fetchCategoriesFromBackend', () => {
    const mockBackendCategory = {
      id: 'uuid-cat-1',
      slug: 'beverages',
      name: 'Tea, Coffee & Beverages',
      nameTe: 'టీ, కాఫీ & పానీయాలు',
      icon: '☕',
    };

    it('should use slug as id for compatibility', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockBackendCategory] }),
      });

      const categories = await fetchCategoriesFromBackend();

      expect(categories[0].id).toBe('beverages');
      expect(categories[0].name).toBe('Tea, Coffee & Beverages');
      expect(categories[0].icon).toBe('☕');
    });

    it('should include URL in error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(fetchCategoriesFromBackend()).rejects.toThrow(/http:\/\/localhost:3000\/api\/v1\/categories/);
    });

    it('should pass abort signal to fetch for timeout', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchCategoriesFromBackend();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBeDefined();
      expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('syncCategoryToBackend', () => {
    const testCategory = { id: 'cat-1706789000-abc1234', name: 'Dairy', icon: '🥛' };

    it('should POST to /categories with slug, name, icon', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: { id: 'backend-uuid-1', slug: 'cat-1706789000-abc1234', name: 'Dairy' } }),
      });

      const result = await syncCategoryToBackend(testCategory, { tenantId: 'quickbasket', accessToken: 'jwt-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/categories',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Tenant-ID': 'quickbasket',
            'Authorization': 'Bearer jwt-token',
          }),
          body: JSON.stringify({ slug: 'cat-1706789000-abc1234', name: 'Dairy', icon: '🥛' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.backendId).toBe('backend-uuid-1');
    });

    it('should treat 409 (already exists) as success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const result = await syncCategoryToBackend(testCategory, { tenantId: 'quickbasket' });

      expect(result.success).toBe(true);
    });

    it('should return failure on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await syncCategoryToBackend(testCategory, { tenantId: 'quickbasket' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return failure on 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await syncCategoryToBackend(testCategory, { tenantId: 'quickbasket' });

      expect(result.success).toBe(false);
    });
  });

  describe('resolveCategoryBackendId', () => {
    it('should GET /categories/slug/:slug and return UUID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'backend-uuid-1', slug: 'cat-1706789000-abc1234', name: 'Dairy' } }),
      });

      const backendId = await resolveCategoryBackendId('cat-1706789000-abc1234', { tenantId: 'quickbasket', accessToken: 'jwt-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/categories/slug/cat-1706789000-abc1234',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Tenant-ID': 'quickbasket',
          }),
        })
      );
      expect(backendId).toBe('backend-uuid-1');
    });

    it('should return null on 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const backendId = await resolveCategoryBackendId('nonexistent', { tenantId: 'quickbasket' });

      expect(backendId).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const backendId = await resolveCategoryBackendId('cat-1', { tenantId: 'quickbasket' });

      expect(backendId).toBeNull();
    });
  });

  describe('syncBackendToLocal', () => {
    it('should return null and log error when backend sync fails', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

      const result = await syncBackendToLocal({ tenantId: 'test' });

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CatalogSync]'),
        expect.any(String)
      );

      warnSpy.mockRestore();
      errorSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('syncItemToBackend', () => {
    const testItem = { id: 'item-1706789100-xyz5678', categoryId: 'cat-1706789000-abc1234', name: 'Whole Milk', unit: 'L' as const, defaultQuantity: 1, mrp: 65, price: 60 };

    it('should POST to /items with correct fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: { id: 'item-uuid-1', slug: 'item-1706789100-xyz5678' } }),
      });

      const result = await syncItemToBackend(testItem, 'category-uuid-123', { tenantId: 'quickbasket', accessToken: 'jwt-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            slug: 'item-1706789100-xyz5678',
            name: 'Whole Milk',
            categoryId: 'category-uuid-123',
            unit: 'L',
            defaultQuantity: 1,
            compareAtPrice: 65,
            price: 60,
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.backendId).toBe('item-uuid-1');
    });

    it('should treat 409 as success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const result = await syncItemToBackend(testItem, 'category-uuid-123', { tenantId: 'quickbasket' });

      expect(result.success).toBe(true);
    });

    it('should return failure on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await syncItemToBackend(testItem, 'category-uuid-123', { tenantId: 'quickbasket' });

      expect(result.success).toBe(false);
    });
  });
});
