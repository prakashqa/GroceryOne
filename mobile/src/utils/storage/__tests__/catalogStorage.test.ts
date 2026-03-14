/**
 * Catalog Storage Tests
 * TDD tests for loadOrSeedCatalog and refreshCatalogFromBackend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadOrSeedCatalog,
  refreshCatalogFromBackend,
  saveCatalogState,
  loadCatalogState,
  CATALOG_STORAGE_KEY,
  CATALOG_CACHE_VERSION,
  getTenantCatalogKey,
  addToCatalogSyncQueue,
  removeFromCatalogSyncQueue,
  loadPendingCatalogSyncQueue,
  getTenantCatalogSyncQueueKey,
} from '../catalogStorage';
import * as catalogSync from '../../sync/catalogSync';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock catalogSync
jest.mock('../../sync/catalogSync', () => ({
  syncBackendToLocal: jest.fn(),
}));

describe('catalogStorage', () => {
  const TEST_TENANT = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategories = [
    { id: 'beverages', name: 'Tea, Coffee & Beverages', icon: '☕' },
    { id: 'rice', name: 'Rice', icon: '🍚' },
  ];

  const mockItemsWithMrp = [
    {
      id: 'bv-001',
      name: 'Loose Tea Leaves',
      categoryId: 'beverages',
      unit: 'gm' as const,
      defaultQuantity: 500,
      price: 440,
      mrp: 440,
    },
    {
      id: 'rc-001',
      name: 'Basmati Rice',
      categoryId: 'rice',
      unit: 'kg' as const,
      defaultQuantity: 5,
      price: 140,
      mrp: 140,
    },
  ];

  const mockItemsWithoutMrp = [
    {
      id: 'bv-001',
      name: 'Loose Tea Leaves',
      categoryId: 'beverages',
      unit: 'gm' as const,
      defaultQuantity: 500,
      price: 220,
    },
  ];

  const mockBackendData = {
    categories: mockCategories,
    items: mockItemsWithMrp,
  };

  const mockCachedData = {
    categories: mockCategories,
    items: mockItemsWithMrp,
    lastSyncedAt: '2026-01-29T00:00:00.000Z',
    cacheVersion: CATALOG_CACHE_VERSION,
  };

  const mockStaleCachedData = {
    categories: mockCategories,
    items: mockItemsWithoutMrp,
    lastSyncedAt: '2026-01-29T00:00:00.000Z',
    // No cacheVersion — stale cache
  };

  describe('loadOrSeedCatalog', () => {
    it('should return backend data with mrp when backend is available', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(mockBackendData);

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.fromCache).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].mrp).toBe(440);
      expect(result.items[1].mrp).toBe(140);
    });

    it('should save backend data to tenant-scoped AsyncStorage key after successful fetch', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(mockBackendData);

      await loadOrSeedCatalog(TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCatalogKey(TEST_TENANT),
        expect.stringContaining('"mrp":440')
      );
    });

    it('should fall back to versioned cached data when backend fails', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockCachedData)
      );

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.fromCache).toBe(true);
      expect(result.categories).toHaveLength(2);
    });

    it('should fall back to versioned cache when backend returns null', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockCachedData)
      );

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.fromCache).toBe(true);
    });

    it('should return empty when backend fails and cache is stale (no version)', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockStaleCachedData)
      );

      const result = await loadOrSeedCatalog(TEST_TENANT);

      // Stale cache rejected, no backend available
      expect(result.categories).toHaveLength(0);
      expect(result.items).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should return empty with error when neither backend nor cache available', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.categories).toHaveLength(0);
      expect(result.items).toHaveLength(0);
      expect(result.fromCache).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return empty data without error when backend returns 0 categories (new tenant)', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce({
        categories: [],
        items: [],
      });

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.categories).toHaveLength(0);
      expect(result.items).toHaveLength(0);
      expect(result.fromCache).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should fall through to cache with error when backend returns null and cache is empty', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadOrSeedCatalog(TEST_TENANT);

      expect(result.categories).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should scope empty catalog result to the provided tenantId (tenant isolation)', async () => {
      const tenantA = 'tenant-a';
      const tenantB = 'tenant-b';

      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValue({
        categories: [],
        items: [],
      });

      await loadOrSeedCatalog(tenantA);
      await loadOrSeedCatalog(tenantB);

      expect(catalogSync.syncBackendToLocal).toHaveBeenCalledWith({ tenantId: tenantA });
      expect(catalogSync.syncBackendToLocal).toHaveBeenCalledWith({ tenantId: tenantB });
      expect(catalogSync.syncBackendToLocal).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshCatalogFromBackend', () => {
    it('should return fresh data from backend with mrp', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(mockBackendData);

      const result = await refreshCatalogFromBackend(TEST_TENANT);;

      expect(result).not.toBeNull();
      expect(result!.items[0].mrp).toBe(440);
      expect(result!.fromCache).toBe(false);
    });

    it('should update tenant-scoped AsyncStorage cache with fresh data', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(mockBackendData);

      await refreshCatalogFromBackend(TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCatalogKey(TEST_TENANT),
        expect.stringContaining('"mrp":440')
      );
    });

    it('should return null when backend fails (no crash)', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const result = await refreshCatalogFromBackend(TEST_TENANT);;

      expect(result).toBeNull();
    });

    it('should return null when backend returns empty data', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce({
        categories: [],
        items: [],
      });

      const result = await refreshCatalogFromBackend(TEST_TENANT);;

      expect(result).toBeNull();
    });

    it('should return null when backend returns null', async () => {
      (catalogSync.syncBackendToLocal as jest.Mock).mockResolvedValueOnce(null);

      const result = await refreshCatalogFromBackend(TEST_TENANT);;

      expect(result).toBeNull();
    });
  });

  describe('saveCatalogState', () => {
    it('should persist items with mrp field to AsyncStorage', async () => {
      await saveCatalogState({
        categories: mockCategories,
        items: mockItemsWithMrp,
        isInitialized: true,
      }, TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData.items[0].mrp).toBe(440);
    });

    it('should use tenant-scoped storage key', async () => {
      await saveCatalogState({
        categories: mockCategories,
        items: mockItemsWithMrp,
        isInitialized: true,
      }, TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCatalogKey(TEST_TENANT),
        expect.any(String)
      );
    });

    it('should include cacheVersion when saving', async () => {
      await saveCatalogState({
        categories: mockCategories,
        items: mockItemsWithMrp,
        isInitialized: true,
      }, TEST_TENANT);

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData.cacheVersion).toBe(CATALOG_CACHE_VERSION);
    });
  });

  describe('loadCatalogState', () => {
    it('should load items with mrp field from AsyncStorage when cache version matches', async () => {
      const dataWithMrp = {
        categories: mockCategories,
        items: mockItemsWithMrp,
        lastSyncedAt: '2026-01-30T00:00:00.000Z',
        cacheVersion: CATALOG_CACHE_VERSION,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(dataWithMrp)
      );

      const result = await loadCatalogState(TEST_TENANT);

      expect(result).not.toBeNull();
      expect(result!.items[0].mrp).toBe(440);
    });

    it('should return null when no data in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadCatalogState(TEST_TENANT);

      expect(result).toBeNull();
    });

    it('should return null when cache version is missing (stale cache)', async () => {
      const staleData = {
        categories: mockCategories,
        items: mockItemsWithoutMrp,
        lastSyncedAt: '2026-01-28T00:00:00.000Z',
        // No cacheVersion
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(staleData)
      );

      const result = await loadCatalogState(TEST_TENANT);

      expect(result).toBeNull();
    });

    it('should return null when cache version is outdated', async () => {
      const outdatedData = {
        categories: mockCategories,
        items: mockItemsWithMrp,
        lastSyncedAt: '2026-01-28T00:00:00.000Z',
        cacheVersion: 1, // Older than CATALOG_CACHE_VERSION
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(outdatedData)
      );

      const result = await loadCatalogState(TEST_TENANT);

      expect(result).toBeNull();
    });
  });

  describe('pending catalog sync queue', () => {
    const TEST_TENANT = 'quickbasket';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return empty array when no queue exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const queue = await loadPendingCatalogSyncQueue(TEST_TENANT);

      expect(queue).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(getTenantCatalogSyncQueueKey(TEST_TENANT));
    });

    it('should add a category sync entry', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await addToCatalogSyncQueue({ type: 'category', localId: 'cat-123' }, TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCatalogSyncQueueKey(TEST_TENANT),
        expect.stringContaining('"localId":"cat-123"')
      );
    });

    it('should add an item sync entry', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await addToCatalogSyncQueue({ type: 'item', localId: 'item-456' }, TEST_TENANT);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCatalogSyncQueueKey(TEST_TENANT),
        expect.stringContaining('"localId":"item-456"')
      );
    });

    it('should increment retryCount if already in queue', async () => {
      const existingQueue = [{ type: 'category', localId: 'cat-123', retryCount: 1, lastAttempt: '2026-01-31T00:00:00.000Z' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingQueue));

      await addToCatalogSyncQueue({ type: 'category', localId: 'cat-123' }, TEST_TENANT);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].retryCount).toBe(2);
    });

    it('should remove an entry by localId', async () => {
      const existingQueue = [
        { type: 'category', localId: 'cat-123', retryCount: 0, lastAttempt: '2026-01-31T00:00:00.000Z' },
        { type: 'item', localId: 'item-456', retryCount: 0, lastAttempt: '2026-01-31T00:00:00.000Z' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingQueue));

      await removeFromCatalogSyncQueue('cat-123', TEST_TENANT);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].localId).toBe('item-456');
    });
  });
});
