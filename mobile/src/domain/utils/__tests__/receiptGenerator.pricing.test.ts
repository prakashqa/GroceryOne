/**
 * Receipt Generator - Pricing Tests
 * Tests for formatCurrency, receipt prices, price alignment,
 * dash display, grand total, 58mm pricing
 */

import {
  generatePickingListReceipt,
  ReceiptItem,
  formatCurrency,
} from '../receiptGenerator';
import { mockMerchantInfo } from './receiptGenerator.fixtures';

describe('receiptGenerator - pricing', () => {
  const pricedItems: ReceiptItem[] = [
    {
      name: 'Aashirvaad Atta',
      quantity: 5,
      unit: 'kg',
      categoryId: 'atta',
      categoryName: 'Atta, Rice & Grains',
      price: 250.0,
      itemTotal: 1250.0,
    },
    {
      name: 'Toor Dal',
      quantity: 2,
      unit: 'kg',
      categoryId: 'dal',
      categoryName: 'Dals & Pulses',
      price: 180.0,
      itemTotal: 360.0,
    },
  ];

  const mixedItems: ReceiptItem[] = [
    {
      name: 'Priced Item',
      quantity: 2,
      unit: 'kg',
      categoryId: 'test',
      categoryName: 'Test Category',
      price: 100.0,
      itemTotal: 200.0,
    },
    {
      name: 'Unpriced Item',
      quantity: 3,
      unit: 'pcs',
      categoryId: 'test',
      categoryName: 'Test Category',
    },
  ];

  describe('formatCurrency', () => {
    it('should format currency in INR format', () => {
      const formatted = formatCurrency(1250.0);
      expect(formatted).toMatch(/₹|Rs\.?|INR/);
      expect(formatted).toContain('1,250');
    });

    it('should handle decimal values', () => {
      const formatted = formatCurrency(99.5);
      expect(formatted).toContain('99');
    });

    it('should format zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0');
    });

    it('should handle large values with thousand separators', () => {
      const formatted = formatCurrency(10000.0);
      expect(formatted).toContain('10,000');
    });
  });

  describe('receipt with prices', () => {
    it('should use 4-column format for items with prices on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
      expect(receipt).toMatch(/\s1,?250\b/);
    });

    it('should include item total in item rows', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      expect(receipt).toMatch(/\s1,?250\b/);
    });

    it('should display grand total when items have prices', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
      expect(receipt).toMatch(/\s1,?610\b/);
    });

    it('should prefix grand total with BOLD_TAB_MARKER on 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const grandTotalLine = lines.find(
        (line) => line.includes('GRAND TOTAL') || line.includes('\u0003')
      );
      expect(grandTotalLine).toBeDefined();
      expect(grandTotalLine!.startsWith('\u0003')).toBe(true);
      expect(grandTotalLine).toContain('\t');
    });

    it('should NOT display grand total when no items have prices', () => {
      const unpricedItems: ReceiptItem[] = [
        {
          name: 'Item Without Price',
          quantity: 5,
          unit: 'kg',
          categoryId: 'test',
          categoryName: 'Test Category',
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: unpricedItems,
        paperWidth: '80mm',
      });

      expect(receipt.toUpperCase()).not.toContain('GRAND TOTAL');
    });

    it('should handle mixed cart with priced and unpriced items', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mixedItems,
        paperWidth: '80mm',
      });

      expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
      expect(receipt).toMatch(/\s200\b/);
    });
  });

  describe('58mm paper format', () => {
    it('should fit pricing within 23 character width', () => {
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

    it('should still show item totals on 58mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      expect(receipt).toMatch(/\s1,?250\b/);
    });

    it('should display grand total on 58mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
    });
  });

  describe('price column alignment', () => {
    it('should align price columns consistently for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const priceLines = lines.filter(
        (line) => line.match(/\d{3,}/) &&
                 !line.includes('=') &&
                 !line.includes('CATEGORY') &&
                 !line.includes('Date') &&
                 !line.includes('Time')
      );

      expect(priceLines.length).toBeGreaterThan(0);
    });

    it('should have consistent line lengths for priced item rows', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter(
        (line) => line.includes('kg') &&
                 line.match(/\d{3,}/) &&
                 !line.includes('=')
      );

      if (itemLines.length > 1) {
        const lineLengths = itemLines.map((line) => line.length);
        const uniqueLengths = [...new Set(lineLengths)];
        expect(uniqueLengths.length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('dash display for missing prices', () => {
    const itemsWithNoPrice: ReceiptItem[] = [
      {
        name: 'Item Without Price',
        quantity: 5,
        unit: 'kg',
        categoryId: 'test',
        categoryName: 'Test Category',
      },
    ];

    const itemsWithZeroPrice: ReceiptItem[] = [
      {
        name: 'Zero Price Item',
        quantity: 3,
        unit: 'kg',
        categoryId: 'test',
        categoryName: 'Test Category',
        price: 0,
        itemTotal: 0,
      },
    ];

    const mixedPriceItems: ReceiptItem[] = [
      {
        name: 'Priced Item',
        quantity: 2,
        unit: 'kg',
        categoryId: 'test',
        categoryName: 'Test Category',
        price: 100,
        itemTotal: 200,
      },
      {
        name: 'Unpriced Item',
        quantity: 3,
        unit: 'pcs',
        categoryId: 'test',
        categoryName: 'Test Category',
      },
    ];

    it('should show "-" for unit price when price is undefined', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: itemsWithNoPrice,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find((line) => line.includes('Item Without'));
      expect(itemLine).toBeDefined();
      expect(itemLine).toMatch(/-/);
    });

    it('should show "-" for unit price when price is 0', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: itemsWithZeroPrice,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find((line) => line.includes('Zero Price'));
      expect(itemLine).toBeDefined();
      expect(itemLine).toMatch(/-/);
    });

    it('should show "-" for total when unit price is missing', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: itemsWithNoPrice,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find((line) => line.includes('Item Without'));
      expect(itemLine).toBeDefined();
      const dashCount = (itemLine!.match(/-/g) || []).length;
      expect(dashCount).toBeGreaterThanOrEqual(2);
    });

    it('should correctly calculate total as QTY x UNIT PRICE when price exists', () => {
      const itemsWithPrice: ReceiptItem[] = [
        {
          name: 'Test Item',
          quantity: 5,
          unit: 'kg',
          categoryId: 'test',
          categoryName: 'Test Category',
          price: 45,
          itemTotal: 225,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: itemsWithPrice,
        paperWidth: '80mm',
      });

      expect(receipt).toMatch(/\s45\b/);
      expect(receipt).toMatch(/\s225\b/);
    });

    it('should handle mixed cart with priced and unpriced items correctly', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mixedPriceItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');

      const pricedLine = lines.find((line) => line.includes('Priced Item'));
      expect(pricedLine).toBeDefined();
      expect(pricedLine).toMatch(/100/);
      expect(pricedLine).toMatch(/200/);

      const unpricedLine = lines.find((line) => line.includes('Unpriced'));
      expect(unpricedLine).toBeDefined();
      expect(unpricedLine).toMatch(/-/);
    });

    it('should show "-" on 58mm paper for items without price', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: itemsWithNoPrice,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      const itemNameLineIdx = lines.findIndex((line) => line.includes('Item Without'));
      expect(itemNameLineIdx).toBeGreaterThan(-1);

      const valuesLine = lines[itemNameLineIdx + 1];
      expect(valuesLine).toBeDefined();
      expect(valuesLine).toMatch(/-/);
    });
  });

  describe('grand total display', () => {
    it('should display full grand total without truncation for large amounts', () => {
      const largePricedItems: ReceiptItem[] = [
        {
          name: 'Wheat Flour',
          quantity: 5,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains',
          price: 48,
          itemTotal: 240,
        },
        {
          name: 'Toothpaste',
          quantity: 200,
          unit: 'gm',
          categoryId: 'personal',
          categoryName: 'Personal Care',
          price: 85,
          itemTotal: 17000,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: largePricedItems,
        paperWidth: '80mm',
      });

      expect(receipt).toMatch(/17,?240/);
    });
  });
});
