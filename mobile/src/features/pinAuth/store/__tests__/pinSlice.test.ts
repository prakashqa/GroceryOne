/**
 * pinSlice Tests
 * TDD: Write tests first, then implement
 */

import {
  pinSlice,
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
  selectIsPinSet,
  selectIsPinVerified,
  selectIsLocked,
  selectFailedAttempts,
  selectLockoutUntil,
  selectRemainingAttempts,
  selectPinError,
  selectPinLoading,
} from '../pinSlice';
import type { PinState } from '../../types/pin.types';
import { PIN_CONFIG } from '../../constants';

describe('pinSlice', () => {
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

  describe('initial state', () => {
    it('should have isPinSet as false', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.isPinSet).toBe(false);
    });

    it('should have isPinVerified as false', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.isPinVerified).toBe(false);
    });

    it('should have failedAttempts as 0', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.failedAttempts).toBe(0);
    });

    it('should have isLocked as false', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.isLocked).toBe(false);
    });

    it('should have lockoutUntil as null', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.lockoutUntil).toBeNull();
    });

    it('should have error as null', () => {
      const state = pinSlice.reducer(undefined, { type: 'unknown' });
      expect(state.error).toBeNull();
    });
  });

  describe('setPinConfigured', () => {
    it('should set isPinSet to true', () => {
      const state = pinSlice.reducer(initialState, setPinConfigured(true));
      expect(state.isPinSet).toBe(true);
    });

    it('should set isPinSet to false', () => {
      const stateWithPin = { ...initialState, isPinSet: true };
      const state = pinSlice.reducer(stateWithPin, setPinConfigured(false));
      expect(state.isPinSet).toBe(false);
    });

    it('should reset failedAttempts to 0 when setting PIN', () => {
      const stateWithAttempts = { ...initialState, failedAttempts: 3 };
      const state = pinSlice.reducer(stateWithAttempts, setPinConfigured(true));
      expect(state.failedAttempts).toBe(0);
    });

    it('should clear error when setting PIN', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = pinSlice.reducer(stateWithError, setPinConfigured(true));
      expect(state.error).toBeNull();
    });
  });

  describe('verifyPinSuccess', () => {
    it('should set isPinVerified to true', () => {
      const state = pinSlice.reducer(initialState, verifyPinSuccess());
      expect(state.isPinVerified).toBe(true);
    });

    it('should reset failedAttempts to 0', () => {
      const stateWithAttempts = { ...initialState, failedAttempts: 3 };
      const state = pinSlice.reducer(stateWithAttempts, verifyPinSuccess());
      expect(state.failedAttempts).toBe(0);
    });

    it('should set lastVerifiedAt to current timestamp', () => {
      const beforeTime = new Date().toISOString();
      const state = pinSlice.reducer(initialState, verifyPinSuccess());
      const afterTime = new Date().toISOString();

      expect(state.lastVerifiedAt).not.toBeNull();
      expect(state.lastVerifiedAt! >= beforeTime).toBe(true);
      expect(state.lastVerifiedAt! <= afterTime).toBe(true);
    });

    it('should clear any error', () => {
      const stateWithError = { ...initialState, error: 'Wrong PIN' };
      const state = pinSlice.reducer(stateWithError, verifyPinSuccess());
      expect(state.error).toBeNull();
    });

    it('should clear loading state', () => {
      const stateLoading = { ...initialState, isLoading: true };
      const state = pinSlice.reducer(stateLoading, verifyPinSuccess());
      expect(state.isLoading).toBe(false);
    });
  });

  describe('verifyPinFailure', () => {
    it('should increment failedAttempts', () => {
      const state = pinSlice.reducer(initialState, verifyPinFailure('Wrong PIN'));
      expect(state.failedAttempts).toBe(1);
    });

    it('should set error message', () => {
      const state = pinSlice.reducer(initialState, verifyPinFailure('Wrong PIN'));
      expect(state.error).toBe('Wrong PIN');
    });

    it('should NOT set isLocked when attempts < MAX_ATTEMPTS', () => {
      let state = initialState;
      for (let i = 0; i < PIN_CONFIG.MAX_ATTEMPTS - 1; i++) {
        state = pinSlice.reducer(state, verifyPinFailure('Wrong'));
      }
      expect(state.isLocked).toBe(false);
    });

    it('should clear loading state', () => {
      const stateLoading = { ...initialState, isLoading: true };
      const state = pinSlice.reducer(stateLoading, verifyPinFailure('Wrong'));
      expect(state.isLoading).toBe(false);
    });

    it('should keep isPinVerified as false', () => {
      const state = pinSlice.reducer(initialState, verifyPinFailure('Wrong'));
      expect(state.isPinVerified).toBe(false);
    });
  });

  describe('lockAccount', () => {
    it('should set isLocked to true', () => {
      const lockoutTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const state = pinSlice.reducer(initialState, lockAccount(lockoutTime));
      expect(state.isLocked).toBe(true);
    });

    it('should set lockoutUntil timestamp', () => {
      const lockoutTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const state = pinSlice.reducer(initialState, lockAccount(lockoutTime));
      expect(state.lockoutUntil).toBe(lockoutTime);
    });

    it('should preserve failedAttempts count', () => {
      const stateWithAttempts = { ...initialState, failedAttempts: 5 };
      const lockoutTime = new Date().toISOString();
      const state = pinSlice.reducer(stateWithAttempts, lockAccount(lockoutTime));
      expect(state.failedAttempts).toBe(5);
    });

    it('should set error message about lockout', () => {
      const lockoutTime = new Date().toISOString();
      const state = pinSlice.reducer(initialState, lockAccount(lockoutTime));
      expect(state.error).toContain('locked');
    });
  });

  describe('unlockAccount', () => {
    it('should set isLocked to false', () => {
      const lockedState = {
        ...initialState,
        isLocked: true,
        lockoutUntil: new Date().toISOString(),
      };
      const state = pinSlice.reducer(lockedState, unlockAccount());
      expect(state.isLocked).toBe(false);
    });

    it('should clear lockoutUntil', () => {
      const lockedState = {
        ...initialState,
        isLocked: true,
        lockoutUntil: new Date().toISOString(),
      };
      const state = pinSlice.reducer(lockedState, unlockAccount());
      expect(state.lockoutUntil).toBeNull();
    });

    it('should reset failedAttempts to 0', () => {
      const lockedState = {
        ...initialState,
        isLocked: true,
        failedAttempts: 5,
      };
      const state = pinSlice.reducer(lockedState, unlockAccount());
      expect(state.failedAttempts).toBe(0);
    });

    it('should clear error', () => {
      const lockedState = {
        ...initialState,
        isLocked: true,
        error: 'Account locked',
      };
      const state = pinSlice.reducer(lockedState, unlockAccount());
      expect(state.error).toBeNull();
    });
  });

  describe('resetPinState', () => {
    it('should return to initial state', () => {
      const modifiedState: PinState = {
        isPinSet: true,
        isPinVerified: true,
        isLocked: true,
        failedAttempts: 3,
        lockoutUntil: new Date().toISOString(),
        isLoading: true,
        error: 'Some error',
        lastVerifiedAt: new Date().toISOString(),
      };
      const state = pinSlice.reducer(modifiedState, resetPinState());
      expect(state).toEqual(initialState);
    });

    it('should clear verified status', () => {
      const verifiedState = { ...initialState, isPinVerified: true };
      const state = pinSlice.reducer(verifiedState, resetPinState());
      expect(state.isPinVerified).toBe(false);
    });
  });

  describe('hydratePinState', () => {
    it('should merge partial state', () => {
      const state = pinSlice.reducer(
        initialState,
        hydratePinState({ isPinSet: true, failedAttempts: 2 })
      );
      expect(state.isPinSet).toBe(true);
      expect(state.failedAttempts).toBe(2);
      expect(state.isPinVerified).toBe(false); // unchanged
    });

    it('should not override with undefined values', () => {
      const stateWithPin = { ...initialState, isPinSet: true };
      const state = pinSlice.reducer(
        stateWithPin,
        hydratePinState({ failedAttempts: 1 })
      );
      expect(state.isPinSet).toBe(true); // preserved
      expect(state.failedAttempts).toBe(1);
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true', () => {
      const state = pinSlice.reducer(initialState, setLoading(true));
      expect(state.isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      const loadingState = { ...initialState, isLoading: true };
      const state = pinSlice.reducer(loadingState, setLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = pinSlice.reducer(initialState, setError('Test error'));
      expect(state.error).toBe('Test error');
    });

    it('should clear error with null', () => {
      const stateWithError = { ...initialState, error: 'Existing error' };
      const state = pinSlice.reducer(stateWithError, setError(null));
      expect(state.error).toBeNull();
    });
  });

  describe('clearVerification', () => {
    it('should clear isPinVerified', () => {
      const verifiedState = { ...initialState, isPinVerified: true, lastVerifiedAt: new Date().toISOString() };
      const state = pinSlice.reducer(verifiedState, clearVerification());
      expect(state.isPinVerified).toBe(false);
    });

    it('should clear lastVerifiedAt', () => {
      const verifiedState = { ...initialState, isPinVerified: true, lastVerifiedAt: new Date().toISOString() };
      const state = pinSlice.reducer(verifiedState, clearVerification());
      expect(state.lastVerifiedAt).toBeNull();
    });

    it('should reset isLoading to false', () => {
      const loadingState = { ...initialState, isLoading: true, isPinVerified: true };
      const state = pinSlice.reducer(loadingState, clearVerification());
      expect(state.isLoading).toBe(false);
    });

    it('should reset isLoading when called after setLoading(true)', () => {
      let state = pinSlice.reducer(initialState, setLoading(true));
      expect(state.isLoading).toBe(true);
      state = pinSlice.reducer(state, clearVerification());
      expect(state.isLoading).toBe(false);
    });

    it('should preserve isPinSet', () => {
      const stateWithPin = { ...initialState, isPinSet: true, isPinVerified: true, isLoading: true };
      const state = pinSlice.reducer(stateWithPin, clearVerification());
      expect(state.isPinSet).toBe(true);
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      pin: {
        isPinSet: true,
        isPinVerified: false,
        isLocked: false,
        failedAttempts: 2,
        lockoutUntil: null,
        isLoading: false,
        error: 'Test error',
        lastVerifiedAt: null,
      },
    };

    it('selectIsPinSet should return isPinSet', () => {
      expect(selectIsPinSet(mockRootState)).toBe(true);
    });

    it('selectIsPinVerified should return isPinVerified', () => {
      expect(selectIsPinVerified(mockRootState)).toBe(false);
    });

    it('selectIsLocked should return isLocked', () => {
      expect(selectIsLocked(mockRootState)).toBe(false);
    });

    it('selectFailedAttempts should return failedAttempts', () => {
      expect(selectFailedAttempts(mockRootState)).toBe(2);
    });

    it('selectLockoutUntil should return lockoutUntil', () => {
      expect(selectLockoutUntil(mockRootState)).toBeNull();
    });

    it('selectPinError should return error', () => {
      expect(selectPinError(mockRootState)).toBe('Test error');
    });

    it('selectPinLoading should return isLoading', () => {
      expect(selectPinLoading(mockRootState)).toBe(false);
    });

    describe('selectRemainingAttempts', () => {
      it('should return MAX_ATTEMPTS - failedAttempts', () => {
        expect(selectRemainingAttempts(mockRootState)).toBe(PIN_CONFIG.MAX_ATTEMPTS - 2);
      });

      it('should return 0 when locked', () => {
        const lockedState = {
          pin: { ...mockRootState.pin, isLocked: true },
        };
        expect(selectRemainingAttempts(lockedState)).toBe(0);
      });

      it('should not go below 0', () => {
        const maxAttemptsState = {
          pin: { ...mockRootState.pin, failedAttempts: PIN_CONFIG.MAX_ATTEMPTS + 1 },
        };
        expect(selectRemainingAttempts(maxAttemptsState)).toBe(0);
      });
    });
  });
});
