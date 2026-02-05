/**
 * Catalog Persist Middleware
 * Automatically persists catalog changes to AsyncStorage
 * and syncs new categories/items to the backend
 * All persistence is tenant-scoped for data isolation
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import {
  saveCatalogState,
  addToCatalogSyncQueue,
  removeFromCatalogSyncQueue,
  loadPendingCatalogSyncQueue,
} from '../../utils/storage/catalogStorage';
import {
  syncCategoryToBackend,
  syncItemToBackend,
  resolveCategoryBackendId,
} from '../../utils/sync/catalogSync';

// Actions that should trigger persistence
const PERSIST_ACTIONS = [
  'catalog/initializeCatalog',
  'catalog/mergeCatalogFromBackend',
  'catalog/addCategory',
  'catalog/updateCategory',
  'catalog/deleteCategory',
  'catalog/addItem',
  'catalog/updateItem',
  'catalog/deleteItem',
  'catalog/resetCatalog',
];

// Actions that should trigger backend sync
const SYNC_TO_BACKEND_ACTIONS = [
  'catalog/addCategory',
  'catalog/addItem',
];

// Debounce timer reference
let persistTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 500;

export const catalogPersistMiddleware: Middleware<object, RootState> =
  (storeAPI) => (next) => (action) => {
    const result = next(action);

    // Check if this action should trigger persistence or sync
    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action
    ) {
      const actionType = (action as { type: string }).type;

      // Handle persistence to AsyncStorage
      if (PERSIST_ACTIONS.includes(actionType)) {
        // Clear existing timer
        if (persistTimer) {
          clearTimeout(persistTimer);
        }

        // Debounce persistence to avoid excessive writes
        persistTimer = setTimeout(() => {
          const state = storeAPI.getState();
          const tenantSlug = state.tenant?.tenant?.slug;
          if (!tenantSlug) {
            console.warn('[CatalogPersist] No tenant slug, skipping persistence');
            return;
          }
          saveCatalogState(state.catalog, tenantSlug).catch((error) => {
            console.error('[CatalogPersist] Failed to save state:', error);
          });
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for catalog creation
      if (SYNC_TO_BACKEND_ACTIONS.includes(actionType)) {
        setTimeout(async () => {
          const state = storeAPI.getState();
          const tenantSlug = state.tenant?.tenant?.slug;

          if (!tenantSlug) {
            console.warn('[CatalogSync] No tenant slug, skipping backend sync');
            return;
          }

          const accessToken = state.auth?.accessToken;
          const options = { tenantId: tenantSlug, accessToken: accessToken ?? undefined };

          if (actionType === 'catalog/addCategory') {
            const categories = state.catalog.categories;
            const newCategory = categories[categories.length - 1];
            if (!newCategory) return;

            console.log(`[CatalogSync] Syncing category: ${newCategory.name}`);
            const syncResult = await syncCategoryToBackend(newCategory, options);

            if (syncResult.success) {
              await removeFromCatalogSyncQueue(newCategory.id, tenantSlug);
              console.log(`[CatalogSync] Category synced: ${newCategory.name} -> ${syncResult.backendId}`);
            } else {
              console.warn(`[CatalogSync] Category sync failed: ${syncResult.error}`);
              await addToCatalogSyncQueue({ type: 'category', localId: newCategory.id }, tenantSlug);
            }
          }

          if (actionType === 'catalog/addItem') {
            const items = state.catalog.items;
            const newItem = items[items.length - 1];
            if (!newItem) return;

            console.log(`[CatalogSync] Syncing item: ${newItem.name}`);

            // Resolve category backend UUID
            const categoryBackendId = await resolveCategoryBackendId(newItem.categoryId, options);
            if (!categoryBackendId) {
              console.warn(`[CatalogSync] Category UUID not found for ${newItem.categoryId}, queuing item for retry`);
              await addToCatalogSyncQueue({ type: 'item', localId: newItem.id }, tenantSlug);
              return;
            }

            const syncResult = await syncItemToBackend(newItem, categoryBackendId, options);

            if (syncResult.success) {
              await removeFromCatalogSyncQueue(newItem.id, tenantSlug);
              console.log(`[CatalogSync] Item synced: ${newItem.name} -> ${syncResult.backendId}`);
            } else {
              console.warn(`[CatalogSync] Item sync failed: ${syncResult.error}`);
              await addToCatalogSyncQueue({ type: 'item', localId: newItem.id }, tenantSlug);
            }
          }
        }, DEBOUNCE_MS);
      }
    }

    return result;
  };

/**
 * Process pending catalog sync queue (retry failed syncs)
 */
export const processPendingCatalogSyncQueue = async (
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = state.tenant?.tenant?.slug;

    if (!tenantSlug) {
      console.warn('[CatalogSync] No tenant slug, skipping pending queue processing');
      return;
    }

    const queue = await loadPendingCatalogSyncQueue(tenantSlug);
    if (queue.length === 0) return;

    console.log(`[CatalogSync] Processing ${queue.length} pending catalog syncs`);

    const accessToken = state.auth?.accessToken;
    const options = { tenantId: tenantSlug, accessToken: accessToken ?? undefined };

    // Process categories first (items depend on them)
    for (const entry of queue.filter(e => e.type === 'category')) {
      const category = state.catalog.categories.find(c => c.id === entry.localId);
      if (!category) {
        await removeFromCatalogSyncQueue(entry.localId, tenantSlug);
        continue;
      }
      const result = await syncCategoryToBackend(category, options);
      if (result.success) {
        await removeFromCatalogSyncQueue(entry.localId, tenantSlug);
        console.log(`[CatalogSync] Retried category synced: ${category.name}`);
      }
    }

    // Then process items
    for (const entry of queue.filter(e => e.type === 'item')) {
      const item = state.catalog.items.find(i => i.id === entry.localId);
      if (!item) {
        await removeFromCatalogSyncQueue(entry.localId, tenantSlug);
        continue;
      }
      const categoryBackendId = await resolveCategoryBackendId(item.categoryId, options);
      if (!categoryBackendId) continue; // Category not synced yet, skip for now
      const result = await syncItemToBackend(item, categoryBackendId, options);
      if (result.success) {
        await removeFromCatalogSyncQueue(entry.localId, tenantSlug);
        console.log(`[CatalogSync] Retried item synced: ${item.name}`);
      }
    }
  } catch (error) {
    console.error('[CatalogSync] Failed to process pending queue:', error);
  }
};
