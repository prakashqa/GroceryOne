/**
 * usePinAuth Hook Tests
 * TDD: Write tests first, then implement
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { usePinAuth } from '../usePinAuth';
import pinReducer from '../../store/pinSlice';
import { authSlice } from '../../../../store/slices/authSlice';
import { tenantSlice } from '../../../../store/slices/tenantSlice';
import { PinSecureStorage } from '../../services/PinSecureStorage';
import { PinHashService } from '../../services/PinHashService';
import { PinAuthApi } from '../../services/PinAuthApi';
import { PIN_CONFIG } from '../../constants';

// Mock api.config to prevent expo-constants transform issue
jest.mock('../../../../core/config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000/api/v1',
    VERSION: 'v1',
  },
  API_ENDPOINTS: {
    AUTH: { LOGIN_PIN: '/auth/pin-login' },
  },
}));

// Mock services
jest.mock('../../services/PinSecureStorage');
jest.mock('../../services/PinHashService');
jest.mock('../../services/PinAuthApi');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock tenant data cleaner
jest.mock('../../../../utils/storage/tenantDataCleaner', () => ({
  clearAllTenantData: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAllTenantData } from '../../../../utils/storage/tenantDataCleaner';

const mockPinSecureStorage = PinSecureStorage as jest.Mocked<typeof PinSecureStorage>;
const mockPinHashService = PinHashService as jest.Mocked<typeof PinHashService>;
const mockPinAuthApi = PinAuthApi as jest.Mocked<typeof PinAuthApi>;

// === Helpers ===
/** Mock a successful backend PIN verification response */
const mockVerifySuccess = (overrides: Record<string, unknown> = {}) => {
  mockPinAuthApi.verifyPin.mockResolvedValue({
    success: true,
    data: {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
      tenantSlug: 'freshmart',
      user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
      ...overrides,
    },
  });
};

/** Mock a failed backend PIN verification */
const mockVerifyFailure = (error = 'Invalid credentials') => {
  mockPinAuthApi.verifyPin.mockResolvedValue({ success: false, error });
};

/** Setup local PIN mocks for fallback verification */
const setupLocalPinMocks = (success = true) => {
  if (success) {
    mockPinSecureStorage.getPinHash.mockResolvedValue({ hash: 'stored-hash', salt: 'stored-salt' });
    mockPinHashService.verifyPin.mockResolvedValue(true);
  } else {
    mockPinSecureStorage.getPinHash.mockResolvedValue(null);
  }
};

/** Setup pin hash/storage mocks for setupPin */
const setupPinCreationMocks = () => {
  mockPinHashService.generateSalt.mockReturnValue('test-salt');
  mockPinHashService.hashPin.mockResolvedValue('test-hash');
  mockPinSecureStorage.storePinHash.mockResolvedValue(undefined);
};

