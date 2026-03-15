/**
 * TextParser Tests
 * TDD: Tests written first to define expected behavior
 */

import { TextParser } from '../TextParser';
import type { ItemUnit } from '../../types/scanning.types';

describe('TextParser', () => {
  let parser: TextParser;

  beforeEach(() => {
    parser = new TextParser();
  });

  describe('parseLine', () => {
    describe('English quantity patterns', () => {
      it('should extract "5 kg" from "Atta 5 kg"', () => {
        const result = parser.parseLine('Atta 5 kg', 'en', 0);
        expect(result.itemName).toBe('Atta');
        expect(result.quantity).toBe(5);
        expect(result.unit).toBe('kg');
      });

      it('should extract "500 gm" from "Sugar 500 gm"', () => {
        const result = parser.parseLine('Sugar 500 gm', 'en', 0);
        expect(result.itemName).toBe('Sugar');
        expect(result.quantity).toBe(500);
        expect(result.unit).toBe('gm');
      });

      it('should extract "500 g" and normalize to "gm"', () => {
        const result = parser.parseLine('Sugar 500 g', 'en', 0);
        expect(result.itemName).toBe('Sugar');
        expect(result.quantity).toBe(500);
        expect(result.unit).toBe('gm');
      });

      it('should extract "3 pcs" from "Soap 3 pcs"', () => {
        const result = parser.parseLine('Soap 3 pcs', 'en', 0);
        expect(result.itemName).toBe('Soap');
        expect(result.quantity).toBe(3);
        expect(result.unit).toBe('pcs');
      });

      it('should extract "2 pieces" and normalize to "pcs"', () => {
        const result = parser.parseLine('Dove Soap 2 pieces', 'en', 0);
        expect(result.itemName).toBe('Dove Soap');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('pcs');
      });

      it('should extract "1 L" from "Oil 1 L"', () => {
        const result = parser.parseLine('Oil 1 L', 'en', 0);
        expect(result.itemName).toBe('Oil');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('L');
      });

      it('should extract "500 ml" from "Shampoo 500 ml"', () => {
        const result = parser.parseLine('Shampoo 500 ml', 'en', 0);
        expect(result.itemName).toBe('Shampoo');
        expect(result.quantity).toBe(500);
        expect(result.unit).toBe('ml');
      });

      it('should extract "1 liter" and normalize to "L"', () => {
        const result = parser.parseLine('Milk 1 liter', 'en', 0);
        expect(result.itemName).toBe('Milk');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('L');
      });

      it('should handle "packet" as "pcs"', () => {
        const result = parser.parseLine('Biscuits 2 packets', 'en', 0);
        expect(result.itemName).toBe('Biscuits');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('pcs');
      });

      it('should handle "kilo" as "kg"', () => {
        const result = parser.parseLine('Rice 5 kilo', 'en', 0);
        expect(result.itemName).toBe('Rice');
        expect(result.quantity).toBe(5);
        expect(result.unit).toBe('kg');
      });

      it('should handle "kilogram" as "kg"', () => {
        const result = parser.parseLine('Wheat 2 kilogram', 'en', 0);
        expect(result.itemName).toBe('Wheat');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('kg');
      });

      it('should handle decimal quantities like "0.5 kg"', () => {
        const result = parser.parseLine('Butter 0.5 kg', 'en', 0);
        expect(result.itemName).toBe('Butter');
        expect(result.quantity).toBe(0.5);
        expect(result.unit).toBe('kg');
      });

      it('should handle decimal quantities like "1.5 L"', () => {
        const result = parser.parseLine('Cooking Oil 1.5 L', 'en', 0);
        expect(result.itemName).toBe('Cooking Oil');
        expect(result.quantity).toBe(1.5);
        expect(result.unit).toBe('L');
      });
    });

    describe('quantity at beginning of line', () => {
      it('should extract quantity when at start: "5 kg Atta"', () => {
        const result = parser.parseLine('5 kg Atta', 'en', 0);
        expect(result.itemName).toBe('Atta');
        expect(result.quantity).toBe(5);
        expect(result.unit).toBe('kg');
      });

      it('should extract quantity when at start: "2 pcs Soap"', () => {
        const result = parser.parseLine('2 pcs Soap', 'en', 0);
        expect(result.itemName).toBe('Soap');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('pcs');
      });
    });

    describe('Telugu quantity patterns', () => {
      it('should extract "2 కి.గ్రా" from Telugu text', () => {
        const result = parser.parseLine('బియ్యం 2 కి.గ్రా', 'te', 0);
        expect(result.itemName).toBe('బియ్యం');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('kg');
      });

      it('should extract "1 కిలో" and normalize to "kg"', () => {
        const result = parser.parseLine('పెసరపప్పు 1 కిలో', 'te', 0);
        expect(result.itemName).toBe('పెసరపప్పు');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('kg');
      });

      it('should extract "500 గ్రా" and normalize to "gm"', () => {
        const result = parser.parseLine('చక్కెర 500 గ్రా', 'te', 0);
        expect(result.itemName).toBe('చక్కెర');
        expect(result.quantity).toBe(500);
        expect(result.unit).toBe('gm');
      });

      it('should extract "1 లీ" and normalize to "L"', () => {
        const result = parser.parseLine('నూనె 1 లీ', 'te', 0);
        expect(result.itemName).toBe('నూనె');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('L');
      });

      it('should extract "1 లీటర్" and normalize to "L"', () => {
        const result = parser.parseLine('పాలు 1 లీటర్', 'te', 0);
        expect(result.itemName).toBe('పాలు');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('L');
      });

      it('should extract "250 మి.లీ" and normalize to "ml"', () => {
        const result = parser.parseLine('షాంపూ 250 మి.లీ', 'te', 0);
        expect(result.itemName).toBe('షాంపూ');
        expect(result.quantity).toBe(250);
        expect(result.unit).toBe('ml');
      });

      it('should extract "3 ప్యాకెట్" and normalize to "pcs"', () => {
        const result = parser.parseLine('బిస్కెట్లు 3 ప్యాకెట్', 'te', 0);
        expect(result.itemName).toBe('బిస్కెట్లు');
        expect(result.quantity).toBe(3);
        expect(result.unit).toBe('pcs');
      });

      it('should extract "2 ముక్కలు" and normalize to "pcs"', () => {
        const result = parser.parseLine('సబ్బు 2 ముక్కలు', 'te', 0);
        expect(result.itemName).toBe('సబ్బు');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('pcs');
      });

      it('should extract "1 ముక్క" (singular) and normalize to "pcs"', () => {
        const result = parser.parseLine('సబ్బు 1 ముక్క', 'te', 0);
        expect(result.itemName).toBe('సబ్బు');
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe('pcs');
      });
    });

    describe('edge cases', () => {
      it('should return null quantity for text without quantity', () => {
        const result = parser.parseLine('Toor Dal', 'en', 0);
        expect(result.itemName).toBe('Toor Dal');
        expect(result.quantity).toBeNull();
        expect(result.unit).toBeNull();
      });

      it('should handle extra whitespace', () => {
        const result = parser.parseLine('  Atta   5   kg  ', 'en', 0);
        expect(result.itemName).toBe('Atta');
        expect(result.quantity).toBe(5);
        expect(result.unit).toBe('kg');
      });

      it('should preserve raw text', () => {
        const result = parser.parseLine('Atta 5 kg', 'en', 0);
        expect(result.rawText).toBe('Atta 5 kg');
      });

      it('should set correct line index', () => {
        const result = parser.parseLine('Atta 5 kg', 'en', 5);
        expect(result.lineIndex).toBe(5);
      });

      it('should set correct language', () => {
        const result = parser.parseLine('Atta 5 kg', 'en', 0);
        expect(result.language).toBe('en');
      });

      it('should handle empty string', () => {
        const result = parser.parseLine('', 'en', 0);
        expect(result.itemName).toBe('');
        expect(result.quantity).toBeNull();
        expect(result.unit).toBeNull();
      });

      it('should handle quantity-only text (no item name)', () => {
        const result = parser.parseLine('5 kg', 'en', 0);
        expect(result.itemName).toBe('');
        expect(result.quantity).toBe(5);
        expect(result.unit).toBe('kg');
      });
    });

    describe('mixed language detection', () => {
      it('should handle English item with Telugu-style quantity', () => {
        const result = parser.parseLine('Rice 2 కి.గ్రా', 'mixed', 0);
        expect(result.itemName).toBe('Rice');
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe('kg');
      });
    });
  });

  describe('parseLines', () => {
    it('should parse multiple lines', () => {
      const lines = ['Atta 5 kg', 'Sugar 500 gm', 'Oil 1 L'];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(3);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
      expect(results[2].itemName).toBe('Oil');
    });

    it('should set correct line indices', () => {
      const lines = ['Atta 5 kg', 'Sugar 500 gm'];
      const results = parser.parseLines(lines, 'en');

      expect(results[0].lineIndex).toBe(0);
      expect(results[1].lineIndex).toBe(1);
    });

    it('should filter out empty lines', () => {
      const lines = ['Atta 5 kg', '', '  ', 'Sugar 500 gm'];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(2);
    });
  });

  describe('normalizeUnit', () => {
    const unitMappings: Array<[string, ItemUnit]> = [
      ['kg', 'kg'],
      ['KG', 'kg'],
      ['Kg', 'kg'],
      ['kilo', 'kg'],
      ['kilogram', 'kg'],
      ['kilograms', 'kg'],
      ['gm', 'gm'],
      ['GM', 'gm'],
      ['g', 'gm'],
      ['gram', 'gm'],
      ['grams', 'gm'],
      ['L', 'L'],
      ['l', 'L'],
      ['liter', 'L'],
      ['litre', 'L'],
      ['liters', 'L'],
      ['litres', 'L'],
      ['ml', 'ml'],
      ['ML', 'ml'],
      ['milliliter', 'ml'],
      ['milliliters', 'ml'],
      ['pcs', 'pcs'],
      ['PCS', 'pcs'],
      ['pc', 'pcs'],
      ['piece', 'pcs'],
      ['pieces', 'pcs'],
      ['packet', 'pcs'],
      ['packets', 'pcs'],
      ['pack', 'pcs'],
      ['packs', 'pcs'],
    ];

    it.each(unitMappings)('should normalize "%s" to "%s"', (input, expected) => {
      expect(parser.normalizeUnit(input)).toBe(expected);
    });

    it('should return null for unknown unit', () => {
      expect(parser.normalizeUnit('xyz')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parser.normalizeUnit('')).toBeNull();
    });
  });

  describe('detectLanguage', () => {
    it('should detect English text', () => {
      expect(parser.detectLanguage('Toor Dal 5 kg')).toBe('en');
    });

    it('should detect Telugu text', () => {
      expect(parser.detectLanguage('కందిపప్పు 1 కిలో')).toBe('te');
    });

    it('should detect mixed text', () => {
      expect(parser.detectLanguage('Rice 2 కి.గ్రా')).toBe('mixed');
    });

    it('should return "en" for numbers only', () => {
      expect(parser.detectLanguage('5 kg')).toBe('en');
    });
  });

  describe('isNonItemLine', () => {
    describe('separator lines', () => {
      it('should identify "===" as non-item line', () => {
        expect(parser.isNonItemLine('===')).toBe(true);
      });

      it('should identify "===================" as non-item line', () => {
        expect(parser.isNonItemLine('===================')).toBe(true);
      });

      it('should identify "---" as non-item line', () => {
        expect(parser.isNonItemLine('---')).toBe(true);
      });

      it('should identify "***" as non-item line', () => {
        expect(parser.isNonItemLine('***')).toBe(true);
      });

      it('should identify mixed separators "=-=" as non-item line', () => {
        expect(parser.isNonItemLine('=-=')).toBe(true);
      });
    });

    describe('header lines', () => {
      it('should identify "CATEGORY NAME" as non-item line', () => {
        expect(parser.isNonItemLine('CATEGORY NAME')).toBe(true);
      });

      it('should identify "ITEM NAME" as non-item line', () => {
        expect(parser.isNonItemLine('ITEM NAME')).toBe(true);
      });

      it('should identify "QUANTITY" as non-item line', () => {
        expect(parser.isNonItemLine('QUANTITY')).toBe(true);
      });

      it('should identify "CATEGORY NAME  ITEM NAME  QUANTITY" as non-item line', () => {
        expect(parser.isNonItemLine('CATEGORY NAME  ITEM NAME  QUANTITY')).toBe(true);
      });

      it('should identify "Total Quantity:" as non-item line', () => {
        expect(parser.isNonItemLine('Total Quantity:')).toBe(true);
      });

      it('should identify "Total Quantity: 20" as non-item line', () => {
        expect(parser.isNonItemLine('Total Quantity: 20')).toBe(true);
      });
    });

    describe('category headers', () => {
      it('should identify "ATTA, RICE & GRAINS" as non-item line', () => {
        expect(parser.isNonItemLine('ATTA, RICE & GRAINS')).toBe(true);
      });

      it('should identify "DAL & PULSES" as non-item line', () => {
        expect(parser.isNonItemLine('DAL & PULSES')).toBe(true);
      });

      it('should identify "OIL & GHEE" as non-item line', () => {
        expect(parser.isNonItemLine('OIL & GHEE')).toBe(true);
      });

      it('should identify "TEA & COFFEE" as non-item line', () => {
        expect(parser.isNonItemLine('TEA & COFFEE')).toBe(true);
      });

      it('should identify "CHIPS & BISCUITS" as non-item line', () => {
        expect(parser.isNonItemLine('CHIPS & BISCUITS')).toBe(true);
      });

      it('should identify "BATH & BODY" as non-item line', () => {
        expect(parser.isNonItemLine('BATH & BODY')).toBe(true);
      });

      it('should identify "MAKEUP & COSMETICS" as non-item line', () => {
        expect(parser.isNonItemLine('MAKEUP & COSMETICS')).toBe(true);
      });

      it('should identify "LAUNDRY" as non-item line', () => {
        expect(parser.isNonItemLine('LAUNDRY')).toBe(true);
      });

      it('should identify "BABY CARE" as non-item line', () => {
        expect(parser.isNonItemLine('BABY CARE')).toBe(true);
      });
    });

    describe('metadata and footer lines', () => {
      it('should identify "Generated by GroOne" as non-item line', () => {
        expect(parser.isNonItemLine('Generated by GroOne')).toBe(true);
      });

      it('should identify "Prakash Groceries" as non-item line (merchant name)', () => {
        expect(parser.isNonItemLine('Prakash Groceries')).toBe(true);
      });

      it('should identify "Main Street, Vizag" as non-item line (address)', () => {
        expect(parser.isNonItemLine('Main Street, Vizag')).toBe(true);
      });

      it('should identify "Main Street. Vizag" as non-item line (address)', () => {
        expect(parser.isNonItemLine('Main Street. Vizag')).toBe(true);
      });

      it('should identify "Categories:" as non-item line', () => {
        expect(parser.isNonItemLine('Categories:')).toBe(true);
      });

      it('should identify "Unique Items:" as non-item line', () => {
        expect(parser.isNonItemLine('Unique Items:')).toBe(true);
      });

      it('should identify "Date:" as non-item line', () => {
        expect(parser.isNonItemLine('Date:')).toBe(true);
      });

      it('should identify "Time:" as non-item line', () => {
        expect(parser.isNonItemLine('Time:')).toBe(true);
      });

      it('should identify "Picking List" as non-item line', () => {
        expect(parser.isNonItemLine('Picking List')).toBe(true);
      });
    });

    describe('number-only lines', () => {
      it('should identify "20" as non-item line', () => {
        expect(parser.isNonItemLine('20')).toBe(true);
      });

      it('should identify "12" as non-item line', () => {
        expect(parser.isNonItemLine('12')).toBe(true);
      });

      it('should identify "100" as non-item line', () => {
        expect(parser.isNonItemLine('100')).toBe(true);
      });
    });

    describe('quantity-only lines (no item name)', () => {
      it('should identify "5kg" as non-item line', () => {
        expect(parser.isNonItemLine('5kg')).toBe(true);
      });

      it('should identify "5 kg" as non-item line', () => {
        expect(parser.isNonItemLine('5 kg')).toBe(true);
      });

      it('should identify "500gm" as non-item line', () => {
        expect(parser.isNonItemLine('500gm')).toBe(true);
      });

      it('should identify "500 gm" as non-item line', () => {
        expect(parser.isNonItemLine('500 gm')).toBe(true);
      });

      it('should identify "1L" as non-item line', () => {
        expect(parser.isNonItemLine('1L')).toBe(true);
      });

      it('should identify "1 L" as non-item line', () => {
        expect(parser.isNonItemLine('1 L')).toBe(true);
      });

      it('should identify "500ml" as non-item line', () => {
        expect(parser.isNonItemLine('500ml')).toBe(true);
      });

      it('should identify "3 pcs" as non-item line', () => {
        expect(parser.isNonItemLine('3 pcs')).toBe(true);
      });

      it('should identify "2 packets" as non-item line', () => {
        expect(parser.isNonItemLine('2 packets')).toBe(true);
      });

      it('should identify "1.5 kg" as non-item line', () => {
        expect(parser.isNonItemLine('1.5 kg')).toBe(true);
      });

      it('should identify "0.5 L" as non-item line', () => {
        expect(parser.isNonItemLine('0.5 L')).toBe(true);
      });

      it('should identify "2 కి.గ్రా" (Telugu quantity) as non-item line', () => {
        expect(parser.isNonItemLine('2 కి.గ్రా')).toBe(true);
      });

      it('should identify "500 గ్రా" (Telugu quantity) as non-item line', () => {
        expect(parser.isNonItemLine('500 గ్రా')).toBe(true);
      });

      it('should identify "1 లీటర్" (Telugu quantity) as non-item line', () => {
        expect(parser.isNonItemLine('1 లీటర్')).toBe(true);
      });
    });

    describe('valid item lines', () => {
      it('should NOT identify "Aashirvaad Atta 5 kg" as non-item line', () => {
        expect(parser.isNonItemLine('Aashirvaad Atta 5 kg')).toBe(false);
      });

      it('should NOT identify "Toor Dal 1 kg" as non-item line', () => {
        expect(parser.isNonItemLine('Toor Dal 1 kg')).toBe(false);
      });

      it('should NOT identify "Fortune Sunflower Oil 1 L" as non-item line', () => {
        expect(parser.isNonItemLine('Fortune Sunflower Oil 1 L')).toBe(false);
      });

      it('should NOT identify "బియ్యం 2 కి.గ్రా" as non-item line', () => {
        expect(parser.isNonItemLine('బియ్యం 2 కి.గ్రా')).toBe(false);
      });

      it('should NOT identify "Dove Soap" as non-item line', () => {
        expect(parser.isNonItemLine('Dove Soap')).toBe(false);
      });
    });
  });

  describe('parseLines with filtering', () => {
    it('should filter out separator lines from results', () => {
      const lines = [
        'Atta 5 kg',
        '===================',
        'Sugar 500 gm',
        '---',
        'Oil 1 L',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(3);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
      expect(results[2].itemName).toBe('Oil');
    });

    it('should filter out header lines from results', () => {
      const lines = [
        'CATEGORY NAME  ITEM NAME  QUANTITY',
        'Atta 5 kg',
        'Sugar 500 gm',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
    });

    it('should filter out category headers from results', () => {
      const lines = [
        'ATTA, RICE & GRAINS',
        'Aashirvaad Atta 5 kg',
        'Basmati Rice 1 kg',
        'DAL & PULSES',
        'Toor Dal 1 kg',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(3);
      expect(results[0].itemName).toBe('Aashirvaad Atta');
      expect(results[1].itemName).toBe('Basmati Rice');
      expect(results[2].itemName).toBe('Toor Dal');
    });

    it('should filter out metadata and footer lines', () => {
      const lines = [
        'Total Quantity: 20',
        '===================',
        'Aashirvaad Atta 5 kg',
        '===================',
        'Generated by GroOne',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('Aashirvaad Atta');
    });

    it('should filter out number-only lines', () => {
      const lines = [
        'Atta 5 kg',
        '20',
        'Sugar 500 gm',
        '12',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
    });

    it('should handle a realistic scanned receipt', () => {
      const lines = [
        'Prakash Groceries',
        'Main Street, Vizag',
        '',
        'Picking List',
        'Date: 22/01/2026',
        'Categories: 3',
        'Unique Items: 12',
        'Total Quantity: 20',
        '',
        '===================',
        'CATEGORY NAME  ITEM NAME  QUANTITY',
        '===================',
        '',
        'ATTA, RICE & GRAINS',
        'Aashirvaad Atta 5 kg',
        'Fortune Chakki Atta 5 kg',
        'Basmati Rice 1 kg',
        'Brown Rice 1 kg',
        '',
        'DAL & PULSES',
        'Toor Dal 1 kg',
        'Moong Dal 1 kg',
        'Chana Dal 1 kg',
        'Masoor Dal 1 kg',
        '',
        'OIL & GHEE',
        'Fortune Sunflower Oil 1 L',
        'Saffola Gold Oil 1 L',
        'Amul Ghee 1 kg',
        'Patanjali Ghee 1 kg',
        '',
        '===================',
        'Generated by GroOne',
        '===================',
      ];

      const results = parser.parseLines(lines, 'en');

      // Should only have the 12 actual items
      expect(results).toHaveLength(12);
      expect(results.map((r) => r.itemName)).toEqual([
        'Aashirvaad Atta',
        'Fortune Chakki Atta',
        'Basmati Rice',
        'Brown Rice',
        'Toor Dal',
        'Moong Dal',
        'Chana Dal',
        'Masoor Dal',
        'Fortune Sunflower Oil',
        'Saffola Gold Oil',
        'Amul Ghee',
        'Patanjali Ghee',
      ]);
    });

    it('should filter out quantity-only lines even with unusual spacing', () => {
      const lines = [
        'Atta 5 kg',
        ' 5kg ',
        '  5 kg  ',
        'Sugar 500 gm',
        '500gm',
        '  500 gm',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
    });

    it('should never return items with empty item names', () => {
      const lines = [
        'Atta 5 kg',
        '5kg',
        '1 L',
        '500 gm',
        '3 pcs',
        'Sugar 500 gm',
      ];
      const results = parser.parseLines(lines, 'en');

      // All results must have non-empty item names
      for (const result of results) {
        expect(result.itemName.trim()).not.toBe('');
      }

      expect(results).toHaveLength(2);
    });

    it('should filter out lines that are just numbers with units from OCR', () => {
      // Simulating OCR output where quantities get separated into their own lines
      const lines = [
        'Aashirvaad Atta',
        '5kg',
        'Basmati Rice',
        '1 kg',
        'Fortune Oil',
        '1L',
      ];
      const results = parser.parseLines(lines, 'en');

      // Should only have the item names, not the quantities
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.itemName)).toEqual([
        'Aashirvaad Atta',
        'Basmati Rice',
        'Fortune Oil',
      ]);
    });

    it('should handle quantity-only lines with Unicode whitespace', () => {
      // Non-breaking space (U+00A0) and other Unicode spaces
      const lines = [
        'Atta 5 kg',
        '5\u00A0kg', // Non-breaking space
        '500\u200Bgm', // Zero-width space
        'Sugar 500 gm',
      ];
      const results = parser.parseLines(lines, 'en');

      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('Atta');
      expect(results[1].itemName).toBe('Sugar');
    });
  });

  // ===========================================================================
  // Two-Column Format Parsing (OCR alternating lines)
  // Bug fix: handwritten lists with item name on left, quantity on right are
  // OCR'd as alternating lines. The quantity-only line must be paired with the
  // preceding item instead of being filtered out by isNonItemLine().
  // ===========================================================================
  describe('two-column format parsing (OCR alternating lines)', () => {
    it('should pair quantity-only line with preceding item (Telugu item, English Kg)', () => {
      const lines = ['కందిపప్పు', '2 Kg'];
      const result = parser.parseLines(lines, 'te');
      expect(result).toHaveLength(1);
      expect(result[0].itemName).toBe('కందిపప్పు');
      expect(result[0].quantity).toBe(2);
      expect(result[0].unit).toBe('kg');
    });

    it('should handle full two-column Telugu list (6 items with quantities)', () => {
      const lines = [
        'కందిపప్పు', '2 Kg',
        'పెసరపప్పు', '3 Kg',
        'శెనగపప్పు', '2 Kg',
        'మిరియాలు', '1 Kg',
        'ధనియాలు', '1 Kg',
        'జీల కర్ర', '1 Kg',
      ];
      const result = parser.parseLines(lines, 'te');
      expect(result).toHaveLength(6);
      expect(result[0]).toMatchObject({ quantity: 2, unit: 'kg' });
      expect(result[1]).toMatchObject({ quantity: 3, unit: 'kg' });
      expect(result[2]).toMatchObject({ quantity: 2, unit: 'kg' });
      expect(result[3]).toMatchObject({ quantity: 1, unit: 'kg' });
      expect(result[4]).toMatchObject({ quantity: 1, unit: 'kg' });
      expect(result[5]).toMatchObject({ quantity: 1, unit: 'kg' });
    });

    it('should pair quantity-only line in English two-column list', () => {
      const lines = ['Atta', '5 kg', 'Sugar', '500 gm', 'Oil', '1 L'];
      const result = parser.parseLines(lines, 'en');
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ itemName: 'Atta', quantity: 5, unit: 'kg' });
      expect(result[1]).toMatchObject({ itemName: 'Sugar', quantity: 500, unit: 'gm' });
      expect(result[2]).toMatchObject({ itemName: 'Oil', quantity: 1, unit: 'L' });
    });

    it('should NOT overwrite existing quantity with a trailing quantity-only line', () => {
      // "Atta 5 kg" already has quantity; "3 kg" on next line should be discarded
      const lines = ['Atta 5 kg', '3 kg'];
      const result = parser.parseLines(lines, 'en');
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(5); // Original quantity preserved
    });

    it('should discard quantity-only line that has no preceding item to pair with', () => {
      // Quantity appears before any item line — orphan, discard it
      const lines = ['2 Kg', 'కందిపప్పు'];
      const result = parser.parseLines(lines, 'te');
      expect(result).toHaveLength(1);
      expect(result[0].itemName).toBe('కందిపప్పు');
      expect(result[0].quantity).toBeNull();
    });

    it('should handle mixed inline and two-column quantities in the same list', () => {
      // "Atta 5 kg" inline, "Sugar" with "500 gm" on next line, "Oil 1 L" inline
      const lines = ['Atta 5 kg', 'Sugar', '500 gm', 'Oil 1 L'];
      const result = parser.parseLines(lines, 'en');
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ itemName: 'Atta', quantity: 5, unit: 'kg' });
      expect(result[1]).toMatchObject({ itemName: 'Sugar', quantity: 500, unit: 'gm' });
      expect(result[2]).toMatchObject({ itemName: 'Oil', quantity: 1, unit: 'L' });
    });
  });

  describe('per-line language detection', () => {
    it('should detect English item name in a Telugu document', () => {
      const lines = ['కందిపప్పు 2 kg', 'Amul Ghee 1 kg', 'పెసరపప్పు 1 kg'];
      const results = parser.parseLines(lines, 'te');
      expect(results).toHaveLength(3);
      // "Amul Ghee" is English text — should NOT be tagged 'te'
      expect(['en', 'mixed']).toContain(results[1].language);
    });

    it('should keep Telugu items as "te" in a Telugu document', () => {
      const lines = ['కందిపప్పు 2 kg', 'పెసరపప్పు 1 kg'];
      const results = parser.parseLines(lines, 'te');
      expect(results[0].language).toBe('te');
      expect(results[1].language).toBe('te');
    });

    it('should detect mixed language item name (Telugu + English)', () => {
      const lines = ['ఫార్చ్యూన్ Sunflower Oil 1 L'];
      const results = parser.parseLines(lines, 'te');
      expect(results[0].language).toBe('mixed');
    });

    it('should detect Telugu item name in an English document', () => {
      const lines = ['Toor Dal 1 kg', 'కందిపప్పు 2 kg', 'Sugar 500 gm'];
      const results = parser.parseLines(lines, 'en');
      expect(results[1].language).toBe('te');
    });

    it('should not change language if item language matches document language', () => {
      const lines = ['Toor Dal 1 kg', 'Amul Ghee 1 kg'];
      const results = parser.parseLines(lines, 'en');
      expect(results[0].language).toBe('en');
      expect(results[1].language).toBe('en');
    });
  });

  describe('minimum item name length filter', () => {
    it('should filter out single character OCR artifact "a"', () => {
      const lines = ['Atta 5 kg', 'a', 'Sugar 500 gm'];
      const results = parser.parseLines(lines, 'en');
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.itemName)).toEqual(['Atta', 'Sugar']);
    });

    it('should filter out two character OCR artifact "ab"', () => {
      const lines = ['ab', 'Toor Dal 1 kg'];
      const results = parser.parseLines(lines, 'en');
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('Toor Dal');
    });

    it('should filter out single character OCR artifacts "k" and "x"', () => {
      const lines = ['k', 'Atta 5 kg', 'x', 'Sugar 500 gm'];
      const results = parser.parseLines(lines, 'en');
      expect(results).toHaveLength(2);
    });

    it('should NOT filter out three character item name "Dal"', () => {
      const lines = ['Dal 1 kg'];
      const results = parser.parseLines(lines, 'en');
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('Dal');
    });

    it('should NOT filter out short Telugu item names (multi-codepoint)', () => {
      // "రవ్వ" (ravva) = 4 Unicode code points — should NOT be filtered
      const lines = ['రవ్వ 1 kg'];
      const results = parser.parseLines(lines, 'te');
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('రవ్వ');
    });

    it('should filter out item name that becomes too short after quantity extraction', () => {
      // "ab 5 kg" → itemName = "ab" (2 chars) → should be filtered
      const lines = ['ab 5 kg', 'Atta 5 kg'];
      const results = parser.parseLines(lines, 'en');
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('Atta');
    });
  });
});
