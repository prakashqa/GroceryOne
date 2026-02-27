/**
 * Receipt Generator - Utility Function Tests
 * Tests for stripFormatMarkers and sanitizeForPrinter
 */

import {
  generatePickingListReceipt,
  stripFormatMarkers,
  sanitizeForPrinter,
  formatForPreview,
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

  describe('formatForPreview', () => {
    it('should return plain text without tabs unchanged', () => {
      expect(formatForPreview('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(formatForPreview('')).toBe('');
    });

    it('should strip CENTER_MARKER and BOLD_TAB_MARKER', () => {
      const text = '\u0002PICKING LIST\n\u0003GRAND TOTAL\t555';
      const result = formatForPreview(text);
      expect(result).not.toContain('\u0002');
      expect(result).not.toContain('\u0003');
    });

    it('should convert 5-column tab-separated header to 28-char padded line', () => {
      const line = 'NO\tITEM\tQTY\tRATE\tAMT';
      const result = formatForPreview(line);
      expect(result.length).toBe(28);
      expect(result).toContain('NO');
      expect(result).toContain('ITEM');
      expect(result).toContain('QTY');
      expect(result).toContain('RATE');
      expect(result).toContain('AMT');
      expect(result).not.toContain('\t');
    });

    it('should convert 5-column item row to 28-char padded line', () => {
      const line = '1\tBasmati Rice\t5kg\t140\t700';
      const result = formatForPreview(line);
      expect(result.length).toBe(28);
      expect(result).not.toContain('\t');
    });

    it('should truncate long item names with ellipsis in 5-column format', () => {
      const line = '1\tAashirvaad Whole Wheat Atta\t5kg\t48\t240';
      const result = formatForPreview(line);
      expect(result.length).toBe(28);
      // Name column is 10 chars, so name truncated to 9 + ellipsis
      expect(result).toMatch(/Aashirvaa\u2026/);
    });

    it('should convert 2-column label-value tab line to 28-char padded line', () => {
      const line = 'Date:\tFeb 27, 2026';
      const result = formatForPreview(line);
      expect(result.length).toBe(28);
      expect(result).toMatch(/^Date:/);
      expect(result).toMatch(/Feb 27, 2026$/);
      expect(result).not.toContain('\t');
    });

    it('should format GRAND TOTAL line as 2-column with right-aligned value', () => {
      const line = '\u0003GRAND TOTAL\t1,965';
      const result = formatForPreview(line);
      expect(result.length).toBe(28);
      expect(result).toMatch(/^GRAND TOTAL/);
      expect(result).toMatch(/1,965$/);
      expect(result).not.toContain('\t');
      expect(result).not.toContain('\u0003');
    });

    it('should pass through divider lines unchanged', () => {
      const line = '============================';
      expect(formatForPreview(line)).toBe(line);
    });

    it('should format a full 80mm receipt with no tabs remaining', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: { name: 'Test Store', address: 'Test Address' },
        items: [
          {
            name: 'Basmati Rice',
            quantity: 5,
            unit: 'kg',
            categoryId: 'rice',
            categoryName: 'Rice',
            price: 140,
            itemTotal: 700,
          },
        ],
        paperWidth: '80mm',
        paymentStatus: 'paid',
        paidAt: '2026-02-27T10:00:00.000Z',
      });
      const preview = formatForPreview(receipt);
      expect(preview).not.toContain('\t');
      expect(preview).not.toContain('\u0002');
      expect(preview).not.toContain('\u0003');
      // All non-empty lines should be <= 28 chars
      const lines = preview.split('\n');
      lines.forEach(line => {
        if (line.trim().length > 0) {
          expect(line.length).toBeLessThanOrEqual(28);
        }
      });
    });

    it('should not alter 58mm receipt text (no tabs present)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: { name: 'Test Store', address: 'Test Address' },
        items: [
          {
            name: 'Rice',
            quantity: 2,
            unit: 'kg',
            categoryId: 'rice',
            categoryName: 'Rice',
          },
        ],
        paperWidth: '58mm',
      });
      const preview = formatForPreview(receipt);
      const stripped = stripFormatMarkers(receipt);
      expect(preview).toBe(stripped);
    });
  });
});
