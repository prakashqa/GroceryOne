/**
 * Identifier normalization tests.
 *
 * Documents the matching policy: the user-typed identifier and the
 * stored phone are reduced to digits-only and compared by last 10
 * characters (Indian mobile length). Email-looking inputs are passed
 * through unchanged.
 */

import {
  digitsOnly,
  looksLikeEmail,
  normalizePhoneLast10,
} from '../identifier';

describe('looksLikeEmail', () => {
  it('returns true for strings containing @', () => {
    expect(looksLikeEmail('a@b.c')).toBe(true);
  });
  it('returns false for digit-only / phone-shaped strings', () => {
    expect(looksLikeEmail('9999000001')).toBe(false);
    expect(looksLikeEmail('+91-9999000001')).toBe(false);
  });
});

describe('digitsOnly', () => {
  it.each([
    ['9999000001', '9999000001'],
    ['+91 9999000001', '919999000001'],
    ['+91-9999000001', '919999000001'],
    ['(999) 900-0001', '9999000001'],
    ['  +91 9999 000 001 ', '919999000001'],
  ])('strips non-digits: %p -> %p', (input, expected) => {
    expect(digitsOnly(input)).toBe(expected);
  });
});

describe('normalizePhoneLast10', () => {
  it.each([
    ['9999000001', '9999000001'],            // bare 10 digits
    ['+919999000001', '9999000001'],         // E.164
    ['+91-9999000001', '9999000001'],        // seed-style with dash
    ['+91 9999000001', '9999000001'],        // with space
    ['919999000001', '9999000001'],          // 12 digits, country code prefix
    ['00919999000001', '9999000001'],        // intl prefix 00
    ['  9999000001  ', '9999000001'],        // whitespace
    ['99990000001', '9990000001'],           // user typo: 11 digits — last 10 win
  ])('canonicalises %p -> %p', (input, expected) => {
    expect(normalizePhoneLast10(input)).toBe(expected);
  });

  it('returns null for inputs that look like an email', () => {
    expect(normalizePhoneLast10('owner@freshmart.com')).toBeNull();
  });

  it('returns null for too-short inputs', () => {
    expect(normalizePhoneLast10('12345')).toBeNull();
    expect(normalizePhoneLast10('')).toBeNull();
    expect(normalizePhoneLast10('   ')).toBeNull();
  });

  it('returns null for non-digit gibberish', () => {
    expect(normalizePhoneLast10('hello world')).toBeNull();
  });
});
