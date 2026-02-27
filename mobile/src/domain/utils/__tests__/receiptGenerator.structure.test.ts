/**
 * Receipt Generator - Structure Tests
 * Tests for receipt layout: cart name, merchant header, title/metadata,
 * summary stats, item listing, footer, categories, empty cart, dividers
 */

import { generatePickingListReceipt, ReceiptItem } from '../receiptGenerator';
import { mockMerchantInfo, mockItems } from './receiptGenerator.fixtures';

describe('receiptGenerator - structure', () => {
  describe('cart name display', () => {
    it('should display cart name instead of PICKING LIST when cartName is provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        cartName: 'My Cart 1',
      });

      expect(receipt).toContain('MY CART 1');
      expect(receipt).not.toContain('PICKING LIST');
    });

    it('should display cart name in uppercase when provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        cartName: 'Bulk Order',
      });

      expect(receipt).toContain('BULK ORDER');
    });

    it('should fallback to PICKING LIST when cartName is not provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('PICKING LIST');
    });
  });

  describe('merchant header', () => {
    it('should include PICKING LIST title at the top when no cartName', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('PICKING LIST');
    });

    it('should include merchant name prominently at the top', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('PRAKASH GROCERIES');
    });

    it('should include merchant address below the name', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('Main Street, Vizag');
    });

    it('should include phone number when provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: {
          ...mockMerchantInfo,
          phone: '+91 98765 43210',
        },
        items: mockItems,
      });

      expect(receipt).toContain('+91 98765 43210');
    });
  });

  describe('document title and metadata', () => {
    it('should include date in readable format', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toMatch(/Date\s*:.*\d{2}\s+\w{3}\s+\d{4}/);
    });

    it('should include time', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toMatch(/Time\s*:.*\d{1,2}:\d{2}\s*(am|pm)/i);
    });
  });

  describe('summary statistics', () => {
    it('should NOT include Categories line in receipt', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).not.toContain('Categories:');
    });

    it('should include unique items count', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toMatch(/Unique Items\s*:.*4/);
    });

    it('should NOT include total quantity (synced with Cart Review screen)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).not.toMatch(/Total Quantity/);
    });

    it('should use tab-separated format for summary values on 80mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const uniqueItemsLine = lines.find((line) =>
        line.includes('Unique Items')
      );

      expect(uniqueItemsLine).toBeDefined();
      expect(uniqueItemsLine).toContain('\t');
    });
  });

  describe('item listing', () => {
    it('should include ITEM, QTY, RATE, AMT column headers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
    });

    it('should format item rows correctly: unit in item name, QTY numeric, RATE and AMT columns', () => {
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

      expect(receipt).toContain('Wheat Flour');
      expect(receipt).toMatch(/Wheat Flour\s+5kg/);
      expect(receipt).toMatch(/\s48\b/);
      expect(receipt).toMatch(/\s240\b/);
    });

    it('should list all items with unit in name and numeric quantity', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('Aashirvaad Atta');
      expect(receipt).toContain('Basmati Rice');
      expect(receipt).toContain('Brown Rice');
      expect(receipt).toContain('5kg');
      expect(receipt).toContain('1kg');
    });

    it('should align quantities properly at the right edge', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter((line) => line.includes('kg') && !line.includes('CATEGORY'));
      expect(itemLines.length).toBeGreaterThan(0);
    });
  });

  describe('footer', () => {
    it('should include Thank You message instead of GroOne attribution', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('Thank You! Shop With Us');
      expect(receipt).not.toContain('Generated by GroOne');
    });

    it('should end with 6 trailing empty lines after the last bold divider for paper feed', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Last 6 lines should be empty — provides ~200px whitespace in bitmap
      // so footer is well above the thermal print head cutoff. Since printText
      // paper feed can silently fail over BLE, the bitmap itself must provide
      // sufficient paper advancement.
      const lastSix = lines.slice(-6);
      expect(lastSix.every(line => line === '')).toBe(true);
      expect(lastSix.length).toBe(6);
    });

    it('should end with 6 trailing empty lines for 58mm paper as well', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      const lastSix = lines.slice(-6);
      expect(lastSix.every(line => line === '')).toBe(true);
      expect(lastSix.length).toBe(6);
    });

    describe('footer gap with payment section', () => {
      const pricedItems: ReceiptItem[] = [
        {
          name: 'Wheat Flour / Atta',
          quantity: 5,
          unit: 'kg',
          categoryId: 'grains',
          categoryName: 'Grains',
          price: 48,
          itemTotal: 240,
        },
      ];

      it('when paid, footer should directly follow payment closing divider on 80mm', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
          paymentStatus: 'paid',
          paidAt: '2026-02-26T11:44:00.000Z',
        });

        const lines = receipt.split('\n');
        const footerIdx = lines.findIndex(line => line.includes('Thank You'));
        expect(footerIdx).toBeGreaterThan(0);

        // Line before footer: bold divider (payment section's closing divider)
        const lineBeforeFooter = lines[footerIdx - 1];
        expect(lineBeforeFooter).toMatch(/^=+$/);

        // Two lines before footer: should be payment data, NOT an empty line
        const twoBeforeFooter = lines[footerIdx - 2];
        expect(twoBeforeFooter).not.toBe('');
      });

      it('when NOT paid, should have empty line + bold divider before footer', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        const footerIdx = lines.findIndex(line => line.includes('Thank You'));
        expect(footerIdx).toBeGreaterThan(0);

        // Line before footer: bold divider (footer opening)
        const lineBeforeFooter = lines[footerIdx - 1];
        expect(lineBeforeFooter).toMatch(/^=+$/);

        // Two lines before footer: empty line (spacing after grand total)
        const twoBeforeFooter = lines[footerIdx - 2];
        expect(twoBeforeFooter).toBe('');
      });

      it('when paid, GRAND TOTAL should directly precede payment divider (no empty line gap)', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
          paymentStatus: 'paid',
          paidAt: '2026-02-26T11:44:00.000Z',
        });

        const lines = receipt.split('\n');
        // Find GRAND TOTAL line (has BOLD_TAB_MARKER \u0003)
        const grandTotalIdx = lines.findIndex(line => line.includes('GRAND TOTAL') || line.startsWith('\u0003'));
        expect(grandTotalIdx).toBeGreaterThan(0);

        // Line after GRAND TOTAL should be bold divider (payment section opener), NOT empty
        const lineAfterGrandTotal = lines[grandTotalIdx + 1];
        expect(lineAfterGrandTotal).toMatch(/^=+$/);
        expect(lineAfterGrandTotal).not.toBe('');
      });

      it('when paid on 58mm, footer should directly follow payment closing divider', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
          paymentStatus: 'paid',
          paidAt: '2026-02-26T11:44:00.000Z',
        });

        const lines = receipt.split('\n');
        const footerIdx = lines.findIndex(line => line.includes('Thank You'));
        expect(footerIdx).toBeGreaterThan(0);

        // Line before footer: bold divider (payment closing = footer separator)
        const lineBeforeFooter = lines[footerIdx - 1];
        expect(lineBeforeFooter).toMatch(/^=+$/);

        // Two lines before footer: should be payment data, NOT an empty line
        const twoBeforeFooter = lines[footerIdx - 2];
        expect(twoBeforeFooter).not.toBe('');
      });
    });
  });

  describe('multiple categories', () => {
    it('should handle items from multiple categories', () => {
      const multiCategoryItems: ReceiptItem[] = [
        ...mockItems,
        {
          name: 'Toor Dal',
          quantity: 2,
          unit: 'kg',
          categoryId: 'dal',
          categoryName: 'Dals & Pulses',
          categoryIcon: '🫘',
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: multiCategoryItems,
      });

      expect(receipt).not.toContain('Categories:');
      expect(receipt).toContain('Toor Dal');
    });
  });

  describe('empty cart', () => {
    it('should handle empty items gracefully', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: [],
      });

      expect(receipt).toContain('PRAKASH GROCERIES');
      expect(receipt).toMatch(/Unique Items\s*:.*0/);
      expect(receipt).not.toMatch(/Total Quantity/);
    });
  });

  describe('summary section dividers', () => {
    it('should have clean divider above Unique Items (after Time)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const uniqueItemsLineIdx = lines.findIndex((line) => line.includes('Unique Items'));
      expect(uniqueItemsLineIdx).toBeGreaterThan(0);

      const dividerLine = lines[uniqueItemsLineIdx - 1];
      expect(dividerLine).not.toContain('|');
      expect(dividerLine).toMatch(/^-+$/);
    });

    it('should NOT have vertical pipe characters in divider below Unique Items', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const uniqueItemsLineIdx = lines.findIndex((line) => line.includes('Unique Items'));
      expect(uniqueItemsLineIdx).toBeGreaterThan(0);

      const dividerLine = lines[uniqueItemsLineIdx + 1];
      expect(dividerLine).not.toContain('|');
      expect(dividerLine).toMatch(/^-+$/);
    });
  });
});
