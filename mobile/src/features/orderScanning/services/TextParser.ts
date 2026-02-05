/**
 * TextParser Service
 * Parses OCR text to extract item names, quantities, and units
 */

import {
  ParsedLineItem,
  DetectedLanguage,
  ItemUnit,
} from '../types/scanning.types';

/**
 * Unit mapping from various representations to standard ItemUnit
 */
const UNIT_MAPPINGS: Record<string, ItemUnit> = {
  // Kilogram variations
  kg: 'kg',
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  // Telugu kg
  'కి.గ్రా': 'kg',
  'కిగ్రా': 'kg',
  'కిలో': 'kg',

  // Gram variations
  gm: 'gm',
  g: 'gm',
  gram: 'gm',
  grams: 'gm',
  // Telugu gm
  'గ్రా': 'gm',
  'గ్రాము': 'gm',
  'గ్రాములు': 'gm',

  // Liter variations
  l: 'L',
  liter: 'L',
  litre: 'L',
  liters: 'L',
  litres: 'L',
  // Telugu L
  'లీ': 'L',
  'లీటర్': 'L',
  'లీటర్లు': 'L',

  // Milliliter variations
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  // Telugu ml
  'మి.లీ': 'ml',
  'మిలీ': 'ml',
  'మిల్లీలీటర్': 'ml',

  // Pieces variations
  pcs: 'pcs',
  pc: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  packet: 'pcs',
  packets: 'pcs',
  pack: 'pcs',
  packs: 'pcs',
  // Telugu pcs
  'ప్యాకెట్': 'pcs',
  'ప్యాకెట్లు': 'pcs',
  'ముక్క': 'pcs',
  'ముక్కలు': 'pcs',
};

/**
 * Telugu Unicode range for language detection
 * Telugu: U+0C00 to U+0C7F
 */
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;

/**
 * Unicode whitespace regex - matches all types of whitespace including:
 * - Regular space, tab, newline
 * - Non-breaking space (U+00A0)
 * - Zero-width characters
 * - Other Unicode whitespace
 */
