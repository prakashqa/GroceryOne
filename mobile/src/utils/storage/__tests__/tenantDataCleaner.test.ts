/**
 * Tenant Data Cleaner Tests
 * TDD tests for centralized tenant data clearing during transitions
 */

import { clearAllTenantData } from '../tenantDataCleaner';
import { resetMultiCart } from '../../../store/slices/multiCartSlice';
import { resetCatalog } from '../../../store/slices/catalogSlice';
import { baseApi } from '../../../data/api/baseApi';
import * as multiCartStorage from '../multiCartStorage';
import * as catalogStorage from '../catalogStorage';

// Mock storage modules
jest.mock('../multiCartStorage', () => ({
  clearMultiCartState: jest.fn(() => Promise.resolve()),
  clearPendingSyncQueue: jest.fn(() => Promise.resolve()),
}));

jest.mock('../catalogStorage', () => ({
  clearCatalogState: jest.fn(() => Promise.resolve()),
}));

// Mock Redux action creators
jest.mock('../../../store/slices/multiCartSlice', () => ({
  resetMultiCart: jest.fn(() => ({ type: 'multiCart/resetMultiCart' })),
}));

jest.mock('../../../store/slices/catalogSlice', () => ({
  resetCatalog: jest.fn(() => ({ type: 'catalog/resetCatalog' })),
}));

jest.mock('../../../data/api/baseApi', () => ({
  baseApi: {
    util: {
      resetApiState: jest.fn(() => ({ type: 'api/resetApiState' })),
    },
  },
}));

describe('clearAllTenantData', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should dispatch resetMultiCart', async () => {
    await clearAllTenantData(mockDispatch, 'test-tenant');

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'multiCart/resetMultiCart' })
    );
  });

  it('should dispatch resetCatalog', async () => {
    await clearAllTenantData(mockDispatch, 'test-tenant');

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'catalog/resetCatalog' })
    );
  });

  it('should dispatch resetApiState', async () => {
    await clearAllTenantData(mockDispatch, 'test-tenant');

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'api/resetApiState' })
    );
  });

  it('should clear AsyncStorage for the specified tenant', async () => {
    await clearAllTenantData(mockDispatch, 'test-tenant');

    expect(multiCartStorage.clearMultiCartState).toHaveBeenCalledWith('test-tenant');
    expect(multiCartStorage.clearPendingSyncQueue).toHaveBeenCalledWith('test-tenant');
    expect(catalogStorage.clearCatalogState).toHaveBeenCalledWith('test-tenant');
  });

  it('should skip AsyncStorage clearing when no tenantSlug provided', async () => {
    await clearAllTenantData(mockDispatch);

    // Redux state should still be cleared
    expect(mockDispatch).toHaveBeenCalledTimes(3);

    // But AsyncStorage should not be touched
    expect(multiCartStorage.clearMultiCartState).not.toHaveBeenCalled();
    expect(multiCartStorage.clearPendingSyncQueue).not.toHaveBeenCalled();
    expect(catalogStorage.clearCatalogState).not.toHaveBeenCalled();
  });

  it('should skip AsyncStorage clearing when tenantSlug is undefined', async () => {
    await clearAllTenantData(mockDispatch, undefined);

    expect(multiCartStorage.clearMultiCartState).not.toHaveBeenCalled();
    expect(multiCartStorage.clearPendingSyncQueue).not.toHaveBeenCalled();
    expect(catalogStorage.clearCatalogState).not.toHaveBeenCalled();
  });

  it('should clear all AsyncStorage items in parallel', async () => {
    await clearAllTenantData(mockDispatch, 'tenant-a');

    // All three should have been called (they run via Promise.all)
    expect(multiCartStorage.clearMultiCartState).toHaveBeenCalledTimes(1);
    expect(multiCartStorage.clearPendingSyncQueue).toHaveBeenCalledTimes(1);
    expect(catalogStorage.clearCatalogState).toHaveBeenCalledTimes(1);
  });
});
