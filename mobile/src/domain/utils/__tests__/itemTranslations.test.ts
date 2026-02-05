/**
 * Item Translations Tests
 * TDD tests for item and category name translation utilities
 *
 * Note: These tests verify the translation functions work correctly.
 * Categories/items data is now fetched from the backend API.
 */

import i18n from '../../../i18n/i18n.config';
import { getTranslatedItemName, getTranslatedCategoryName } from '../itemTranslations';

describe('Item Translations', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  describe('getTranslatedItemName', () => {
    it('should return English item name when language is English', async () => {
      await i18n.changeLanguage('en');

      const result = getTranslatedItemName('tea-1');

      expect(result).toBe('Tata Tea Gold');
    });

    it('should return Telugu item name when language is Telugu', async () => {
      await i18n.changeLanguage('te');

      const result = getTranslatedItemName('tea-1');

      expect(result).toBe('టాటా టీ గోల్డ్');
    });

    it('should return English name for various items when in English', async () => {
      await i18n.changeLanguage('en');

      // Test a few items from i18n translations
      expect(getTranslatedItemName('atta-1')).toBe('Aashirvaad Atta');
      expect(getTranslatedItemName('dal-1')).toBe('Toor Dal');
      expect(getTranslatedItemName('oil-3')).toBe('Amul Ghee');
    });

    it('should return Telugu name for various items when in Telugu', async () => {
      await i18n.changeLanguage('te');

      // Test a few items from i18n translations
      expect(getTranslatedItemName('atta-1')).toBe('ఆశీర్వాద్ ఆటా');
      expect(getTranslatedItemName('dal-1')).toBe('కందిపప్పు'); // Telugu name for Toor Dal
      expect(getTranslatedItemName('oil-3')).toBe('అమూల్ ఘీ');
    });

    it('should return item id if translation not found', async () => {
      const result = getTranslatedItemName('non-existent-item');

      expect(result).toBe('non-existent-item');
    });
  });

  describe('getTranslatedCategoryName', () => {
    it('should return English category name when language is English', async () => {
      await i18n.changeLanguage('en');

      const result = getTranslatedCategoryName('tea-coffee');

      expect(result).toBe('Tea, Coffee & Drinks');
    });

    it('should return Telugu category name when language is Telugu', async () => {
      await i18n.changeLanguage('te');

      const result = getTranslatedCategoryName('tea-coffee');

      expect(result).toBe('టీ, కాఫీ & డ్రింక్స్');
    });

    it('should return English name for various categories when in English', async () => {
      await i18n.changeLanguage('en');

      expect(getTranslatedCategoryName('atta-rice')).toBe('Atta, Rice & Grains');
      expect(getTranslatedCategoryName('dal-pulses')).toBe('Dal & Pulses');
      expect(getTranslatedCategoryName('oil-ghee')).toBe('Oil & Ghee');
    });

    it('should return Telugu name for various categories when in Telugu', async () => {
      await i18n.changeLanguage('te');

      expect(getTranslatedCategoryName('atta-rice')).toBe('ఆటా, బియ్యం & ధాన్యాలు');
      expect(getTranslatedCategoryName('dal-pulses')).toBe('పప్పులు & దినుసులు');
      expect(getTranslatedCategoryName('oil-ghee')).toBe('నూనె & నెయ్యి');
    });

    it('should return category id if translation not found', async () => {
      const result = getTranslatedCategoryName('non-existent-category');

      expect(result).toBe('non-existent-category');
    });
  });

  describe('language switching', () => {
    it('should switch item names when language changes', async () => {
      await i18n.changeLanguage('en');
      expect(getTranslatedItemName('tea-2')).toBe('Red Label Tea');

      await i18n.changeLanguage('te');
      expect(getTranslatedItemName('tea-2')).toBe('రెడ్ లేబుల్ టీ');

      await i18n.changeLanguage('en');
      expect(getTranslatedItemName('tea-2')).toBe('Red Label Tea');
    });

    it('should switch category names when language changes', async () => {
      await i18n.changeLanguage('en');
      expect(getTranslatedCategoryName('chips-biscuits')).toBe('Chips & Biscuits');

      await i18n.changeLanguage('te');
      expect(getTranslatedCategoryName('chips-biscuits')).toBe('చిప్స్ & బిస్కెట్లు');

      await i18n.changeLanguage('en');
      expect(getTranslatedCategoryName('chips-biscuits')).toBe('Chips & Biscuits');
    });
  });
});
