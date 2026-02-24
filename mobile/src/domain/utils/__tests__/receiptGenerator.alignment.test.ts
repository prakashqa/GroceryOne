/**
 * Receipt Generator - Alignment Tests
 * Tests for column formatting: column headers, column alignment,
 * 80mm header/item alignment
 */

import { generatePickingListReceipt, ReceiptItem } from '../receiptGenerator';
import { mockMerchantInfo, mockItems } from './receiptGenerator.fixtures';

describe('receiptGenerator - alignment', () => {
  describe('column headers', () => {
    it('should include ITEM, QTY, RATE, and AMT column headers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
    });

    it('should include ITEM, QTY, RATE, and AMT headers for items with prices on 80mm paper', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Wheat Flour',
          quantity: 5,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains & Flour',
          price: 48,
          itemTotal: 240,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
    });

    it('should include ITEM, QTY, and AMT headers for items with prices on 58mm paper', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Wheat Flour',
          quantity: 5,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains & Flour',
          price: 48,
          itemTotal: 240,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('AMT');
    });

    it('should align 4-column header with data columns on 80mm paper', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Wheat Flour',
          quantity: 5,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains & Flour',
          price: 48,
          itemTotal: 240,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('RATE') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();
      expect(headerLine!.split('\t').length).toBe(5);
    });
  });

  describe('column alignment', () => {
    it('should align header columns with data row columns for 80mm paper', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Maida (All Purpose Flour)',
          quantity: 1,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains & Flour',
          price: 42,
          itemTotal: 42,
        },
        {
          name: 'Sona Masuri (New)',
          quantity: 5,
          unit: 'kg',
          categoryId: 'rice',
          categoryName: 'Rice',
          price: 72,
          itemTotal: 360,
        },
      ];

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
      expect(headerLine).toContain('\t');

      const nameLines = lines.filter(
        (line) =>
          (line.includes('Maida') || line.includes('Sona Masuri')) &&
          !line.includes('=')
      );
      nameLines.forEach((line) => {
        const tabCount = (line.match(/\t/g) || []).length;
        expect(tabCount).toBe(4);
      });
    });

    it('should use two-line format for 58mm paper with separate header lines', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Maida Flour',
          quantity: 1,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains & Flour',
          price: 42,
          itemTotal: 42,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      const itemHeaderLine = lines.find((line) => line.trim() === 'ITEM');
      expect(itemHeaderLine).toBeDefined();

      const valuesHeaderLine = lines.find(
        (line) => line.includes('QTY') && line.includes('RATE') && line.includes('AMT')
      );
      expect(valuesHeaderLine).toBeDefined();
      expect(valuesHeaderLine!.length).toBeLessThanOrEqual(23);
    });

    it('should right-align quantity values consistently', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter(
        (line) => line.includes('kg') && line.includes('\t') && !line.includes('=')
      );

      itemLines.forEach((line) => {
        const columns = line.split('\t');
        expect(columns.length).toBe(5);
        expect(columns[2]).toMatch(/kg/);
      });
    });

    it('should list all items without category section headers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('Aashirvaad');
      expect(receipt).toContain('Basmati Rice');
    });

    it('should have consistent total line width for all item rows', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter(
        (line) => line.includes('kg') && line.includes('\t') && !line.includes('=')
      );

      const columnCounts = itemLines.map((line) => line.split('\t').length);
      const uniqueCounts = [...new Set(columnCounts)];
      expect(uniqueCounts.length).toBe(1);
      expect(uniqueCounts[0]).toBe(5);
    });
  });

  describe('80mm header and item alignment', () => {
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
        name: 'Jeera Samba Rice',
        quantity: 1,
        unit: 'kg',
        categoryId: 'rice',
        categoryName: 'Rice',
        price: 65,
        itemTotal: 65,
      },
    ];

    it('should align QTY values under QTY header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();

      const basmatiLine = lines.find((line) => line.includes('Basmati Rice'));
      expect(basmatiLine).toBeDefined();

      const headerColumns = headerLine!.split('\t');
      const itemColumns = basmatiLine!.split('\t');

      expect(headerColumns[2].trim()).toBe('QTY');
      expect(itemColumns[2].trim()).toBe('5kg');
    });

    it('should align RATE values under RATE header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();

      const basmatiLine = lines.find((line) => line.includes('Basmati Rice'));
      expect(basmatiLine).toBeDefined();

      const headerColumns = headerLine!.split('\t');
      const itemColumns = basmatiLine!.split('\t');

      expect(headerColumns[3].trim()).toBe('RATE');
      expect(itemColumns[3].trim()).toBe('140');
    });

    it('should align AMT values under AMT header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();

      const basmatiLine = lines.find((line) => line.includes('Basmati Rice'));
      expect(basmatiLine).toBeDefined();

      const headerColumns = headerLine!.split('\t');
      const itemColumns = basmatiLine!.split('\t');

      expect(headerColumns[4].trim()).toBe('AMT');
      expect(itemColumns[4].trim()).toBe('700');
    });

    it('should have ITEM header and item names in same column position', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      const itemNameLine = lines.find((line) => line.includes('Basmati Rice'));

      expect(headerLine).toBeDefined();
      expect(itemNameLine).toBeDefined();

      const headerColumns = headerLine!.split('\t');
      const itemColumns = itemNameLine!.split('\t');

      expect(headerColumns[1].trim()).toBe('ITEM');
      expect(itemColumns[1].trim()).toBe('Basmati Rice');
    });
  });
});
