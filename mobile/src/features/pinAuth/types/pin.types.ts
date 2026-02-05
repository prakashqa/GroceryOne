/**
 * PIN Authentication Types
 */

/**
 * Redux state for PIN authentication
 */
export interface PinState {
  /** Whether a PIN has been configured for the current user */
  isPinSet: boolean;
  /** Whether the PIN has been verified in the current session */
  isPinVerified: boolean;
  /** Whether the account is locked due to failed attempts */
  isLocked: boolean;
  /** Number of consecutive failed PIN attempts */
  failedAttempts: number;
  /** ISO timestamp when lockout expires (null if not locked) */
  lockoutUntil: string | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message from last operation */
  error: string | null;
  /** ISO timestamp of last successful PIN verification */
  lastVerifiedAt: string | null;
}

/**
 * Stored PIN data in secure storage
 */
export interface StoredPinData {
  /** SHA-256 hash of the PIN */
  hash: string;
  /** Random salt used for hashing */
  salt: string;
  /** User ID the PIN belongs to */
  userId: string;
  /** ISO timestamp when PIN was created */
  createdAt: string;
}

/**
 * Result of PIN verification
 */
export interface PinVerificationResult {
  /** Whether verification was successful */
  success: boolean;
  /** Error message if verification failed */
  error?: string;
  /** Whether account is now locked */
  isLocked?: boolean;
  /** Remaining attempts before lockout */
  remainingAttempts?: number;
}

/**
 * Props for PIN input component
 */
export interface PinInputProps {
  /** Current PIN value (partial or complete) */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when all digits entered */
  onComplete?: (pin: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether to mask digits (show dots instead of numbers) */
  secure?: boolean;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for individual PIN digit display
 */
export interface PinDigitProps {
  /** Whether this digit position is filled */
  filled: boolean;
  /** The actual digit value (only shown if not secure) */
  value?: string;
  /** Whether to show as masked (dot) */
  secure?: boolean;
  /** Whether to show error state */
  hasError?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for PIN keypad
 */
export interface PinKeypadProps {
  /** Callback when a digit is pressed */
  onDigitPress: (digit: string) => void;
  /** Callback when backspace is pressed */
  onBackspace: () => void;
  /** Whether keypad is disabled */
  disabled?: boolean;
  /** Test ID prefix for testing */
  testID?: string;
}

/**
 * PIN auth hook return type
 */
export interface UsePinAuthReturn {
  /** Current PIN state from Redux */
  pinState: PinState;
  /** Set up a new PIN for the user */
  setupPin: (pin: string, userId: string) => Promise<boolean>;
  /** Verify entered PIN against stored hash */
  verifyPin: (pin: string) => Promise<PinVerificationResult>;
  /** Clear stored PIN (requires re-authentication) */
  resetPin: () => Promise<void>;
  /** End the current session (preserves PIN and tenant for next login) */
  logoutSession: () => Promise<void>;
  /** Check if PIN is configured for user */
  checkPinConfigured: (userId: string) => Promise<boolean>;
  /** Check and update lockout status */
  checkLockoutStatus: () => void;
  /** Clear PIN verification (e.g., on logout) */
  clearVerification: () => void;
}
