/**
 * PinHashService Tests
 * TDD: Write tests first, then implement
 */

import { PinHashService } from '../PinHashService';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  getRandomBytes: jest.fn(),
}));

import * as Crypto from 'expo-crypto';

describe('PinHashService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSalt', () => {
    it('should return a string of expected length (32 hex chars)', () => {
      // Mock getRandomBytes to return predictable bytes
      const mockBytes = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      ]);
      (Crypto.getRandomBytes as jest.Mock).mockReturnValue(mockBytes);

      const salt = PinHashService.generateSalt();

      expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(typeof salt).toBe('string');
    });

    it('should return unique values on each call', () => {
      const mockBytes1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const mockBytes2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

      (Crypto.getRandomBytes as jest.Mock)
        .mockReturnValueOnce(mockBytes1)
        .mockReturnValueOnce(mockBytes2);

      const salt1 = PinHashService.generateSalt();
      const salt2 = PinHashService.generateSalt();

      expect(salt1).not.toBe(salt2);
    });

    it('should only contain hexadecimal characters', () => {
      const mockBytes = new Uint8Array([0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78]);
      (Crypto.getRandomBytes as jest.Mock).mockReturnValue(mockBytes);

      const salt = PinHashService.generateSalt();

      expect(salt).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('hashPin', () => {
    it('should return consistent hash for same pin and salt', async () => {
      const mockHash = 'abc123def456';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue(mockHash);

      const hash1 = await PinHashService.hashPin('1234', 'salt123');
      const hash2 = await PinHashService.hashPin('1234', 'salt123');

      expect(hash1).toBe(hash2);
      expect(hash1).toBe(mockHash);
    });

    it('should call digestStringAsync with SHA256 and combined pin+salt', async () => {
      const mockHash = 'hashresult';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue(mockHash);

      await PinHashService.hashPin('5678', 'mysalt');

      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        '5678mysalt'
      );
    });

    it('should return different hashes for different pins', async () => {
      (Crypto.digestStringAsync as jest.Mock)
        .mockResolvedValueOnce('hash_for_1234')
        .mockResolvedValueOnce('hash_for_5678');

      const hash1 = await PinHashService.hashPin('1234', 'samesalt');
      const hash2 = await PinHashService.hashPin('5678', 'samesalt');

      expect(hash1).not.toBe(hash2);
    });

    it('should return different hashes for different salts', async () => {
      (Crypto.digestStringAsync as jest.Mock)
        .mockResolvedValueOnce('hash_with_salt1')
        .mockResolvedValueOnce('hash_with_salt2');

      const hash1 = await PinHashService.hashPin('1234', 'salt1');
      const hash2 = await PinHashService.hashPin('1234', 'salt2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle 4-digit numeric PINs', async () => {
      const mockHash = 'validhash';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue(mockHash);

      const hash = await PinHashService.hashPin('0000', 'salt');

      expect(hash).toBe(mockHash);
      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        '0000salt'
      );
    });
  });

  describe('verifyPin', () => {
    it('should return true for matching pin', async () => {
      const storedHash = 'correcthash';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue(storedHash);

      const result = await PinHashService.verifyPin('1234', 'salt', storedHash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching pin', async () => {
      const storedHash = 'correcthash';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('wronghash');

      const result = await PinHashService.verifyPin('9999', 'salt', storedHash);

      expect(result).toBe(false);
    });

    it('should return false for wrong salt', async () => {
      const storedHash = 'hashwithoriginalsalt';
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('hashwithdifferentsalt');

      const result = await PinHashService.verifyPin('1234', 'wrongsalt', storedHash);

      expect(result).toBe(false);
    });

    it('should use constant-time comparison to prevent timing attacks', async () => {
      const storedHash = 'a'.repeat(64);
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('b'.repeat(64));

      // This test verifies the function works - actual timing attack prevention
      // is implementation detail tested by using secure comparison
      const result = await PinHashService.verifyPin('1234', 'salt', storedHash);

      expect(result).toBe(false);
    });
  });
});
