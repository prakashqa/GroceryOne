/**
 * useCatalog Hook Tests
 * TDD tests for the catalog data hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import catalogReducer from '../../store/slices/catalogSlice';
import { useCatalog } from '../useCatalog';

// Mock RTK Query hooks
const mockCategories = [
  { id: 'cat-1', slug: 'grains', name: 'Grains & Flour', icon: '🌾', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'cat-2', slug: 'spices', name: 'Spices & Masalas', icon: '🌶️', sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
];

const mockItems = [
  { id: 'item-1', slug: 'wheat', name: 'Wheat Flour', categoryId: 'cat-1', unit: 'kg' as const, defaultQuantity: 5, price: 48, sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'item-2', slug: 'cumin', name: 'Cumin Seeds', categoryId: 'cat-2', unit: 'gm' as const, defaultQuantity: 250, price: 85, sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'item-3', slug: 'chillies', name: 'Dry Red Chillies', categoryId: 'cat-2', unit: 'gm' as const, defaultQuantity: 250, price: 140, sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
];

// Mock API state
let mockApiState = {
  categories: { data: mockCategories, isLoading: false, error: null },
  items: { data: mockItems, isLoading: false, error: null },
};

jest.mock('../../data/api/categoryApi', () => ({
  useGetCategoriesQuery: jest.fn(() => mockApiState.categories),
}));

jest.mock('../../data/api/productApi', () => ({
  useGetItemsQuery: jest.fn(() => mockApiState.items),
}));

// Helper to create test store
const createTestStore = (initialCatalog = { categories: [], items: [], isInitialized: false }) => {
  return configureStore({
    reducer: {
      catalog: catalogReducer,
    },
    preloadedState: {
      catalog: initialCatalog,
    },
  });
};

// Helper wrapper component
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useCatalog', () => {
  beforeEach(() => {
    // Reset mock API state
    mockApiState = {
      categories: { data: mockCategories, isLoading: false, error: null },
      items: { data: mockItems, isLoading: false, error: null },
    };
  });

  describe('data fetching', () => {
    it('should return categories from API', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.categories).toEqual(mockCategories);
    });

    it('should return items from API', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.items).toEqual(mockItems);
    });

    it('should return loading state', () => {
      mockApiState.categories.isLoading = true;
      mockApiState.items.isLoading = true;

      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state', () => {
      mockApiState.categories.error = { status: 500, data: 'Server error' } as any;

      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('fallback to Redux store', () => {
    it('should fall back to Redux store when API returns no data', () => {
      mockApiState.categories.data = undefined as any;
      mockApiState.items.data = undefined as any;

      const storeCategories = [
        { id: 'store-cat', name: 'Store Category', icon: '📦' },
      ];
      const storeItems = [
        { id: 'store-item', name: 'Store Item', categoryId: 'store-cat', unit: 'pcs' as const, defaultQuantity: 1, price: 100 },
      ];

      const store = createTestStore({
        categories: storeCategories,
        items: storeItems,
        isInitialized: true,
      });

      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.categories).toEqual(storeCategories);
      expect(result.current.items).toEqual(storeItems);
    });
  });

  describe('helper functions', () => {
    it('should get item by ID', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const item = result.current.getItemById('item-2');
      expect(item).toBeDefined();
      expect(item?.name).toBe('Cumin Seeds');
    });

    it('should return undefined for non-existent item ID', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const item = result.current.getItemById('non-existent');
      expect(item).toBeUndefined();
    });

    it('should get items by category', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const spiceItems = result.current.getItemsByCategory('cat-2');
      expect(spiceItems).toHaveLength(2);
      expect(spiceItems[0].name).toBe('Cumin Seeds');
      expect(spiceItems[1].name).toBe('Dry Red Chillies');
    });

    it('should return empty array for non-existent category', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const items = result.current.getItemsByCategory('non-existent');
      expect(items).toEqual([]);
    });

    it('should get category by ID', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const category = result.current.getCategoryById('cat-2');
      expect(category).toBeDefined();
      expect(category?.name).toBe('Spices & Masalas');
    });

    it('should return undefined for non-existent category ID', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      const category = result.current.getCategoryById('non-existent');
      expect(category).toBeUndefined();
    });
  });

  describe('data integrity', () => {
    it('should return items with prices', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      result.current.items.forEach((item) => {
        expect(item.price).toBeDefined();
        expect(typeof item.price).toBe('number');
      });
    });

    it('should return all required item fields', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      result.current.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.categoryId).toBeDefined();
        expect(item.unit).toBeDefined();
        expect(item.defaultQuantity).toBeDefined();
      });
    });
  });

  describe('MRP normalization', () => {
    it('should populate mrp from compareAtPrice when mrp is undefined', () => {
      // Simulate API items that have compareAtPrice but no mrp
      const itemsWithCompareAtPrice = mockItems.map(item => ({
        ...item,
        compareAtPrice: 200,
        // mrp intentionally missing
      }));

      mockApiState.items.data = itemsWithCompareAtPrice as any;

      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      result.current.items.forEach((item) => {
        expect(item.mrp).toBe(200);
      });
    });

    it('should keep existing mrp when already present', () => {
      const itemsWithMrp = mockItems.map(item => ({
        ...item,
        mrp: 150,
        compareAtPrice: 200,
      }));

      mockApiState.items.data = itemsWithMrp as any;

      const store = createTestStore();
      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(store),
      });

      result.current.items.forEach((item) => {
        expect(item.mrp).toBe(150);
      });
    });
  });
});
