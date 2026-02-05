/**
 * PIN Authentication Feature
 *
 * Provides secure PIN-based authentication for fast merchant login.
 */

// Components
export { PinInput, PinDigit, PinKeypad } from './components';

// Screens
export { TenantSetupScreen, PinSetupScreen, PinConfirmScreen, PinLoginScreen } from './screens';

// Hooks
export { usePinAuth } from './hooks';

// Store
export {
  pinSlice,
  setPinConfigured,
  verifyPinSuccess,
  verifyPinFailure,
  lockAccount,
  unlockAccount,
  resetPinState,
  clearVerification,
  selectIsPinSet,
  selectIsPinVerified,
  selectIsLocked,
  selectRemainingAttempts,
} from './store/pinSlice';

// Services
export { PinHashService } from './services/PinHashService';
export { PinSecureStorage } from './services/PinSecureStorage';

// Types
export type {
  PinState,
  PinInputProps,
  PinVerificationResult,
  UsePinAuthReturn,
} from './types/pin.types';

// Constants
export { PIN_CONFIG, PIN_STORAGE_KEYS } from './constants';
