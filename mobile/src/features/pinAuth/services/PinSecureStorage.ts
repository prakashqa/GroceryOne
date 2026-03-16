import AsyncStorage from '@react-native-async-storage/async-storage';
/**
 * PinSecureStorage
 * Secure storage wrapper for PIN data using expo-secure-store
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PIN_STORAGE_KEYS } from '../constants';

// expo-secure-store exports empty object on web — use AsyncStorage as dev fallback
const storage = Platform.OS === 'web'
  ? {
      setItemAsync: async (k: string, v: string) => { AsyncStorage.setItem(k, v); },
      getItemAsync: async (k: string): Promise<string | null> => AsyncStorage.getItem(k),
      deleteItemAsync: async (k: string) => { AsyncStorage.removeItem(k); },
    }
  : SecureStore;

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
      storage.setItemAsync(PIN_STORAGE_KEYS.PIN_HASH, hash),
      storage.setItemAsync(PIN_STORAGE_KEYS.PIN_SALT, salt),
      storage.setItemAsync(PIN_STORAGE_KEYS.USER_ID, userId),
      storage.setItemAsync(PIN_STORAGE_KEYS.CREATED_AT, createdAt),
    ]);
  },

  /**
   * Retrieve stored PIN hash and salt
   * @returns Object with hash and salt, or null if not configured
   */
  async getPinHash(): Promise<{ hash: string; salt: string } | null> {
    const [hash, salt] = await Promise.all([
      storage.getItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      storage.getItemAsync(PIN_STORAGE_KEYS.PIN_SALT),
    ]);

    if (!hash || !salt) {
      return null;
    }

    return { hash, salt };
  },

  /**
   * Clear all PIN-related data from secure storage
   * Includes auth context and tenant name keys added for offline restoration
   */
  async clearPin(): Promise<void> {
    await Promise.all([
      storage.deleteItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.PIN_SALT),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.USER_ID),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.CREATED_AT),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.AUTH_USER),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.AUTH_ACCESS_TOKEN),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.AUTH_REFRESH_TOKEN),
      storage.deleteItemAsync(PIN_STORAGE_KEYS.TENANT_NAME),
    ]);
  },

  /**
   * Check if a PIN is configured for the given user
   * @param userId - The user ID to check
   * @returns true if PIN is configured for this user
   */
  async isPinConfigured(userId: string): Promise<boolean> {
    const [hash, storedUserId] = await Promise.all([
      storage.getItemAsync(PIN_STORAGE_KEYS.PIN_HASH),
      storage.getItemAsync(PIN_STORAGE_KEYS.USER_ID),
    ]);

    return !!(hash && storedUserId && storedUserId === userId);
  },

  /**
   * Get the user ID associated with the stored PIN
   * @returns The stored user ID or null
   */
  async getUserId(): Promise<string | null> {
    return storage.getItemAsync(PIN_STORAGE_KEYS.USER_ID);
  },

  /**
   * Store tenant slug and user identifier alongside PIN
   * Called after successful backend authentication to associate PIN with tenant
   * @param tenantSlug - The tenant slug this PIN belongs to
   * @param identifier - The user email or phone for backend verification
   */
  async storeTenantContext(tenantSlug: string, identifier: string): Promise<void> {
    await Promise.all([
      storage.setItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG, tenantSlug),
      storage.setItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER, identifier),
    ]);
  },

  /**
   * Get stored tenant slug for backend PIN verification
   * @returns The tenant slug or null
   */
  async getTenantSlug(): Promise<string | null> {
    return storage.getItemAsync(PIN_STORAGE_KEYS.TENANT_SLUG);
  },

  /**
   * Get stored user identifier (email/phone) for backend PIN verification
   * @returns The user identifier or null
   */
  async getUserIdentifier(): Promise<string | null> {
    return storage.getItemAsync(PIN_STORAGE_KEYS.USER_IDENTIFIER);
  },

  /**
   * Store auth context (user, tokens) for offline restoration after local PIN verify.
   * All data stored in hardware-backed SecureStore (not AsyncStorage).
   * @param user - User object to serialize
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   */
  async storeAuthContext(user: Record<string, unknown>, accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.setItemAsync(PIN_STORAGE_KEYS.AUTH_USER, JSON.stringify(user)),
      storage.setItemAsync(PIN_STORAGE_KEYS.AUTH_ACCESS_TOKEN, accessToken),
      storage.setItemAsync(PIN_STORAGE_KEYS.AUTH_REFRESH_TOKEN, refreshToken),
    ]);
  },

  /**
   * Retrieve stored auth context for offline restoration.
   * @returns Object with user, accessToken, refreshToken — or null if incomplete/corrupt
   */
  async getAuthContext(): Promise<{ user: Record<string, unknown>; accessToken: string; refreshToken: string } | null> {
    const [userJson, accessToken, refreshToken] = await Promise.all([
      storage.getItemAsync(PIN_STORAGE_KEYS.AUTH_USER),
      storage.getItemAsync(PIN_STORAGE_KEYS.AUTH_ACCESS_TOKEN),
      storage.getItemAsync(PIN_STORAGE_KEYS.AUTH_REFRESH_TOKEN),
    ]);

    if (!userJson || !accessToken || !refreshToken) {
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      return { user, accessToken, refreshToken };
    } catch {
      // Corrupt JSON — treat as missing
      return null;
    }
  },

  /**
   * Store friendly tenant display name for offline restoration.
   * @param name - Human-readable tenant name (e.g. "FreshMart Groceries")
   */
  async storeTenantName(name: string): Promise<void> {
    await storage.setItemAsync(PIN_STORAGE_KEYS.TENANT_NAME, name);
  },

  /**
   * Retrieve stored friendly tenant display name.
   * @returns The tenant name or null
   */
  async getTenantName(): Promise<string | null> {
    return storage.getItemAsync(PIN_STORAGE_KEYS.TENANT_NAME);
  },
};
