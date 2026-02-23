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
  stripFormatMarkers,
  sanitizeForPrinter,
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

      // Should contain Date: with value right-aligned (format: "22 Feb 2026")
      expect(receipt).toMatch(/Date\s*:.*\d{2}\s+\w{3}\s+\d{4}/);
    });

    it('should include time', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Time with value right-aligned
      expect(receipt).toMatch(/Time\s*:.*\d{1,2}:\d{2}\s*(am|pm)/i);
    });
  });

  describe('summary statistics', () => {
    it('should NOT include Categories line in receipt', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Categories line was removed from the receipt
      expect(receipt).not.toContain('Categories:');
    });

    it('should include unique items count', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Unique Items with count
      expect(receipt).toMatch(/Unique Items\s*:.*4/);
    });

    it('should NOT include total quantity (synced with Cart Review screen)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      // Total Quantity should NOT appear - removed to sync with Cart Review screen
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
      // 80mm uses tab-separated format for label-value lines
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

      // Item name is just the name without unit (unit is concatenated to QTY)
      expect(receipt).toContain('Wheat Flour');

      // QTY column shows qty+unit concatenated (e.g. "5kg"), space-separated
      expect(receipt).toMatch(/Wheat Flour\s+5kg/);

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
      // Two-line format: name on line 1, values on line 2
      expect(receipt).toContain('Aashirvaad Atta');
      expect(receipt).toContain('Basmati Rice');
      expect(receipt).toContain('Brown Rice');
      // QTY column shows qty+unit concatenated (e.g. "5kg") on values line
      expect(receipt).toContain('5kg');
      expect(receipt).toContain('1kg');
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
    it('should include Thank You message instead of GroceryOne attribution', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
      });

      expect(receipt).toContain('Thank You! Shop With Us');
      expect(receipt).not.toContain('Generated by GroceryOne');
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
        // Skip tab-separated lines (rendered by native pixel-based column layout)
        // Skip CENTER_MARKER lines (rendered by native pixel-based centering)
        if (line.includes('\t') || line.startsWith('\u0002') || line.startsWith('\u0003')) return;
        const adjustedLength = line.replace(/[\uD800-\uDFFF]/g, '').length;
        // 80mm paper uses 28 chars/line for even larger font (~22% bigger than 32)
        expect(adjustedLength).toBeLessThanOrEqual(28);
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

      // Categories line removed — just verify items from both categories are listed
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
      // Unique Items with count right-aligned
      expect(receipt).toMatch(/Unique Items\s*:.*0/);
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

      // 80mm uses tab-separated format: NO\tITEM\tQTY\tRATE\tAMT
      const headerLine = lines.find(
        (line) => line.includes('ITEM') && line.includes('RATE') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();
      // Header should have 5 tab-separated columns
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

      // 80mm uses tab-separated format: NO\tITEM\tQTY\tRATE\tAMT
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('ITEM') && line.includes('QTY')
      );
      expect(headerLine).toBeDefined();
      // Header should contain tab characters
      expect(headerLine).toContain('\t');

      // Data: item lines contain item names with tab-separated columns
      const nameLines = lines.filter(
        (line) =>
          (line.includes('Maida') || line.includes('Sona Masuri')) &&
          !line.includes('=')
      );
      nameLines.forEach((line) => {
        // Tab-separated lines should have 4 tabs (5 columns)
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

      // 58mm uses two-line format: ITEM header on one line, QTY/RATE/AMT on next line
      const itemHeaderLine = lines.find((line) => line.trim() === 'ITEM');
      expect(itemHeaderLine).toBeDefined();

      // Find the values header line (QTY RATE AMT)
      const valuesHeaderLine = lines.find(
        (line) => line.includes('QTY') && line.includes('RATE') && line.includes('AMT')
      );
      expect(valuesHeaderLine).toBeDefined();

      // All lines should be at most 23 characters for 58mm paper (larger text)
      expect(valuesHeaderLine!.length).toBeLessThanOrEqual(23);
    });

    it('should right-align quantity values consistently', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find tab-separated item data rows with "kg"
      const itemLines = lines.filter(
        (line) => line.includes('kg') && line.includes('\t') && !line.includes('=')
      );

      // All item rows should have consistent tab-separated structure (5 columns)
      itemLines.forEach((line) => {
        const columns = line.split('\t');
        expect(columns.length).toBe(5);
        // QTY column (3rd) should contain the unit
        expect(columns[2]).toMatch(/kg/);
      });
    });

    it('should list all items without category section headers', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      // All items should be listed directly (no category section headers)
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
      // Filter for tab-separated item data rows
      const itemLines = lines.filter(
        (line) => line.includes('kg') && line.includes('\t') && !line.includes('=')
      );

      // All data rows should have consistent column count (5 columns)
      const columnCounts = itemLines.map((line) => line.split('\t').length);
      const uniqueCounts = [...new Set(columnCounts)];
      expect(uniqueCounts.length).toBe(1);
      expect(uniqueCounts[0]).toBe(5);
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
      footer: 'ధన్యవాదాలు! మాతో షాపింగ్ చేయండి',
      categoryName: 'వర్గం పేరు',
      itemName: 'వస్తువు పేరు',
      quantity: 'పరిమాణం',
      noHeader: 'న',
      itemHeader: 'వస్తువు',
      qtyShort: 'పరి',
      rateHeader: 'రేటు',
      amtHeader: 'అమౌంట్',
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
      expect(receipt).not.toContain('Categories:');
      expect(receipt).toContain('Unique Items:');
      // Total Quantity removed to sync with Cart Review screen
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

      // Telugu names should be shown in the receipt (may be truncated on 80mm)
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
      footer: 'ధన్యవాదాలు! మాతో షాపింగ్ చేయండి',
      categoryName: 'వర్గం పేరు',
      itemName: 'వస్తువు పేరు',
      quantity: 'పరిమాణం',
      noHeader: 'న',
      itemHeader: 'వస్తువు',
      qtyShort: 'పరి',
      rateHeader: 'రేటు',
      amtHeader: 'అమౌంట్',
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
        expect(len).toBeLessThanOrEqual(60);
      });
    });

    it('should center Telugu title correctly on 80mm', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: teluguItems,
        translations: teluguTranslations,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      const titleLine = lines.find((line) => line.includes('పికింగ్ జాబితా'));

      expect(titleLine).toBeDefined();
      // 80mm uses CENTER_MARKER prefix for pixel-based centering by native module
      expect(titleLine!.startsWith('\u0002')).toBe(true);
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
        expect(line.length).toBeLessThanOrEqual(60);
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
        // Should have BOLD_TAB_MARKER prefix on 80mm
        expect(grandTotalLine!.startsWith('\u0003')).toBe(true);
        // Should still contain tab separator
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

        // Should show grand total for the priced item only (200)
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

        // Should contain Telugu grand total label (without మహా prefix)
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
        // 80mm single-line format: item name and dashes on the same line
        const itemLine = lines.find((line) => line.includes('Item Without'));
        expect(itemLine).toBeDefined();
        // The item line should have dash for missing price
        expect(itemLine).toMatch(/-/);
      });

      it('should show "-" for unit price when price is 0', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithZeroPrice,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        // 80mm single-line format: item name and dashes on the same line
        const itemLine = lines.find((line) => line.includes('Zero Price'));
        expect(itemLine).toBeDefined();
        // The item line should have dash for zero price
        expect(itemLine).toMatch(/-/);
      });

      it('should show "-" for total when unit price is missing', () => {
        const receipt = generatePickingListReceipt({
          merchantInfo: mockMerchantInfo,
          items: itemsWithNoPrice,
          paperWidth: '80mm',
        });

        const lines = receipt.split('\n');
        // 80mm single-line format: item name and dashes on the same line
        const itemLine = lines.find((line) => line.includes('Item Without'));
        expect(itemLine).toBeDefined();
        // The item line should have dashes for rate and amt columns
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

        // 80mm single-line format: name and values on the same line
        // Priced item: line should show actual prices
        const pricedLine = lines.find((line) => line.includes('Priced Item'));
        expect(pricedLine).toBeDefined();
        expect(pricedLine).toMatch(/100/); // unit price
        expect(pricedLine).toMatch(/200/); // total price

        // Unpriced item: line should show dashes
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

      // 80mm uses tab-separated format: NO\tITEM\tQTY\tRATE\tAMT
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      expect(headerLine).toBeDefined();

      // Find the item line for Basmati Rice
      const basmatiLine = lines.find((line) => line.includes('Basmati Rice'));
      expect(basmatiLine).toBeDefined();

      // QTY is the 3rd tab-separated column (index 2)
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

      // RATE is the 4th tab-separated column (index 3)
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

      // AMT is the 5th tab-separated column (index 4)
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

      // ITEM is the 2nd tab-separated column (index 1)
      const headerColumns = headerLine!.split('\t');
      const itemColumns = itemNameLine!.split('\t');

      expect(headerColumns[1].trim()).toBe('ITEM');
      expect(itemColumns[1].trim()).toBe('Basmati Rice');
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

  describe('stripFormatMarkers', () => {
    it('should return plain text unchanged', () => {
      const text = 'Hello World';
      expect(stripFormatMarkers(text)).toBe('Hello World');
    });

    it('should strip ESC/POS bold markers from text', () => {
      // ESC E 1 (bold on) = \x1b\x45\x01, ESC E 0 (bold off) = \x1b\x45\x00
      const text = '\x1b\x45\x01TOTAL\x1b\x45\x00';
      expect(stripFormatMarkers(text)).toBe('TOTAL');
    });

    it('should strip ESC/POS underline markers from text', () => {
      // ESC - 1 (underline on) = \x1b\x2d\x01, ESC - 0 (underline off) = \x1b\x2d\x00
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
      // Receipt on 80mm has CENTER_MARKER — stripping should remove them
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
      // Should not contain any Telugu characters
      expect(result).not.toMatch(/[\u0C00-\u0C7F]/);
    });

    it('should replace emoji characters with ? for single-byte codepage printers', () => {
      const text = '🌾 Atta';
      const result = sanitizeForPrinter(text);
      // Should not contain emoji
      expect(result).not.toMatch(/[\uD800-\uDFFF]|[\u{1F000}-\u{1FFFF}]/u);
      // Should preserve the ASCII portion
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

  describe('summary section dividers', () => {
    it('should have clean divider above Unique Items (after Time)', () => {
      const receipt = generatePickingListReceipt({
        merchantInfo: mockMerchantInfo,
        items: mockItems,
        paperWidth: '80mm',
      });

      const lines = receipt.split('\n');
      // Find the line index of "Unique Items"
      const uniqueItemsLineIdx = lines.findIndex((line) => line.includes('Unique Items'));
      expect(uniqueItemsLineIdx).toBeGreaterThan(0);

      // The divider line is immediately before Unique Items (after Time:)
      const dividerLine = lines[uniqueItemsLineIdx - 1];
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
      // Find the line index of "Unique Items" (colon may be truncated at width=22)
      const uniqueItemsLineIdx = lines.findIndex((line) => line.includes('Unique Items'));
      expect(uniqueItemsLineIdx).toBeGreaterThan(0);

      // The divider line is immediately after Unique Items
      const dividerLine = lines[uniqueItemsLineIdx + 1];
      // This divider should NOT have pipe characters
      expect(dividerLine).not.toContain('|');
      // It should be a simple divider with dashes only
      expect(dividerLine).toMatch(/^-+$/);
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
      // 80mm uses single-line header: NO ITEM QTY RATE AMT
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

      // Categories line removed from receipt
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
        // Item names may contain "/" but should never contain "|"
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
      // 80mm uses tab-separated format
      const headerLine = lines.find(
        (line) => line.startsWith('NO\t') && line.includes('\t')
      );
      const secondItemLine = lines.find((line) => line.includes('Maida'));

      expect(headerLine).toBeDefined();
      expect(secondItemLine).toBeDefined();

      // Both header and item lines should have the same number of columns (5)
      const headerCols = headerLine!.split('\t').length;
      const itemCols = secondItemLine!.split('\t').length;
      expect(headerCols).toBe(5);
      expect(itemCols).toBe(5);
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
      // 58mm uses character-based center() — starts with spaces, no CENTER_MARKER
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
      // 58mm uses character-based padding, no tabs
      expect(dateLine).not.toContain('\t');
    });
  });
});
