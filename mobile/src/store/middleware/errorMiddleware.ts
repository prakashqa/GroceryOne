/**
 * Error Middleware
 * Global error handling for Redux actions
 */

import { Middleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import { showToast } from '../slices/uiSlice';
import { logout } from '../slices/authSlice';

export const errorMiddleware: Middleware<object, RootState> =
  (storeAPI) => (next) => (action) => {
    // Handle rejected API calls
    if (isRejectedWithValue(action)) {
      const payload = action.payload as {
        status?: number | string;
        error?: string;
        data?: { error?: { code?: string; message?: string } };
      };
      const errorCode = payload?.data?.error?.code;
      const errorMessage = payload?.data?.error?.message || 'An error occurred';
      const status = payload?.status;

      // Silently pass through TENANT_NOT_FOUND errors (no log, no toast)
      // These occur when tenant context is unavailable (e.g., before login)
      if (errorCode === 'TENANT_NOT_FOUND') {
        return next(action);
      }

      // Silently pass through aborted requests (normal RTK Query behavior when component unmounts)
      if (
        status === 'FETCH_ERROR' &&
        payload?.error &&
        typeof payload.error === 'string' &&
        payload.error.includes('AbortError')
      ) {
        return next(action);
      }

      // Log errors in development (only real errors reach here)
      if (__DEV__) {
        console.error('[ErrorMiddleware] API Error:', {
          status,
          errorCode,
          errorMessage,
          action,
        });
      }

      // Handle network/fetch errors (RTK Query sets status to 'FETCH_ERROR' string)
      if (status === 'FETCH_ERROR' || !status) {
        storeAPI.dispatch(
          showToast({
            type: 'error',
            message: 'Network error. Please check your connection.',
          })
        );
        return next(action);
      }

      // Handle authentication errors
      if (status === 401 || errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
        storeAPI.dispatch(logout());
        storeAPI.dispatch(
          showToast({
            type: 'error',
            message: 'Session expired. Please login again.',
          })
        );
        return next(action);
      }

      // Handle forbidden errors
      if (status === 403 || errorCode === 'FORBIDDEN') {
        storeAPI.dispatch(
          showToast({
            type: 'error',
            message: 'You do not have permission to perform this action.',
          })
        );
        return next(action);
      }

      // Handle not found errors
      if (status === 404) {
        storeAPI.dispatch(
          showToast({
            type: 'error',
            message: errorMessage,
          })
        );
        return next(action);
      }

      // Handle server errors
      if (status && status >= 500) {
        storeAPI.dispatch(
          showToast({
            type: 'error',
            message: 'Server error. Please try again later.',
          })
        );
        return next(action);
      }
    }

    return next(action);
  };
