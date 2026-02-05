/**
 * Tenant Middleware
 * Ensures tenant context is available for API calls
 */

import { Middleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';

export const tenantMiddleware: Middleware<object, RootState> =
  (storeAPI) => (next) => (action) => {
    // Log tenant-related actions in development
    if (__DEV__ && typeof action === 'object' && action !== null && 'type' in action) {
      const actionType = (action as { type: string }).type;
      if (actionType.startsWith('tenant/')) {
        console.log('[TenantMiddleware] Action:', actionType);
      }
    }

    // Handle rejected API calls due to tenant issues
    if (isRejectedWithValue(action)) {
      const payload = action.payload as { status?: number; data?: { error?: { code?: string } } };
      if (
        payload?.status === 404 &&
        payload?.data?.error?.code === 'TENANT_NOT_FOUND'
      ) {
        // Dispatch tenant error action
        storeAPI.dispatch({
          type: 'tenant/setError',
          payload: 'Tenant not found',
        });
      }
    }

    return next(action);
  };