const UNICODE_WHITESPACE_REGEX = /[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g;

/**
 * Patterns for identifying non-item lines
 */
const NON_ITEM_PATTERNS = {
  // Lines consisting only of separator characters (=, -, *, etc.)
  separator: /^[-=*_|+]+$/,

  // Number-only lines (just digits, possibly with whitespace)
  numberOnly: /^\d+$/,

  // Quantity-only lines (number + unit, no item name)
  // English: "5kg", "5 kg", "500gm", "1L", "500ml", "3 pcs", "2 packets"
  quantityOnlyEnglish:
    /^\d+(?:\.\d+)?\s*(?:kg|kgs?|kilo|kilogram|kilograms?|gm?|gms?|gram|grams?|l|litre|liter|litres|liters?|ml|millilitre|milliliter|millilitres|milliliters?|pcs?|pieces?|packets?|packs?|nos?)$/i,

  // Telugu quantity-only: "2 కి.గ్రా", "500 గ్రా", "1 లీటర్"
  quantityOnlyTelugu:
    /^\d+(?:\.\d+)?\s*(?:కి\.?గ్రా|కిలో|కిలోగ్రాము|గ్రా|గ్రాము|గ్రాములు|లీ|లీటర్|లీటర్లు|మి\.?లీ|మిల్లీలీటర్|ప్యాకెట్|ప్యాక్|ముక్క|ముక్కలు)$/,

  // Table header patterns
  tableHeaders: [
    /^category\s*name/i,
    /^item\s*name/i,
    /^quantity$/i,
    /category\s*name.*item\s*name.*quantity/i,
  ],

  // Metadata patterns (lines ending with colon or colon followed by value)
  metadata: [
    /^total\s*quantity\s*:?/i,
    /^categories\s*:?/i,
    /^unique\s*items\s*:?/i,
    /^date\s*:?/i,
    /^time\s*:?/i,
    /generated\s*by/i,
    /^picking\s*list$/i,
  ],

  // Category headers (all caps, often with & or ,)
  categoryHeaders: [
    /^atta[,\s]*rice/i,
    /^dal\s*[&,]\s*pulses/i,
    /^oil\s*[&,]\s*ghee/i,
    /^tea\s*[&,]\s*coffee/i,
    /^chips\s*[&,]\s*biscuits/i,
    /^bath\s*[&,]\s*body/i,
    /^makeup\s*[&,]\s*cosmetics/i,
    /^laundry\s*(detergents?)?$/i,
    /^baby\s*care$/i,
    /^grains?$/i,
    /^pulses?$/i,
    /^beverages?$/i,
    /^snacks?$/i,
    /^personal\s*care$/i,
    /^household$/i,
  ],

  // Address-like patterns
  address: [
    /street/i,
    /road/i,
    /lane/i,
    /nagar/i,
    /colony/i,
    /vizag/i,
    /visakhapatnam/i,
    /hyderabad/i,
  ],

  // Merchant name pattern (ends with Groceries, Store, Shop, Mart)
  merchantName: /(groceries|grocery|store|shop|mart|supermarket)$/i,
};

/**
 * Quantity patterns for extraction
 */
const QUANTITY_PATTERNS = {
  // Pattern: number + optional decimal + unit (at end)
  // e.g., "Atta 5 kg", "Sugar 500 gm", "Oil 1.5 L"
  endPattern:
    /(\d+(?:\.\d+)?)\s*(kg|kilo|kilograms?|gm?|grams?|l|liters?|litres?|ml|milliliters?|millilitres?|pcs?|pieces?|packets?|packs?|కి\.?గ్రా|కిలో|గ్రా(?:ము(?:లు)?)?|లీ(?:టర్(?:లు)?)?|మి\.?లీ|మిల్లీలీటర్|ప్యాకెట్(?:లు)?|ముక్క(?:లు)?)\s*$/i,

  // Pattern: number + unit at start
  // e.g., "5 kg Atta", "2 pcs Soap"
  startPattern:
    /^(\d+(?:\.\d+)?)\s*(kg|kilo|kilograms?|gm?|grams?|l|liters?|litres?|ml|milliliters?|millilitres?|pcs?|pieces?|packets?|packs?|కి\.?గ్రా|కిలో|గ్రా(?:ము(?:లు)?)?|లీ(?:టర్(?:లు)?)?|మి\.?లీ|మిల్లీలీటర్|ప్యాకెట్(?:లు)?|ముక్క(?:లు)?)\s+/i,
};

export class TextParser {
  /**
   * Parse a single line of text to extract item name, quantity, and unit
   */
  parseLine(
    text: string,
    language: DetectedLanguage,
    lineIndex: number
  ): ParsedLineItem {
    const rawText = text;
    const trimmedText = text.trim();

    if (!trimmedText) {
      return {
        rawText,
        itemName: '',
        quantity: null,
        unit: null,
        language,
        lineIndex,
      };
    }

    // Try to extract quantity from end of text first
    let match = trimmedText.match(QUANTITY_PATTERNS.endPattern);
    let itemName = '';
    let quantity: number | null = null;
    let unit: ItemUnit | null = null;

    if (match) {
      quantity = parseFloat(match[1]);
      unit = this.normalizeUnit(match[2]);
      // Item name is everything before the quantity
      itemName = trimmedText.slice(0, match.index).trim();
    } else {
      // Try to extract quantity from start of text
      match = trimmedText.match(QUANTITY_PATTERNS.startPattern);
      if (match) {
        quantity = parseFloat(match[1]);
        unit = this.normalizeUnit(match[2]);
        // Item name is everything after the quantity+unit
        itemName = trimmedText.slice(match[0].length).trim();
      } else {
        // No quantity found, treat entire text as item name
        itemName = trimmedText;
      }
    }

    // Clean up item name - remove extra whitespace
    itemName = itemName.replace(/\s+/g, ' ').trim();

    return {
      rawText,
      itemName,
      quantity,
      unit,
      language,
      lineIndex,
    };
  }

  /**
   * Parse multiple lines of text
   * Filters out non-item lines (headers, separators, metadata) before parsing
   */
  parseLines(lines: string[], language: DetectedLanguage): ParsedLineItem[] {
    return lines
      .filter((line) => {
        const trimmed = line.trim();
        // Filter out empty lines and non-item lines
        return trimmed !== '' && !this.isNonItemLine(trimmed);
      })
      .map((line, index) => this.parseLine(line, language, index))
      .filter((item) => item.itemName.trim() !== '');
  }

  /**
   * Normalize a unit string to standard ItemUnit
   */
  normalizeUnit(unit: string): ItemUnit | null {
    if (!unit) return null;

    const normalized = unit.toLowerCase().trim();

    // Check direct mapping
    if (UNIT_MAPPINGS[normalized]) {
      return UNIT_MAPPINGS[normalized];
    }

    // Check case-insensitive for all keys
    for (const [key, value] of Object.entries(UNIT_MAPPINGS)) {
      if (key.toLowerCase() === normalized) {
        return value;
      }
    }

    return null;
  }

  /**
   * Detect the language of a text string
   */
  detectLanguage(text: string): DetectedLanguage {
    const hasEnglish = /[a-zA-Z]/.test(text);
    const hasTelugu = TELUGU_REGEX.test(text);

    if (hasEnglish && hasTelugu) {
      return 'mixed';
    } else if (hasTelugu) {
      return 'te';
    } else {
      return 'en';
    }
  }

  /**
   * Normalize text by replacing all Unicode whitespace with regular spaces
   * and trimming the result
   */
  private normalizeWhitespace(text: string): string {
    return text.replace(UNICODE_WHITESPACE_REGEX, ' ').trim();
  }

  /**
   * Check if a line is a non-item line (header, separator, metadata, etc.)
   * Returns true if the line should be filtered out
   */
  isNonItemLine(text: string): boolean {
    // Normalize all Unicode whitespace to regular spaces
    const trimmed = this.normalizeWhitespace(text);

    // Empty lines are handled separately in parseLines
    if (!trimmed) {
      return false;
    }

    // Check for separator lines (===, ---, ***, etc.)
    if (NON_ITEM_PATTERNS.separator.test(trimmed)) {
      return true;
    }

    // Check for number-only lines (e.g., "20", "12")
    if (NON_ITEM_PATTERNS.numberOnly.test(trimmed)) {
      return true;
    }

    // Check for quantity-only lines (e.g., "5kg", "500 gm", "2 కి.గ్రా")
    if (NON_ITEM_PATTERNS.quantityOnlyEnglish.test(trimmed)) {
      return true;
    }
    if (NON_ITEM_PATTERNS.quantityOnlyTelugu.test(trimmed)) {
      return true;
    }

    // Check for table headers
    for (const pattern of NON_ITEM_PATTERNS.tableHeaders) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    // Check for metadata patterns
    for (const pattern of NON_ITEM_PATTERNS.metadata) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    // Check for category headers
    for (const pattern of NON_ITEM_PATTERNS.categoryHeaders) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    // Check for address patterns
    for (const pattern of NON_ITEM_PATTERNS.address) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    // Check for merchant name patterns
    if (NON_ITEM_PATTERNS.merchantName.test(trimmed)) {
      return true;
    }

    return false;
  }
}

// Export singleton instance for convenience
export const textParser = new TextParser();