describe('usePinAuth', () => {
  let store: ReturnType<typeof createTestStore>;

  function createTestStore(preloadedState: any = {}) {
    return configureStore({
      reducer: {
        pin: pinReducer,
        auth: authSlice.reducer,
        tenant: tenantSlice.reducer,
      },
      preloadedState: {
        pin: {
          isPinSet: false,
          isPinVerified: false,
          isLocked: false,
          failedAttempts: 0,
          lockoutUntil: null,
          isLoading: false,
          error: null,
          lastVerifiedAt: null,
          ...preloadedState.pin,
        },
        auth: {
          user: { id: 'user123', email: 'admin@freshmart.com' },
          accessToken: null,
          refreshToken: null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          requiresPinSetup: false,
          ...preloadedState.auth,
        },
        tenant: {
          tenant: { slug: 'freshmart' },
          config: null,
          branding: null,
          currentLanguage: 'en',
          isLoading: false,
          error: null,
          ...preloadedState.tenant,
        },
      },
    });
  }

  // Common store presets
  const PIN_SET_STATE = { pin: { isPinSet: true }, auth: { user: { id: 'user123', email: 'admin@freshmart.com' } }, tenant: { tenant: { slug: 'freshmart' } } };

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
  });

  describe('setupPin', () => {
    it('should hash and store PIN', async () => {
      const mockSalt = 'randomsalt123';
      const mockHash = 'hashedpin456';

      mockPinHashService.generateSalt.mockReturnValue(mockSalt);
      mockPinHashService.hashPin.mockResolvedValue(mockHash);
      mockPinSecureStorage.storePinHash.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let success: boolean;
      await act(async () => {
        success = await result.current.setupPin('1234', 'user123');
      });

      expect(success!).toBe(true);
      expect(mockPinHashService.generateSalt).toHaveBeenCalled();
      expect(mockPinHashService.hashPin).toHaveBeenCalledWith('1234', mockSalt);
      expect(mockPinSecureStorage.storePinHash).toHaveBeenCalledWith(
        mockHash,
        mockSalt,
        'user123'
      );
    });

    it('should update Redux state after setup', async () => {
      setupPinCreationMocks();
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.setupPin('1234', 'user123');
      });

      expect(result.current.pinState.isPinSet).toBe(true);
    });

    it('should return false on storage error', async () => {
      mockPinHashService.generateSalt.mockReturnValue('salt');
      mockPinHashService.hashPin.mockResolvedValue('hash');
      mockPinSecureStorage.storePinHash.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let success: boolean;
      await act(async () => {
        success = await result.current.setupPin('1234', 'user123');
      });

      expect(success!).toBe(false);
      expect(result.current.pinState.error).toBeTruthy();
    });
  });

  describe('verifyPin - API based', () => {
    beforeEach(() => {
      store = createTestStore(PIN_SET_STATE);
    });

    it('should call backend API with correct payload', async () => {
      mockVerifySuccess();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com', pin: '1234', tenantSlug: 'freshmart',
      });
    });

    it('should dispatch success and return tokens on valid PIN', async () => {
      mockVerifySuccess();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(true);
      expect(result.current.pinState.isPinVerified).toBe(true);
      expect(result.current.pinState.failedAttempts).toBe(0);
    });

    it('should dispatch failure action on invalid PIN from API', async () => {
      mockVerifyFailure();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('9999'); });

      expect(verifyResult.success).toBe(false);
      expect(result.current.pinState.isPinVerified).toBe(false);
      expect(result.current.pinState.failedAttempts).toBe(1);
    });

    it('should fall back to local verification on network error', async () => {
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network error'));
      setupLocalPinMocks();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(true);
    });

    it('should return local error when network fails and local PIN not configured', async () => {
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network error'));
      setupLocalPinMocks(false);
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBe('PIN not configured');
    });

    it('should return remaining attempts on failure', async () => {
      mockVerifyFailure();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('wrong'); });

      expect(verifyResult.remainingAttempts).toBe(PIN_CONFIG.MAX_ATTEMPTS - 1);
    });

    it('should trigger lockout after max attempts', async () => {
      store = createTestStore({ ...PIN_SET_STATE, pin: { isPinSet: true, failedAttempts: PIN_CONFIG.MAX_ATTEMPTS - 1 } });
      mockVerifyFailure();
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('wrong'); });

      expect(verifyResult.isLocked).toBe(true);
      expect(result.current.pinState.isLocked).toBe(true);
      expect(result.current.pinState.lockoutUntil).not.toBeNull();
    });

    it('should not call API when already locked', async () => {
      store = createTestStore({
        ...PIN_SET_STATE,
        pin: { isPinSet: true, isLocked: true, lockoutUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
      });
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.isLocked).toBe(true);
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
    });

    it('should fall back to local verification when no credentials available', async () => {
      store = createTestStore({ pin: { isPinSet: true }, auth: { user: null }, tenant: { tenant: { slug: 'freshmart' } } });
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
      mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);
      setupLocalPinMocks(false);
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBe('PIN not configured');
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
    });
  });

  describe('resetPin', () => {
    it('should clear stored PIN', async () => {
      mockPinSecureStorage.clearPin.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(mockPinSecureStorage.clearPin).toHaveBeenCalled();
    });

    it('should reset Redux state', async () => {
      store = createTestStore({
        pin: {
          isPinSet: true,
          isPinVerified: true,
          failedAttempts: 2,
        },
      });

      mockPinSecureStorage.clearPin.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(result.current.pinState.isPinSet).toBe(false);
      expect(result.current.pinState.isPinVerified).toBe(false);
      expect(result.current.pinState.failedAttempts).toBe(0);
    });
  });

  describe('checkPinConfigured', () => {
    it.each([[true], [false]])('should return %s based on storage result', async (expected) => {
      mockPinSecureStorage.isPinConfigured.mockResolvedValue(expected);
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let isConfigured: boolean;
      await act(async () => { isConfigured = await result.current.checkPinConfigured('user123'); });
      expect(isConfigured!).toBe(expected);
    });

    it('should update Redux state based on result', async () => {
      mockPinSecureStorage.isPinConfigured.mockResolvedValue(true);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.checkPinConfigured('user123');
      });

      expect(result.current.pinState.isPinSet).toBe(true);
    });
  });

  describe('checkLockoutStatus', () => {
    it('should unlock when lockout time passed', () => {
      const pastLockout = new Date(Date.now() - 1000).toISOString();
      store = createTestStore({
        pin: {
          isLocked: true,
          lockoutUntil: pastLockout,
          failedAttempts: 5,
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      act(() => {
        result.current.checkLockoutStatus();
      });

      expect(result.current.pinState.isLocked).toBe(false);
      expect(result.current.pinState.failedAttempts).toBe(0);
    });

    it('should remain locked when within lockout period', () => {
      const futureLockout = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      store = createTestStore({
        pin: {
          isLocked: true,
          lockoutUntil: futureLockout,
          failedAttempts: 5,
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      act(() => {
        result.current.checkLockoutStatus();
      });

      expect(result.current.pinState.isLocked).toBe(true);
    });
  });

  describe('clearVerification', () => {
    it('should clear PIN verification status', () => {
      store = createTestStore({
        pin: {
          isPinSet: true,
          isPinVerified: true,
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      act(() => {
        result.current.clearVerification();
      });

      expect(result.current.pinState.isPinVerified).toBe(false);
      expect(result.current.pinState.isPinSet).toBe(true); // Should preserve isPinSet
    });
  });

  describe('cross-tenant credential resolution', () => {
    it('should use SecureStore credentials when Redux state is empty', async () => {
      store = createTestStore({ pin: { isPinSet: true }, auth: { user: null }, tenant: { tenant: null } });
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('admin@freshmart.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('freshmart');
      mockVerifySuccess();

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(true);
      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com', pin: '1234', tenantSlug: 'freshmart',
      });
    });

    it('should prefer Redux state over SecureStore for credentials', async () => {
      store = createTestStore(PIN_SET_STATE);
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('old-user@stale.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('stale-tenant');
      mockVerifySuccess();

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com', pin: '1234', tenantSlug: 'freshmart',
      });
    });

    it('should fall back to local verification when both Redux and SecureStore are empty', async () => {
      store = createTestStore({ pin: { isPinSet: true }, auth: { user: null }, tenant: { tenant: null } });
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
      mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);
      setupLocalPinMocks();

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      expect(verifyResult.success).toBe(true);
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
    });
  });

  describe('handleBackendVerifySuccess - tenant context persistence', () => {
    beforeEach(() => {
      store = createTestStore(PIN_SET_STATE);
      mockVerifySuccess();
    });

    it('should persist tenant context to SecureStore on successful verification', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinSecureStorage.storeTenantContext).toHaveBeenCalledWith('freshmart', 'admin@freshmart.com');
    });

    it('should save tenant slug to AsyncStorage on successful verification', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@tenant_id', 'freshmart');
    });

    it('should update Redux auth state from backend response', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      const state = store.getState();
      expect(state.auth.accessToken).toBe('new-access-token');
      expect(state.auth.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('resetPin - complete cleanup for cross-tenant', () => {
    beforeEach(() => {
      store = createTestStore({
        pin: { isPinSet: true, isPinVerified: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });
      mockPinSecureStorage.clearPin.mockResolvedValue(undefined);
    });

    it('should clear all tenant data via clearAllTenantData', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(clearAllTenantData).toHaveBeenCalledWith(
        expect.any(Function),
        'freshmart'
      );
    });

    it('should remove @tenant_id from AsyncStorage', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@tenant_id');
    });

    it('should clear tenant Redux state', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      const state = store.getState();
      expect(state.tenant.tenant).toBeNull();
    });

    it('should clear auth Redux state (logout)', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.accessToken).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
    });

    it('should clear SecureStore PIN data including tenant context', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(mockPinSecureStorage.clearPin).toHaveBeenCalled();
    });

    it('should reset PIN state in Redux', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPin();
      });

      expect(result.current.pinState.isPinSet).toBe(false);
      expect(result.current.pinState.isPinVerified).toBe(false);
    });
  });

  describe('setupPin - background tenant verification', () => {
    beforeEach(() => {
      store = createTestStore({
        pin: { isPinSet: false },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });
      setupPinCreationMocks();
    });

    it('should attempt backend verification during setup', async () => {
      mockVerifySuccess();

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.setupPin('1234', 'user123');
      });

      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com',
        pin: '1234',
        tenantSlug: 'freshmart',
      });
    });

    it('should persist tenant context on successful backend verification during setup', async () => {
      mockVerifySuccess();

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.setupPin('1234', 'user123');
      });

      expect(mockPinSecureStorage.storeTenantContext).toHaveBeenCalledWith(
        'freshmart',
        'admin@freshmart.com'
      );
    });

    it('should succeed even when backend verification fails during setup', async () => {
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let success: boolean;
      await act(async () => {
        success = await result.current.setupPin('1234', 'user123');
      });

      // Setup should still succeed (backend is best-effort)
      expect(success!).toBe(true);
      expect(result.current.pinState.isPinSet).toBe(true);
      expect(result.current.pinState.isPinVerified).toBe(true);
    });

    it('should not attempt backend verification when no credentials available', async () => {
      store = createTestStore({
        pin: { isPinSet: false },
        auth: { user: null },
        tenant: { tenant: null },
      });

      mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
      mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.setupPin('1234', 'user123');
      });

      // Backend API should not have been called
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
      // But setup should still succeed locally
      expect(result.current.pinState.isPinSet).toBe(true);
    });
  });

  describe('full cross-tenant flow (Tenant A → reset → Tenant B)', () => {
    it('should isolate data between tenant A and tenant B sessions', async () => {
      // --- Phase 1: Tenant A session ---
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user-a', email: 'admin@tenant-a.com' } },
        tenant: { tenant: { slug: 'tenant-a' } },
      });

      mockVerifySuccess({
        accessToken: 'tenant-a-access', refreshToken: 'tenant-a-refresh',
        tenantSlug: 'tenant-a',
        user: { id: 'user-a', email: 'admin@tenant-a.com', role: 'merchant', tenantId: 'tid-a' },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      // Verify with Tenant A PIN
      await act(async () => {
        await result.current.verifyPin('1234');
      });

      expect(mockPinSecureStorage.storeTenantContext).toHaveBeenCalledWith(
        'tenant-a',
        'admin@tenant-a.com'
      );

      // --- Phase 2: Reset PIN ---
      mockPinSecureStorage.clearPin.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.resetPin();
      });

      // Verify complete cleanup happened
      expect(mockPinSecureStorage.clearPin).toHaveBeenCalled();
      expect(clearAllTenantData).toHaveBeenCalledWith(expect.any(Function), 'tenant-a');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@tenant_id');

      // After reset, Redux should be clean
      const stateAfterReset = store.getState();
      expect(stateAfterReset.auth.user).toBeNull();
      expect(stateAfterReset.tenant.tenant).toBeNull();
      expect(stateAfterReset.pin.isPinSet).toBe(false);
    });
  });

  describe('handleBackendVerifySuccess - auth context persistence (Step 3)', () => {
    beforeEach(() => {
      store = createTestStore(PIN_SET_STATE);
      mockVerifySuccess();
    });

    it('should persist auth context to SecureStore on successful backend verification', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinSecureStorage.storeAuthContext).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user123',
          email: 'admin@freshmart.com',
          role: 'merchant',
          tenantId: 'tid',
        }),
        'new-access-token',
        'new-refresh-token'
      );
    });

    it('should not persist auth context when backend response has no user', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'at', refreshToken: 'rt', expiresIn: 3600,
          tenantSlug: 'freshmart', user: undefined as any,
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinSecureStorage.storeAuthContext).not.toHaveBeenCalled();
    });

    it('should also persist tenant name from tenant state during backend verify', async () => {
      store = createTestStore({
        ...PIN_SET_STATE,
        tenant: { tenant: { slug: 'freshmart', name: 'FreshMart Groceries' } },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      expect(mockPinSecureStorage.storeTenantName).toHaveBeenCalledWith('FreshMart Groceries');
    });
  });

  describe('verifyPinLocally - auth context restoration (Step 5)', () => {
    beforeEach(() => {
      // Simulate post-restart: PIN is set, no Redux auth/tenant state, backend unreachable
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: null, accessToken: null, refreshToken: null },
        tenant: { tenant: { slug: 'freshmart' } }, // slug set by RootNavigator
      });

      // Backend call will fail → fall back to local verification
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network timeout'));

      // Local PIN verification succeeds
      setupLocalPinMocks(true);

      // Stored credentials for resolveBackendCredentials (so backend is attempted first)
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('admin@freshmart.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('freshmart');
    });

    it('should restore auth tokens from SecureStore after local PIN verify', async () => {
      mockPinSecureStorage.getAuthContext.mockResolvedValue({
        user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      });
      mockPinSecureStorage.getTenantName.mockResolvedValue('FreshMart Groceries');

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      const state = store.getState();
      expect(state.auth.accessToken).toBe('stored-access-token');
      expect(state.auth.refreshToken).toBe('stored-refresh-token');
    });

    it('should restore user credentials from SecureStore after local PIN verify', async () => {
      mockPinSecureStorage.getAuthContext.mockResolvedValue({
        user: { id: 'user123', email: 'admin@freshmart.com', firstName: 'Admin', lastName: 'User', role: 'merchant', tenantId: 'tid' },
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockPinSecureStorage.getTenantName.mockResolvedValue(null);

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      const state = store.getState();
      expect(state.auth.user).not.toBeNull();
      expect(state.auth.user?.id).toBe('user123');
      expect(state.auth.user?.email).toBe('admin@freshmart.com');
      expect(state.auth.isAuthenticated).toBe(true);
    });

    it('should restore tenant name from SecureStore after local PIN verify', async () => {
      mockPinSecureStorage.getAuthContext.mockResolvedValue({
        user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockPinSecureStorage.getTenantName.mockResolvedValue('FreshMart Groceries');

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      const state = store.getState();
      expect(state.tenant.tenant?.name).toBe('FreshMart Groceries');
    });

    it('should succeed even when no auth context is stored (graceful degradation)', async () => {
      mockPinSecureStorage.getAuthContext.mockResolvedValue(null);
      mockPinSecureStorage.getTenantName.mockResolvedValue(null);

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      let verifyResult: any;
      await act(async () => { verifyResult = await result.current.verifyPin('1234'); });

      // PIN verification should still succeed
      expect(verifyResult.success).toBe(true);
      expect(result.current.pinState.isPinVerified).toBe(true);

      // But auth state should remain empty
      const state = store.getState();
      expect(state.auth.accessToken).toBeNull();
    });

    it('should not restore auth context when local PIN verification fails', async () => {
      // Setup local verification to fail (wrong PIN)
      mockPinHashService.verifyPin.mockResolvedValue(false);

      mockPinSecureStorage.getAuthContext.mockResolvedValue({
        user: { id: 'user123' },
        accessToken: 'at',
        refreshToken: 'rt',
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('9999'); });

      // Auth context should NOT be restored on failed PIN
      expect(mockPinSecureStorage.getAuthContext).not.toHaveBeenCalled();
    });

    it('should not attempt auth restoration when backend succeeds (no fallback needed)', async () => {
      // Backend succeeds this time
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'backend-at', refreshToken: 'backend-rt', expiresIn: 3600,
          tenantSlug: 'freshmart',
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.verifyPin('1234'); });

      // getAuthContext should NOT be called because backend succeeded
      expect(mockPinSecureStorage.getAuthContext).not.toHaveBeenCalled();

      // Should have fresh tokens from backend
      const state = store.getState();
      expect(state.auth.accessToken).toBe('backend-at');
    });
  });

  describe('logoutSession - session-only cleanup (preserves PIN and tenant)', () => {
    beforeEach(() => {
      store = createTestStore({
        pin: { isPinSet: true, isPinVerified: true },
        auth: {
          user: { id: 'user123', email: 'admin@freshmart.com' },
          accessToken: 'active-token',
          refreshToken: 'active-refresh',
          isAuthenticated: true,
        },
        tenant: { tenant: { slug: 'freshmart' } },
      });
      mockPinSecureStorage.clearPin.mockResolvedValue(undefined);
    });

    it('should clear auth Redux state (tokens, user)', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.accessToken).toBeNull();
      expect(state.auth.refreshToken).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
    });

    it('should clear PIN verification but preserve PIN setup', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      expect(result.current.pinState.isPinVerified).toBe(false);
      expect(result.current.pinState.isPinSet).toBe(true);
    });

    it('should clear tenant-specific cached data (carts, catalog)', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      expect(clearAllTenantData).toHaveBeenCalledWith(
        expect.any(Function),
        'freshmart'
      );
    });

    it.each([
      ['SecureStore PIN data', () => expect(mockPinSecureStorage.clearPin).not.toHaveBeenCalled()],
      ['@tenant_id from AsyncStorage', () => expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('@tenant_id')],
      ['tenant from Redux', () => { const s = store.getState(); expect(s.tenant.tenant).not.toBeNull(); expect(s.tenant.tenant.slug).toBe('freshmart'); }],
    ] as [string, () => void][])('should NOT clear %s', async (_label, assertion) => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });
      await act(async () => { await result.current.logoutSession(); });
      assertion();
    });

    it('should handle errors gracefully', async () => {
      (clearAllTenantData as jest.Mock).mockRejectedValueOnce(new Error('Cleanup failed'));

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      expect(result.current.pinState.error).toBeTruthy();
    });
  });
});
