/**
 * Catalog Storage Utility
 * Handles AsyncStorage operations for persisting catalog (categories and items)
 * All storage is tenant-scoped to ensure data isolation between tenants
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogState } from '../../store/slices/catalogSlice';
import { syncBackendToLocal } from '../sync/catalogSync';

// Legacy storage key constant (used for one-time migration only)
/** @deprecated Use getTenantCatalogKey(tenantId) for tenant-scoped storage */
export const CATALOG_STORAGE_KEY = '@groceryone/catalog';

/**
 * Get tenant-scoped catalog storage key
 */
export const getTenantCatalogKey = (tenantId: string): string =>
  `@groceryone/catalog/${tenantId}`;

/**
 * Get tenant-scoped pending catalog sync queue key
 */
export const getTenantCatalogSyncQueueKey = (tenantId: string): string =>
  `@groceryone/pending_catalog_sync/${tenantId}`;

/**
 * Cache version - bump when schema changes to invalidate stale data.
 * v2: Added mrp field mapping from compareAtPrice
 * v3: Added trackInventory, stockQuantity, lowStockThreshold fields to item mapping
 * v4: Force invalidation — old v3 cache may contain inventory categories that leak
 *     into order screens via mergeCatalogFromBackend's local-only preservation
 */
export const CATALOG_CACHE_VERSION = 4;

/**
 * Persisted state shape
 */
export interface PersistedCatalogState {
  categories: CatalogState['categories'];
  items: CatalogState['items'];
  lastSyncedAt: string;
  cacheVersion?: number;
}

/**
 * Get default catalog data
 * Returns empty arrays - backend API is the source of truth
 * @deprecated Use loadOrSeedCatalog() which fetches from backend
 */
export const getDefaultCatalogData = (): Pick<CatalogState, 'categories' | 'items'> => {
  return {
    categories: [],
    items: [],
  };
};

/**
 * Save catalog state to AsyncStorage (tenant-scoped)
 */
export const saveCatalogState = async (
  state: CatalogState,
  tenantId: string
): Promise<void> => {
  try {
    const persistedState: PersistedCatalogState = {
      categories: state.categories,
      items: state.items,
      lastSyncedAt: new Date().toISOString(),
      cacheVersion: CATALOG_CACHE_VERSION,
    };
    await AsyncStorage.setItem(
      getTenantCatalogKey(tenantId),
      JSON.stringify(persistedState)
    );
  } catch (error) {
    console.error('Failed to save catalog state:', error);
    throw error;
  }
};

/**
 * Load catalog state from AsyncStorage (tenant-scoped)
 * Returns null if no data exists (will trigger seeding default data)
 */
export const loadCatalogState = async (
  tenantId: string
): Promise<Pick<CatalogState, 'categories' | 'items'> | null> => {
  try {
    const data = await AsyncStorage.getItem(getTenantCatalogKey(tenantId));
    if (!data) {
      return null;
    }
    const parsed = JSON.parse(data) as PersistedCatalogState;

    // Reject stale cache (missing or outdated version)
    if (!parsed.cacheVersion || parsed.cacheVersion < CATALOG_CACHE_VERSION) {
      console.warn('[CatalogStorage] Stale cache detected (version mismatch), forcing backend refresh');
      return null;
    }

    return {
      categories: parsed.categories,
      items: parsed.items,
    };
  } catch (error) {
    console.error('Failed to load catalog state:', error);
    return null;
  }
};

/**
 * Clear catalog state from AsyncStorage (tenant-scoped)
 */
export const clearCatalogState = async (tenantId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getTenantCatalogKey(tenantId));
  } catch (error) {
    console.error('Failed to clear catalog state:', error);
    throw error;
  }
};

/**
 * Result type for loadOrSeedCatalog
 */
export interface LoadCatalogResult {
  categories: CatalogState['categories'];
  items: CatalogState['items'];
  fromCache: boolean;
  error?: string;
}

/**
 * Load catalog from backend API or local storage (tenant-scoped)
 * Priority: Backend API > Local Storage
 * No hardcoded fallback - backend is the single source of truth
 */
