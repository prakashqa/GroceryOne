/**
 * Category Lookup Utility
 * Centralized category lookup that handles slug-UUID mismatch.
 *
 * The local catalog stores categories with id: slug (e.g., "vegetables"),
 * but cart items from the backend may reference categories by UUID.
 * This utility checks both id (slug) and backendId (UUID) for lookups.
 */

import { Category } from '../types/picking';

/**
 * Find a category by either slug (id) or backend UUID (backendId).
 * Handles the slug-UUID mismatch where cart items may reference
 * categories by UUID (from backend) instead of slug (local catalog).
 */
export function findCategoryByIdOrUuid(
  categories: Category[],
  categoryId: string
): Category | undefined {
  return categories.find(
    (c) => c.id === categoryId || c.backendId === categoryId
  );
}
