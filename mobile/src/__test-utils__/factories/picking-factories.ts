/**
 * Factory functions for picking domain test data.
 * Used across pickingCartSlice, catalogSlice, and useCatalog tests.
 */

import type { Item, Category } from '../../domain/types/picking';

export function buildMockItem(overrides?: Partial<Item>): Item {
  return {
    id: 'atta-1',
    categoryId: 'atta-rice',
    name: 'Aashirvaad Atta',
    unit: 'kg',
    defaultQuantity: 5,
    ...overrides,
  };
}

export function buildMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'test-cat-1',
    name: 'Test Category',
    icon: '🧪',
    ...overrides,
  };
}
