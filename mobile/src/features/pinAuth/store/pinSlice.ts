/**
 * PIN Authentication Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PinState } from '../types/pin.types';
import { PIN_CONFIG } from '../constants';

const initialState: PinState = {
  isPinSet: false,
  isPinVerified: false,
  isLocked: false,
  failedAttempts: 0,
  lockoutUntil: null,
  isLoading: false,
  error: null,
  lastVerifiedAt: null,
};

export const pinSlice = createSlice({
  name: 'pin',
  initialState,
  reducers: {
    /**
     * Set whether PIN is configured
     */
    setPinConfigured: (state, action: PayloadAction<boolean>) => {
      state.isPinSet = action.payload;
      state.failedAttempts = 0;
      state.error = null;
    },

    /**
     * Handle successful PIN verification
     */
    verifyPinSuccess: (state) => {
      state.isPinVerified = true;
      state.failedAttempts = 0;
      state.lastVerifiedAt = new Date().toISOString();
      state.error = null;
      state.isLoading = false;
    },

    /**
     * Handle failed PIN verification
     */
    verifyPinFailure: (state, action: PayloadAction<string>) => {
      state.failedAttempts += 1;
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Lock account after too many failed attempts
     */
    lockAccount: (state, action: PayloadAction<string>) => {
      state.isLocked = true;
      state.lockoutUntil = action.payload;
      state.error = 'Account locked due to too many failed attempts';
    },

    /**
     * Unlock account after lockout period expires
     */
    unlockAccount: (state) => {
      state.isLocked = false;
      state.lockoutUntil = null;
      state.failedAttempts = 0;
      state.error = null;
    },

    /**
     * Reset PIN state (e.g., on logout)
     */
    resetPinState: () => initialState,

    /**
     * Hydrate PIN state from storage
     */
    hydratePinState: (state, action: PayloadAction<Partial<PinState>>) => {
      return { ...state, ...action.payload };
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear verification status (e.g., on session timeout)
     * Preserves isPinSet and other settings
     */
    clearVerification: (state) => {
      state.isPinVerified = false;
      state.lastVerifiedAt = null;
      state.isLoading = false;
    },
  },
});

export const {
  setPinConfigured,
  verifyPinSuccess,
  verifyPinFailure,
  lockAccount,
  unlockAccount,
  resetPinState,
  hydratePinState,
  setLoading,
  setError,
  clearVerification,
} = pinSlice.actions;

// Selectors
type RootStateWithPin = { pin: PinState };

export const selectIsPinSet = (state: RootStateWithPin) => state.pin.isPinSet;
export const selectIsPinVerified = (state: RootStateWithPin) => state.pin.isPinVerified;
export const selectIsLocked = (state: RootStateWithPin) => state.pin.isLocked;
export const selectFailedAttempts = (state: RootStateWithPin) => state.pin.failedAttempts;
export const selectLockoutUntil = (state: RootStateWithPin) => state.pin.lockoutUntil;
export const selectPinError = (state: RootStateWithPin) => state.pin.error;
export const selectPinLoading = (state: RootStateWithPin) => state.pin.isLoading;
export const selectLastVerifiedAt = (state: RootStateWithPin) => state.pin.lastVerifiedAt;

export const selectRemainingAttempts = (state: RootStateWithPin) => {
  if (state.pin.isLocked) {
    return 0;
  }
  const remaining = PIN_CONFIG.MAX_ATTEMPTS - state.pin.failedAttempts;
  return Math.max(0, remaining);
};

export default pinSlice.reducer;
