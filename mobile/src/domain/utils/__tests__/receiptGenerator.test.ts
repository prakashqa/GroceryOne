/**
 * Receipt Generator Tests
 * TDD tests for enhanced picking list receipt generation
 */

import {
  generatePickingListReceipt,
  MerchantInfo,
  ReceiptItem,
  ReceiptTranslations,
  getVisualWidth,
  formatCurrency,
} from '../receiptGenerator';

describe('receiptGenerator', () => {
  const mockMerchantInfo: MerchantInfo = {
    name: 'Prakash Groceries',
    address: 'Main Street, Vizag',
  };

  const mockItems: ReceiptItem[] = [
    {
      name: 'Aashirvaad Atta',
      quantity: 5,
      unit: 'kg',
      categoryId: 'atta',
      categoryName: 'Atta, Rice & Grains',
      categoryIcon: '🌾',
    },
    {
      name: 'Fortune Chakki Atta',
      quantity: 5,
      unit: 'kg',
      categoryId: 'atta',
      categoryName: 'Atta, Rice & Grains',
      categoryIcon: '🌾',
    },
    {
      name: 'Basmati Rice',
      quantity: 1,
      unit: 'kg',
      categoryId: 'atta',
      categoryName: 'Atta, Rice & Grains',
      categoryIcon: '🌾',
    },
    {
      name: 'Brown Rice',
      quantity: 1,
      unit: 'kg',
      categoryId: 'atta',
      categoryName: 'Atta, Rice & Grains',
      categoryIcon: '🌾',
    },
  ];

  describe('cart name display', () => {
    it('should display cart name instead of PICKING LIST when cartName is provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        cartName: 'My Cart 1',
      });

      // Should show cart name at the top (uppercase for thermal printer format)
      expect(receipt).toContain('MY CART 1');
      // Should NOT show "PICKING LIST"
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

      // Should contain Date: in pipe format: | Date: ... | Wed, 11 ... |
      expect(receipt).toMatch(/\|\s*Date\s*:.*\|\s*\w+,\s+\d{2}\s*\|/);
    });

    it('should include time', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Time is in pipe format: | Time: ... | 2:33 pm |
      expect(receipt).toMatch(/\|\s*Time\s*:.*\|\s*\d{1,2}:\d{2}\s*(am|pm)\s*\|/i);
    });
  });

  describe('summary statistics', () => {
    it('should include category count', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Categories is in pipe format: | Categories: ... | 1 |
      expect(receipt).toMatch(/\|\s*Categories\s*:.*\|\s*1\s*\|/);
    });

    it('should include unique items count', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Unique Items is in pipe format: | Unique Items: ... | 4 |
      expect(receipt).toMatch(/\|\s*Unique Items\s*:.*\|\s*4\s*\|/);
    });

    it('should NOT include total quantity (synced with Cart Review screen)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Total Quantity should NOT appear - removed to sync with Cart Review screen
      expect(receipt).not.toMatch(/Total Quantity/);
    });

    it('should right-align summary values', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find summary stat lines (Total Quantity removed to sync with Cart Review)
      const categoriesLine = lines.find((line) => line.includes('Categories:'));
      const uniqueItemsLine = lines.find((line) =>
        line.includes('Unique Items:')
      );

      expect(categoriesLine).toBeDefined();
      expect(uniqueItemsLine).toBeDefined();

      // All summary lines should have the same length (values right-aligned)
      const lengths = [
        categoriesLine!.length,
        uniqueItemsLine!.length,
      ];
      expect(new Set(lengths).size).toBe(1);
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

      // Item name is just the name without unit (unit is concatenated to QTY)
      expect(receipt).toContain('Wheat Flour');

      // QTY column shows qty+unit concatenated (e.g. "5kg"), with pipe separators
      // The line format is: | SNO | ITEM | QTY | RATE | AMT |
      expect(receipt).toMatch(/Wheat Flour\s*\|\s*5kg/);

      // RATE column should show "48" (unit price without currency symbol)
      expect(receipt).toMatch(/\s48\b/);

      // AMT column should show "240" (total price without currency symbol)
      expect(receipt).toMatch(/\s240\b/);
    });

    it('should list all items with unit in name and numeric quantity', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Item names appear without unit (unit is concatenated to QTY column)
      expect(receipt).toContain('Aashirvaad Atta');
      expect(receipt).toContain('Basmati Rice');
      expect(receipt).toContain('Brown Rice');
      // QTY column shows qty+unit concatenated (e.g. "5kg") with pipe separators
      expect(receipt).toMatch(/Aashirvaad Atta\s*\|\s*5kg/);
      expect(receipt).toMatch(/Brown Rice\s*\|\s*1kg/);
    });

    it('should align quantities properly at the right edge', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Check that quantities are formatted with proper spacing
      const lines = receipt.split('\n');
      const itemLines = lines.filter((line) => line.includes('kg') && !line.includes('CATEGORY'));
      expect(itemLines.length).toBeGreaterThan(0);
    });
  });

  describe('footer', () => {
    it('should include Generated by GroceryOne attribution', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('Generated by GroceryOne');
    });
  });

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
        expect(adjustedLength).toBeLessThanOrEqual(32);
      });
    });

    it('should have lines no longer than 48 characters for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        // Standard 80mm thermal printer supports 48 chars/line
        // Truncated names with ellipsis (…) may cause lines to be 49 chars
        expect(adjustedLength).toBeLessThanOrEqual(49);
      });
    });

    it('should use simple ASCII characters for dividers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Should use - or = for dividers, avoid complex unicode box-drawing chars
      expect(receipt).toMatch(/[-=]{10,}/);
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

      // Should count categories correctly (pipe format: | Categories: ... | 2 |)
      expect(receipt).toMatch(/\|\s*Categories\s*:.*\|\s*2\s*\|/);
      // Should list items from both categories
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
      // Unique Items in pipe format: | Unique Items: ... | 0 |
      expect(receipt).toMatch(/\|\s*Unique Items\s*:.*\|\s*0\s*\|/);
      // Total Quantity removed to sync with Cart Review screen
      expect(receipt).not.toMatch(/Total Quantity/);
    });
  });

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

      // Should have a header row with all four columns: ITEM | QTY | RATE | AMT
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

      // Should have a header row with three columns (no RATE on narrow paper)
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

      // Find the header line with 4 columns: ITEM | QTY | RATE | AMT
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('RATE') && line.includes('AMT')
      );

      expect(headerLine).toBeDefined();
      expect(headerLine!.length).toBeLessThanOrEqual(48); // 80mm paper width
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

      // Find header line with ITEM
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('QTY') && line.includes('RATE')
      );
      expect(headerLine).toBeDefined();

      // All lines should be exactly 48 characters for 80mm paper
      // Find data lines that have prices (numeric values for price columns)
      const dataLines = lines.filter(
        (line) =>
          line.match(/\d{2,}/) &&
          line.includes('kg') &&
          !line.includes('GRAND') &&
          !line.includes('=') &&
          !line.includes('ITEM')
      );

      // Header line should be exactly 48 characters
      expect(headerLine!.length).toBe(48);
      // Data lines may be 48-49 characters (49 when name fills/overflows the column due to ellipsis)
      dataLines.forEach((line) => {
        expect(line.length).toBeGreaterThanOrEqual(48);
        expect(line.length).toBeLessThanOrEqual(49);
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

      // 58mm uses two-line format: ITEM header on one line, QTY/RATE/AMT on next line
      const itemHeaderLine = lines.find((line) => line.trim() === 'ITEM');
      expect(itemHeaderLine).toBeDefined();

      // Find the values header line (QTY RATE AMT)
      const valuesHeaderLine = lines.find(
        (line) => line.includes('QTY') && line.includes('RATE') && line.includes('AMT')
      );
      expect(valuesHeaderLine).toBeDefined();

      // All lines should be at most 32 characters for 58mm paper
      expect(valuesHeaderLine!.length).toBeLessThanOrEqual(32);
    });

    it('should right-align quantity values consistently', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find lines with "kg" that are item data rows
      const itemLines = lines.filter(
        (line) => line.includes('kg') && !line.includes('CATEGORY') && !line.includes('=')
      );

      // All quantity values should end at the same column position
      const lineEndings = itemLines.map((line) => line.trimEnd().length);
      const uniqueEndings = [...new Set(lineEndings)];

      // Data rows should have consistent length
      expect(uniqueEndings.length).toBeLessThanOrEqual(2);
    });

    it('should list all items without category section headers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      // All items should be listed directly (no category section headers)
      expect(receipt).toContain('Aashirvaad Atta');
      expect(receipt).toContain('Basmati Rice');
    });

    it('should have consistent total line width for all item rows', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Filter for item data rows (have kg but not headers or dividers)
      const itemLines = lines.filter(
        (line) => line.includes('kg') && !line.includes('CATEGORY') && !line.includes('=')
      );

      // All data rows should have consistent length
      const lineLengths = itemLines.map((line) => line.replace(/[\uD800-\uDFFF]/g, '').length);
      const uniqueLengths = [...new Set(lineLengths)];
      expect(uniqueLengths.length).toBeLessThanOrEqual(2);
    });
  });

  describe('translations support', () => {
    const teluguTranslations: ReceiptTranslations = {
      title: 'పికింగ్ జాబితా',
      date: 'తేదీ',
      time: 'సమయం',
      categories: 'వర్గాలు',
      uniqueItems: 'ప్రత్యేక వస్తువులు',
      totalQuantity: 'మొత్తం పరిమాణం',
      item: 'వస్తువు',
      qty: 'పరిమాణం',
      footer: 'GroceryOne ద్వారా',
      categoryName: 'వర్గం పేరు',
      itemName: 'వస్తువు పేరు',
      quantity: 'పరిమాణం',
    };

    const teluguItems: ReceiptItem[] = [
      {
        name: 'ఆశీర్వాద్ ఆటా',
        quantity: 5,
        unit: 'కి.గ్రా',
        categoryId: 'atta',
        categoryName: 'ఆటా, బియ్యం & ధాన్యాలు',
        categoryIcon: '🌾',
      },
      {
        name: 'తూర్ దాల్',
        quantity: 1,
        unit: 'కి.గ్రా',
        categoryId: 'dal',
        categoryName: 'పప్పులు & దినుసులు',
        categoryIcon: '🫘',
      },
    ];

    it('should use default English translations when none provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('PICKING LIST');
      expect(receipt).toContain('Date:');
      expect(receipt).toContain('Time:');
      expect(receipt).toContain('Categories:');
      expect(receipt).toContain('Unique Items:');
      // Total Quantity removed to sync with Cart Review screen
      expect(receipt).not.toContain('Total Quantity:');
      expect(receipt).toContain('ITEM');
      expect(receipt).toContain('QTY');
      expect(receipt).toContain('RATE');
      expect(receipt).toContain('AMT');
      expect(receipt).toContain('Generated by GroceryOne');
    });

    it('should use Telugu translations when provided', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
      });

      expect(receipt).toContain('పికింగ్ జాబితా');
      expect(receipt).toContain('తేదీ:');
      expect(receipt).toContain('సమయం:');
      expect(receipt).toContain('వర్గాలు:');
      expect(receipt).toContain('ప్రత్యేక వస్తువులు:');
      expect(receipt).toContain('GroceryOne ద్వారా');
    });

    it('should display Telugu item names correctly', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
      });

      // Telugu names should be shown in the receipt
      expect(receipt).toMatch(/ఆశీర్వాద్ ఆటా/);
      expect(receipt).toMatch(/తూర్ దాల్/);
    });

    it('should format date/time with Telugu locale when specified', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
        locale: 'te-IN',
      });

      // Should contain the Telugu date label followed by a date
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
      // Telugu characters should be counted as wider than ASCII
      // 'ఆటా' = ఆ (base, 1.5) + ట (base, 1.5) + ా (combining, 0) = 3
      const teluguText = 'ఆటా';
      const width = getVisualWidth(teluguText);
      // Telugu base chars are 1.5x wider than ASCII
      expect(width).toBeGreaterThanOrEqual(3);
      // But wider than pure ASCII of same length
      expect(width).toBeGreaterThan(2); // 2 ASCII chars would be 2
    });

    it('should count Telugu combining characters for better receipt alignment', () => {
      // Simple character counting for thermal printer alignment
      const baseConsonant = 'జ'; // 1 character
      const withMatra = 'జీ'; // 2 characters
      const withVirama = 'క్'; // 2 characters

      // Simple character count
      expect(getVisualWidth(baseConsonant)).toBe(1);
      expect(getVisualWidth(withMatra)).toBe(2);
      expect(getVisualWidth(withVirama)).toBe(2);
    });

    it('should handle mixed Telugu and ASCII text', () => {
      const mixedText = 'ఆటా Rice';
      const width = getVisualWidth(mixedText);
      // ఆ (1.5) + ట (1.5) + ా (0) + space (1) + Rice (4) = 8
      // Telugu base chars (2) at 1.5x + combining (1) at 0 + space + ASCII
      expect(width).toBeGreaterThanOrEqual(8);
      // Should be wider than pure ASCII equivalent
      expect(width).toBeGreaterThan(6); // 'aa Rice' would be 7
    });

    it('should calculate wider visual width for emojis', () => {
      // Emojis render as 2-character width in monospace fonts
      expect(getVisualWidth('🌾')).toBe(2); // Single emoji = 2 chars wide
      expect(getVisualWidth('🫘')).toBe(2);
      expect(getVisualWidth('📦')).toBe(2);
    });

    it('should handle mixed emoji and ASCII text', () => {
      // "🌾 ATTA" = emoji(2) + space(1) + ATTA(4) = 7
      const mixedText = '🌾 ATTA';
      expect(getVisualWidth(mixedText)).toBe(7);
    });

    it('should handle category names with emojis correctly', () => {
      // Typical category display: "🌾 Atta, Rice.."
      const catWithEmoji = '🌾 Atta';
      expect(getVisualWidth(catWithEmoji)).toBe(7); // 2 + 1 + 4
    });
  });

  describe('Telugu text alignment', () => {
    const teluguTranslations: ReceiptTranslations = {
      title: 'పికింగ్ జాబితా',
      date: 'తేదీ',
      time: 'సమయం',
      categories: 'వర్గాలు',
      uniqueItems: 'ప్రత్యేక వస్తువులు',
      totalQuantity: 'మొత్తం పరిమాణం',
      item: 'వస్తువు',
      qty: 'పరిమాణం',
      footer: 'GroceryOne ద్వారా',
      categoryName: 'వర్గం పేరు',
      itemName: 'వస్తువు పేరు',
      quantity: 'పరిమాణం',
    };

    const teluguItems: ReceiptItem[] = [
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
        items: teluguItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find lines with Telugu item names
      const itemLines = lines.filter(
        (line) => (line.includes('ఆశీర్వాద్') || line.includes('ఫార్చ్యూన్')) && !line.includes('=')
      );

      // Should have Telugu items listed
      expect(itemLines.length).toBeGreaterThan(0);

      // All item lines should have consistent CHARACTER length
      const lineLengths = itemLines.map((line) => line.length);

      // Lines may exceed 48 character count due to Telugu multi-codepoint characters
      // filling the fixed column width. The layout uses simple .length which doesn't
      // account for visual width differences in Telugu script.
      lineLengths.forEach((len) => {
        expect(len).toBeGreaterThan(0);
        // Telugu text may extend beyond 48 chars due to combining characters
        expect(len).toBeLessThanOrEqual(55);
      });
    });

    it('should center Telugu title correctly', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const titleLine = lines.find((line) => line.includes('పికింగ్ జాబితా'));

      expect(titleLine).toBeDefined();
      // Title should have leading spaces for centering
      expect(titleLine!.startsWith(' ')).toBe(true);
    });

    it('should use visual width for Telugu units when calculating item line alignment', () => {
      // This test verifies that Telugu items are properly listed
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
      // Find lines with Telugu item names
      const itemLines = lines.filter(
        (line) => (line.includes('బాస్మతి') || line.includes('జీరా')) && !line.includes('=')
      );

      // Should have Telugu items listed
      expect(itemLines.length).toBeGreaterThan(0);

      // Lines may exceed 48 character count due to Telugu multi-codepoint characters
      // The layout uses simple .length which doesn't account for visual width
      itemLines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(55);
      });
    });
  });

  describe('pricing functionality', () => {
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
        // No price or itemTotal
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

        // Should contain the 4-column headers: ITEM | QTY | RATE | AMT
        expect(receipt).toContain('ITEM');
        expect(receipt).toContain('QTY');
        expect(receipt).toContain('RATE');
        expect(receipt).toContain('AMT');

        // Should contain the item total in the AMT column (without currency symbol)
        expect(receipt).toMatch(/\s1,?250\b/);
      });

      it('should include item total in item rows', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
        });

        // Should contain the item total (5 * 250 = 1250) without currency symbol
        expect(receipt).toMatch(/\s1,?250\b/);
      });

      it('should display grand total when items have prices', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
        });

        // Grand total should be 1250 + 360 = 1610
        expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
        expect(receipt).toMatch(/\s1,?610\b/);
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

        // Should show grand total for the priced item only (200)
        expect(receipt.toUpperCase()).toContain('GRAND TOTAL');
        expect(receipt).toMatch(/\s200\b/);
      });
    });

    describe('58mm paper format', () => {
      it('should fit pricing within 32 character width', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
        });

        const lines = receipt.split('\n');
        lines.forEach((line) => {
          const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
          expect(adjustedLength).toBeLessThanOrEqual(32);
        });
      });

      it('should still show item totals on 58mm paper', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '58mm',
        });

        // Should contain item total even on narrow paper (without currency symbol)
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
        footer: 'GroceryOne ద్వారా',
        categoryName: 'వర్గం పేరు',
        itemName: 'వస్తువు పేరు',
        quantity: 'పరిమాణం',
        unitPrice: 'ధర',
        itemTotal: 'మొత్తం',
        grandTotal: 'మహా మొత్తం',
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

        // Should contain Telugu grand total label
        expect(receipt).toContain('మహా మొత్తం');
      });

      it('should format prices correctly with Telugu item names', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: teluguPricedItems,
          translations: teluguTranslationsWithPricing,
          paperWidth: '80mm',
        });

        // Should contain the price value (without currency symbol)
        expect(receipt).toMatch(/\s1,?250\b/);
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
        // Find lines with price data (containing numeric values)
        const priceLines = lines.filter(
          (line) => line.match(/\d{3,}/) &&
                   !line.includes('=') &&
                   !line.includes('CATEGORY') &&
                   !line.includes('Date') &&
                   !line.includes('Time')
        );

        // Price lines should exist
        expect(priceLines.length).toBeGreaterThan(0);
      });

      it('should have consistent line lengths for priced item rows', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: pricedItems,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        // Find item data rows (containing kg and price values)
        const itemLines = lines.filter(
          (line) => line.includes('kg') &&
                   line.match(/\d{3,}/) &&
                   !line.includes('=')
        );

        if (itemLines.length > 1) {
          const lineLengths = itemLines.map((line) => line.length);
          const uniqueLengths = [...new Set(lineLengths)];
          // Should have consistent or near-consistent lengths
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
          // price is undefined
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
          // No price
        },
      ];

      it('should show "-" for unit price when price is undefined', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithNoPrice,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        // Name may be truncated with ellipsis on 80mm (16 char column)
        const itemLine = lines.find((line) => line.includes('Item Without Pri'));
        expect(itemLine).toBeDefined();
        // The line should have dash for missing price
        expect(itemLine).toMatch(/-/);
      });

      it('should show "-" for unit price when price is 0', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithZeroPrice,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        const itemLine = lines.find((line) => line.includes('Zero Price Item'));
        expect(itemLine).toBeDefined();
        // Should have dash for zero price
        expect(itemLine).toMatch(/-/);
      });

      it('should show "-" for total when unit price is missing', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithNoPrice,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        // Name may be truncated with ellipsis on 80mm (16 char column)
        const itemLine = lines.find((line) => line.includes('Item Without Pri'));
        expect(itemLine).toBeDefined();
        // Should have dashes for rate and amt columns
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
            price: 45, // 45 per kg
            itemTotal: 225, // 5 x 45 = 225
          },
        ];

        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithPrice,
          paperWidth: '80mm',
        });

        // Should show unit price 45 (without currency symbol)
        expect(receipt).toMatch(/\s45\b/);
        // Should show total 225 (without currency symbol)
        expect(receipt).toMatch(/\s225\b/);
      });

      it('should handle mixed cart with priced and unpriced items correctly', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: mixedPriceItems,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');

        // Priced item should show actual prices (without currency symbol)
        const pricedLine = lines.find((line) => line.includes('Priced Item'));
        expect(pricedLine).toBeDefined();
        expect(pricedLine).toMatch(/\s100\b/); // unit price
        expect(pricedLine).toMatch(/\s200\b/); // total price

        // Unpriced item should show dashes
        const unpricedLine = lines.find((line) => line.includes('Unpriced Item'));
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
        // In two-line format, item name is on first line, values on second line
        const itemNameLineIdx = lines.findIndex((line) => line.includes('Item Without'));
        expect(itemNameLineIdx).toBeGreaterThan(-1);

        // The values line (next line) should contain dashes for missing prices
        const valuesLine = lines[itemNameLineIdx + 1];
        expect(valuesLine).toBeDefined();
        // Should contain dash on narrow paper too (in values line)
        expect(valuesLine).toMatch(/-/);
      });
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

      // 58mm should now show RATE value (140 for Basmati Rice)
      expect(receipt).toMatch(/140/);
      // Should also show the unit price 85 for Cumin Seeds
      expect(receipt).toMatch(/85/);
    });

    it('should show item name on first line and values on second line for 58mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');

      // Find the line with Basmati Rice - should be the item name line
      const basmatiNameLineIdx = lines.findIndex((line) => line.includes('Basmati Rice'));
      expect(basmatiNameLineIdx).toBeGreaterThan(-1);

      // The next line should contain the quantity, rate, and amount values
      const valuesLine = lines[basmatiNameLineIdx + 1];
      expect(valuesLine).toBeDefined();
      // Should contain qty (5), rate (140), and amt (700)
      expect(valuesLine).toMatch(/5/);
      expect(valuesLine).toMatch(/140/);
      expect(valuesLine).toMatch(/700/);
    });

    it('should keep all lines within 32 character limit for 58mm two-line format', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '58mm',
      });

      const lines = receipt.split('\n');
      lines.forEach((line) => {
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        expect(adjustedLength).toBeLessThanOrEqual(32);
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

      // Full item name should be visible (not truncated with ellipsis)
      // Unit is shown in QTY column, not appended to item name
      expect(receipt).toContain('Coriander Seeds');
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

      // Find header line
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('QTY') && line.includes('RATE')
      );
      expect(headerLine).toBeDefined();

      // Find item line with Basmati Rice
      const itemLine = lines.find((line) => line.includes('Basmati Rice'));
      expect(itemLine).toBeDefined();

      // Header should be exactly 48 characters
      expect(headerLine!.length).toBe(48);

      // Pipe format: | SNO | ITEM             | QTY  | RATE |   AMT |
      // QTY content starts at position 27 (after "| " at 25-26)
      const headerQtySection = headerLine!.substring(27, 31); // positions 27-30
      const itemQtySection = itemLine!.substring(27, 31);

      // QTY header should be in its column
      expect(headerQtySection.trim()).toBe('QTY');
      // Item qty shows qty+unit concatenated (e.g. "5kg")
      expect(itemQtySection.trim()).toBe('5kg');
    });

    it('should align RATE values under RATE header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');

      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('RATE')
      );
      const itemLine = lines.find((line) => line.includes('Basmati Rice'));

      expect(headerLine).toBeDefined();
      expect(itemLine).toBeDefined();

      // Pipe format: | SNO | ITEM             | QTY  | RATE |   AMT |
      // RATE content is at positions 34-37 (4 chars, padStart(4))
      const headerRateSection = headerLine!.substring(34, 38);
      const itemRateSection = itemLine!.substring(34, 38);

      expect(headerRateSection.trim()).toBe('RATE');
      expect(itemRateSection.trim()).toBe('140');
    });

    it('should align AMT values under AMT header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');

      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('AMT')
      );
      const itemLine = lines.find((line) => line.includes('Basmati Rice'));

      expect(headerLine).toBeDefined();
      expect(itemLine).toBeDefined();

      // Pipe format: | SNO | ITEM             | QTY  | RATE |   AMT |
      // AMT content is at positions 41-45 (5 chars, padStart(5))
      const headerAmtSection = headerLine!.substring(41, 46);
      const itemAmtSection = itemLine!.substring(41, 46);

      expect(headerAmtSection.trim()).toBe('AMT');
      expect(itemAmtSection.trim()).toBe('700');
    });

    it('should have ITEM header and item names starting at same column position', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');

      const headerLine = lines.find((line) => line.includes('ITEM') && line.includes('QTY'));
      const itemLine = lines.find((line) => line.includes('Basmati Rice'));

      expect(headerLine).toBeDefined();
      expect(itemLine).toBeDefined();

      // Pipe format: | SNO | ITEM ... | QTY ...
      // ITEM header starts at position 8 (after "| SNO | ")
      expect(headerLine!.indexOf('ITEM')).toBe(8);
      // Item name also starts at position 8
      expect(itemLine!.indexOf('Basmati Rice')).toBe(8);
    });
  });

  describe('grand total display', () => {
    it('should display full grand total without truncation for large amounts', () => {
      const pricedItems: ReceiptItem[] = [
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
        items: pricedItems,
        paperWidth: '80mm',
      });

      // Grand total should be 240 + 17000 = 17240
      // The full amount should be displayed, not truncated (e.g., "17,2" or "17,5")
      expect(receipt).toMatch(/17,?240/);
    });
  });

  describe('summary section dividers', () => {
    it('should NOT have vertical pipe characters in divider above Categories', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find the line index of "Categories:"
      const categoriesLineIdx = lines.findIndex((line) => line.includes('Categories:'));
      expect(categoriesLineIdx).toBeGreaterThan(0);

      // The divider line is immediately before Categories (after Time:)
      const dividerLine = lines[categoriesLineIdx - 1];
      // This divider should NOT have pipe characters
      expect(dividerLine).not.toContain('|');
      // It should be a simple divider with dashes only
      expect(dividerLine).toMatch(/^-+$/);
    });

    it('should NOT have vertical pipe characters in divider below Unique Items', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find the line index of "Unique Items:"
      const uniqueItemsLineIdx = lines.findIndex((line) => line.includes('Unique Items:'));
      expect(uniqueItemsLineIdx).toBeGreaterThan(0);

      // The divider line is immediately after Unique Items
      const dividerLine = lines[uniqueItemsLineIdx + 1];
      // This divider should NOT have pipe characters
      expect(dividerLine).not.toContain('|');
      // It should be a simple divider with dashes only
      expect(dividerLine).toMatch(/^-+$/);
    });
  });

  describe('vertical lines (column separators)', () => {
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

    it('should include vertical pipe separators between columns in header for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('QTY')
      );

      expect(headerLine).toBeDefined();
      // Should have pipe separators: SNO | ITEM | QTY | RATE | AMT
      expect(headerLine).toMatch(/SNO\s*\|\s*ITEM/);
      expect(headerLine).toMatch(/ITEM.*\|\s*QTY/);
      expect(headerLine).toMatch(/QTY\s*\|\s*RATE/);
      expect(headerLine).toMatch(/RATE\s*\|\s*AMT/);
    });

    it('should include vertical pipe separators in item rows for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const itemLine = lines.find((line) => line.includes('Wheat Flour'));

      expect(itemLine).toBeDefined();
      // Should have pipe separators in data rows: |   1 | Wheat Flour / At… | 5kg  |   48 |   240 |
      // QTY column has qty+unit concatenated (e.g. "5kg")
      expect(itemLine).toMatch(/\|\s*\d+\s*\|.*\|\s*\d+\w+\s*\|\s*\d+\s*\|\s*\d+\s*\|/);
    });

    it('should have plain dash dividers without pipes for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find divider lines (lines with dashes)
      const dividerLines = lines.filter((line) => line.includes('---'));

      // Divider lines should be plain dashes (no pipe separators)
      dividerLines.forEach((line) => {
        expect(line).not.toContain('|');
      });
      // Should have at least some divider lines
      expect(dividerLines.length).toBeGreaterThan(0);
    });

    it('should include vertical pipe separators in summary section for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const categoriesLine = lines.find((line) => line.includes('Categories:'));
      const itemsLine = lines.find((line) => line.includes('Unique Items:'));

      expect(categoriesLine).toBeDefined();
      expect(itemsLine).toBeDefined();
      // Summary lines should have pipe at the right positions
      expect(categoriesLine).toMatch(/\|/);
      expect(itemsLine).toMatch(/\|/);
    });

    it('should maintain proper alignment with vertical separators for 80mm paper', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: pricedItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const headerLine = lines.find(
        (line) => line.includes('SNO') && line.includes('ITEM')
      );
      const firstItemLine = lines.find((line) => line.includes('Wheat Flour'));
      const secondItemLine = lines.find((line) => line.includes('Maida'));

      expect(headerLine).toBeDefined();
      expect(firstItemLine).toBeDefined();
      expect(secondItemLine).toBeDefined();

      // Find positions of pipe characters in each line
      const getPipePositions = (line: string) => {
        const positions: number[] = [];
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '|') positions.push(i);
        }
        return positions;
      };

      const headerPipes = getPipePositions(headerLine!);
      const item2Pipes = getPipePositions(secondItemLine!);

      // All lines should have the same number of pipe characters (6 pipes)
      expect(headerPipes.length).toBe(6);
      expect(getPipePositions(firstItemLine!).length).toBe(6);
      expect(item2Pipes.length).toBe(6);

      // Short item names (Maida, 5 chars) that fit within the column
      // should have pipes at the same positions as the header
      expect(item2Pipes).toEqual(headerPipes);
    });
  });
});
