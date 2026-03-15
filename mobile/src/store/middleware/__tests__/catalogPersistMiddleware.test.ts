/**
 * Catalog Persist Middleware Tests
 * TDD tests for catalog state persistence to AsyncStorage
 */

import { configureStore } from '@reduxjs/toolkit';
import catalogReducer, {
  initializeCatalog,
  addItem,
  updateItem,
  deleteItem,
  addCategory,
} from '../../slices/catalogSlice';
import { catalogPersistMiddleware } from '../catalogPersistMiddleware';
import * as catalogStorage from '../../../utils/storage/catalogStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the storage functions
jest.mock('../../../utils/storage/catalogStorage', () => ({
  saveCatalogState: jest.fn(() => Promise.resolve()),
  loadCatalogState: jest.fn(() => Promise.resolve(null)),
  clearCatalogState: jest.fn(() => Promise.resolve()),
  CATALOG_STORAGE_KEY: '@groceryone/catalog',
  addToCatalogSyncQueue: jest.fn(() => Promise.resolve()),
  removeFromCatalogSyncQueue: jest.fn(() => Promise.resolve()),
  loadPendingCatalogSyncQueue: jest.fn(() => Promise.resolve([])),
}));

// Mock the sync functions
jest.mock('../../../utils/sync/catalogSync', () => ({
  syncCategoryToBackend: jest.fn(() => Promise.resolve({ success: true, backendId: 'backend-uuid' })),
  syncItemToBackend: jest.fn(() => Promise.resolve({ success: true, backendId: 'backend-uuid' })),
  resolveCategoryBackendId: jest.fn(() => Promise.resolve('category-uuid-123')),
}));

import * as catalogSync from '../../../utils/sync/catalogSync';

