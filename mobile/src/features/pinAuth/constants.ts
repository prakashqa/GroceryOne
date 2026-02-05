/**
 * PIN Authentication Constants
 */

export const PIN_CONFIG = {
  /** Number of digits in the PIN */
  PIN_LENGTH: 4,
  /** Maximum failed attempts before lockout */
  MAX_ATTEMPTS: 5,
  /** Lockout duration in milliseconds (30 minutes) */
  LOCKOUT_DURATION_MS: 30 * 60 * 1000,
  /** Session timeout - re-verify PIN after idle (15 minutes) */
  SESSION_TIMEOUT_MS: 15 * 60 * 1000,
  /** Whether to allow skipping PIN setup */
  ALLOW_SKIP_SETUP: false,
} as const;

/**
 * Secure storage keys for PIN data
 */
export const PIN_STORAGE_KEYS = {
  /** Key for storing PIN hash */
  PIN_HASH: 'groceryone_pin_hash',
  /** Key for storing PIN salt */
  PIN_SALT: 'groceryone_pin_salt',
  /** Key for storing user ID associated with PIN */
  USER_ID: 'groceryone_pin_user_id',
  /** Key for storing PIN creation timestamp */
  CREATED_AT: 'groceryone_pin_created_at',
  /** Key for storing tenant slug associated with PIN (for cross-tenant switch) */
  TENANT_SLUG: 'groceryone_pin_tenant_slug',
  /** Key for storing user identifier (email/phone) for backend PIN verification */
  USER_IDENTIFIER: 'groceryone_pin_user_identifier',
} as const;
