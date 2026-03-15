/**
 * Catalog Sync Utility
 * Handles synchronization between local storage and backend API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Item } from '../../domain/types/picking';

// Storage keys
const CATALOG_STORAGE_KEY = '@groceryone/catalog';
const SYNC_STATUS_KEY = '@groceryone/catalog_sync_status';

// API configuration
import { API_CONFIG } from '../../core/config/api.config';

export interface LocalCatalogData {
  categories: Category[];
  items: Item[];
  isInitialized: boolean;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  syncedToBackend: boolean;
  version: number;
}

export interface SyncReport {
  success: boolean;
  categoriesMigrated: number;
  itemsMigrated: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Get local catalog data from AsyncStorage
 */
export async function getLocalCatalogData(): Promise<LocalCatalogData | null> {
  try {
    const stored = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get local catalog data:', error);
    return null;
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus | null> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return null;
  }
}

/**
 * Save sync status
 */
export async function saveSyncStatus(status: SyncStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save sync status:', error);
  }
}

/**
 * Fetch categories from backend
 */
export async function fetchCategoriesFromBackend(options?: {
  tenantId?: string;
  accessToken?: string;
  trackInventory?: boolean;
}): Promise<Category[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  // Build URL with optional trackInventory filter
  let url = `${API_CONFIG.BASE_URL}/categories`;
  const params: string[] = [];
  if (options?.trackInventory !== undefined) {
    params.push(`trackInventory=${options.trackInventory}`);
  }
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  console.log('[CatalogSync] Fetching categories from:', url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CatalogSync] Categories fetch failed:', msg, '| URL:', url);
    throw new Error(`Failed to fetch categories from ${url}: ${msg}`);
  }
  clearTimeout(timeoutId);

  console.log('[CatalogSync] Categories response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const response_data = await response.json();
  const data = response_data.data || response_data; // Handle both { data: [...] } and direct array

  // Map backend format to local format
  return data.map((cat: { id: string; slug: string; name: string; nameTe?: string; icon: string; trackInventory?: boolean }) => ({
    id: cat.slug, // Use slug as ID for compatibility
    backendId: cat.id, // Store UUID for reverse lookup (slug-UUID mismatch fix)
    name: cat.name,
    nameTe: cat.nameTe,
    icon: cat.icon,
    trackInventory: cat.trackInventory ?? false,
  }));
}

/**
 * Fetch items from backend
 */
export async function fetchItemsFromBackend(options?: {
  tenantId?: string;
  accessToken?: string;
}): Promise<Item[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const itemsUrl = `${API_CONFIG.BASE_URL}/items`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  let response: Response;
  try {
    response = await fetch(itemsUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CatalogSync] Items fetch failed:', msg, '| URL:', itemsUrl);
    throw new Error(`Failed to fetch items from ${itemsUrl}: ${msg}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.status}`);
  }

  const response_data = await response.json();
  const data = response_data.data || response_data; // Handle both { data: [...] } and direct array

  // Map backend format to local format
  return data.map((item: {
    id: string;
    slug: string;
    name: string;
    nameTe?: string;
    categoryId: string;
    category?: { slug: string };
    unit: string;
    defaultQuantity: number | string;
    price?: number | string;
    compareAtPrice?: number | string;
    sortOrder?: number;
    trackInventory?: boolean;
    stockQuantity?: number | string;
    lowStockThreshold?: number;
  }) => ({
    id: item.slug, // Use slug as ID for compatibility
    backendId: item.id, // Store backend UUID for cart sync API calls
    name: item.name,
    nameTe: item.nameTe,
    categoryId: item.category?.slug || item.categoryId, // Use category slug
    unit: item.unit as Item['unit'],
    defaultQuantity: typeof item.defaultQuantity === 'string' ? parseFloat(item.defaultQuantity) : item.defaultQuantity,
    // Parse price with validation to handle edge cases (null, undefined, malformed strings)
    price: (() => {
      if (item.price === undefined || item.price === null) return undefined;
      const parsed = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return isNaN(parsed) ? undefined : parsed;
    })(),
    // Map compareAtPrice (MRP) from backend to mrp on mobile
    // Falls back to price if compareAtPrice is missing, then to 0
    mrp: (() => {
      const raw = item.compareAtPrice ?? item.price;
      if (raw === undefined || raw === null) return 0;
      const parsed = typeof raw === 'string' ? parseFloat(raw) : raw;
      return isNaN(parsed) ? 0 : parsed;
    })(),
    // Carry sortOrder for consistent display ordering across screens
    sortOrder: item.sortOrder ?? 0,
    // Inventory tracking fields — required for filtering inventory items from order/POS screens
    trackInventory: item.trackInventory ?? false,
    stockQuantity: (() => {
      if (item.stockQuantity === undefined || item.stockQuantity === null) return undefined;
      return typeof item.stockQuantity === 'string' ? parseFloat(item.stockQuantity) : item.stockQuantity;
    })(),
    lowStockThreshold: item.lowStockThreshold,
  }));
}

/**
 * Migrate local categories to backend
 */
