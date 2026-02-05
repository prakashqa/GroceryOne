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
      mockPinHashService.generateSalt.mockReturnValue('salt');
      mockPinHashService.hashPin.mockResolvedValue('hash');
      mockPinSecureStorage.storePinHash.mockResolvedValue(undefined);

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
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });
    });

    it('should call backend API with correct payload', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'admin' },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyPin('1234');
      });

      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com',
        pin: '1234',
        tenantSlug: 'freshmart',
      });
    });

    it('should dispatch success and return tokens on valid PIN', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'admin' },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(true);
      expect(result.current.pinState.isPinVerified).toBe(true);
      expect(result.current.pinState.failedAttempts).toBe(0);
    });

    it('should dispatch failure action on invalid PIN from API', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('9999');
      });

      expect(verifyResult.success).toBe(false);
      expect(result.current.pinState.isPinVerified).toBe(false);
      expect(result.current.pinState.failedAttempts).toBe(1);
    });

    it('should fall back to local verification on network error', async () => {
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network error'));

      // Set up local PIN so fallback verification can succeed
      mockPinSecureStorage.getPinHash.mockResolvedValue({ hash: 'stored-hash', salt: 'stored-salt' });
      mockPinHashService.verifyPin.mockResolvedValue(true);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      // Should succeed via local fallback
      expect(verifyResult.success).toBe(true);
    });

    it('should return local error when network fails and local PIN not configured', async () => {
      mockPinAuthApi.verifyPin.mockRejectedValue(new Error('Network error'));

      // No local PIN stored
      mockPinSecureStorage.getPinHash.mockResolvedValue(null);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBe('PIN not configured');
    });

    it('should return remaining attempts on failure', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('wrong');
      });

      expect(verifyResult.remainingAttempts).toBe(PIN_CONFIG.MAX_ATTEMPTS - 1);
    });

    it('should trigger lockout after max attempts', async () => {
      store = createTestStore({
        pin: {
          isPinSet: true,
          failedAttempts: PIN_CONFIG.MAX_ATTEMPTS - 1,
        },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('wrong');
      });

      expect(verifyResult.isLocked).toBe(true);
      expect(result.current.pinState.isLocked).toBe(true);
      expect(result.current.pinState.lockoutUntil).not.toBeNull();
    });

    it('should not call API when already locked', async () => {
      store = createTestStore({
        pin: {
          isPinSet: true,
          isLocked: true,
          lockoutUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.isLocked).toBe(true);
      // Should not have called API
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
    });

    it('should fall back to local verification when no credentials available', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: null },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      // SecureStore also has no stored credentials
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
      mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);

      // Local verification will also fail (no PIN stored)
      mockPinSecureStorage.getPinHash.mockResolvedValue(null);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBe('PIN not configured');
      // Should not have called backend API
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
    it('should return true when PIN exists for user', async () => {
      mockPinSecureStorage.isPinConfigured.mockResolvedValue(true);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let isConfigured: boolean;
      await act(async () => {
        isConfigured = await result.current.checkPinConfigured('user123');
      });

      expect(isConfigured!).toBe(true);
    });

    it('should return false when no PIN for user', async () => {
      mockPinSecureStorage.isPinConfigured.mockResolvedValue(false);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let isConfigured: boolean;
      await act(async () => {
        isConfigured = await result.current.checkPinConfigured('user123');
      });

      expect(isConfigured!).toBe(false);
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
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: null },
        tenant: { tenant: null },
      });

      // SecureStore has persisted credentials from a previous session
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('admin@freshmart.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('freshmart');

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant' },
          tenantSlug: 'freshmart',
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(true);
      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com',
        pin: '1234',
        tenantSlug: 'freshmart',
      });
    });

    it('should prefer Redux state over SecureStore for credentials', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      // SecureStore has DIFFERENT (stale) credentials
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('old-user@stale.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('stale-tenant');

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 3600,
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant' },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyPin('1234');
      });

      // Should use Redux state, not SecureStore
      expect(mockPinAuthApi.verifyPin).toHaveBeenCalledWith({
        identifier: 'admin@freshmart.com',
        pin: '1234',
        tenantSlug: 'freshmart',
      });
    });

    it('should fall back to local verification when both Redux and SecureStore are empty', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: null },
        tenant: { tenant: null },
      });

      mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
      mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);

      // Local verification succeeds
      mockPinSecureStorage.getPinHash.mockResolvedValue({ hash: 'stored-hash', salt: 'stored-salt' });
      mockPinHashService.verifyPin.mockResolvedValue(true);

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let verifyResult: any;
      await act(async () => {
        verifyResult = await result.current.verifyPin('1234');
      });

      expect(verifyResult.success).toBe(true);
      // Should NOT have called backend API
      expect(mockPinAuthApi.verifyPin).not.toHaveBeenCalled();
    });
  });

  describe('handleBackendVerifySuccess - tenant context persistence', () => {
    it('should persist tenant context to SecureStore on successful verification', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tenantSlug: 'freshmart',
          user: {
            id: 'user123',
            email: 'admin@freshmart.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'merchant',
            tenantId: 'tenant-uuid-123',
          },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyPin('1234');
      });

      // Should persist tenant context for future sessions
      expect(mockPinSecureStorage.storeTenantContext).toHaveBeenCalledWith(
        'freshmart',
        'admin@freshmart.com'
      );
    });

    it('should save tenant slug to AsyncStorage on successful verification', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
          tenantSlug: 'freshmart',
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyPin('1234');
      });

      // Should persist tenant slug for RootNavigator initialization
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@tenant_id', 'freshmart');
    });

    it('should update Redux auth state from backend response', async () => {
      store = createTestStore({
        pin: { isPinSet: true },
        auth: { user: { id: 'user123', email: 'admin@freshmart.com' } },
        tenant: { tenant: { slug: 'freshmart' } },
      });

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'fresh-access-token',
          refreshToken: 'fresh-refresh-token',
          expiresIn: 7200,
          tenantSlug: 'freshmart',
          user: {
            id: 'user123',
            email: 'admin@freshmart.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'merchant',
            tenantId: 'tenant-uuid-123',
          },
        },
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyPin('1234');
      });

      // Verify Redux state was updated with new tokens
      const state = store.getState();
      expect(state.auth.accessToken).toBe('fresh-access-token');
      expect(state.auth.refreshToken).toBe('fresh-refresh-token');
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
      mockPinHashService.generateSalt.mockReturnValue('test-salt');
      mockPinHashService.hashPin.mockResolvedValue('test-hash');
      mockPinSecureStorage.storePinHash.mockResolvedValue(undefined);
    });

    it('should attempt backend verification during setup', async () => {
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
          tenantSlug: 'freshmart',
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        },
      });

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
      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
          tenantSlug: 'freshmart',
          user: { id: 'user123', email: 'admin@freshmart.com', role: 'merchant', tenantId: 'tid' },
        },
      });

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

      mockPinAuthApi.verifyPin.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'tenant-a-access',
          refreshToken: 'tenant-a-refresh',
          expiresIn: 3600,
          tenantSlug: 'tenant-a',
          user: { id: 'user-a', email: 'admin@tenant-a.com', role: 'merchant', tenantId: 'tid-a' },
        },
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

    it('should NOT clear SecureStore PIN data', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      expect(mockPinSecureStorage.clearPin).not.toHaveBeenCalled();
    });

    it('should NOT remove @tenant_id from AsyncStorage', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('@tenant_id');
    });

    it('should NOT clear tenant from Redux', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.logoutSession();
      });

      const state = store.getState();
      expect(state.tenant.tenant).not.toBeNull();
      expect(state.tenant.tenant.slug).toBe('freshmart');
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
