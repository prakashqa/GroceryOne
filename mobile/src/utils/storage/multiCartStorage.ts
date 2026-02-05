/**
 * Multi-Cart Storage Utility
 * Handles AsyncStorage operations for persisting multi-cart state
 * All storage is tenant-scoped to ensure data isolation between tenants
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MultiCartState } from '../../domain/types/picking';

// Legacy storage key constants (used for one-time migration only)
/** @deprecated Use getTenantCartKey(tenantId) for tenant-scoped storage */
export const MULTI_CART_STORAGE_KEY = '@groceryone/multi_cart';
/** @deprecated Use getTenantSyncQueueKey(tenantId) for tenant-scoped storage */
export const PENDING_SYNC_QUEUE_KEY = '@groceryone/pending_cart_sync';

/**
 * Get tenant-scoped cart storage key
 */
export const getTenantCartKey = (tenantId: string): string =>
  `@groceryone/multi_cart/${tenantId}`;

/**
 * Get tenant-scoped sync queue storage key
 */
export const getTenantSyncQueueKey = (tenantId: string): string =>
  `@groceryone/pending_cart_sync/${tenantId}`;

/**
 * Persisted state shape (subset of MultiCartState)
 */
export interface PersistedMultiCartState {
  carts: MultiCartState['carts'];
  activeCartId: MultiCartState['activeCartId'];
  lastSyncedAt: string;
}

/**
 * Save multi-cart state to AsyncStorage (tenant-scoped)
 */
export const saveMultiCartState = async (
  state: MultiCartState,
  tenantId: string
): Promise<void> => {
  try {
    const persistedState: PersistedMultiCartState = {
      carts: state.carts,
      activeCartId: state.activeCartId,
      lastSyncedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      getTenantCartKey(tenantId),
      JSON.stringify(persistedState)
    );
  } catch (error) {
    console.error('Failed to save multi-cart state:', error);
    throw error;
  }
};

/**
 * Load multi-cart state from AsyncStorage (tenant-scoped)
 */
export const loadMultiCartState = async (
  tenantId: string
): Promise<Partial<MultiCartState> | null> => {
  try {
    const data = await AsyncStorage.getItem(getTenantCartKey(tenantId));
    if (!data) {
      return null;
    }
    const parsed = JSON.parse(data) as PersistedMultiCartState;
    return {
      carts: parsed.carts,
      activeCartId: parsed.activeCartId,
      lastSyncedAt: parsed.lastSyncedAt,
    };
  } catch (error) {
    console.error('Failed to load multi-cart state:', error);
    return null;
  }
};

/**
 * Clear multi-cart state from AsyncStorage (tenant-scoped)
 */
export const clearMultiCartState = async (tenantId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getTenantCartKey(tenantId));
  } catch (error) {
    console.error('Failed to clear multi-cart state:', error);
    throw error;
  }
};

// ============================================
// Pending Sync Queue for Offline Support
// ============================================

/**
 * Pending cart sync operation
 */
export interface PendingCartSync {
  localId: string;
  name: string;
  status: string;
  createdAt: string;
  retryCount: number;
  lastAttempt: string;
}

/**
 * Save pending sync queue to AsyncStorage (tenant-scoped)
 */
export const savePendingSyncQueue = async (
  queue: PendingCartSync[],
  tenantId: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      getTenantSyncQueueKey(tenantId),
      JSON.stringify(queue)
    );
  } catch (error) {
    console.error('Failed to save pending sync queue:', error);
    throw error;
  }
};

/**
 * Load pending sync queue from AsyncStorage (tenant-scoped)
 */
export const loadPendingSyncQueue = async (
  tenantId: string
): Promise<PendingCartSync[]> => {
  try {
    const data = await AsyncStorage.getItem(getTenantSyncQueueKey(tenantId));
    if (!data) {
      return [];
    }
    return JSON.parse(data) as PendingCartSync[];
  } catch (error) {
    console.error('Failed to load pending sync queue:', error);
    return [];
  }
};

/**
 * Add a cart to the pending sync queue (tenant-scoped)
 */
export const addToPendingSyncQueue = async (
  cart: { id: string; name: string; status: string; createdAt: string },
  tenantId: string
): Promise<void> => {
  try {
    const queue = await loadPendingSyncQueue(tenantId);

    // Check if cart is already in queue
    const existingIndex = queue.findIndex((item) => item.localId === cart.id);
    if (existingIndex >= 0) {
      // Update retry count and last attempt
      queue[existingIndex].retryCount += 1;
      queue[existingIndex].lastAttempt = new Date().toISOString();
    } else {
      // Add new item to queue
      queue.push({
        localId: cart.id,
        name: cart.name,
        status: cart.status,
        createdAt: cart.createdAt,
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
      });
    }

    await savePendingSyncQueue(queue, tenantId);
  } catch (error) {
    console.error('Failed to add cart to pending sync queue:', error);
  }
};

/**
 * Remove a cart from the pending sync queue (tenant-scoped)
 */
export const removeFromPendingSyncQueue = async (
  localId: string,
  tenantId: string
): Promise<void> => {
  try {
    const queue = await loadPendingSyncQueue(tenantId);
    const filteredQueue = queue.filter((item) => item.localId !== localId);
    await savePendingSyncQueue(filteredQueue, tenantId);
  } catch (error) {
    console.error('Failed to remove cart from pending sync queue:', error);
  }
};

/**
 * Clear the entire pending sync queue (tenant-scoped)
 */
export const clearPendingSyncQueue = async (tenantId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getTenantSyncQueueKey(tenantId));
  } catch (error) {
    console.error('Failed to clear pending sync queue:', error);
    throw error;
  }
};
