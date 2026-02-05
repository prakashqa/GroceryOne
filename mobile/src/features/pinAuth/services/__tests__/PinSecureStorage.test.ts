/**
 * PinSecureStorage Tests
 * TDD: Write tests first, then implement
 */

import { PinSecureStorage } from '../PinSecureStorage';
import { PIN_STORAGE_KEYS } from '../../constants';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('PinSecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storePinHash', () => {
    it('should store hash in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storePinHash('testhash', 'testsalt', 'user123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PIN_STORAGE_KEYS.PIN_HASH,
        'testhash'
      );
    });

    it('should store salt in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storePinHash('testhash', 'testsalt', 'user123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PIN_STORAGE_KEYS.PIN_SALT,
        'testsalt'
      );
    });

    it('should store userId in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storePinHash('testhash', 'testsalt', 'user123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PIN_STORAGE_KEYS.USER_ID,
        'user123'
      );
    });

    it('should store creation timestamp in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      const beforeTime = new Date().toISOString();

      await PinSecureStorage.storePinHash('testhash', 'testsalt', 'user123');

      const afterTime = new Date().toISOString();
      const timestampCall = (SecureStore.setItemAsync as jest.Mock).mock.calls.find(
        (call) => call[0] === PIN_STORAGE_KEYS.CREATED_AT
      );
      expect(timestampCall).toBeDefined();
      const storedTime = timestampCall[1];
      expect(storedTime >= beforeTime).toBe(true);
      expect(storedTime <= afterTime).toBe(true);
    });

    it('should throw error on storage failure', async () => {
      const error = new Error('Storage failed');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(error);

      await expect(
        PinSecureStorage.storePinHash('hash', 'salt', 'user')
      ).rejects.toThrow('Storage failed');
    });
  });

  describe('getPinHash', () => {
    it('should return hash and salt when stored', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('storedhash')  // PIN_HASH
        .mockResolvedValueOnce('storedsalt'); // PIN_SALT

      const result = await PinSecureStorage.getPinHash();

      expect(result).toEqual({
        hash: 'storedhash',
        salt: 'storedsalt',
      });
    });

    it('should return null when not configured (no hash)', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(null)  // PIN_HASH
        .mockResolvedValueOnce('salt'); // PIN_SALT

      const result = await PinSecureStorage.getPinHash();

      expect(result).toBeNull();
    });

    it('should return null when not configured (no salt)', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('hash')  // PIN_HASH
        .mockResolvedValueOnce(null);   // PIN_SALT

      const result = await PinSecureStorage.getPinHash();

      expect(result).toBeNull();
    });

    it('should handle SecureStore errors', async () => {
      const error = new Error('Read failed');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(error);

      await expect(PinSecureStorage.getPinHash()).rejects.toThrow('Read failed');
    });
  });

  describe('clearPin', () => {
    it('should remove all PIN-related keys including tenant context', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.clearPin();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.PIN_HASH);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.PIN_SALT);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.USER_ID);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.CREATED_AT);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.TENANT_SLUG);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.USER_IDENTIFIER);
    });

    it('should remove exactly 6 keys', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.clearPin();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(6);
    });

    it('should not throw when keys do not exist', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(PinSecureStorage.clearPin()).resolves.not.toThrow();
    });
  });

  describe('isPinConfigured', () => {
    it('should return true when PIN exists for userId', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('somehash')  // PIN_HASH
        .mockResolvedValueOnce('user123');  // USER_ID

      const result = await PinSecureStorage.isPinConfigured('user123');

      expect(result).toBe(true);
    });

    it('should return false when no PIN stored', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(null)       // PIN_HASH
        .mockResolvedValueOnce('user123'); // USER_ID

      const result = await PinSecureStorage.isPinConfigured('user123');

      expect(result).toBe(false);
    });

    it('should return false when PIN is for different userId', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('somehash')    // PIN_HASH
        .mockResolvedValueOnce('otheruser');  // USER_ID

      const result = await PinSecureStorage.isPinConfigured('user123');

      expect(result).toBe(false);
    });

    it('should return false when no userId stored', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('somehash')  // PIN_HASH
        .mockResolvedValueOnce(null);       // USER_ID

      const result = await PinSecureStorage.isPinConfigured('user123');

      expect(result).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('should return stored userId', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('user456');

      const result = await PinSecureStorage.getUserId();

      expect(result).toBe('user456');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.USER_ID);
    });

    it('should return null when no userId stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await PinSecureStorage.getUserId();

      expect(result).toBeNull();
    });
  });

  describe('storeTenantContext', () => {
    it('should store tenant slug in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storeTenantContext('freshmart', 'admin@freshmart.com');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PIN_STORAGE_KEYS.TENANT_SLUG,
        'freshmart'
      );
    });

    it('should store user identifier in SecureStore', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storeTenantContext('freshmart', 'admin@freshmart.com');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PIN_STORAGE_KEYS.USER_IDENTIFIER,
        'admin@freshmart.com'
      );
    });

    it('should store both values in parallel', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.storeTenantContext('freshmart', '+919876543210');

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw on storage failure', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('SecureStore write failed'));

      await expect(
        PinSecureStorage.storeTenantContext('freshmart', 'admin@freshmart.com')
      ).rejects.toThrow('SecureStore write failed');
    });
  });

  describe('getTenantSlug', () => {
    it('should return stored tenant slug', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('freshmart');

      const result = await PinSecureStorage.getTenantSlug();

      expect(result).toBe('freshmart');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.TENANT_SLUG);
    });

    it('should return null when no tenant slug stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await PinSecureStorage.getTenantSlug();

      expect(result).toBeNull();
    });
  });

  describe('getUserIdentifier', () => {
    it('should return stored user identifier (email)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('admin@freshmart.com');

      const result = await PinSecureStorage.getUserIdentifier();

      expect(result).toBe('admin@freshmart.com');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.USER_IDENTIFIER);
    });

    it('should return stored user identifier (phone)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('+919876543210');

      const result = await PinSecureStorage.getUserIdentifier();

      expect(result).toBe('+919876543210');
    });

    it('should return null when no identifier stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await PinSecureStorage.getUserIdentifier();

      expect(result).toBeNull();
    });
  });

  describe('cross-tenant isolation', () => {
    it('should clear tenant context when clearPin is called', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await PinSecureStorage.clearPin();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.TENANT_SLUG);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PIN_STORAGE_KEYS.USER_IDENTIFIER);
    });

    it('should overwrite previous tenant context when storing new one', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      // Store Tenant A context
      await PinSecureStorage.storeTenantContext('tenant-a', 'user-a@tenant-a.com');

      // Store Tenant B context (overwrites)
      await PinSecureStorage.storeTenantContext('tenant-b', 'user-b@tenant-b.com');

      // Last call for TENANT_SLUG should be 'tenant-b'
      const tenantSlugCalls = (SecureStore.setItemAsync as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0] === PIN_STORAGE_KEYS.TENANT_SLUG
      );
      expect(tenantSlugCalls[tenantSlugCalls.length - 1][1]).toBe('tenant-b');

      // Last call for USER_IDENTIFIER should be 'user-b@tenant-b.com'
      const identifierCalls = (SecureStore.setItemAsync as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0] === PIN_STORAGE_KEYS.USER_IDENTIFIER
      );
      expect(identifierCalls[identifierCalls.length - 1][1]).toBe('user-b@tenant-b.com');
    });
  });
});
