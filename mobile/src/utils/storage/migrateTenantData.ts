/**
 * Tenant Data Migration
 * One-time migration to move data from global (unscoped) AsyncStorage keys
 * to tenant-scoped keys for proper multi-tenant data isolation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MULTI_CART_STORAGE_KEY,
  PENDING_SYNC_QUEUE_KEY,
  getTenantCartKey,
  getTenantSyncQueueKey,
} from './multiCartStorage';
import {
  CATALOG_STORAGE_KEY,
  getTenantCatalogKey,
} from './catalogStorage';
import {
  STORAGE_KEYS,
  getTenantSettingsKey,
} from './settingsStorage';

const MIGRATION_KEY = '@groceryone/migration_v1_tenant_scoped';

/**
 * Migrate data from global (unscoped) keys to tenant-scoped keys.
 * Should be called once during app initialization after tenant slug is resolved.
 * Safe to call multiple times - uses a flag to skip if already done.
 *
 * @param tenantSlug - The tenant slug to migrate data to
 */
export const migrateGlobalToTenantScoped = async (
  tenantSlug: string
): Promise<void> => {
  try {
    // Check if migration was already performed
    const done = await AsyncStorage.getItem(MIGRATION_KEY);
    if (done) return;

    console.log('[Migration] Starting global-to-tenant-scoped data migration...');

    // Migrate multi-cart data
    const oldCartData = await AsyncStorage.getItem(MULTI_CART_STORAGE_KEY);
    if (oldCartData) {
      await AsyncStorage.setItem(getTenantCartKey(tenantSlug), oldCartData);
      await AsyncStorage.removeItem(MULTI_CART_STORAGE_KEY);
      console.log('[Migration] Migrated multi-cart data');
    }

    // Migrate pending sync queue
    const oldSyncData = await AsyncStorage.getItem(PENDING_SYNC_QUEUE_KEY);
    if (oldSyncData) {
      await AsyncStorage.setItem(getTenantSyncQueueKey(tenantSlug), oldSyncData);
      await AsyncStorage.removeItem(PENDING_SYNC_QUEUE_KEY);
      console.log('[Migration] Migrated pending sync queue');
    }

    // Migrate catalog data
    const oldCatalogData = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
    if (oldCatalogData) {
      await AsyncStorage.setItem(getTenantCatalogKey(tenantSlug), oldCatalogData);
      await AsyncStorage.removeItem(CATALOG_STORAGE_KEY);
      console.log('[Migration] Migrated catalog data');
    }

    // Migrate settings data
    const oldSettingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (oldSettingsData) {
      await AsyncStorage.setItem(getTenantSettingsKey(tenantSlug), oldSettingsData);
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
      console.log('[Migration] Migrated settings data');
    }

    // Mark migration as complete
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[Migration] Tenant-scoped data migration complete');
  } catch (error) {
    console.error('[Migration] Failed to migrate tenant data:', error);
    // Don't throw - migration failure shouldn't prevent app from working
  }
};
