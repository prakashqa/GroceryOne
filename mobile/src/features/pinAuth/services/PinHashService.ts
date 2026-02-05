/**
 * PinHashService
 * Handles PIN hashing and verification using SHA-256
 */

import * as Crypto from 'expo-crypto';

/**
 * Service for securely hashing and verifying PINs
 */
export const PinHashService = {
  /**
   * Generate a random salt for PIN hashing
   * @returns 32-character hex string (16 bytes)
   */
  generateSalt(): string {
    const randomBytes = Crypto.getRandomBytes(16);
    return Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Hash a PIN with the given salt using SHA-256
   * @param pin - The PIN to hash
   * @param salt - The salt to use
   * @returns Promise resolving to the hash string
   */
  async hashPin(pin: string, salt: string): Promise<string> {
    const combined = pin + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    return hash;
  },

  /**
   * Verify a PIN against a stored hash
   * Uses constant-time comparison to prevent timing attacks
   * @param pin - The PIN to verify
   * @param salt - The salt used for hashing
   * @param storedHash - The stored hash to compare against
   * @returns Promise resolving to true if PIN matches
   */
  async verifyPin(pin: string, salt: string, storedHash: string): Promise<boolean> {
    const computedHash = await this.hashPin(pin, salt);
    return this.secureCompare(computedHash, storedHash);
  },

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns true if strings are equal
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  },
};