export const loadOrSeedCatalog = async (tenantId: string): Promise<LoadCatalogResult> => {
  console.log('[CatalogStorage] loadOrSeedCatalog called with tenantId:', tenantId);

  // First, try to fetch from backend API
  try {
    console.log('[CatalogStorage] Attempting to fetch catalog from backend...');
    const backendData = await syncBackendToLocal({ tenantId });
    console.log('[CatalogStorage] syncBackendToLocal returned:', backendData ? `${backendData.categories.length} categories, ${backendData.items.length} items` : 'null');
    if (backendData) {
      // Backend responded successfully (even 0 categories is valid for a new tenant)
      if (backendData.categories.length > 0) {
        console.log(`[CatalogStorage] ✅ Loaded ${backendData.categories.length} categories and ${backendData.items.length} items from backend`);
        // Save to local storage for offline access
        await saveCatalogState({
          categories: backendData.categories,
          items: backendData.items,
          isInitialized: true,
        }, tenantId);
      } else {
        console.log('[CatalogStorage] ✅ Backend responded with 0 categories (new/empty tenant — valid state)');
      }
      return { ...backendData, fromCache: false };
    }
    // backendData is null — syncBackendToLocal caught an error internally
    console.warn('[CatalogStorage] ⚠️ Backend returned null (possible network issue)');
  } catch (error) {
    console.error('[CatalogStorage] ❌ Failed to fetch from backend, falling back to local storage:', error instanceof Error ? error.message : error);
  }

  // Fall back to local storage (for offline mode)
  console.log('[CatalogStorage] Trying local storage fallback...');
  const stored = await loadCatalogState(tenantId);
  if (stored && stored.categories.length > 0) {
    console.log(`[CatalogStorage] ✅ Loaded ${stored.categories.length} categories from local storage (offline mode)`);
    return { ...stored, fromCache: true };
  }
  console.log('[CatalogStorage] Local storage returned:', stored ? `${stored.categories.length} categories` : 'null');

  // No data available from backend or cache — genuine failure
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { API_CONFIG: config } = require('../../core/config/api.config');
  const errorMsg = `Could not load catalog. Backend: ${config.BASE_URL}. TenantId: ${tenantId}`;
  console.error(`[CatalogStorage] ❌ No catalog data available. Backend URL: ${config.BASE_URL}`);
  return {
    categories: [],
    items: [],
    fromCache: false,
    error: errorMsg,
  };
};

/**
 * Refresh catalog from backend (background sync, tenant-scoped)
 * Used after initial cache load to get fresh data.
 * Does NOT fall back to cache — caller already has cached data.
 * Returns null on failure (non-critical, app continues with cached data).
 */
export const refreshCatalogFromBackend = async (
  tenantId: string
): Promise<LoadCatalogResult | null> => {
  try {
    console.log('[CatalogStorage] Background refresh: attempting backend fetch...');
    const backendData = await syncBackendToLocal({ tenantId });
    if (backendData && backendData.categories.length > 0) {
      console.log(
        `[CatalogStorage] Background refresh: got ${backendData.categories.length} categories, ${backendData.items.length} items`
      );
      // Update the cache with fresh data
      await saveCatalogState({
        categories: backendData.categories,
        items: backendData.items,
        isInitialized: true,
      }, tenantId);
      return { ...backendData, fromCache: false };
    }
    return null;
  } catch (error) {
    console.warn('[CatalogStorage] Background refresh failed (non-critical):', error);
    return null;
  }
};

// ── Pending Catalog Sync Queue ──

export interface PendingCatalogSync {
  type: 'category' | 'item';
  localId: string;
  retryCount: number;
  lastAttempt: string;
}

/**
 * Load pending catalog sync queue from AsyncStorage
 */
export const loadPendingCatalogSyncQueue = async (tenantId: string): Promise<PendingCatalogSync[]> => {
  try {
    const stored = await AsyncStorage.getItem(getTenantCatalogSyncQueueKey(tenantId));
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[CatalogStorage] Failed to load sync queue:', error);
    return [];
  }
};

/**
 * Save pending catalog sync queue to AsyncStorage
 */
const savePendingCatalogSyncQueue = async (queue: PendingCatalogSync[], tenantId: string): Promise<void> => {
  await AsyncStorage.setItem(getTenantCatalogSyncQueueKey(tenantId), JSON.stringify(queue));
};

/**
 * Add an entry to the pending catalog sync queue
 * Increments retryCount if the entry already exists
 */
export const addToCatalogSyncQueue = async (
  entry: { type: 'category' | 'item'; localId: string },
  tenantId: string
): Promise<void> => {
  try {
    const queue = await loadPendingCatalogSyncQueue(tenantId);
    const existingIndex = queue.findIndex(e => e.localId === entry.localId);

    if (existingIndex >= 0) {
      queue[existingIndex].retryCount++;
      queue[existingIndex].lastAttempt = new Date().toISOString();
    } else {
      queue.push({
        type: entry.type,
        localId: entry.localId,
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
      });
    }

    await savePendingCatalogSyncQueue(queue, tenantId);
  } catch (error) {
    console.error('[CatalogStorage] Failed to add to sync queue:', error);
  }
};

/**
 * Remove an entry from the pending catalog sync queue
 */
export const removeFromCatalogSyncQueue = async (localId: string, tenantId: string): Promise<void> => {
  try {
    const queue = await loadPendingCatalogSyncQueue(tenantId);
    const filtered = queue.filter(e => e.localId !== localId);
    await savePendingCatalogSyncQueue(filtered, tenantId);
  } catch (error) {
    console.error('[CatalogStorage] Failed to remove from sync queue:', error);
  }
};
