/**
 * Tests for categoryLookup utility
 * Verifies that categories can be found by either slug (id) or backend UUID (backendId)
 */

import { findCategoryByIdOrUuid } from '../categoryLookup';
import { Category } from '../../types/picking';

describe('findCategoryByIdOrUuid', () => {
  const categories: Category[] = [
    { id: 'vegetables', backendId: '06f2712d-24f9-4ef2-9218-62467408c406', name: 'Vegetables', icon: '🥬' },
    { id: 'fruits', backendId: '816d2844-1616-4b22-8ea0-c9537a49283b', name: 'Fruits', icon: '🍎' },
    { id: 'dairy', backendId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Dairy', icon: '🥛' },
    { id: 'spices', name: 'Spices', icon: '🌶️' }, // No backendId (locally created category)
  ];

  it('should find category by slug (id)', () => {
    const result = findCategoryByIdOrUuid(categories, 'vegetables');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Vegetables');
  });

  it('should find category by backend UUID (backendId)', () => {
    const result = findCategoryByIdOrUuid(categories, '06f2712d-24f9-4ef2-9218-62467408c406');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Vegetables');
  });

  it('should find different categories by UUID', () => {
    const result = findCategoryByIdOrUuid(categories, '816d2844-1616-4b22-8ea0-c9537a49283b');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Fruits');
  });

  it('should return undefined for non-existent id', () => {
    const result = findCategoryByIdOrUuid(categories, 'non-existent');
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existent UUID', () => {
    const result = findCategoryByIdOrUuid(categories, 'ffffffff-ffff-ffff-ffff-ffffffffffff');
    expect(result).toBeUndefined();
  });

  it('should work with categories that have no backendId', () => {
    const result = findCategoryByIdOrUuid(categories, 'spices');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Spices');
  });

  it('should return undefined when searching by UUID for category without backendId', () => {
    // 'spices' has no backendId, so searching by any UUID won't match it
    const result = findCategoryByIdOrUuid(categories, 'some-random-uuid');
    expect(result).toBeUndefined();
  });

  it('should handle empty categories array', () => {
    const result = findCategoryByIdOrUuid([], 'vegetables');
    expect(result).toBeUndefined();
  });

  it('should prefer slug match over UUID match', () => {
    // Edge case: if a category's slug matches another category's backendId
    const edgeCategories: Category[] = [
      { id: 'some-uuid-value', name: 'Category A', icon: '📦' },
      { id: 'other', backendId: 'some-uuid-value', name: 'Category B', icon: '📦' },
    ];
    // Should find Category A first (slug match takes precedence in array order)
    const result = findCategoryByIdOrUuid(edgeCategories, 'some-uuid-value');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Category A');
  });
});