export async function migrateCategoriesToBackend(
  categories: Category[],
  options?: {
    tenantId?: string;
    accessToken?: string;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const category of categories) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slug: category.id,
          name: category.name,
          icon: category.icon,
        }),
      });

      if (response.ok) {
        success++;
      } else if (response.status === 409) {
        // Already exists, skip
        success++;
      } else {
        failed++;
        errors.push(`Category ${category.name}: ${response.status}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Migrate local items to backend
 */
export async function migrateItemsToBackend(
  items: Item[],
  categoryIdMap: Map<string, string>,
  options?: {
    tenantId?: string;
    accessToken?: string;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const categoryId = categoryIdMap.get(item.categoryId);
      if (!categoryId) {
        failed++;
        errors.push(`Item ${item.name}: Category ${item.categoryId} not found`);
        continue;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slug: item.id,
          name: item.name,
          categoryId,
          unit: item.unit,
          defaultQuantity: item.defaultQuantity,
          price: item.price,
          compareAtPrice: item.mrp, // Map mobile mrp to backend compareAtPrice
        }),
      });

      if (response.ok) {
        success++;
      } else if (response.status === 409) {
        // Already exists, skip
        success++;
      } else {
        failed++;
        errors.push(`Item ${item.name}: ${response.status}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Item ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Full sync from local to backend
 */
export async function syncLocalToBackend(options?: {
  tenantId?: string;
  accessToken?: string;
}): Promise<SyncReport> {
  const report: SyncReport = {
    success: false,
    categoriesMigrated: 0,
    itemsMigrated: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Get local data
    const localData = await getLocalCatalogData();
    if (!localData) {
      report.errors.push('No local catalog data found');
      return report;
    }

    // Migrate categories
    const categoryResult = await migrateCategoriesToBackend(localData.categories, options);
    report.categoriesMigrated = categoryResult.success;
    report.errors.push(...categoryResult.errors);

    // Build category ID map (local ID -> backend ID)
    // For now, we use slug as the ID in both, so map is identity
    const categoryIdMap = new Map<string, string>();
    for (const category of localData.categories) {
      categoryIdMap.set(category.id, category.id);
    }

    // Migrate items
    const itemResult = await migrateItemsToBackend(localData.items, categoryIdMap, options);
    report.itemsMigrated = itemResult.success;
    report.errors.push(...itemResult.errors);

    // Update sync status
    await saveSyncStatus({
      lastSyncedAt: new Date().toISOString(),
      syncedToBackend: true,
      version: 1,
    });

    report.success = report.errors.length === 0;
    return report;

  } catch (error) {
    report.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return report;
  }
}

/**
 * Sync from backend to local
 */
export async function syncBackendToLocal(options?: {
  tenantId?: string;
  accessToken?: string;
}): Promise<{ categories: Category[]; items: Item[] } | null> {
  try {
    console.log('[CatalogSync] Starting sync from backend...');
    console.log('[CatalogSync] API URL:', API_CONFIG.BASE_URL);
    console.log('[CatalogSync] Options:', JSON.stringify(options));

    const categories = await fetchCategoriesFromBackend({ ...options, trackInventory: false });
    console.log(`[CatalogSync] Fetched ${categories.length} order categories`);

    const allItems = await fetchItemsFromBackend(options);
    console.log(`[CatalogSync] Fetched ${allItems.length} total items from backend`);

    // Defense-in-depth: Only include items belonging to fetched order categories.
    // This prevents inventory items from leaking into the order Redux store even if
    // the backend response is missing the trackInventory field (e.g. old deployment).
    const orderCategoryIds = new Set(categories.map(c => c.id));
    const items = allItems.filter(item => orderCategoryIds.has(item.categoryId));
    console.log(`[CatalogSync] Filtered to ${items.length} order items (excluded ${allItems.length - items.length} inventory items)`);

    return { categories, items };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[CatalogSync] ❌ Failed to sync from backend');
    console.error('[CatalogSync] Error:', errorMsg);
    console.error('[CatalogSync] Stack:', errorStack);
    console.error('[CatalogSync] URL was:', API_CONFIG.BASE_URL);
    return null;
  }
}

/**
 * Result type for single-entity sync operations
 */
export interface SyncResult {
  success: boolean;
  backendId?: string;
  error?: string;
}

/**
 * Sync a single category to the backend
 * Returns success=true on 201 (created) or 409 (already exists, idempotent)
 */
export async function syncCategoryToBackend(
  category: Category,
  options?: { tenantId?: string; accessToken?: string }
): Promise<SyncResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.tenantId) headers['X-Tenant-ID'] = options.tenantId;
    if (options?.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

    const response = await fetch(`${API_CONFIG.BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: category.id,
        name: category.name,
        icon: category.icon,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      const data = json.data || json;
      return { success: true, backendId: data.id };
    }

    if (response.status === 409) {
      return { success: true }; // Already exists — idempotent
    }

    return { success: false, error: `Backend returned status ${response.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Resolve a category slug to its backend UUID
 * Used when syncing items that reference a local category ID
 */
export async function resolveCategoryBackendId(
  categorySlug: string,
  options?: { tenantId?: string; accessToken?: string }
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.tenantId) headers['X-Tenant-ID'] = options.tenantId;
    if (options?.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

    const response = await fetch(`${API_CONFIG.BASE_URL}/categories/slug/${categorySlug}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) return null;

    const json = await response.json();
    const data = json.data || json;
    return data.id || null;
  } catch {
    return null;
  }
}

/**
 * Sync a single item to the backend
 * Requires the backend UUID for the item's category (not the local slug)
 */
export async function syncItemToBackend(
  item: Item,
  categoryBackendId: string,
  options?: { tenantId?: string; accessToken?: string }
): Promise<SyncResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.tenantId) headers['X-Tenant-ID'] = options.tenantId;
    if (options?.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

    const response = await fetch(`${API_CONFIG.BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: item.id,
        name: item.name,
        categoryId: categoryBackendId,
        unit: item.unit,
        defaultQuantity: item.defaultQuantity,
        compareAtPrice: item.mrp ?? 0,
        price: item.price,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      const data = json.data || json;
      return { success: true, backendId: data.id };
    }

    if (response.status === 409) {
      return { success: true }; // Already exists — idempotent
    }

    return { success: false, error: `Backend returned status ${response.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/categories/count`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}
