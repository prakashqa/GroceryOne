/**
 * Catalog Slice
 * Redux slice for managing categories and items
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category, Item } from '../../domain/types/picking';

/**
 * State shape for catalog management
 */
export interface CatalogState {
  categories: Category[];
  items: Item[];
  isInitialized: boolean;
}

/**
 * Generate a unique ID
 */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: CatalogState = {
  categories: [],
  items: [],
  isInitialized: false,
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    /**
     * Initialize catalog with seeded or loaded data
     */
    initializeCatalog: (
      state,
      action: PayloadAction<{ categories: Category[]; items: Item[] }>
    ) => {
      state.categories = action.payload.categories;
      state.items = action.payload.items;
      state.isInitialized = true;
    },

    /**
     * Merge backend catalog data with local state.
     * Backend entries update existing ones by ID.
     * Local-only entries (user-created, not yet on backend) are preserved.
     */
    mergeCatalogFromBackend: (
      state,
      action: PayloadAction<{ categories: Category[]; items: Item[] }>
    ) => {
      const { categories: backendCategories, items: backendItems } = action.payload;

      // Build sets of backend IDs for efficient lookup
      const backendCategoryIds = new Set(backendCategories.map(c => c.id));
      const backendItemIds = new Set(backendItems.map(i => i.id));

      // Keep local-only categories (not on backend)
      const localOnlyCategories = state.categories.filter(c => !backendCategoryIds.has(c.id));
      state.categories = [...backendCategories, ...localOnlyCategories];

      // Keep local-only items (not on backend)
      const localOnlyItems = state.items.filter(i => !backendItemIds.has(i.id));
      state.items = [...backendItems, ...localOnlyItems];

      state.isInitialized = true;
    },

    /**
     * Add a new category
     * Rejects if name already exists (case-insensitive)
     */
    addCategory: (
      state,
      action: PayloadAction<{ name: string; icon?: string }>
    ) => {
      const { name, icon = '📁' } = action.payload;

      // Check for duplicate name (case-insensitive)
      const isDuplicate = state.categories.some(
        (cat) => cat.name.toLowerCase() === name.toLowerCase()
      );

      if (isDuplicate) {
        return; // Don't add duplicate
      }

      const newCategory: Category = {
        id: generateId('cat'),
        name,
        icon,
      };

      state.categories.push(newCategory);
    },

    /**
     * Update an existing category
     * Rejects name update if it would create a duplicate
     */
    updateCategory: (
      state,
      action: PayloadAction<{ id: string; name?: string; icon?: string }>
    ) => {
      const { id, name, icon } = action.payload;
      const categoryIndex = state.categories.findIndex((cat) => cat.id === id);

      if (categoryIndex === -1) {
        return; // Category not found
      }

      const category = state.categories[categoryIndex];

      // If updating name, check for duplicates (excluding current category)
      if (name && name.toLowerCase() !== category.name.toLowerCase()) {
        const isDuplicate = state.categories.some(
          (cat) => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase()
        );

        if (isDuplicate) {
          // Only update icon if name would be duplicate
          if (icon) {
            state.categories[categoryIndex].icon = icon;
          }
          return;
        }

        state.categories[categoryIndex].name = name;
      }

      if (icon) {
        state.categories[categoryIndex].icon = icon;
      }
    },

    /**
     * Delete a category
     * Options:
     * - deleteItems: true = delete all items in category
     * - deleteItems: false = keep items (orphaned)
     * - moveItemsTo: move items to another category before deletion
     */
    deleteCategory: (
      state,
      action: PayloadAction<{
        id: string;
        deleteItems: boolean;
        moveItemsTo?: string;
      }>
    ) => {
      const { id, deleteItems, moveItemsTo } = action.payload;

      // Don't delete last category
      if (state.categories.length <= 1) {
        return;
      }

      const categoryIndex = state.categories.findIndex((cat) => cat.id === id);

      if (categoryIndex === -1) {
        return; // Category not found
      }

      // Move items to target category if specified
      if (moveItemsTo) {
        const targetExists = state.categories.some((cat) => cat.id === moveItemsTo);
        if (targetExists) {
          state.items = state.items.map((item) => {
            if (item.categoryId === id) {
              return { ...item, categoryId: moveItemsTo };
            }
            return item;
          });
        }
      } else if (deleteItems) {
        // Delete items in this category
        state.items = state.items.filter((item) => item.categoryId !== id);
      }
      // If neither, items remain orphaned

      // Remove the category
      state.categories.splice(categoryIndex, 1);
    },

    /**
     * Add a new item
     * Rejects if categoryId doesn't exist
     */
    addItem: (
      state,
      action: PayloadAction<{
        name: string;
        categoryId: string;
        unit?: Item['unit'];
        defaultQuantity?: number;
        price?: number;
        mrp: number;
      }>
    ) => {
      const { name, categoryId, unit = 'pcs', defaultQuantity = 1, price, mrp } = action.payload;

      // Validate category exists
      const categoryExists = state.categories.some((cat) => cat.id === categoryId);

      if (!categoryExists) {
        return; // Category not found
      }

      const newItem: Item = {
        id: generateId('item'),
        name,
        categoryId,
        unit,
        defaultQuantity,
        mrp,
        ...(price !== undefined && { price }),
      };

      state.items.push(newItem);
    },

    /**
     * Update an existing item
     * Rejects categoryId update if new category doesn't exist
     */
    updateItem: (
      state,
      action: PayloadAction<{
        id: string;
        name?: string;
        categoryId?: string;
        unit?: Item['unit'];
        defaultQuantity?: number;
        price?: number;
        mrp?: number;
      }>
    ) => {
      const { id, name, categoryId, unit, defaultQuantity, price, mrp } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return; // Item not found
      }

      // If updating categoryId, validate it exists
      if (categoryId) {
        const categoryExists = state.categories.some((cat) => cat.id === categoryId);
        if (!categoryExists) {
          // Update other fields but not categoryId
          if (name) state.items[itemIndex].name = name;
          if (unit) state.items[itemIndex].unit = unit;
          if (defaultQuantity !== undefined) state.items[itemIndex].defaultQuantity = defaultQuantity;
          if (price !== undefined) state.items[itemIndex].price = price;
          if (mrp !== undefined) state.items[itemIndex].mrp = mrp;
          return;
        }
        state.items[itemIndex].categoryId = categoryId;
      }

      if (name) {
        state.items[itemIndex].name = name;
      }
      if (unit) {
        state.items[itemIndex].unit = unit;
      }
      if (defaultQuantity !== undefined) {
        state.items[itemIndex].defaultQuantity = defaultQuantity;
      }
      if (price !== undefined) {
        state.items[itemIndex].price = price;
      }
      if (mrp !== undefined) {
        state.items[itemIndex].mrp = mrp;
      }
    },

    /**
     * Delete an item
     */
    deleteItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId);
    },

    /**
     * Action to trigger cart cleanup (handled by middleware)
     * This doesn't change catalog state but signals to multiCartSlice
     */
    removeItemFromAllCarts: (_state, _action: PayloadAction<string>) => {
      // This is a no-op for catalog state
      // The middleware will intercept this and dispatch to multiCart
    },

    /**
     * Reset entire catalog state (used during tenant switch)
     * Clears all categories and items, resets to initial state
     */
    resetCatalog: () => initialState,
  },
});

// Export actions
export const {
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
} = catalogSlice.actions;

// Selectors
interface RootState {
  catalog: CatalogState;
}

export const selectCategories = (state: RootState): Category[] =>
  state.catalog.categories;

export const selectItems = (state: RootState): Item[] =>
  state.catalog.items;

export const selectItemsByCategory = (state: RootState, categoryId: string): Item[] =>
  state.catalog.items.filter((item) => item.categoryId === categoryId);

export const selectCategoryById = (state: RootState, categoryId: string): Category | undefined =>
  state.catalog.categories.find((cat) => cat.id === categoryId);

export const selectItemById = (state: RootState, itemId: string): Item | undefined =>
  state.catalog.items.find((item) => item.id === itemId);

export const selectIsCatalogInitialized = (state: RootState): boolean =>
  state.catalog.isInitialized;

// Export reducer
export default catalogSlice.reducer;
