/**
 * Validation utility tests (TDD - tests first)
 */

import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidPostalCode,
  isValidSlug,
  sanitizeSlug,
} from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.in')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user123@test.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid Indian phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('919876543210')).toBe(true);
      expect(isValidPhone('09876543210')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('12345678901234')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
      expect(isValidPhone('1234567890')).toBe(false); // doesn't start with valid digit
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('Password1!')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
      expect(isValidPassword('Str0ng!Pass')).toBe(true);
    });

    it('should return false for passwords without uppercase', () => {
      expect(isValidPassword('password1!')).toBe(false);
    });

    it('should return false for passwords without lowercase', () => {
      expect(isValidPassword('PASSWORD1!')).toBe(false);
    });

    it('should return false for passwords without numbers', () => {
      expect(isValidPassword('Password!')).toBe(false);
    });

    it('should return false for passwords without special characters', () => {
      expect(isValidPassword('Password1')).toBe(false);
    });

    it('should return false for passwords shorter than 8 characters', () => {
      expect(isValidPassword('Pass1!')).toBe(false);
    });
  });

  describe('isValidPostalCode', () => {
    it('should return true for valid Indian postal codes', () => {
      expect(isValidPostalCode('500001')).toBe(true);
      expect(isValidPostalCode('110001')).toBe(true);
      expect(isValidPostalCode('400001')).toBe(true);
    });

    it('should return false for invalid postal codes', () => {
      expect(isValidPostalCode('')).toBe(false);
      expect(isValidPostalCode('12345')).toBe(false);
      expect(isValidPostalCode('1234567')).toBe(false);
      expect(isValidPostalCode('abcdef')).toBe(false);
      expect(isValidPostalCode('000001')).toBe(false); // starts with 0
    });
  });

  describe('isValidSlug', () => {
    it('should return true for valid slugs', () => {
      expect(isValidSlug('valid-slug')).toBe(true);
      expect(isValidSlug('slug123')).toBe(true);
      expect(isValidSlug('my-product-name')).toBe(true);
      expect(isValidSlug('simple')).toBe(true);
    });

    it('should return false for invalid slugs', () => {
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug('Invalid Slug')).toBe(false);
      expect(isValidSlug('slug_with_underscore')).toBe(false);
      expect(isValidSlug('UPPERCASE')).toBe(false);
      expect(isValidSlug('-starts-with-dash')).toBe(false);
      expect(isValidSlug('ends-with-dash-')).toBe(false);
      expect(isValidSlug('has--double-dash')).toBe(false);
    });
  });

  describe('sanitizeSlug', () => {
    it('should convert string to valid slug', () => {
      expect(sanitizeSlug('Hello World')).toBe('hello-world');
      expect(sanitizeSlug('My Product Name')).toBe('my-product-name');
      expect(sanitizeSlug('Product 123')).toBe('product-123');
    });

    it('should handle special characters', () => {
      expect(sanitizeSlug('Product (Special)')).toBe('product-special');
      expect(sanitizeSlug('Price: $100')).toBe('price-100');
      expect(sanitizeSlug('Hello@World!')).toBe('helloworld');
    });

    it('should trim and collapse multiple dashes', () => {
      expect(sanitizeSlug('  Hello   World  ')).toBe('hello-world');
      expect(sanitizeSlug('Too---Many---Dashes')).toBe('too-many-dashes');
    });

    it('should handle empty strings', () => {
      expect(sanitizeSlug('')).toBe('');
      expect(sanitizeSlug('   ')).toBe('');
    });
  });
});
