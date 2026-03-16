/**
 * Catalog Slice Tests
 * TDD tests for category and item management functionality
 */

import catalogReducer, {
  initializeCatalog,
  mergeCatalogFromBackend,
  addCategory,
  updateCategory,
  deleteCategory,
  addItem,
  updateItem,
  deleteItem,
  removeItemFromAllCarts,
  resetCatalog,
  selectCategories,
  selectItems,
  selectItemsByCategory,
  selectCategoryById,
  selectItemById,
  selectIsCatalogInitialized,
  CatalogState,
} from '../catalogSlice';
import { Category, Item } from '../../../domain/types/picking';
import { buildMockItem, buildMockCategory } from '../../../__test-utils__/factories/picking-factories';

describe('catalogSlice', () => {
  const mockCategory: Category = buildMockCategory({
    id: 'test-cat-1',
    name: 'Test Category',
    icon: '🧪',
  });

  const mockCategory2: Category = buildMockCategory({
    id: 'test-cat-2',
    name: 'Another Category',
    icon: '📦',
  });

  const mockItem: Item = buildMockItem({
    id: 'test-item-1',
    categoryId: 'test-cat-1',
    name: 'Test Item',
    unit: 'kg',
    defaultQuantity: 1,
  });

  const mockItem2: Item = buildMockItem({
    id: 'test-item-2',
    categoryId: 'test-cat-1',
    name: 'Another Item',
    unit: 'pcs',
    defaultQuantity: 5,
  });

  const emptyState: CatalogState = {
    categories: [],
    items: [],
    isInitialized: false,
  };

  const stateWithData: CatalogState = {
    categories: [mockCategory, mockCategory2],
    items: [mockItem, mockItem2],
    isInitialized: true,
  };

  describe('initializeCatalog', () => {
    it('should initialize with seeded categories and items', () => {
      const seedData = {
        categories: [mockCategory],
        items: [mockItem],
      };

      const action = initializeCatalog(seedData);
      const state = catalogReducer(emptyState, action);

      expect(state.categories).toHaveLength(1);
      expect(state.items).toHaveLength(1);
      expect(state.isInitialized).toBe(true);
    });

    it('should set isInitialized to true even with empty data', () => {
      const action = initializeCatalog({ categories: [], items: [] });
      const state = catalogReducer(emptyState, action);

      expect(state.isInitialized).toBe(true);
    });

    it('should replace existing data when initializing', () => {
      const newData = {
        categories: [mockCategory2],
        items: [],
      };

      const action = initializeCatalog(newData);
      const state = catalogReducer(stateWithData, action);

      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].id).toBe('test-cat-2');
    });
  });

  describe('addCategory', () => {
    it('should add a new category', () => {
      const action = addCategory({ name: 'New Category', icon: '🆕' });
      const state = catalogReducer(emptyState, action);

      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].name).toBe('New Category');
      expect(state.categories[0].icon).toBe('🆕');
      expect(state.categories[0].id).toBeDefined();
    });

    it('should generate unique IDs for categories', () => {
      let state = catalogReducer(emptyState, addCategory({ name: 'Cat 1', icon: '1️⃣' }));
      state = catalogReducer(state, addCategory({ name: 'Cat 2', icon: '2️⃣' }));

      expect(state.categories[0].id).not.toBe(state.categories[1].id);
    });

    it('should reject duplicate category name (case-insensitive)', () => {
      const stateWithCat: CatalogState = {
        ...emptyState,
        categories: [mockCategory],
        isInitialized: true,
      };

      const action = addCategory({ name: 'test category', icon: '🔄' }); // lowercase
      const state = catalogReducer(stateWithCat, action);

      // Should not add duplicate
      expect(state.categories).toHaveLength(1);
    });

    it('should allow adding category with different name', () => {
      const stateWithCat: CatalogState = {
        ...emptyState,
        categories: [mockCategory],
        isInitialized: true,
      };

      const action = addCategory({ name: 'Different Name', icon: '✅' });
      const state = catalogReducer(stateWithCat, action);

      expect(state.categories).toHaveLength(2);
    });

    it('should use default icon if not provided', () => {
      const action = addCategory({ name: 'No Icon Category' });
      const state = catalogReducer(emptyState, action);

      expect(state.categories[0].icon).toBe('📁');
    });
  });

  describe('updateCategory', () => {
    it('should update category name', () => {
      const action = updateCategory({ id: 'test-cat-1', name: 'Updated Name' });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories.find(c => c.id === 'test-cat-1')?.name).toBe('Updated Name');
    });

    it('should update category icon', () => {
      const action = updateCategory({ id: 'test-cat-1', icon: '🔥' });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories.find(c => c.id === 'test-cat-1')?.icon).toBe('🔥');
    });

    it('should update both name and icon', () => {
      const action = updateCategory({ id: 'test-cat-1', name: 'New Name', icon: '🌟' });
      const state = catalogReducer(stateWithData, action);

      const updated = state.categories.find(c => c.id === 'test-cat-1');
      expect(updated?.name).toBe('New Name');
      expect(updated?.icon).toBe('🌟');
    });

    it('should reject update if new name already exists (different category)', () => {
      const action = updateCategory({ id: 'test-cat-1', name: 'Another Category' }); // mockCategory2's name
      const state = catalogReducer(stateWithData, action);

      // Name should not change due to duplicate
      expect(state.categories.find(c => c.id === 'test-cat-1')?.name).toBe('Test Category');
    });

    it('should allow keeping same name when updating', () => {
      const action = updateCategory({ id: 'test-cat-1', name: 'Test Category', icon: '🔄' });
      const state = catalogReducer(stateWithData, action);

      const updated = state.categories.find(c => c.id === 'test-cat-1');
      expect(updated?.name).toBe('Test Category');
      expect(updated?.icon).toBe('🔄');
    });

    it('should not change anything for non-existent category', () => {
      const action = updateCategory({ id: 'non-existent', name: 'Whatever' });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories).toEqual(stateWithData.categories);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', () => {
      const action = deleteCategory({ id: 'test-cat-2', deleteItems: false });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories).toHaveLength(1);
      expect(state.categories.find(c => c.id === 'test-cat-2')).toBeUndefined();
    });

    it('should delete category and its items when deleteItems is true', () => {
      const action = deleteCategory({ id: 'test-cat-1', deleteItems: true });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories.find(c => c.id === 'test-cat-1')).toBeUndefined();
      // Both mockItem and mockItem2 belong to test-cat-1
      expect(state.items.filter(i => i.categoryId === 'test-cat-1')).toHaveLength(0);
    });

    it('should keep items when deleteItems is false', () => {
      const action = deleteCategory({ id: 'test-cat-1', deleteItems: false });
      const state = catalogReducer(stateWithData, action);

      // Category deleted but items remain (orphaned)
      expect(state.categories.find(c => c.id === 'test-cat-1')).toBeUndefined();
      expect(state.items.filter(i => i.categoryId === 'test-cat-1')).toHaveLength(2);
    });

    it('should move items to target category when moveItemsTo is provided', () => {
      const action = deleteCategory({
        id: 'test-cat-1',
        deleteItems: false,
        moveItemsTo: 'test-cat-2'
      });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories.find(c => c.id === 'test-cat-1')).toBeUndefined();
      expect(state.items.filter(i => i.categoryId === 'test-cat-2')).toHaveLength(2);
    });

    it('should not delete last category', () => {
      const singleCatState: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = deleteCategory({ id: 'test-cat-1', deleteItems: false });
      const state = catalogReducer(singleCatState, action);

      // Should not delete the last category
      expect(state.categories).toHaveLength(1);
    });

    it('should do nothing for non-existent category', () => {
      const action = deleteCategory({ id: 'non-existent', deleteItems: false });
      const state = catalogReducer(stateWithData, action);

      expect(state.categories).toHaveLength(2);
    });
  });

  describe('addItem', () => {
    it('should add a new item to a category', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = addItem({ name: 'New Item', categoryId: 'test-cat-1', unit: 'kg', defaultQuantity: 2, mrp: 0 });
      const state = catalogReducer(stateWithCat, action);

      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('New Item');
      expect(state.items[0].categoryId).toBe('test-cat-1');
      expect(state.items[0].unit).toBe('kg');
      expect(state.items[0].defaultQuantity).toBe(2);
    });

    it('should generate unique ID for item', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      let state = catalogReducer(stateWithCat, addItem({ name: 'Item 1', categoryId: 'test-cat-1', unit: 'kg', defaultQuantity: 1, mrp: 0 }));
      state = catalogReducer(state, addItem({ name: 'Item 2', categoryId: 'test-cat-1', unit: 'kg', defaultQuantity: 1, mrp: 0 }));

      expect(state.items[0].id).not.toBe(state.items[1].id);
    });

    it('should reject item if categoryId does not exist', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = addItem({ name: 'Orphan Item', categoryId: 'non-existent-cat', unit: 'pcs', defaultQuantity: 1, mrp: 0 });
      const state = catalogReducer(stateWithCat, action);

      expect(state.items).toHaveLength(0);
    });

    it('should use default values for optional fields', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = addItem({
        name: 'Minimal Item',
        categoryId: 'test-cat-1',
        mrp: 100,
      });
      const state = catalogReducer(stateWithCat, action);

      expect(state.items[0].unit).toBe('pcs');
      expect(state.items[0].defaultQuantity).toBe(1);
    });

    it('should always include mrp in the created item', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = addItem({
        name: 'Item With MRP',
        categoryId: 'test-cat-1',
        mrp: 250,
      });
      const state = catalogReducer(stateWithCat, action);

      expect(state.items[0].mrp).toBe(250);
    });

    it('should include both mrp and price when provided', () => {
      const stateWithCat: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const action = addItem({
        name: 'Priced Item',
        categoryId: 'test-cat-1',
        mrp: 300,
        price: 250,
      });
      const state = catalogReducer(stateWithCat, action);

      expect(state.items[0].mrp).toBe(300);
      expect(state.items[0].price).toBe(250);
    });
  });

  describe('updateItem', () => {
    it('should update item name', () => {
      const action = updateItem({ id: 'test-item-1', name: 'Updated Item Name' });
      const state = catalogReducer(stateWithData, action);

      expect(state.items.find(i => i.id === 'test-item-1')?.name).toBe('Updated Item Name');
    });

    it('should update item category', () => {
      const action = updateItem({ id: 'test-item-1', categoryId: 'test-cat-2' });
      const state = catalogReducer(stateWithData, action);

      expect(state.items.find(i => i.id === 'test-item-1')?.categoryId).toBe('test-cat-2');
    });

    it('should update item unit', () => {
      const action = updateItem({ id: 'test-item-1', unit: 'gm' });
      const state = catalogReducer(stateWithData, action);

      expect(state.items.find(i => i.id === 'test-item-1')?.unit).toBe('gm');
    });

    it('should update item defaultQuantity', () => {
      const action = updateItem({ id: 'test-item-1', defaultQuantity: 10 });
      const state = catalogReducer(stateWithData, action);

      expect(state.items.find(i => i.id === 'test-item-1')?.defaultQuantity).toBe(10);
    });

    it('should reject category update if new categoryId does not exist', () => {
      const action = updateItem({ id: 'test-item-1', categoryId: 'non-existent' });
      const state = catalogReducer(stateWithData, action);

      // Category should not change
      expect(state.items.find(i => i.id === 'test-item-1')?.categoryId).toBe('test-cat-1');
    });

    it('should not change anything for non-existent item', () => {
      const action = updateItem({ id: 'non-existent', name: 'Whatever' });
      const state = catalogReducer(stateWithData, action);

      expect(state.items).toEqual(stateWithData.items);
    });
  });

  describe('deleteItem', () => {
    it('should delete item', () => {
      const action = deleteItem('test-item-1');
      const state = catalogReducer(stateWithData, action);

      expect(state.items).toHaveLength(1);
      expect(state.items.find(i => i.id === 'test-item-1')).toBeUndefined();
    });

    it('should not affect other items when deleting one', () => {
      const action = deleteItem('test-item-1');
      const state = catalogReducer(stateWithData, action);

      expect(state.items.find(i => i.id === 'test-item-2')).toBeDefined();
    });

    it('should do nothing for non-existent item', () => {
      const action = deleteItem('non-existent');
      const state = catalogReducer(stateWithData, action);

      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItemFromAllCarts', () => {
    it('should set flag to trigger cart cleanup', () => {
      // This action is used to coordinate with multiCartSlice
      const action = removeItemFromAllCarts('test-item-1');
      const state = catalogReducer(stateWithData, action);

      // The state itself doesn't change, this is for middleware coordination
      expect(state).toEqual(stateWithData);
    });
  });

  describe('resetCatalog', () => {
    it('should reset to initial state', () => {
      const action = resetCatalog();
      const state = catalogReducer(stateWithData, action);

      expect(state.categories).toHaveLength(0);
      expect(state.items).toHaveLength(0);
      expect(state.isInitialized).toBe(false);
    });

    it('should reset from any state to empty', () => {
      const populatedState: CatalogState = {
        categories: [mockCategory, mockCategory2],
        items: [mockItem, mockItem2],
        isInitialized: true,
      };

      const state = catalogReducer(populatedState, resetCatalog());

      expect(state).toEqual({
        categories: [],
        items: [],
        isInitialized: false,
      });
    });
  });

  describe('selectors', () => {
    const rootState = {
      catalog: stateWithData,
    };

    it('selectCategories should return all categories', () => {
      const categories = selectCategories(rootState);
      expect(categories).toHaveLength(2);
    });

    it('selectItems should return all items', () => {
      const items = selectItems(rootState);
      expect(items).toHaveLength(2);
    });

    it('selectItemsByCategory should return items for specific category', () => {
      const items = selectItemsByCategory(rootState, 'test-cat-1');
      expect(items).toHaveLength(2);
      expect(items.every(i => i.categoryId === 'test-cat-1')).toBe(true);
    });

    it('selectItemsByCategory should return empty array for category with no items', () => {
      const items = selectItemsByCategory(rootState, 'test-cat-2');
      expect(items).toHaveLength(0);
    });

    it('selectCategoryById should return specific category', () => {
      const category = selectCategoryById(rootState, 'test-cat-1');
      expect(category?.name).toBe('Test Category');
    });

    it('selectCategoryById should return undefined for non-existent category', () => {
      const category = selectCategoryById(rootState, 'non-existent');
      expect(category).toBeUndefined();
    });

    it('selectItemById should return specific item', () => {
      const item = selectItemById(rootState, 'test-item-1');
      expect(item?.name).toBe('Test Item');
    });

    it('selectItemById should return undefined for non-existent item', () => {
      const item = selectItemById(rootState, 'non-existent');
      expect(item).toBeUndefined();
    });

    it('selectIsCatalogInitialized should return initialization status', () => {
      const isInitialized = selectIsCatalogInitialized(rootState);
      expect(isInitialized).toBe(true);
    });

    it('selectIsCatalogInitialized should return false for uninitialized state', () => {
      const uninitializedState = { catalog: emptyState };
      const isInitialized = selectIsCatalogInitialized(uninitializedState);
      expect(isInitialized).toBe(false);
    });
  });

  describe('mergeCatalogFromBackend', () => {
    it('should add new backend categories not in local state', () => {
      const localState: CatalogState = {
        categories: [mockCategory],
        items: [],
        isInitialized: true,
      };

      const backendCategory: Category = { id: 'backend-cat', name: 'Backend Category', icon: '🏪' };
      const state = catalogReducer(localState, mergeCatalogFromBackend({
        categories: [mockCategory, backendCategory],
        items: [],
      }));

      expect(state.categories).toHaveLength(2);
      expect(state.categories.find(c => c.id === 'backend-cat')).toBeTruthy();
      expect(state.categories.find(c => c.id === 'test-cat-1')).toBeTruthy();
    });

    it('should preserve locally-created categories not on backend', () => {
      const localCategory: Category = { id: 'cat-1706789000-abc1234', name: 'User Created', icon: '✨' };
      const localState: CatalogState = {
        categories: [mockCategory, localCategory],
        items: [],
        isInitialized: true,
      };

      // Backend only has mockCategory, not the user-created one
      const state = catalogReducer(localState, mergeCatalogFromBackend({
        categories: [mockCategory],
        items: [],
      }));

      expect(state.categories).toHaveLength(2);
      expect(state.categories.find(c => c.id === 'cat-1706789000-abc1234')).toBeTruthy();
      expect(state.categories.find(c => c.id === 'test-cat-1')).toBeTruthy();
    });

    it('should add new backend items not in local state', () => {
      const localState: CatalogState = {
        categories: [mockCategory],
        items: [mockItem],
        isInitialized: true,
      };

      const backendItem: Item = { id: 'backend-item', categoryId: 'test-cat-1', name: 'Backend Item', unit: 'pcs', defaultQuantity: 1 };
      const state = catalogReducer(localState, mergeCatalogFromBackend({
        categories: [mockCategory],
        items: [mockItem, backendItem],
      }));

      expect(state.items).toHaveLength(2);
      expect(state.items.find(i => i.id === 'backend-item')).toBeTruthy();
      expect(state.items.find(i => i.id === 'test-item-1')).toBeTruthy();
    });

    it('should preserve locally-created items not on backend', () => {
      const localItem: Item = { id: 'item-1706789000-xyz5678', categoryId: 'test-cat-1', name: 'User Item', unit: 'kg', defaultQuantity: 2 };
      const localState: CatalogState = {
        categories: [mockCategory],
        items: [mockItem, localItem],
        isInitialized: true,
      };

      // Backend only has mockItem, not the user-created one
      const state = catalogReducer(localState, mergeCatalogFromBackend({
        categories: [mockCategory],
        items: [mockItem],
      }));

      expect(state.items).toHaveLength(2);
      expect(state.items.find(i => i.id === 'item-1706789000-xyz5678')).toBeTruthy();
      expect(state.items.find(i => i.id === 'test-item-1')).toBeTruthy();
    });

    it('should update existing items from backend data', () => {
      const localState: CatalogState = {
        categories: [mockCategory],
        items: [{ ...mockItem, name: 'Old Name' }],
        isInitialized: true,
      };

      const state = catalogReducer(localState, mergeCatalogFromBackend({
        categories: [mockCategory],
        items: [{ ...mockItem, name: 'Updated Name' }],
      }));

      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Updated Name');
    });

    it('should set isInitialized to true', () => {
      const state = catalogReducer(emptyState, mergeCatalogFromBackend({
        categories: [],
        items: [],
      }));

      expect(state.isInitialized).toBe(true);
    });
  });
});
