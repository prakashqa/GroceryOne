/**
 * RTK Query Base API (shared)
 * Platform-agnostic version using StorageAdapter instead of AsyncStorage
 */

import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { getStorageAdapter } from '../adapters/storage';
import { logout, setTokens } from '../slices/authSlice';
import { setExpired } from '../slices/subscriptionSlice';
import type { AuthTokens } from '@groceryone/shared';

const TENANT_ID_KEY = '@tenant_id';

const TENANT_SKIP_ROUTES = ['/health', '/docs', '/admin', '/seed', '/auth/'];

export function isTenantRequired(url: string): boolean {
  return !TENANT_SKIP_ROUTES.some((route) => url.startsWith(route));
}

/**
 * API configuration that must be set by the platform before use.
 * Mobile sets this to its API_CONFIG, web sets it to env-based config.
 */
let _apiConfig = {
  baseUrl: '',
  timeout: 30000,
  version: '1.0',
};

export function setApiConfig(config: { baseUrl: string; timeout?: number; version?: string }): void {
  _apiConfig = { ..._apiConfig, ...config };
}

export function getApiConfig() {
  return _apiConfig;
}

// Base query with tenant and auth headers
const baseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: async (headers, { getState }) => {
    const state = getState() as any;

    // Add tenant header
    const tenantId = state.tenant?.tenant?.slug;
    if (tenantId) {
      headers.set('X-Tenant-ID', tenantId);
    } else {
      try {
        const storage = getStorageAdapter();
        const storedTenantId = await storage.getItem(TENANT_ID_KEY);
        if (storedTenantId) headers.set('X-Tenant-ID', storedTenantId);
      } catch {
        // Storage not available
      }
    }

    // Add auth header
    const token = state.auth?.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);

    // Add language header
    const language = state.tenant?.currentLanguage || 'en';
    headers.set('Accept-Language', language);

    headers.set('X-API-Version', _apiConfig.version);
    return headers;
  },
  timeout: 30000,
  responseHandler: async (response) => {
    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data;
    }
    return json;
  },
});

// Wrap baseQuery to inject dynamic baseUrl
const dynamicBaseQuery: typeof baseQuery = async (args, api, extraOptions) => {
  const config = getApiConfig();
  const adjustedArgs = typeof args === 'string'
    ? `${config.baseUrl}${args}`
    : { ...args, url: `${config.baseUrl}${args.url}` };
  return baseQuery(adjustedArgs, api, extraOptions);
};

// Base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const url = typeof args === 'string' ? args : args.url;
  if (isTenantRequired(url)) {
    const state = api.getState() as any;
    const tenantSlug = state.tenant?.tenant?.slug;
    if (!tenantSlug) {
      try {
        const storage = getStorageAdapter();
        const storedTenantId = await storage.getItem(TENANT_ID_KEY).catch(() => null);
        if (!storedTenantId) {
          return {
            error: {
              status: 400,
              data: { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant context not available. Please select a store.' } },
            } as FetchBaseQueryError,
          };
        }
      } catch {
        // Storage not available, proceed anyway
      }
    }
  }

  let result = await dynamicBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 402) {
    api.dispatch(setExpired());
    return result;
  }

  if (result.error && result.error.status === 401) {
    const state = api.getState() as any;
    const refreshToken = state.auth?.refreshToken;
    if (refreshToken) {
      const refreshResult = await dynamicBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api, extraOptions
      );
      if (refreshResult.data) {
        const tokens = refreshResult.data as AuthTokens;
        api.dispatch(setTokens(tokens));
        result = await dynamicBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Product', 'Category', 'Cart', 'Order', 'Address', 'Review', 'Wishlist', 'Tenant', 'Inventory', 'Subscription'],
  endpoints: () => ({}),
});
