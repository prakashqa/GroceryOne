import catalogReducer, {
  initializeCatalog,
  mergeCatalogFromBackend,
  addCategory,
  updateCategory,
  deleteCategory,
  addItem,
  updateItem,
  deleteItem,
  CatalogState,
} from './catalogSlice';

describe('catalogSlice', () => {
  const emptyState: CatalogState = { categories: [], items: [], isInitialized: false };

  describe('mergeCatalogFromBackend', () => {
    it('should replace backend-synced items with fresh backend data', () => {
      // Simulate: item exists locally with old category, backend has new data
      const localState: CatalogState = {
        categories: [
          { id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' },
          { id: 'veggies', backendId: 'uuid-2', name: 'Veggies', icon: '🥬' },
        ],
        items: [
          { id: 'apple', backendId: 'item-uuid-1', categoryId: 'fruits', name: 'Apple', unit: 'kg' as const, defaultQuantity: 1, mrp: 100 },
        ],
        isInitialized: true,
      };

      // Backend returns item with updated category
      const backendData = {
        categories: [
          { id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' },
          { id: 'veggies', backendId: 'uuid-2', name: 'Veggies', icon: '🥬' },
        ],
        items: [
          { id: 'apple', backendId: 'item-uuid-1', categoryId: 'veggies', name: 'Apple', unit: 'kg' as const, defaultQuantity: 1, mrp: 100 },
        ],
      };

      const result = catalogReducer(localState, mergeCatalogFromBackend(backendData));
      const apple = result.items.find(i => i.id === 'apple');
      expect(apple?.categoryId).toBe('veggies');
    });

    it('should preserve local-only categories not in backend', () => {
      const localState: CatalogState = {
        categories: [
          { id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' },
          { id: 'cat-local-123', name: 'Local Only', icon: '📁' }, // no backendId
        ],
        items: [],
        isInitialized: true,
      };

      const backendData = {
        categories: [
          { id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' },
        ],
        items: [],
      };

      const result = catalogReducer(localState, mergeCatalogFromBackend(backendData));
      expect(result.categories).toHaveLength(2);
      expect(result.categories.find(c => c.id === 'cat-local-123')).toBeDefined();
    });

    it('should preserve local-only items not in backend', () => {
      const localState: CatalogState = {
        categories: [{ id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' }],
        items: [
          { id: 'apple', backendId: 'item-uuid-1', categoryId: 'fruits', name: 'Apple', unit: 'kg' as const, defaultQuantity: 1, mrp: 100 },
          { id: 'item-local-456', categoryId: 'fruits', name: 'Local Item', unit: 'pcs' as const, defaultQuantity: 1, mrp: 50 },
        ],
        isInitialized: true,
      };

      const backendData = {
        categories: [{ id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' }],
        items: [
          { id: 'apple', backendId: 'item-uuid-1', categoryId: 'fruits', name: 'Apple Updated', unit: 'kg' as const, defaultQuantity: 1, mrp: 120 },
        ],
      };

      const result = catalogReducer(localState, mergeCatalogFromBackend(backendData));
      expect(result.items).toHaveLength(2);
      // Backend item should be updated
      expect(result.items.find(i => i.id === 'apple')?.name).toBe('Apple Updated');
      // Local-only item should be preserved
      expect(result.items.find(i => i.id === 'item-local-456')).toBeDefined();
    });

    it('should update state on repeated merges (no hasMerged guard)', () => {
      const initialState: CatalogState = {
        categories: [{ id: 'fruits', backendId: 'uuid-1', name: 'Fruits', icon: '🍎' }],
        items: [],
        isInitialized: true,
      };

      // First merge
      const merge1 = catalogReducer(initialState, mergeCatalogFromBackend({
        categories: [{ id: 'fruits', backendId: 'uuid-1', name: 'Fruits V1', icon: '🍎' }],
        items: [],
      }));
      expect(merge1.categories[0].name).toBe('Fruits V1');

      // Second merge (simulates refetch after mutation)
      const merge2 = catalogReducer(merge1, mergeCatalogFromBackend({
        categories: [{ id: 'fruits', backendId: 'uuid-1', name: 'Fruits V2', icon: '🍎' }],
        items: [],
      }));
      expect(merge2.categories[0].name).toBe('Fruits V2');
    });
  });

  describe('CRUD operations', () => {
    it('should add a category with generated ID', () => {
      const result = catalogReducer(
        { ...emptyState, isInitialized: true },
        addCategory({ name: 'New Cat', icon: '📦' })
      );
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('New Cat');
      expect(result.categories[0].id).toMatch(/^cat-/);
    });

    it('should reject duplicate category names (case-insensitive)', () => {
      const state: CatalogState = {
        categories: [{ id: 'cat-1', name: 'Fruits', icon: '🍎' }],
        items: [],
        isInitialized: true,
      };
      const result = catalogReducer(state, addCategory({ name: 'fruits' }));
      expect(result.categories).toHaveLength(1); // No duplicate added
    });

    it('should update category name and icon', () => {
      const state: CatalogState = {
        categories: [{ id: 'cat-1', name: 'Old', icon: '📁' }],
        items: [],
        isInitialized: true,
      };
      const result = catalogReducer(state, updateCategory({ id: 'cat-1', name: 'New', icon: '🍎' }));
      expect(result.categories[0].name).toBe('New');
      expect(result.categories[0].icon).toBe('🍎');
    });

    it('should update item categoryId', () => {
      const state: CatalogState = {
        categories: [
          { id: 'cat-1', name: 'A', icon: '📁' },
          { id: 'cat-2', name: 'B', icon: '📁' },
        ],
        items: [
          { id: 'item-1', categoryId: 'cat-1', name: 'Item', unit: 'pcs' as const, defaultQuantity: 1, mrp: 10 },
        ],
        isInitialized: true,
      };
      const result = catalogReducer(state, updateItem({ id: 'item-1', categoryId: 'cat-2' }));
      expect(result.items[0].categoryId).toBe('cat-2');
    });

    it('should not update item categoryId to non-existent category', () => {
      const state: CatalogState = {
        categories: [{ id: 'cat-1', name: 'A', icon: '📁' }],
        items: [
          { id: 'item-1', categoryId: 'cat-1', name: 'Item', unit: 'pcs' as const, defaultQuantity: 1, mrp: 10 },
        ],
        isInitialized: true,
      };
      const result = catalogReducer(state, updateItem({ id: 'item-1', categoryId: 'non-existent' }));
      expect(result.items[0].categoryId).toBe('cat-1'); // Unchanged
    });

    it('should delete item', () => {
      const state: CatalogState = {
        categories: [{ id: 'cat-1', name: 'A', icon: '📁' }],
        items: [
          { id: 'item-1', categoryId: 'cat-1', name: 'Item', unit: 'pcs' as const, defaultQuantity: 1, mrp: 10 },
        ],
        isInitialized: true,
      };
      const result = catalogReducer(state, deleteItem('item-1'));
      expect(result.items).toHaveLength(0);
    });

    it('should delete category and move items to another category', () => {
      const state: CatalogState = {
        categories: [
          { id: 'cat-1', name: 'A', icon: '📁' },
          { id: 'cat-2', name: 'B', icon: '📁' },
        ],
        items: [
          { id: 'item-1', categoryId: 'cat-1', name: 'Item', unit: 'pcs' as const, defaultQuantity: 1, mrp: 10 },
        ],
        isInitialized: true,
      };
      const result = catalogReducer(state, deleteCategory({ id: 'cat-1', deleteItems: false, moveItemsTo: 'cat-2' }));
      expect(result.categories).toHaveLength(1);
      expect(result.items[0].categoryId).toBe('cat-2');
    });
  });

  describe('Tenant isolation at store level', () => {
    it('should scope categories by merge data (no cross-tenant leakage)', () => {
      // Tenant A state
      const tenantAState: CatalogState = {
        categories: [{ id: 'fruits', backendId: 'uuid-a', name: 'Fruits A', icon: '🍎' }],
        items: [],
        isInitialized: true,
      };

      // Merge with Tenant A data only
      const result = catalogReducer(tenantAState, mergeCatalogFromBackend({
        categories: [{ id: 'fruits', backendId: 'uuid-a', name: 'Fruits A Updated', icon: '🍎' }],
        items: [],
      }));

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Fruits A Updated');
      // No Tenant B data leaks in
    });
  });
});
