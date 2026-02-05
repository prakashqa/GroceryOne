/**
 * TenantProvider Tests
 * Tests for tenant resolution and data isolation
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { tenantSlice } from '../../store/slices/tenantSlice';
import { TenantProvider, useTenant } from '../TenantProvider';

// Create a test store
const createTestStore = () =>
  configureStore({
    reducer: {
      tenant: tenantSlice.reducer,
    },
  });

// Wrapper with Provider and TenantProvider (no initialTenantSlug)
const createWrapper = (initialTenantSlug?: string) => {
  const store = createTestStore();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <TenantProvider initialTenantSlug={initialTenantSlug}>
        {children}
      </TenantProvider>
    </Provider>
  );
  return { Wrapper, store };
};

describe('TenantProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  describe('tenant resolution without hardcoded fallback', () => {
    it('should NOT set a tenant when no stored tenant ID exists and no initialTenantSlug', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { Wrapper, store } = createWrapper(); // no initialTenantSlug

      renderHook(() => useTenant(), { wrapper: Wrapper });

      // Wait for async loadTenant to complete
      await waitFor(() => {
        const state = store.getState();
        // Tenant should remain null since no stored ID and no fallback
        expect(state.tenant.tenant).toBeNull();
      });
    });

    it('should load tenant from AsyncStorage when a stored tenant ID exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('freshmart');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { Wrapper, store } = createWrapper();

      renderHook(() => useTenant(), { wrapper: Wrapper });

      await waitFor(() => {
        const state = store.getState();
        expect(state.tenant.tenant).not.toBeNull();
        expect(state.tenant.tenant?.slug).toBe('freshmart');
      });
    });

    it('should use only stored value and not fallback to initialTenantSlug when storage is empty', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      // Even when initialTenantSlug is provided, it should be ignored
      // after our fix removes the fallback logic
      const { Wrapper, store } = createWrapper();

      renderHook(() => useTenant(), { wrapper: Wrapper });

      await waitFor(() => {
        const state = store.getState();
        // Should NOT have set tenant to any fallback value
        expect(state.tenant.tenant).toBeNull();
      });
    });
  });

  describe('tenant data isolation on switch', () => {
    it('should clear old tenant data when switching tenants', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('freshmart');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { Wrapper, store } = createWrapper();

      const { result } = renderHook(() => useTenant(), { wrapper: Wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(store.getState().tenant.tenant?.slug).toBe('freshmart');
      });

      // Switch to different tenant
      await act(async () => {
        await result.current.setCurrentTenant('quickbasket');
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.tenant.tenant?.slug).toBe('quickbasket');
      });
    });
  });
});
