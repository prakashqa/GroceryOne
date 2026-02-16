/**
 * usePinAuth Hook
 * Main hook for PIN authentication operations
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/hooks/useAppDispatch';
import {
  setPinConfigured,
  verifyPinSuccess,
  verifyPinFailure,
  lockAccount,
  unlockAccount,
  resetPinState,
  setLoading,
  setError,
  clearVerification as clearVerificationAction,
  selectIsPinSet,
  selectIsPinVerified,
  selectIsLocked,
  selectFailedAttempts,
  selectLockoutUntil,
  selectPinError,
  selectPinLoading,
  selectRemainingAttempts,
  selectLastVerifiedAt,
} from '../store/pinSlice';
import { selectCurrentUser, setCredentials, setTokens, logout } from '../../../store/slices/authSlice';
import { selectTenant, setTenant, clearTenant } from '../../../store/slices/tenantSlice';
import { PinSecureStorage } from '../services/PinSecureStorage';
import { PinHashService } from '../services/PinHashService';
import { PinAuthApi } from '../services/PinAuthApi';
import { PIN_CONFIG } from '../constants';
import { clearAllTenantData } from '../../../utils/storage/tenantDataCleaner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PinState, PinVerificationResult, UsePinAuthReturn } from '../types/pin.types';

// Must match TenantProvider / RootNavigator
const TENANT_ID_KEY = '@tenant_id';

export function usePinAuth(): UsePinAuthReturn {
  const dispatch = useAppDispatch();

  // Selectors
  const isPinSet = useAppSelector(selectIsPinSet);
  const isPinVerified = useAppSelector(selectIsPinVerified);
  const isLocked = useAppSelector(selectIsLocked);
  const failedAttempts = useAppSelector(selectFailedAttempts);
  const lockoutUntil = useAppSelector(selectLockoutUntil);
  const error = useAppSelector(selectPinError);
  const isLoading = useAppSelector(selectPinLoading);
  const remainingAttempts = useAppSelector(selectRemainingAttempts);
  const lastVerifiedAt = useAppSelector(selectLastVerifiedAt);

  // Auth and tenant selectors for API-based verification
  const currentUser = useAppSelector(selectCurrentUser);
  const tenant = useAppSelector(selectTenant);

  const pinState: PinState = {
    isPinSet,
    isPinVerified,
    isLocked,
    failedAttempts,
    lockoutUntil,
    isLoading,
    error,
    lastVerifiedAt,
  };

  /**
   * Set up a new PIN for the user.
   * Stores the PIN locally, then attempts a backend verification to establish
   * the tenant identity. If backend fails, user still enters the app and
   * tenant resolution happens on the next login.
   */
  const setupPin = useCallback(
    async (pin: string, userId: string): Promise<boolean> => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Generate salt and hash the PIN
        const salt = PinHashService.generateSalt();
        const hash = await PinHashService.hashPin(pin, salt);

        // Store in secure storage
        await PinSecureStorage.storePinHash(hash, salt, userId);

        // Update Redux state
        dispatch(setPinConfigured(true));

        // Attempt backend verification to establish tenant identity
        // This is best-effort — if it fails, user still enters the app
        const credentials = await resolveBackendCredentials();
        if (credentials) {
          try {
            const result = await PinAuthApi.verifyPin({
              identifier: credentials.identifier,
              pin,
              tenantSlug: credentials.tenantSlug,
            });
            if (result.success && result.data) {
              await handleBackendVerifySuccess(result.data);
            }
          } catch {
            // Backend verification failed - not blocking, tenant will be resolved on next login
            if (__DEV__) {
              console.log('[usePinAuth] Background tenant verification failed during setup - will retry on next login');
            }
          }
        }

        // Mark PIN as verified since user just created it
        dispatch(verifyPinSuccess());

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to setup PIN';
        dispatch(setError(errorMessage));
        dispatch(setLoading(false));
        return false;
      }
    },
    [dispatch, resolveBackendCredentials, handleBackendVerifySuccess]
  );

  /**
   * Verify PIN locally against stored hash
   * Used as fallback when backend is unreachable
   */
  const verifyPinLocally = useCallback(
    async (pin: string): Promise<PinVerificationResult> => {
      if (__DEV__) {
        console.log('[usePinAuth] Starting local PIN verification...');
      }

      try {
        // Get stored PIN hash from secure storage
        const storedData = await PinSecureStorage.getPinHash();

        if (__DEV__) {
          console.log('[usePinAuth] Stored PIN data exists:', !!storedData);
        }

        if (!storedData) {
          if (__DEV__) {
            console.log('[usePinAuth] No PIN configured locally');
          }
          return {
            success: false,
            error: 'PIN not configured',
          };
        }

        // Verify PIN against stored hash
        const isValid = await PinHashService.verifyPin(pin, storedData.salt, storedData.hash);

        if (__DEV__) {
          console.log('[usePinAuth] Local PIN verification result:', isValid);
        }

        if (isValid) {
          dispatch(verifyPinSuccess());
          if (__DEV__) {
            console.log('[usePinAuth] PIN verified successfully! Dispatched verifyPinSuccess');
          }
          return {
            success: true,
          };
        }

        if (__DEV__) {
          console.log('[usePinAuth] Local PIN verification failed - incorrect PIN');
        }
        return {
          success: false,
          error: 'Incorrect PIN',
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Local verification failed';
        if (__DEV__) {
          console.error('[usePinAuth] Local verification error:', errorMessage);
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [dispatch]
  );

  /**
   * Resolve identifier and tenant slug for backend PIN verification.
   * Tries Redux state first, then falls back to SecureStore (persisted from last login).
   */
  const resolveBackendCredentials = useCallback(
    async (): Promise<{ identifier: string; tenantSlug: string } | null> => {
      // 1. Try Redux state (available during active session)
      const reduxIdentifier = currentUser?.email || currentUser?.phone;
      const reduxTenant = tenant?.slug;
      if (reduxIdentifier && reduxTenant) {
        return { identifier: reduxIdentifier, tenantSlug: reduxTenant };
      }

      // 2. Fall back to SecureStore (persisted from last successful backend login)
      const storedIdentifier = await PinSecureStorage.getUserIdentifier();
      const storedTenant = await PinSecureStorage.getTenantSlug();
      if (storedIdentifier && storedTenant) {
        if (__DEV__) {
          console.log('[usePinAuth] Using stored credentials for backend verification');
        }
        return { identifier: storedIdentifier, tenantSlug: storedTenant };
      }

      return null;
    },
    [currentUser, tenant]
  );

  /**
   * Handle successful backend verification - update Redux state and persist credentials
   */
  const handleBackendVerifySuccess = useCallback(
    async (data: NonNullable<import('../services/PinAuthApi').PinAuthResult['data']>) => {
      // ALL synchronous Redux dispatches FIRST so React batches them
      // into a single re-render. This ensures accessToken, user, and
      // tenantSlug are all available simultaneously when cart hydration fires.

      // Update auth tokens
      dispatch(setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      }));

      // Update user credentials from backend response
      if (data.user) {
        dispatch(setCredentials({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            role: (data.user.role || 'merchant') as 'merchant',
            tenantId: data.user.tenantId || '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          requiresPinSetup: false,
        }));
      }

      // Update tenant context from backend response if changed
      const responseTenant = data.tenantSlug;
      if (responseTenant) {
        dispatch(setTenant({
          id: data.user?.tenantId || '',
          name: tenant?.name || responseTenant,
          slug: responseTenant,
          status: 'active',
          subscriptionPlan: 'premium',
          branding: {
            primaryColor: '#4CAF50',
            secondaryColor: '#2196F3',
            fontFamily: 'Roboto',
          },
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'te'],
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      // Async persistence operations AFTER all dispatches.
      // These are fire-and-forget — they persist context for future logins
      // but don't affect the current session's UI state.
      try {
        if (data.user) {
          const userIdentifier = data.user.email || data.user.phone || '';
          const responseTenantSlug = data.tenantSlug || tenant?.slug || '';
          if (userIdentifier && responseTenantSlug) {
            await PinSecureStorage.storeTenantContext(responseTenantSlug, userIdentifier);
          }
        }

        if (responseTenant) {
          await AsyncStorage.setItem(TENANT_ID_KEY, responseTenant);
        }
      } catch (err) {
        console.error('[usePinAuth] Failed to persist login context:', err);
      }
    },
    [dispatch, tenant]
  );

  /**
   * Verify entered PIN - tries backend API first, falls back to local verification
   */
  const verifyPin = useCallback(
    async (pin: string): Promise<PinVerificationResult> => {
      // Check if locked
      if (isLocked) {
        return {
          success: false,
          error: 'Account is locked',
          isLocked: true,
          remainingAttempts: 0,
        };
      }

      // Resolve identifier and tenant for backend call
      const credentials = await resolveBackendCredentials();
      if (!credentials) {
        // No credentials available anywhere - local-only verification
        if (__DEV__) {
          console.log('[usePinAuth] No credentials found, using local verification');
        }
        return verifyPinLocally(pin);
      }

      const { identifier, tenantSlug } = credentials;

      try {
        dispatch(setLoading(true));

        // Call backend API to verify PIN
        const result = await PinAuthApi.verifyPin({
          identifier,
          pin,
          tenantSlug,
        });

        if (result.success && result.data) {
          await handleBackendVerifySuccess(result.data);
          dispatch(verifyPinSuccess());
          return {
            success: true,
          };
        }

        // Backend API failed - fall back to local verification
        // This handles network errors, tenant not found, server errors, etc.
        if (__DEV__) {
          console.log('[usePinAuth] API error:', result.error, '- falling back to local verification');
        }
        dispatch(setLoading(false));
        const localResult = await verifyPinLocally(pin);

        if (!localResult.success) {
          // Handle failure with attempts tracking
          const newFailedAttempts = failedAttempts + 1;
          const newRemainingAttempts = Math.max(0, PIN_CONFIG.MAX_ATTEMPTS - newFailedAttempts);

          dispatch(verifyPinFailure(localResult.error || 'Incorrect PIN'));

          if (newFailedAttempts >= PIN_CONFIG.MAX_ATTEMPTS) {
            const lockoutTime = new Date(Date.now() + PIN_CONFIG.LOCKOUT_DURATION_MS).toISOString();
            dispatch(lockAccount(lockoutTime));
            return {
              success: false,
              error: 'Account locked due to too many failed attempts',
              isLocked: true,
              remainingAttempts: 0,
            };
          }

          return {
            success: false,
            error: localResult.error || 'Incorrect PIN',
            isLocked: false,
            remainingAttempts: newRemainingAttempts,
          };
        }

        return localResult;
      } catch (err) {
        // On any error, try local verification as fallback
        if (__DEV__) {
          console.log('[usePinAuth] Exception occurred, trying local verification:', err);
        }
        dispatch(setLoading(false));
        return verifyPinLocally(pin);
      }
    },
    [dispatch, isLocked, failedAttempts, resolveBackendCredentials, handleBackendVerifySuccess, verifyPinLocally]
  );

  /**
   * Clear stored PIN (requires re-authentication)
   * Clears ALL tenant-specific data and identity so the next user/tenant starts fresh.
   * This is the full "logout" equivalent in a PIN-first auth flow.
   */
  const resetPin = useCallback(async (): Promise<void> => {
    try {
      dispatch(setLoading(true));

      // Capture tenant slug BEFORE any dispatches that might clear it.
      // This prevents a race condition where clearAllTenantData receives
      // undefined if tenant state is cleared by an earlier dispatch.
      const currentTenantSlug = tenant?.slug;

      // 1. Clear PIN hash, salt, user ID, tenant slug, identifier from SecureStore
      await PinSecureStorage.clearPin();

      // 2. Reset PIN Redux state (isPinSet = false, isPinVerified = false)
      dispatch(resetPinState());

      // 3. Clear tenant-specific cached data (carts, catalog, API cache)
      await clearAllTenantData(dispatch, currentTenantSlug);

      // 4. Clear the stored tenant identity so the next login doesn't inherit it
      await AsyncStorage.removeItem(TENANT_ID_KEY);

      // 5. Clear tenant from Redux (no stale tenant in memory)
      dispatch(clearTenant());

      // 6. Clear auth state (user, tokens) so no stale credentials remain
      dispatch(logout());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset PIN';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
    }
  }, [dispatch, tenant]);

  /**
   * End the current session without clearing PIN or tenant identity.
   * The user will see the PIN login screen on next app launch instead
   * of the email/tenant setup screen.
   *
   * Clears: session tokens, PIN verification, cached tenant data (carts, catalog)
   * Preserves: PIN hash/salt, tenant slug, user identifier, @tenant_id
   */
  const logoutSession = useCallback(async (): Promise<void> => {
    try {
      dispatch(setLoading(true));

      const currentTenantSlug = tenant?.slug;

      // 1. Clear PIN verification (isPinVerified = false, keeps isPinSet = true)
      dispatch(clearVerificationAction());

      // 2. Clear tenant-specific cached data (carts, catalog, API cache)
      await clearAllTenantData(dispatch, currentTenantSlug);

      // 3. Clear auth state (user, tokens) so no stale credentials remain
      dispatch(logout());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
    }
  }, [dispatch, tenant]);

  /**
   * Check if PIN is configured for user
   */
  const checkPinConfigured = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const isConfigured = await PinSecureStorage.isPinConfigured(userId);
        dispatch(setPinConfigured(isConfigured));
        return isConfigured;
      } catch (err) {
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Check and update lockout status
   */
  const checkLockoutStatus = useCallback((): void => {
    if (!isLocked || !lockoutUntil) return;

    const lockoutTime = new Date(lockoutUntil).getTime();
    const now = Date.now();

    if (now >= lockoutTime) {
      dispatch(unlockAccount());
    }
  }, [dispatch, isLocked, lockoutUntil]);

  /**
   * Clear PIN verification (e.g., on logout or session timeout)
   */
  const clearVerification = useCallback((): void => {
    dispatch(clearVerificationAction());
  }, [dispatch]);

  return {
    pinState,
    setupPin,
    verifyPin,
    resetPin,
    logoutSession,
    checkPinConfigured,
    checkLockoutStatus,
    clearVerification,
  };
}

export default usePinAuth;
