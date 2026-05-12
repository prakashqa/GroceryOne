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

    it('should use grandTotalOverride when provided (paid carts use paidAmount)', () => {
      // Repro of the user's bug: paidAmount was 5,144 but recomputing from
      // current item priceSnapshots gives 4,824. The print path must trust
      // paidAmount for paid carts via the grandTotalOverride option.
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems, // would compute to 1,610
        paperWidth: '80mm',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        grandTotalOverride: 5144,
      });

      expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
      // The override (5,144) appears, the recomputed total (1,610) does not.
      expect(receipt).toMatch(/\s5,?144\b/);
      expect(receipt).not.toMatch(/\s1,?610\b/);
    });

    it('should ignore grandTotalOverride when there are no priced items', () => {
      // Defensive: if a paid cart somehow has zero priceSnapshots, we still
      // skip the GRAND TOTAL section to avoid printing a phantom total.
      const unpricedItems: ReceiptItem[] = [
        {
          name: 'Unpriced',
          quantity: 1,
          unit: 'pcs',
          categoryId: 'test',
          categoryName: 'Test',
        },
      ];
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: unpricedItems,
        paperWidth: '80mm',
        paymentStatus: 'paid',
        grandTotalOverride: 999,
      });

      expect(receipt.toUpperCase()).not.toContain('GRAND TOTAL');
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

    // Regression: physical 58mm prints were missing RATE / AMT / Date / Time /
    // GRAND TOTAL / Payment Status / Paid at values because an unrecognised
    // paperWidth (e.g. unhydrated settings) silently fell through to the 80mm
    // tab-columnar format, then got bitmap-clipped by the narrower paper.
    describe('format-shape guarantees (regression)', () => {
      it('uses two-line item rows with no tabs', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
        });

        const lines = receipt.split('\n');
        const itemNameIdx = lines.findIndex((l) => l.includes('Aashirvaad'));
        expect(itemNameIdx).toBeGreaterThan(-1);
        // Item name line: no tabs (would indicate 80mm tab-columnar fallback)
        expect(lines[itemNameIdx]).not.toContain('\t');
        // Following line carries QTY / RATE / AMT values (5kg + 250 + 1,250)
        const valuesLine = lines[itemNameIdx + 1];
        expect(valuesLine).toBeDefined();
        expect(valuesLine).not.toContain('\t');
        expect(valuesLine).toMatch(/5kg/);
        expect(valuesLine).toMatch(/250/);
        expect(valuesLine).toMatch(/1,?250/);
      });

      it('column header is two lines with no tabs (ITEM then QTY RATE AMT)', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
        });

        const lines = receipt.split('\n');
        // The 58mm format renders the header as: "ITEM" alone, then the values header.
        // Reject any line that looks like the 80mm 5-column tab format.
        const tabHeader = lines.find((l) => /^NO\tITEM\tQTY\tRATE\tAMT$/.test(l));
        expect(tabHeader).toBeUndefined();

        const itemHeaderIdx = lines.findIndex((l) => l.trim() === 'ITEM');
        expect(itemHeaderIdx).toBeGreaterThan(-1);
        const valuesHeader = lines[itemHeaderIdx + 1];
        expect(valuesHeader).toBeDefined();
        expect(valuesHeader).toContain('QTY');
        expect(valuesHeader).toContain('RATE');
        expect(valuesHeader).toContain('AMT');
        expect(valuesHeader).not.toContain('\t');
      });

      it('label-value lines (Date/Time/Grand Total/Payment) use padding, not tabs', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
          paymentStatus: 'paid',
          paidAt: new Date('2026-05-10T15:33:00').toISOString(),
        });

        const lines = receipt.split('\n');
        // 58mm padding truncates labels to 13 chars (23 - 10 for value column),
        // so search by leading prefix that survives truncation.
        const labelPrefixes = ['Date:', 'Time:', 'GRAND TOTAL', 'Payment', 'Paid at'];
        labelPrefixes.forEach((prefix) => {
          const line = lines.find((l) => l.includes(prefix));
          expect(line).toBeDefined();
          // 58mm uses character padding; tabs would indicate the 80mm fallback
          // and cause the value to be clipped off the right edge of the paper.
          expect(line).not.toContain('\t');
        });

        // Grand total value (1,610) must be on the same line as the label
        const gtLine = lines.find((l) => l.includes('GRAND TOTAL'));
        expect(gtLine).toMatch(/1,?610/);

        // Payment status value (PAID) must be on the same line as the label
        const psLine = lines.find((l) => l.includes('Payment'));
        expect(psLine).toMatch(/PAID/);
      });

      it('falls back to 58mm format (not 80mm) when paperWidth is unrecognised', () => {
        // If settings haven't hydrated and paperWidth is undefined or a stray
        // value, we'd rather over-clip a wide receipt onto narrow paper than
        // lose the right-hand columns to bitmap clipping.
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: undefined,
        });

        const lines = receipt.split('\n');
        const tabHeader = lines.find((l) => /^NO\tITEM\tQTY\tRATE\tAMT$/.test(l));
        expect(tabHeader).toBeUndefined();
      });
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

    it('should have grand total equal to sum of rounded item AMTs (no rounding mismatch)', () => {
      // Items with fractional totals that round differently when summed vs individually
      // 3.6 + 5.6 = 9.2 → rounds to 9 (if summed first)
      // But Math.round(3.6) + Math.round(5.6) = 4 + 6 = 10
      const fractionalItems: ReceiptItem[] = [
        {
          name: 'Black Pepper',
          quantity: 2,
          unit: 'gm',
          categoryId: 'spice',
          categoryName: 'Spices',
          price: 1800,
          itemTotal: 3.6,
        },
        {
          name: 'Cinnamon',
          quantity: 1,
          unit: 'gm',
          categoryId: 'spice',
          categoryName: 'Spices',
          price: 5600,
          itemTotal: 5.6,
        },
        {
          name: 'Rice',
          quantity: 5,
          unit: 'kg',
          categoryId: 'rice',
          categoryName: 'Rice',
          price: 140,
          itemTotal: 700,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: fractionalItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find all item AMT values from receipt (last number on each 5-column tab line)
      const itemAmts: number[] = [];
      lines.forEach(line => {
        // Skip format markers, dividers, and non-tab lines
        // eslint-disable-next-line no-control-regex
        const stripped = line.replace(/[\x02\x03]/g, '');
        if (!stripped.includes('\t') || stripped.includes('GRAND TOTAL')) return;
        const parts = stripped.split('\t');
        if (parts.length === 5) {
          const amt = parseInt(parts[4].replace(/,/g, ''), 10);
          if (!isNaN(amt)) itemAmts.push(amt);
        }
      });

      // Find GRAND TOTAL value
      const grandTotalLine = lines.find(l => l.includes('GRAND TOTAL'));
      expect(grandTotalLine).toBeDefined();
      // eslint-disable-next-line no-control-regex
      const gtParts = grandTotalLine!.replace(/[\x03]/g, '').split('\t');
      const grandTotalValue = parseInt(gtParts[gtParts.length - 1].replace(/,/g, ''), 10);

      // Sum of printed AMTs should equal printed GRAND TOTAL
      const sumOfAmts = itemAmts.reduce((s, v) => s + v, 0);
      expect(sumOfAmts).toBe(grandTotalValue);
    });
  });

  describe('receipt unit display', () => {
    it('should display "g" instead of "gm" in QTY column on 80mm receipt', () => {
      const gmItems: ReceiptItem[] = [
        {
          name: 'Cumin Seeds',
          quantity: 250,
          unit: 'gm',
          categoryId: 'spice',
          categoryName: 'Spices',
          price: 320,
          itemTotal: 80,
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: gmItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find(l => l.includes('Cumin'));
      expect(itemLine).toBeDefined();
      // Should show "250g" not "250gm"
      expect(itemLine).toContain('250g');
      expect(itemLine).not.toMatch(/250gm/);
    });

    it('should display "g" instead of "gm" in QTY column on 58mm receipt', () => {
      const gmItems: ReceiptItem[] = [
        {
          name: 'Black Pepper',
          quantity: 100,
          unit: 'gm',
          categoryId: 'spice',
          categoryName: 'Spices',
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: gmItems,
        paperWidth: '58mm',
      });

      // Should contain "100g" not "100gm"
      expect(receipt).toContain('100g');
      expect(receipt).not.toMatch(/100gm/);
    });

    it('should keep "kg" unchanged in QTY column', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('5kg');
    });
  });
});
