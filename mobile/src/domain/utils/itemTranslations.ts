/**
 * Item and Category Translation Utilities
 * Provides functions to get translated names for items and categories
 */

import i18n from '../../i18n/i18n.config';
import { Item, Category } from '../types/picking';

/**
 * Get translated item name
 * Uses item.nameTe for Telugu, item.name otherwise
 * Falls back to i18n lookup for legacy items
 * @param itemOrId - The item object or item ID (for backward compatibility)
 * @returns Translated item name
 */
export const getTranslatedItemName = (itemOrId: Item | string): string => {
  // If it's a string (legacy usage), try i18n lookup
  if (typeof itemOrId === 'string') {
    const translationKey = `items.${itemOrId}`;
    const translated = i18n.t(translationKey, { ns: 'common' });
    if (translated !== translationKey) {
      return translated;
    }
    return itemOrId;
  }

  // It's an Item object - use name/nameTe from data
  const currentLang = i18n.language;
  if (currentLang === 'te') {
    // First check if nameTe property exists on the item
    if (itemOrId.nameTe) {
      return itemOrId.nameTe;
    }
    // Fallback to i18n lookup using item ID
    const translationKey = `items.${itemOrId.id}`;
    const translated = i18n.t(translationKey, { ns: 'common' });
    if (translated !== translationKey) {
      return translated;
    }
  }
  return itemOrId.name;
};

/**
 * Get translated category name
 * Uses category.nameTe for Telugu, category.name otherwise
 * Falls back to i18n lookup for legacy categories
 * @param categoryOrId - The category object or category ID (for backward compatibility)
 * @returns Translated category name
 */
export const getTranslatedCategoryName = (categoryOrId: Category | string): string => {
  // If it's a string (legacy usage), try i18n lookup
  if (typeof categoryOrId === 'string') {
    const translationKey = `categories.${categoryOrId}`;
    const translated = i18n.t(translationKey, { ns: 'common' });
    if (translated !== translationKey) {
      return translated;
    }
    return categoryOrId;
  }

  // It's a Category object - use name/nameTe from data
  const currentLang = i18n.language;
  if (currentLang === 'te') {
    // First check if nameTe property exists on the category
    if (categoryOrId.nameTe) {
      return categoryOrId.nameTe;
    }
    // Fallback to i18n lookup using category ID
    const translationKey = `categories.${categoryOrId.id}`;
    const translated = i18n.t(translationKey, { ns: 'common' });
    if (translated !== translationKey) {
      return translated;
    }
  }
  return categoryOrId.name;
};

/**
 * Get Telugu item name by item ID (always returns Telugu regardless of current language)
 * This is used for OCR matching where we need to match Telugu text even when app is in English
 * @param itemId - The unique identifier of the item
 * @returns Telugu item name or the itemId if translation not found
 */
export const getTeluguItemName = (itemId: string): string => {
  const translationKey = `items.${itemId}`;
  // Force Telugu language for this specific translation
  const translated = i18n.t(translationKey, { ns: 'common', lng: 'te' });

  // If translation key is returned (not found), return itemId as fallback
  if (translated === translationKey) {
    return itemId;
  }

  return translated;
};
