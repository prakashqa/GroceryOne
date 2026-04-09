/**
 * Tenant Slice (shared)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Tenant, TenantConfig, TenantBranding, SupportedLanguage } from '@groceryone/shared';

interface TenantState {
  tenant: Tenant | null;
  config: TenantConfig | null;
  branding: TenantBranding | null;
  currentLanguage: SupportedLanguage;
  isLoading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  tenant: null,
  config: null,
  branding: null,
  currentLanguage: 'en',
  isLoading: false,
  error: null,
};

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (state, action: PayloadAction<Tenant>) => {
      state.tenant = action.payload;
      state.branding = action.payload.branding;
      state.currentLanguage = action.payload.defaultLanguage;
      state.error = null;
    },
    setTenantConfig: (state, action: PayloadAction<TenantConfig>) => {
      state.config = action.payload;
    },
    setBranding: (state, action: PayloadAction<TenantBranding>) => {
      state.branding = action.payload;
    },
    setLanguage: (state, action: PayloadAction<SupportedLanguage>) => {
      state.currentLanguage = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTenant: (state) => {
      state.tenant = null;
      state.config = null;
      state.branding = null;
      state.error = null;
    },
  },
});

export const {
  setTenant,
  setTenantConfig,
  setBranding,
  setLanguage,
  setLoading,
  setError,
  clearTenant,
} = tenantSlice.actions;

export const selectTenant = (state: { tenant: TenantState }) => state.tenant.tenant;
export const selectTenantConfig = (state: { tenant: TenantState }) => state.tenant.config;
export const selectBranding = (state: { tenant: TenantState }) => state.tenant.branding;
export const selectCurrentLanguage = (state: { tenant: TenantState }) => state.tenant.currentLanguage;
export const selectTenantLoading = (state: { tenant: TenantState }) => state.tenant.isLoading;
export const selectTenantError = (state: { tenant: TenantState }) => state.tenant.error;
