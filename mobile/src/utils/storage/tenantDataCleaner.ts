/**
 * Tenant Data Cleaner
 * Centralized utility to clear all tenant-specific cached data
 * from Redux state and AsyncStorage during tenant transitions
 */

import type { AppDispatch } from '../../store/store';
import { resetMultiCart } from '../../store/slices/multiCartSlice';
import { resetCatalog } from '../../store/slices/catalogSlice';
import { clearMultiCartState, clearPendingSyncQueue } from './multiCartStorage';
import { clearCatalogState } from './catalogStorage';
import { baseApi } from '../../data/api/baseApi';

/**
 * Clear all tenant-specific cached data from Redux and AsyncStorage.
 * Call during: tenant switch, PIN reset, logout.
 *
 * @param dispatch - Redux dispatch function
 * @param tenantSlug - The tenant slug whose data should be cleared from AsyncStorage.
 *                     If undefined, only Redux state is cleared (AsyncStorage is skipped).
 */
export const clearAllTenantData = async (
  dispatch: AppDispatch,
  tenantSlug?: string
): Promise<void> => {
  // Clear Redux state
  dispatch(resetMultiCart());
  dispatch(resetCatalog());
  dispatch(baseApi.util.resetApiState());

  // Clear AsyncStorage for the specific tenant
  if (tenantSlug) {
    await Promise.all([
      clearMultiCartState(tenantSlug),
      clearPendingSyncQueue(tenantSlug),
      clearCatalogState(tenantSlug),
    ]);
  }
};
