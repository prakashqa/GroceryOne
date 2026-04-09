/**
 * Catalog Slice (shared)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category, Item } from '../types/picking';

export interface CatalogState {
  categories: Category[];
  items: Item[];
  isInitialized: boolean;
}

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
    initializeCatalog: (state, action: PayloadAction<{ categories: Category[]; items: Item[] }>) => {
      state.categories = action.payload.categories;
      state.items = action.payload.items;
      state.isInitialized = true;
    },
    mergeCatalogFromBackend: (state, action: PayloadAction<{ categories: Category[]; items: Item[] }>) => {
      const { categories: backendCategories, items: backendItems } = action.payload;
      const backendCategoryIds = new Set(backendCategories.map(c => c.id));
      const backendItemIds = new Set(backendItems.map(i => i.id));
      const localOnlyCategories = state.categories.filter(c => !backendCategoryIds.has(c.id));
      state.categories = [...backendCategories, ...localOnlyCategories];
      const localOnlyItems = state.items.filter(i => !backendItemIds.has(i.id));
      state.items = [...backendItems, ...localOnlyItems];
      state.isInitialized = true;
    },
    addCategory: (state, action: PayloadAction<{ name: string; icon?: string }>) => {
      const { name, icon = '📁' } = action.payload;
      const isDuplicate = state.categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) return;
      state.categories.push({ id: generateId('cat'), name, icon });
    },
    updateCategory: (state, action: PayloadAction<{ id: string; name?: string; icon?: string }>) => {
      const { id, name, icon } = action.payload;
      const idx = state.categories.findIndex((cat) => cat.id === id);
      if (idx === -1) return;
      if (name && name.toLowerCase() !== state.categories[idx].name.toLowerCase()) {
        const isDuplicate = state.categories.some((cat) => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
          if (icon) state.categories[idx].icon = icon;
          return;
        }
        state.categories[idx].name = name;
      }
      if (icon) state.categories[idx].icon = icon;
    },
    deleteCategory: (state, action: PayloadAction<{ id: string; deleteItems: boolean; moveItemsTo?: string }>) => {
      const { id, deleteItems, moveItemsTo } = action.payload;
      if (state.categories.length <= 1) return;
      if (state.categories.findIndex((cat) => cat.id === id) === -1) return;
      if (moveItemsTo) {
        if (state.categories.some((cat) => cat.id === moveItemsTo)) {
          state.items = state.items.map((item) => item.categoryId === id ? { ...item, categoryId: moveItemsTo } : item);
        }
      } else if (deleteItems) {
        state.items = state.items.filter((item) => item.categoryId !== id);
      }
      state.categories = state.categories.filter((cat) => cat.id !== id);
    },
    addItem: (state, action: PayloadAction<{ name: string; categoryId: string; unit?: Item['unit']; defaultQuantity?: number; price?: number; mrp: number }>) => {
      const { name, categoryId, unit = 'pcs', defaultQuantity = 1, price, mrp } = action.payload;
      if (!state.categories.some((cat) => cat.id === categoryId)) return;
      state.items.push({ id: generateId('item'), name, categoryId, unit, defaultQuantity, mrp, ...(price !== undefined && { price }) });
    },
    updateItem: (state, action: PayloadAction<{ id: string; name?: string; categoryId?: string; unit?: Item['unit']; defaultQuantity?: number; price?: number; mrp?: number }>) => {
      const { id, name, categoryId, unit, defaultQuantity, price, mrp } = action.payload;
      const idx = state.items.findIndex((item) => item.id === id);
      if (idx === -1) return;
      if (categoryId) {
        if (state.categories.some((cat) => cat.id === categoryId)) {
          state.items[idx].categoryId = categoryId;
        }
      }
      if (name) state.items[idx].name = name;
      if (unit) state.items[idx].unit = unit;
      if (defaultQuantity !== undefined) state.items[idx].defaultQuantity = defaultQuantity;
      if (price !== undefined) state.items[idx].price = price;
      if (mrp !== undefined) state.items[idx].mrp = mrp;
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    removeItemFromAllCarts: (_state, _action: PayloadAction<string>) => {},
    resetCatalog: () => initialState,
  },
});

export const {
  initializeCatalog, mergeCatalogFromBackend, addCategory, updateCategory, deleteCategory,
  addItem, updateItem, deleteItem, removeItemFromAllCarts, resetCatalog,
} = catalogSlice.actions;

interface RootState { catalog: CatalogState }
export const selectCategories = (state: RootState): Category[] => state.catalog.categories;
export const selectItems = (state: RootState): Item[] => state.catalog.items;
export const selectItemsByCategory = (state: RootState, categoryId: string): Item[] => state.catalog.items.filter((item) => item.categoryId === categoryId);
export const selectCategoryById = (state: RootState, categoryId: string): Category | undefined => state.catalog.categories.find((cat) => cat.id === categoryId);
export const selectItemById = (state: RootState, itemId: string): Item | undefined => state.catalog.items.find((item) => item.id === itemId);
export const selectIsCatalogInitialized = (state: RootState): boolean => state.catalog.isInitialized;

export default catalogSlice.reducer;