describe('catalogPersistMiddleware', () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        catalog: catalogReducer,
        tenant: () => ({ tenant: { id: 'tenant-uuid-123', slug: 'test-tenant' } }),
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(catalogPersistMiddleware),
    });
  };

  const createTestStoreWithAuth = () => {
    return configureStore({
      reducer: {
        catalog: catalogReducer,
        tenant: () => ({ tenant: { id: 'tenant-uuid-123', slug: 'test-tenant' } }),
        auth: () => ({ accessToken: 'test-jwt-token' }),
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(catalogPersistMiddleware),
    });
  };

  const mockCategories = [
    { id: 'beverages', name: 'Tea, Coffee & Beverages', icon: '☕' },
    { id: 'rice', name: 'Rice', icon: '🍚' },
  ];

  const mockItems = [
    {
      id: 'bv-001',
      name: 'Loose Tea Leaves',
      categoryId: 'beverages',
      unit: 'gm' as const,
      defaultQuantity: 500,
      price: 440,
      mrp: 440,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initializeCatalog persistence', () => {
    it('should persist state when initializeCatalog is dispatched', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalled();
    });

    it('should pass tenant slug to saveCatalogState', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalledWith(
        expect.anything(),
        'test-tenant'
      );
    });

    it('should persist items with mrp field via initializeCatalog', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      // Fast-forward debounce timer
      jest.advanceTimersByTime(500);

      // Wait for async operations
      await Promise.resolve();

      const savedState = (catalogStorage.saveCatalogState as jest.Mock).mock.calls[0][0];
      expect(savedState.items[0].mrp).toBe(440);
    });
  });

  describe('item action persistence', () => {
    it('should persist state when addItem is dispatched', async () => {
      const store = createTestStore();

      // Initialize catalog first
      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: [],
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      (catalogStorage.saveCatalogState as jest.Mock).mockClear();

      // Add item
      store.dispatch(addItem({
        name: 'New Item',
        categoryId: 'beverages',
        unit: 'pcs',
        defaultQuantity: 1,
        mrp: 100,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalled();
    });

    it('should persist state when updateItem is dispatched', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      (catalogStorage.saveCatalogState as jest.Mock).mockClear();

      store.dispatch(updateItem({
        id: 'bv-001',
        mrp: 500,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalled();
    });

    it('should persist state when deleteItem is dispatched', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      (catalogStorage.saveCatalogState as jest.Mock).mockClear();

      store.dispatch(deleteItem('bv-001'));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalled();
    });
  });

  describe('category action persistence', () => {
    it('should persist state when addCategory is dispatched', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: [],
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      (catalogStorage.saveCatalogState as jest.Mock).mockClear();

      store.dispatch(addCategory({ name: 'New Category', icon: '🆕' }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).toHaveBeenCalled();
    });
  });

  describe('debouncing', () => {
    it('should debounce multiple rapid actions', async () => {
      const store = createTestStore();

      store.dispatch(initializeCatalog({
        categories: mockCategories,
        items: [],
      }));

      // Multiple rapid dispatches
      store.dispatch(addCategory({ name: 'Cat 1' }));
      store.dispatch(addCategory({ name: 'Cat 2' }));
      store.dispatch(addCategory({ name: 'Cat 3' }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      // initializeCatalog + debounced category adds = at most 2 saves
      // (initializeCatalog save + debounced batch for the 3 addCategory actions)
      const callCount = (catalogStorage.saveCatalogState as jest.Mock).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(2);
    });
  });

  describe('tenant slug handling', () => {
    it('should skip persistence when no tenant slug is available', async () => {
      const storeNoTenant = configureStore({
        reducer: {
          catalog: catalogReducer,
          tenant: () => ({ tenant: null }),
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false,
          }).concat(catalogPersistMiddleware),
      });

      storeNoTenant.dispatch(initializeCatalog({
        categories: mockCategories,
        items: mockItems,
      }));

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(catalogStorage.saveCatalogState).not.toHaveBeenCalled();
    });
  });

  describe('backend sync on category creation', () => {
    it('should call syncCategoryToBackend when addCategory is dispatched', async () => {
      const store = createTestStoreWithAuth();

      store.dispatch(initializeCatalog({ categories: [], items: [] }));
      await jest.advanceTimersByTimeAsync(500);

      store.dispatch(addCategory({ name: 'Dairy', icon: '🥛' }));

      // advanceTimersByTimeAsync flushes both timers and microtasks
      await jest.advanceTimersByTimeAsync(500);

      expect(catalogSync.syncCategoryToBackend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dairy', icon: '🥛' }),
        expect.objectContaining({ tenantId: 'test-tenant' })
      );
    });

    it('should queue for retry when category sync fails', async () => {
      (catalogSync.syncCategoryToBackend as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = createTestStoreWithAuth();

      store.dispatch(initializeCatalog({ categories: [], items: [] }));
      await jest.advanceTimersByTimeAsync(500);

      store.dispatch(addCategory({ name: 'Failed Cat', icon: '❌' }));

      await jest.advanceTimersByTimeAsync(500);

      expect(catalogStorage.addToCatalogSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'category' }),
        'test-tenant'
      );
    });
  });

  describe('backend sync on item creation', () => {
    it('should call syncItemToBackend when addItem is dispatched', async () => {
      const store = createTestStoreWithAuth();

      store.dispatch(initializeCatalog({ categories: mockCategories, items: [] }));
      await jest.advanceTimersByTimeAsync(500);

      store.dispatch(addItem({ name: 'New Item', categoryId: 'beverages', unit: 'pcs', defaultQuantity: 1, mrp: 100 }));

      await jest.advanceTimersByTimeAsync(500);

      expect(catalogSync.resolveCategoryBackendId).toHaveBeenCalledWith(
        'beverages',
        expect.objectContaining({ tenantId: 'test-tenant' })
      );
      expect(catalogSync.syncItemToBackend).toHaveBeenCalled();
    });

    it('should queue for retry when category UUID cannot be resolved', async () => {
      (catalogSync.resolveCategoryBackendId as jest.Mock).mockResolvedValueOnce(null);

      const store = createTestStoreWithAuth();

      store.dispatch(initializeCatalog({ categories: mockCategories, items: [] }));
      await jest.advanceTimersByTimeAsync(500);

      store.dispatch(addItem({ name: 'Orphan Item', categoryId: 'beverages', unit: 'kg', defaultQuantity: 1, mrp: 50 }));

      await jest.advanceTimersByTimeAsync(500);

      expect(catalogStorage.addToCatalogSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'item' }),
        'test-tenant'
      );
    });
  });
});
