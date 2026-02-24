/**
 * Receipt Generator - Thermal Printer Tests
 * Tests for thermal compatibility, 58mm two-line format,
 * CENTER_MARKER centering, pipe-free format, tab-separated label-value
 */

import { generatePickingListReceipt, ReceiptItem } from '../receiptGenerator';
import { mockMerchantInfo, mockItems } from './receiptGenerator.fixtures';

describe('receiptGenerator - thermal', () => {
  describe('thermal printer compatibility', () => {
    it('should have lines no longer than 32 characters for 58mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        expect(adjustedLength).toBeLessThanOrEqual(23);
      });
    });

    it('should have lines no longer than 28 characters for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        if (line.includes('\t') || line.startsWith('\u0002') || line.startsWith('\u0003')) return;
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        expect(adjustedLength).toBeLessThanOrEqual(28);
      });
    });

    it('should use simple ASCII characters for dividers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toMatch(/[-=]{10,}/);
    });
  });

  describe('58mm two-line format with RATE column', () => {
    const pricedItems: ReceiptItem[] = [
      {
        name: 'Basmati Rice',
        quantity: 5,
        unit: 'kg',
        categoryId: 'rice',
        categoryName: 'Rice',
        price: 140,
        itemTotal: 700,
      },
      {
        name: 'Cumin Seeds',
        quantity: 500,
        unit: 'gm',
        categoryId: 'spices',
        categoryName: 'Spices',
        price: 85,
        itemTotal: 42500,
      },
    ];

    it('should show RATE column on 58mm paper using two-line format', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      expect(receipt).toMatch(/140/);
      expect(receipt).toMatch(/85/);
    });

    it('should show item name on first line and values on second line for 58mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');

      const basmatiNameLineIdx = lines.findIndex((line) => line.includes('Basmati Rice'));
      expect(basmatiNameLineIdx).toBeGreaterThan(-1);

      const valuesLine = lines[basmatiNameLineIdx + 1];
      expect(valuesLine).toBeDefined();
      expect(valuesLine).toMatch(/5/);
      expect(valuesLine).toMatch(/140/);
      expect(valuesLine).toMatch(/700/);
    });

    it('should keep all lines within 23 character limit for 58mm two-line format', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        expect(adjustedLength).toBeLessThanOrEqual(23);
      });
    });

    it('should show full item name without truncation on 58mm two-line format', () => {
      const longNameItems: ReceiptItem[] = [
        {
          name: 'Coriander Seeds',
          quantity: 250,
          unit: 'gm',
          categoryId: 'spices',
          categoryName: 'Spices',
          price: 45,
          itemTotal: 11250,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: longNameItems,
        paperWidth: '58mm',
      });

      expect(receipt).toContain('Coriander Seeds');
    });
  });

  describe('CENTER_MARKER for pixel-based centering', () => {
    it('should use CENTER_MARKER prefix for header lines on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const titleLine = lines.find((line) => line.includes('PICKING LIST'));
      const merchantLine = lines.find((line) => line.includes('PRAKASH GROCERIES'));
      const addressLine = lines.find((line) => line.includes('Main Street, Vizag'));

      expect(titleLine!.startsWith('\u0002')).toBe(true);
      expect(merchantLine!.startsWith('\u0002')).toBe(true);
      expect(addressLine!.startsWith('\u0002')).toBe(true);
    });

    it('should use space-based centering for header lines on 58mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      const titleLine = lines.find((line) => line.includes('PICKING LIST'));
      expect(titleLine).toBeDefined();
      expect(titleLine!.startsWith('\u0002')).toBe(false);
      expect(titleLine!.startsWith(' ')).toBe(true);
    });

    it('should use CENTER_MARKER prefix for footer on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const footerLine = lines.find((line) => line.includes('Thank You'));
      expect(footerLine!.startsWith('\u0002')).toBe(true);
    });
  });

  describe('pipe-free format (space-separated columns)', () => {
    const pricedItems: ReceiptItem[] = [
      {
        name: 'Wheat Flour / Atta',
        quantity: 5,
        unit: 'kg',
        categoryId: 'grains',
        categoryName: 'Atta & Flour',
        price: 48,
        itemTotal: 240,
      },
      {
        name: 'Maida',
        quantity: 1,
        unit: 'kg',
        categoryId: 'grains',
        categoryName: 'Atta & Flour',
        price: 42,
        itemTotal: 42,
      },
    ];

    it('should NOT have pipe characters in header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('ITEM') && line.includes('QTY')
      );

      expect(headerLine).toBeDefined();
      expect(headerLine).not.toContain('|');
    });

    it('should NOT have pipe characters in item rows for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find((line) => line.includes('Maida'));

      expect(itemLine).toBeDefined();
      expect(itemLine).not.toContain('|');
    });

    it('should NOT have pipe characters in summary section for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemsLine = lines.find((line) => line.includes('Unique Items'));

      expect(receipt).not.toContain('Categories:');
      expect(itemsLine).toBeDefined();
      expect(itemsLine).not.toContain('|');
    });

    it('should have NO pipe characters anywhere in the 80mm receipt', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        expect(line).not.toContain('|');
      });
    });

    it('should maintain consistent line lengths for item rows on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      const secondItemLine = lines.find((line) => line.includes('Maida'));

      expect(headerLine).toBeDefined();
      expect(secondItemLine).toBeDefined();

      const headerCols = headerLine!.split('\t').length;
      const itemCols = secondItemLine!.split('\t').length;
      expect(headerCols).toBe(5);
      expect(itemCols).toBe(5);
    });
  });

  describe('tab-separated label-value format', () => {
    it('should use tab-separated format for label-value lines on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const dateLine = lines.find((line) => line.includes('Date:'));
      const timeLine = lines.find((line) => line.includes('Time:'));
      const uniqueItemsLine = lines.find((line) => line.includes('Unique Items'));

      expect(dateLine).toContain('\t');
      expect(timeLine).toContain('\t');
      expect(uniqueItemsLine).toContain('\t');
    });

    it('should use character-padded format for label-value lines on 58mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      const dateLine = lines.find((line) => line.includes('Date:'));
      expect(dateLine).toBeDefined();
      expect(dateLine).not.toContain('\t');
    });
  });
});
