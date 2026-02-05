/**
 * Formatter utility tests (TDD - tests first)
 */

import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatPhone,
  formatWeight,
  formatOrderNumber,
  truncateText,
} from './formatters';

describe('Formatter Utils', () => {
  describe('formatCurrency', () => {
    it('should format amount in INR by default', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1234.56)).toBe('₹1,234.56');
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500)).toBe('-₹500.00');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('₹10,00,000.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('₹11.00');
      expect(formatCurrency(10.001)).toBe('₹10.00');
    });
  });

  describe('formatCurrencyCompact', () => {
    it('should format amount without rupee symbol and without decimals', () => {
      expect(formatCurrencyCompact(1000)).toBe('1,000');
      expect(formatCurrencyCompact(21333)).toBe('21,333');
      expect(formatCurrencyCompact(0)).toBe('0');
    });

    it('should use Indian numbering system for large amounts', () => {
      expect(formatCurrencyCompact(1000000)).toBe('10,00,000');
    });

    it('should round off decimals', () => {
      expect(formatCurrencyCompact(1234.56)).toBe('1,235');
      expect(formatCurrencyCompact(292.0)).toBe('292');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrencyCompact(-500)).toBe('-500');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2025-01-15T10:30:00Z');

    it('should format date in default format', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Jan 15, 2025/);
    });

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/15\/01\/2025|1\/15\/2025/);
    });

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toMatch(/January 15, 2025/);
    });

    it('should format date with time', () => {
      const result = formatDate(testDate, 'datetime');
      expect(result).toMatch(/Jan 15, 2025/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle string dates', () => {
      const result = formatDate('2025-01-15');
      expect(result).toMatch(/Jan 15, 2025/);
    });
  });

  describe('formatPhone', () => {
    it('should format 10-digit phone number', () => {
      expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    });

    it('should handle phone with country code', () => {
      expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
      expect(formatPhone('919876543210')).toBe('+91 98765 43210');
    });

    it('should return original if invalid', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone('')).toBe('');
    });
  });

  describe('formatWeight', () => {
    it('should format weight in kg', () => {
      expect(formatWeight(1, 'kg')).toBe('1 kg');
      expect(formatWeight(2.5, 'kg')).toBe('2.5 kg');
    });

    it('should format weight in grams', () => {
      expect(formatWeight(500, 'g')).toBe('500 g');
    });

    it('should format volume in liters', () => {
      expect(formatWeight(1, 'l')).toBe('1 L');
      expect(formatWeight(500, 'ml')).toBe('500 ml');
    });

    it('should format pieces', () => {
      expect(formatWeight(1, 'piece')).toBe('1 pc');
      expect(formatWeight(6, 'piece')).toBe('6 pcs');
    });

    it('should format packs', () => {
      expect(formatWeight(1, 'pack')).toBe('1 pack');
      expect(formatWeight(3, 'pack')).toBe('3 packs');
    });
  });

  describe('formatOrderNumber', () => {
    it('should format order ID to display number', () => {
      expect(formatOrderNumber('abc123')).toBe('ORD-ABC123');
    });

    it('should handle UUID format', () => {
      expect(formatOrderNumber('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
        'ORD-A1B2C3D4'
      );
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('Hello World This is a long text', 15)).toBe('Hello World...');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should use custom suffix', () => {
      expect(truncateText('Hello World', 8, '…')).toBe('Hello…');
    });
  });
});
