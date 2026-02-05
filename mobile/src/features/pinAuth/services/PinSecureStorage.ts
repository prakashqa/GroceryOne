/**
 * PinSecureStorage
 * Secure storage wrapper for PIN data using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { PIN_STORAGE_KEYS } from '../constants';

/**
 * Service for securely storing and retrieving PIN data
 */
export const PinSecureStorage = {
  /**
   * Store PIN hash and related data in secure storage
   * @param hash - The hashed PIN
   * @param salt - The salt used for hashing
   * @param userId - The user ID this PIN belongs to
   */
  async storePinHash(hash: string, salt: string, userId: string): Promise<void> {
    const createdAt = new Date().toISOString();

    await Promise.all([
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.PIN_HASH, hash),
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.PIN_SALT, salt),
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.USER_ID, userId),
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.CREATED_AT, createdAt),
    ]);
  },

  /**
   * Retrieve stored PIN hash and salt
   * @returns Object with hash and salt, or null if not configured
   */
  async getPinHash(): Promise<{ hash: string; salt: string } | null> {
    const [hash, salt] = await Promise.all([
      SecureStore.getItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      SecureStore.getItemAsync(PIN_STORAGE_KEYS.PIN_SALT),
    ]);

    if (!hash || !salt) {
      return null;
    }

    return { hash, salt };
  },

  /**
   * Clear all PIN-related data from secure storage
   */
  async clearPin(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.PIN_SALT),
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.USER_ID),
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.CREATED_AT),
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG),
      SecureStore.deleteItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER),
    ]);
  },

  /**
   * Check if a PIN is configured for the given user
   * @param userId - The user ID to check
   * @returns true if PIN is configured for this user
   */
  async isPinConfigured(userId: string): Promise<boolean> {
    const [hash, storedUserId] = await Promise.all([
      SecureStore.getItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      SecureStore.getItemAsync(PIN_STORAGE_KEYS.USER_ID),
    ]);

    return !!(hash && storedUserId && storedUserId === userId);
  },

  /**
   * Get the user ID associated with the stored PIN
   * @returns The stored user ID or null
   */
  async getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_STORAGE_KEYS.USER_ID);
  },

  /**
   * Store tenant slug and user identifier alongside PIN
   * Called after successful backend authentication to associate PIN with tenant
   * @param tenantSlug - The tenant slug this PIN belongs to
   * @param identifier - The user email or phone for backend verification
   */
  async storeTenantContext(tenantSlug: string, identifier: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG, tenantSlug),
      SecureStore.setItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER, identifier),
    ]);
  },

  /**
   * Get stored tenant slug for backend PIN verification
   * @returns The tenant slug or null
   */
  async getTenantSlug(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG);
  },

  /**
   * Get stored user identifier (email/phone) for backend PIN verification
   * @returns The user identifier or null
   */
  async getUserIdentifier(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER);
  },
};
