/**
 * Tenant Provider
 * Provides multi-tenant context and branding throughout the app
 * Handles data isolation by clearing tenant-specific data on tenant switch
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../core/hooks/useAppDispatch';
import { setTenant, selectTenant, selectBranding } from '../store/slices/tenantSlice';
import { clearAllTenantData } from '../utils/storage/tenantDataCleaner';
import { PinSecureStorage } from '../features/pinAuth/services/PinSecureStorage';
import type { Tenant, TenantBranding } from '@groceryone/shared';

// Storage key for tenant
const TENANT_ID_KEY = '@tenant_id';

// Default branding
const defaultBranding: TenantBranding = {
  primaryColor: '#4CAF50',
  secondaryColor: '#2196F3',
  fontFamily: 'Roboto',
};

interface TenantContextValue {
  tenant: Tenant | null;
  branding: TenantBranding;
  isLoading: boolean;
  error: string | null;
  setCurrentTenant: (tenantSlug: string) => Promise<void>;
  clearTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  initialTenantSlug?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-expect-error TS6133: kept for future use
export function TenantProvider({ children, _initialTenantSlug }: TenantProviderProps) {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(selectTenant);
  const branding = useAppSelector(selectBranding);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenant on mount
  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use ONLY stored tenant ID — no hardcoded fallback.
      // Tenant will be set by PIN auth (handleBackendVerifySuccess) for new users.
      const storedTenantId = await AsyncStorage.getItem(TENANT_ID_KEY);
      const tenantSlug = storedTenantId;

      if (tenantSlug) {
        await fetchTenant(tenantSlug);
      }
    } catch (err) {
      console.error('Failed to load tenant:', err);
      setError('Failed to load store configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenant = async (tenantSlug: string) => {
    // Set minimal tenant context. Full tenant data (including real id)
    // will come from PIN authentication via handleBackendVerifySuccess().
    // Use persisted friendly name if available (instead of slug)
    let tenantName = tenantSlug;
    try {
      const persistedName = await PinSecureStorage.getTenantName();
      if (persistedName) {
        tenantName = persistedName;
      }
    } catch {
      // Non-fatal — fall back to slug
    }

    const mockTenant: Tenant = {
      id: '',
      name: tenantName,
      slug: tenantSlug,
      status: 'active',
      subscriptionPlan: 'premium',
      branding: defaultBranding,
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'te'],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(setTenant(mockTenant));
    await AsyncStorage.setItem(TENANT_ID_KEY, tenantSlug);
  };

  const setCurrentTenant = async (tenantSlug: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear outgoing tenant's cached data before switching
      const currentSlug = tenant?.slug;
      if (currentSlug && currentSlug !== tenantSlug) {
        await clearAllTenantData(dispatch, currentSlug);
      }

      await fetchTenant(tenantSlug);
    } catch (err) {
      console.error('Failed to set tenant:', err);
      setError('Failed to switch store');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearTenantData = async () => {
    try {
      // Clear tenant-specific data before clearing tenant identity
      await clearAllTenantData(dispatch, tenant?.slug);
      await AsyncStorage.removeItem(TENANT_ID_KEY);
      dispatch({ type: 'tenant/clearTenant' });
    } catch (err) {
      console.error('Failed to clear tenant:', err);
    }
  };

  const value: TenantContextValue = {
    tenant,
    branding: branding || defaultBranding,
    isLoading,
    error,
    setCurrentTenant,
    clearTenant: clearTenantData,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook to access current branding
 */
export function useBranding(): TenantBranding {
  const { branding } = useTenant();
  return branding;
}

export default TenantProvider;
