/**
 * RTK Query Base API
 * Configures the base API with tenant header injection and auth handling
 */

import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../store/rootReducer';
import { logout, setTokens } from '../../store/slices/authSlice';
import { setExpired } from '../../store/slices/subscriptionSlice';
import { API_CONFIG } from '../../core/config/api.config';
import type { AuthTokens } from '@groceryone/shared';

// Storage keys
const TENANT_ID_KEY = '@tenant_id';

// Routes that the backend skips tenant validation for (mirrors backend tenant.middleware.ts skipRoutes)
const TENANT_SKIP_ROUTES = [
  '/health',
  '/docs',
  '/admin',
  '/seed',
  '/auth/',
];

/**
 * Check if a route requires tenant context.
 * Returns false for routes the backend skips tenant validation on.
 */
export function isTenantRequired(url: string): boolean {
  return !TENANT_SKIP_ROUTES.some((route) => url.startsWith(route));
}

// Base query with tenant and auth headers
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    const state = getState() as RootState;

    // Add tenant header
    const tenantId = state.tenant.tenant?.slug;
    if (tenantId) {
      headers.set('X-Tenant-ID', tenantId);
    } else {
      // Try to get from storage if not in state
      try {
        const storedTenantId = await AsyncStorage.getItem(TENANT_ID_KEY);
        if (storedTenantId) {
          headers.set('X-Tenant-ID', storedTenantId);
        }
      } catch (error) {
        console.error('Failed to get tenant ID from storage:', error);
      }
    }

    // Add auth header
    const token = state.auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add language header
    const language = state.tenant.currentLanguage || 'en';
    headers.set('Accept-Language', language);

    // Add API version header
    headers.set('X-API-Version', API_CONFIG.VERSION);

    return headers;
  },
  timeout: API_CONFIG.TIMEOUT,
  // Transform response to unwrap backend's {success: true, data: T} format
  responseHandler: async (response) => {
    const json = await response.json();
    // If response is wrapped in {success, data} format, unwrap it
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data;
    }
    return json;
  },
});

// Base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Tenant guard: short-circuit requests that require tenant when none is available
  const url = typeof args === 'string' ? args : args.url;
  if (isTenantRequired(url)) {
    const state = api.getState() as RootState;
    const tenantSlug = state.tenant.tenant?.slug;
    if (!tenantSlug) {
      // Check AsyncStorage fallback before giving up
      const storedTenantId = await AsyncStorage.getItem(TENANT_ID_KEY).catch(() => null);
      if (!storedTenantId) {
        return {
          error: {
            status: 400,
            data: {
              success: false,
              error: {
                code: 'TENANT_NOT_FOUND',
                message: 'Tenant context not available. Please select a store.',
              },
            },
          } as FetchBaseQueryError,
        };
      }
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  // If we get a 402, subscription has expired
  if (result.error && result.error.status === 402) {
    api.dispatch(setExpired());
    return result;
  }

  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // Store the new tokens
        const tokens = refreshResult.data as AuthTokens;
        api.dispatch(setTokens(tokens));

        // Retry the original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout user
        api.dispatch(logout());
      }
    } else {
      // No refresh token, logout user
      api.dispatch(logout());
    }
  }

  return result;
};

// Create the base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Product',
    'Category',
    'Cart',
    'Order',
    'Address',
    'Review',
    'Wishlist',
    'Tenant',
    'Inventory',
    'Subscription',
  ],
  endpoints: () => ({}),
});

// Note: baseApi is already exported above
// Hooks will be exported when endpoints are injected
