/**
 * Receipt Generator - Utility Function Tests
 * Tests for stripFormatMarkers and sanitizeForPrinter
 */

import {
  generatePickingListReceipt,
  stripFormatMarkers,
  sanitizeForPrinter,
} from '../receiptGenerator';

describe('receiptGenerator - utils', () => {
  describe('stripFormatMarkers', () => {
    it('should return plain text unchanged', () => {
      const text = 'Hello World';
      expect(stripFormatMarkers(text)).toBe('Hello World');
    });

    it('should strip ESC/POS bold markers from text', () => {
      const text = '\x1b\x45\x01TOTAL\x1b\x45\x00';
      expect(stripFormatMarkers(text)).toBe('TOTAL');
    });

    it('should strip ESC/POS underline markers from text', () => {
      const text = '\x1b\x2d\x01Header\x1b\x2d\x00';
      expect(stripFormatMarkers(text)).toBe('Header');
    });

    it('should handle receipt text with mixed format markers', () => {
      const receiptText = '\x1b\x45\x01PICKING LIST\x1b\x45\x00\nItem 1  5kg';
      expect(stripFormatMarkers(receiptText)).toBe('PICKING LIST\nItem 1  5kg');
    });

    it('should handle empty string', () => {
      expect(stripFormatMarkers('')).toBe('');
    });

    it('should strip CENTER_MARKER from receipt text', () => {
      const text = '\u0002PICKING LIST\n\u0002FRESHMART';
      const result = stripFormatMarkers(text);
      expect(result).toBe('PICKING LIST\nFRESHMART');
      expect(result).not.toContain('\u0002');
    });

    it('should strip BOLD_TAB_MARKER from receipt text', () => {
      const text = '\u0003GRAND TOTAL\t555';
      const result = stripFormatMarkers(text);
      expect(result).toBe('GRAND TOTAL\t555');
      expect(result).not.toContain('\u0003');
    });

    it('should strip CENTER_MARKER from generated receipt on 80mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: { name: 'Test Store', address: 'Test Address' },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            unit: 'kg',
            categoryId: 'test',
            categoryName: 'Test',
          },
        ],
        paperWidth: '80mm',
      });
      expect(receipt).toContain('\u0002');
      const stripped = stripFormatMarkers(receipt);
      expect(stripped).not.toContain('\u0002');
    });
  });

  describe('sanitizeForPrinter', () => {
    it('should return ASCII text unchanged', () => {
      const text = '| ITEM | QTY | RATE | AMT |\n| Rice | 5kg |  140 |  700 |';
      expect(sanitizeForPrinter(text)).toBe(text);
    });

    it('should replace Telugu characters with ? for single-byte codepage printers', () => {
      const text = 'ఆశీర్వాద్ ఆటా';
      const result = sanitizeForPrinter(text);
      expect(result).not.toMatch(/[\u0C00-\u0C7F]/);
    });

    it('should replace emoji characters with ? for single-byte codepage printers', () => {
      const text = '🌾 Atta';
      const result = sanitizeForPrinter(text);
      expect(result).not.toMatch(/[\uD800-\uDFFF]|[\u{1F000}-\u{1FFFF}]/u);
      expect(result).toContain('Atta');
    });

    it('should preserve receipt structure (pipes, dashes, equals) while replacing non-ASCII', () => {
      const text = '| మొత్తం   |  700 |\n==========';
      const result = sanitizeForPrinter(text);
      expect(result).toContain('|');
      expect(result).toContain('700');
      expect(result).toContain('==========');
    });

    it('should handle empty string', () => {
      expect(sanitizeForPrinter('')).toBe('');
    });

    it('should preserve newlines and whitespace', () => {
      const text = 'Line 1\n  Line 2\n';
      expect(sanitizeForPrinter(text)).toBe(text);
    });
  });
});
