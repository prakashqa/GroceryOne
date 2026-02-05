/**
 * Error Middleware Tests
 * Verifies error handling and logging behavior for API errors
 */

import { configureStore, createSlice, createAction } from '@reduxjs/toolkit';
import { errorMiddleware } from '../errorMiddleware';

// Mock showToast and logout actions
jest.mock('../../slices/uiSlice', () => ({
  showToast: jest.fn((payload) => ({
    type: 'ui/showToast',
    payload,
  })),
}));

jest.mock('../../slices/authSlice', () => ({
  logout: jest.fn(() => ({ type: 'auth/logout' })),
}));

// Helper to create a rejected-with-value action matching RTK Query shape
function createRejectedAction(payload: Record<string, unknown>) {
  // RTK Query rejected actions have this structure
  return {
    type: 'api/executeQuery/rejected',
    payload,
    meta: {
      requestStatus: 'rejected',
      rejectedWithValue: true,
      arg: {},
      requestId: 'test-id',
      aborted: false,
      condition: false,
    },
    error: { message: 'Rejected' },
  };
}

describe('errorMiddleware', () => {
  let store: ReturnType<typeof configureStore>;
  let dispatched: unknown[];

  beforeEach(() => {
    dispatched = [];

    // Create a minimal store with the error middleware
    const dummySlice = createSlice({
      name: 'dummy',
      initialState: {},
      reducers: {},
    });

    store = configureStore({
      reducer: {
        dummy: dummySlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }).concat(errorMiddleware),
    });

    // Track dispatched actions
    const originalDispatch = store.dispatch;
    store.dispatch = ((action: unknown) => {
      dispatched.push(action);
      return originalDispatch(action as Parameters<typeof originalDispatch>[0]);
    }) as typeof originalDispatch;
  });

  describe('FETCH_ERROR (network errors)', () => {
    it('should log error details in development when network error occurs', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate FETCH_ERROR - no status, just error string
      const action = createRejectedAction({
        status: 'FETCH_ERROR',
        error: 'TypeError: Network request failed',
      });

      store.dispatch(action);

      // Verify error is logged in __DEV__ mode
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorMiddleware] API Error:',
        expect.objectContaining({
          errorMessage: expect.any(String),
          action: expect.any(Object),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should show network error toast when FETCH_ERROR occurs', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const { showToast } = require('../../slices/uiSlice');

      const action = createRejectedAction({
        status: 'FETCH_ERROR',
        error: 'TypeError: Network request failed',
      });

      store.dispatch(action);

      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Network error. Please check your connection.',
      });

      jest.restoreAllMocks();
    });
  });

  describe('HTTP status errors', () => {
    it('should dispatch logout and toast for 401 errors', () => {
      const { logout } = require('../../slices/authSlice');

      const action = createRejectedAction({
        status: 401,
        data: { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      });

      store.dispatch(action);

      expect(logout).toHaveBeenCalled();
    });

    it('should show permission toast for 403 errors', () => {
      const { showToast } = require('../../slices/uiSlice');

      const action = createRejectedAction({
        status: 403,
        data: { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      });

      store.dispatch(action);

      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'You do not have permission to perform this action.',
      });
    });

    it('should show server error toast for 500 errors', () => {
      const { showToast } = require('../../slices/uiSlice');

      const action = createRejectedAction({
        status: 500,
        data: { error: { message: 'Internal Server Error' } },
      });

      store.dispatch(action);

      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Server error. Please try again later.',
      });
    });
  });

  describe('AbortError suppression', () => {
    it('should NOT log console.error for aborted requests', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const action = createRejectedAction({
        status: 'FETCH_ERROR',
        error: 'AbortError: Aborted',
      });

      store.dispatch(action);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should NOT show toast for aborted requests', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const { showToast } = require('../../slices/uiSlice');
      showToast.mockClear();

      const action = createRejectedAction({
        status: 'FETCH_ERROR',
        error: 'AbortError: Aborted',
      });

      store.dispatch(action);

      expect(showToast).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  describe('TENANT_NOT_FOUND suppression', () => {
    it('should NOT log console.error for TENANT_NOT_FOUND 404 errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const action = createRejectedAction({
        status: 404,
        data: { error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
      });

      store.dispatch(action);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should NOT log console.error for TENANT_NOT_FOUND 400 errors (client guard)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const action = createRejectedAction({
        status: 400,
        data: { error: { code: 'TENANT_NOT_FOUND', message: 'Tenant context not available' } },
      });

      store.dispatch(action);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should NOT show toast for TENANT_NOT_FOUND errors', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const { showToast } = require('../../slices/uiSlice');
      showToast.mockClear();

      const action = createRejectedAction({
        status: 404,
        data: { error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
      });

      store.dispatch(action);

      expect(showToast).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });
});
