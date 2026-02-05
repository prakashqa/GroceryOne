/**
 * Tenant Data Migration Tests
 * TDD tests for one-time migration from global to tenant-scoped keys
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateGlobalToTenantScoped } from '../migrateTenantData';
import {
  MULTI_CART_STORAGE_KEY,
  PENDING_SYNC_QUEUE_KEY,
  getTenantCartKey,
  getTenantSyncQueueKey,
} from '../multiCartStorage';
import {
  CATALOG_STORAGE_KEY,
  getTenantCatalogKey,
} from '../catalogStorage';
import {
  STORAGE_KEYS,
  getTenantSettingsKey,
} from '../settingsStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock catalogSync to prevent transitive expo-constants import
jest.mock('../../sync/catalogSync', () => ({
  syncBackendToLocal: jest.fn(),
}));

describe('migrateGlobalToTenantScoped', () => {
  const TENANT_SLUG = 'test-tenant';
  const MIGRATION_KEY = '@groceryone/migration_v1_tenant_scoped';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip migration if already done', async () => {
    // Migration flag is set
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve('true');
      return Promise.resolve(null);
    });

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    // Should only read the migration flag, not any data keys
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should migrate multi-cart data from global to tenant-scoped key', async () => {
    const mockCartData = JSON.stringify({ carts: [{ id: 'cart-1' }] });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve(null);
      if (key === MULTI_CART_STORAGE_KEY) return Promise.resolve(mockCartData);
      return Promise.resolve(null);
    });

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getTenantCartKey(TENANT_SLUG),
      mockCartData
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(MULTI_CART_STORAGE_KEY);
  });

  it('should migrate pending sync queue data', async () => {
    const mockSyncData = JSON.stringify([{ localId: 'cart-1' }]);

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve(null);
      if (key === PENDING_SYNC_QUEUE_KEY) return Promise.resolve(mockSyncData);
      return Promise.resolve(null);
    });

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getTenantSyncQueueKey(TENANT_SLUG),
      mockSyncData
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(PENDING_SYNC_QUEUE_KEY);
  });

  it('should migrate catalog data', async () => {
    const mockCatalogData = JSON.stringify({ categories: [], items: [] });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve(null);
      if (key === CATALOG_STORAGE_KEY) return Promise.resolve(mockCatalogData);
      return Promise.resolve(null);
    });

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getTenantCatalogKey(TENANT_SLUG),
      mockCatalogData
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(CATALOG_STORAGE_KEY);
  });

  it('should migrate settings data', async () => {
    const mockSettingsData = JSON.stringify({ themeMode: 'dark' });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve(null);
      if (key === STORAGE_KEYS.SETTINGS) return Promise.resolve(mockSettingsData);
      return Promise.resolve(null);
    });

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getTenantSettingsKey(TENANT_SLUG),
      mockSettingsData
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.SETTINGS);
  });

  it('should set migration flag after successful migration', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await migrateGlobalToTenantScoped(TENANT_SLUG);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MIGRATION_KEY, 'true');
  });

  it('should not crash when no global data exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await expect(migrateGlobalToTenantScoped(TENANT_SLUG)).resolves.not.toThrow();

    // Should still mark as complete
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MIGRATION_KEY, 'true');
  });

  it('should not throw on AsyncStorage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === MIGRATION_KEY) return Promise.resolve(null);
      return Promise.reject(new Error('Storage error'));
    });

    // Should not throw
    await expect(migrateGlobalToTenantScoped(TENANT_SLUG)).resolves.not.toThrow();
  });
});
