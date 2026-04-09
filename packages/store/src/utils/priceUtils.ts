/**
 * Price Utilities (shared)
 * Minimal version - just the lookup functions needed by multiCartSlice
 */

import type { Item } from '../types/picking';

/**
 * Get price for an item by ID or name from catalog
 * Returns undefined if not found
 */
export const getItemPrice = (
  items: Item[],
  itemId: string,
  itemName: string
): number | undefined => {
  // Try ID match first
  const byId = items.find((item) => item.id === itemId);
  if (byId?.price !== undefined) return byId.price;

  // Fallback to name match
  const byName = items.find(
    (item) => item.name.toLowerCase() === itemName.toLowerCase() && item.price !== undefined
  );
  return byName?.price;
};

/**
 * Get hardcoded item price (stub for shared package)
 * The full fallback price list is in mobile/src/domain/utils/priceUtils.ts
 * On web, prices should always come from the API
 */
export const getHardcodedItemPrice = (
  _itemId: string,
  _itemName: string
): number | undefined => {
  return undefined;
};
