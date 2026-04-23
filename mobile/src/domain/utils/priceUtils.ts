/**
 * Price Utilities
 * Helper functions for price lookup from tenant-scoped catalog arrays.
 *
 * NOTE: this module used to carry a ~100-entry `FALLBACK_ITEMS` array of
 * hardcoded FreshMart-slug prices. In a multi-tenant app that fallback was
 * actively harmful:
 *   - Only FreshMart's slug namespace was represented, so QuickBasket /
 *     VijayParcelPOS / ABTrade never benefited from it AND were exposed
 *     to a cross-tenant price-leak risk on name collisions.
 *   - Prices went stale the moment backend prices changed.
 *   - Deletions (e.g. the Spices category purge) could never fully
 *     propagate to offline clients.
 *
 * Correct offline behavior lives in `utils/storage/catalogStorage.ts`,
 * which caches the real backend catalog per tenant in AsyncStorage. If
 * neither the live catalog nor the cache has a price, the honest answer
 * is `undefined` and the UI decides how to surface that.
 *
 * `getHardcodedItemPrice` is kept only as a permanent stub so existing
 * callers compile without change — it MUST always return `undefined`.
 */

import type { Item } from '../types/picking';

/**
 * Get price for an item from a provided items array.
 * Tries ID match first, then falls back to name match (case-insensitive).
 *
 * @param itemId - Item ID to lookup
 * @param itemName - Item name for fallback match
 * @param items - Array of tenant-scoped items to search in (from API or Redux store)
 * @returns Price if found, undefined otherwise
 */
export const getItemPrice = (
  itemId: string,
  itemName: string,
  items: Item[]
): number | undefined => {
  // Try exact ID match first
  let item = items.find((i) => i.id === itemId);

  // If no ID match or no price, try name match (case-insensitive)
  if (!item || item.price === undefined) {
    item = items.find(
      (i) =>
        i.name.toLowerCase() === itemName.toLowerCase() &&
        i.price !== undefined
    );
  }

  return item?.price;
};

/**
 * Get price for an item by ID only.
 */
export const getItemPriceById = (
  itemId: string,
  items: Item[]
): number | undefined => {
  const item = items.find((i) => i.id === itemId);
  return item?.price;
};

/**
 * Get price for an item by name (case-insensitive).
 */
export const getItemPriceByName = (
  itemName: string,
  items: Item[]
): number | undefined => {
  const item = items.find(
    (i) =>
      i.name.toLowerCase() === itemName.toLowerCase() &&
      i.price !== undefined
  );
  return item?.price;
};

/**
 * Calculate total price for a cart item.
 * Quantities are stored in base units (kg, L) and prices are per base unit,
 * so the formula is simply: price * quantity.
 */
export const calculateItemTotal = (
  price: number | undefined,
  quantity: number,
): number => {
  if (price === undefined) return 0;
  return price * quantity;
};

/**
 * Permanent stub — ALWAYS returns undefined.
 *
 * Do not reintroduce a hardcoded price table here. Prices must come from
 * the tenant-scoped catalog (live API or AsyncStorage cache). See the
 * module docblock for the multi-tenant safety rationale.
 */
export const getHardcodedItemPrice = (
  _itemId: string,
  _itemName: string
): number | undefined => {
  return undefined;
};
