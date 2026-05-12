/**
 * Receipt Generator - Translations Tests
 * Tests for i18n: translations support, visual width calculation,
 * Telugu alignment, Telugu pricing translations
 */

import {
  generatePickingListReceipt,
  ReceiptItem,
  ReceiptTranslations,
  getVisualWidth,
} from '../receiptGenerator';
import {
  mockMerchantInfo,
  mockItems,
  teluguTranslations,
  teluguItems,
} from './receiptGenerator.fixtures';

describe('receiptGenerator - translations', () => {
  describe('translations support', () => {
    it('should use default English translations when none provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('PICKING LIST');
      expect(receipt).toContain('Date:');
      expect(receipt).toContain('Time:');
      expect(receipt).not.toContain('Categories:');
      expect(receipt).toContain('Unique Items:');
      expect(receipt).not.toContain('Total Quantity:');
      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
      expect(receipt).toContain('Thank You! Shop With Us');
    });

    it('should use Telugu translations when provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('పికింగ్ జాబితా');
      expect(receipt).toContain('తేదీ:');
      expect(receipt).toContain('సమయం:');
      expect(receipt).not.toContain('వర్గాలు:');
      expect(receipt).toContain('ప్రత్యేక వస్తువులు:');
      expect(receipt).toContain('ధన్యవాదాలు! మాతో షాపింగ్ చేయండి');
    });

    it('should display Telugu item names correctly', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
      });

      expect(receipt).toMatch(/ఆశీర్వాద్/);
      expect(receipt).toMatch(/తూర్ దాల్/);
    });

    it('should format date/time with Telugu locale when specified', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
        locale: 'te-IN',
      });

      expect(receipt).toMatch(/తేదీ\s*:/);
      expect(receipt).toMatch(/సమయం\s*:/);
    });
  });

  describe('visual width calculation for Telugu', () => {
    it('should calculate visual width correctly for ASCII text', () => {
      expect(getVisualWidth('Hello')).toBe(5);
      expect(getVisualWidth('Item')).toBe(4);
      expect(getVisualWidth('12345')).toBe(5);
    });

    it('should calculate wider visual width for Telugu characters', () => {
      const teluguText = 'ఆటా';
      const width = getVisualWidth(teluguText);
      expect(width).toBeGreaterThanOrEqual(3);
      expect(width).toBeGreaterThan(2);
    });

    it('should count Telugu combining characters for better receipt alignment', () => {
      const baseConsonant = 'జ';
      const withMatra = 'జీ';
      const withVirama = 'క్';

      expect(getVisualWidth(baseConsonant)).toBe(1);
      expect(getVisualWidth(withMatra)).toBe(2);
      expect(getVisualWidth(withVirama)).toBe(2);
    });

    it('should handle mixed Telugu and ASCII text', () => {
      const mixedText = 'ఆటా Rice';
      const width = getVisualWidth(mixedText);
      expect(width).toBeGreaterThanOrEqual(8);
      expect(width).toBeGreaterThan(6);
    });

    it('should calculate wider visual width for emojis', () => {
      expect(getVisualWidth('🌾')).toBe(2);
      expect(getVisualWidth('🫘')).toBe(2);
      expect(getVisualWidth('📦')).toBe(2);
    });

    it('should handle mixed emoji and ASCII text', () => {
      const mixedText = '🌾 ATTA';
      expect(getVisualWidth(mixedText)).toBe(7);
    });

    it('should handle category names with emojis correctly', () => {
      const catWithEmoji = '🌾 Atta';
      expect(getVisualWidth(catWithEmoji)).toBe(7);
    });
  });

  describe('Telugu text alignment', () => {
    const teluguAlignmentItems: ReceiptItem[] = [
      {
        name: 'ఆశీర్వాద్ ఆటా',
        quantity: 5,
        unit: 'కి.గ్రా',
        categoryId: 'atta',
        categoryName: 'ఆటా, బియ్యం & ధాన్యాలు',
        categoryIcon: '🌾',
      },
      {
        name: 'ఫార్చ్యూన్ చక్కీ ఆటా',
        quantity: 5,
        unit: 'కి.గ్రా',
        categoryId: 'atta',
        categoryName: 'ఆటా, బియ్యం & ధాన్యాలు',
        categoryIcon: '🌾',
      },
    ];

    it('should align Telugu item quantities consistently', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguAlignmentItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter(
        (line) => (line.includes('ఆశీర్వాద్') || line.includes('ఫార్చ్యూన్')) && !line.includes('=')
      );

      expect(itemLines.length).toBeGreaterThan(0);

      const lineLengths = itemLines.map((line) => line.length);
      lineLengths.forEach((len) => {
        expect(len).toBeGreaterThan(0);
        expect(len).toBeLessThanOrEqual(60);
      });
    });

    it('should center Telugu title correctly on 80mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguAlignmentItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const titleLine = lines.find((line) => line.includes('పికింగ్ జాబితా'));

      expect(titleLine).toBeDefined();
      expect(titleLine!.startsWith('\u0002')).toBe(true);
    });

    it('should use visual width for Telugu units when calculating item line alignment', () => {
      const teluguItemsWithDifferentUnits: ReceiptItem[] = [
        {
          name: 'బాస్మతి బియ్యం',
          quantity: 5,
          unit: 'కి.గ్రా',
          categoryId: 'rice',
          categoryName: 'బియ్యం',
          categoryIcon: '🌾',
        },
        {
          name: 'జీరా సాంబా',
          quantity: 1,
          unit: 'కి.గ్రా',
          categoryId: 'rice',
          categoryName: 'బియ్యం',
          categoryIcon: '🌾',
        },
      ];

      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItemsWithDifferentUnits,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLines = lines.filter(
        (line) => (line.includes('బాస్మతి') || line.includes('జీరా')) && !line.includes('=')
      );

      expect(itemLines.length).toBeGreaterThan(0);

      itemLines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('Telugu pricing translations', () => {
    const teluguTranslationsWithPricing: ReceiptTranslations = {
      title: 'పికింగ్ జాబితా',
      date: 'తేదీ',
      time: 'సమయం',
      categories: 'వర్గాలు',
      uniqueItems: 'ప్రత్యేక వస్తువులు',
      totalQuantity: 'మొత్తం పరిమాణం',
      item: 'వస్తువు',
      qty: 'పరిమాణం',
      footer: 'ధన్యవాదాలు! మాతో షాపింగ్ చేయండి',
      categoryName: 'వర్గం పేరు',
      itemName: 'వస్తువు పేరు',
      quantity: 'పరిమాణం',
      unitPrice: 'ధర',
      itemTotal: 'మొత్తం',
      grandTotal: 'మొత్తం',
      noHeader: 'న',
      itemHeader: 'వస్తువు',
      qtyShort: 'పరి',
      rateHeader: 'రేటు',
      amtHeader: 'అమౌంట్',
    };

    const teluguPricedItems: ReceiptItem[] = [
      {
        name: 'ఆశీర్వాద్ ఆటా',
        quantity: 5,
        unit: 'కి.గ్రా',
        categoryId: 'atta',
        categoryName: 'ఆటా, బియ్యం & ధాన్యాలు',
        price: 250.0,
        itemTotal: 1250.0,
      },
    ];

    it('should use Telugu grand total label when Telugu translations provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguPricedItems,
        translations: teluguTranslationsWithPricing,
        paperWidth: '80mm',
      });

      expect(receipt).toContain('మొత్తం');
      expect(receipt).not.toContain('మహా మొత్తం');
    });

    it('should format prices correctly with Telugu item names', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguPricedItems,
        translations: teluguTranslationsWithPricing,
        paperWidth: '80mm',
      });

      expect(receipt).toMatch(/\s1,?250\b/);
    });
  });
});
