/**
 * useCatalog Hook
 * Unified hook for accessing catalog data (categories and items)
 * Uses RTK Query for API data with fallback to Redux store
 */

import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetCategoriesQuery } from '../data/api/categoryApi';
import { useGetItemsQuery } from '../data/api/productApi';
import {
  selectCategories,
  selectItems,
} from '../store/slices/catalogSlice';
import type { Category, Item } from '../domain/types/picking';

// API response types (extended from domain types)
interface ApiCategory extends Category {
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiItem extends Item {
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  compareAtPrice?: number;
  costPrice?: number;
}

interface UseCatalogResult {
  /** All categories (from API or Redux store) */
  categories: (Category | ApiCategory)[];
  /** All items (from API or Redux store) */
  items: (Item | ApiItem)[];
  /** Loading state - true if fetching from API */
  isLoading: boolean;
  /** Error state - set if API fetch failed */
  error: unknown;
  /** Get a specific item by ID */
  getItemById: (id: string) => (Item | ApiItem) | undefined;
  /** Get all items in a category */
  getItemsByCategory: (categoryId: string) => (Item | ApiItem)[];
  /** Get a specific category by ID */
  getCategoryById: (id: string) => (Category | ApiCategory) | undefined;
  /** Refetch data from API */
  refetch: () => void;
}

/**
 * Hook to access catalog data (categories and items)
 *
 * Fetches data from backend API via RTK Query.
 * Falls back to Redux store (catalogSlice) if API fails.
 *
 * @example
 * const { categories, items, getItemById, isLoading } = useCatalog();
 *
 * // Get all spice items
 * const spices = getItemsByCategory('spices');
 *
 * // Get a specific item
 * const item = getItemById('sp-001');
 */
export const useCatalog = (): UseCatalogResult => {
  // Fetch from API
  const {
    data: apiCategories,
    isLoading: loadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery({ includeInactive: false });

  const {
    data: apiItems,
    isLoading: loadingItems,
    error: itemsError,
    refetch: refetchItems,
  } = useGetItemsQuery({ includeInactive: false });

  // Fallback to Redux store
  const storeCategories = useSelector(selectCategories);
  const storeItems = useSelector(selectItems);

  // Use API data if available, otherwise fall back to store
  const categories = useMemo(
    () => apiCategories ?? storeCategories,
    [apiCategories, storeCategories]
  );

  const items = useMemo(() => {
    const rawItems = apiItems ?? storeItems;
    // Ensure mrp is populated from compareAtPrice for items from API
    return rawItems.map(item => {
      const apiItem = item as ApiItem;
      if (item.mrp === undefined && apiItem.compareAtPrice != null) {
        return { ...item, mrp: Number(apiItem.compareAtPrice) };
      }
      return item;
    });
  }, [apiItems, storeItems]);

  // Combined loading state
  const isLoading = loadingCategories || loadingItems;

  // Combined error state
  const error = categoriesError || itemsError;

  // Helper: Get item by ID
  const getItemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  // Helper: Get items by category
  const getItemsByCategory = useCallback(
    (categoryId: string) => items.filter((item) => item.categoryId === categoryId),
    [items]
  );

  // Helper: Get category by ID
  const getCategoryById = useCallback(
    (id: string) => categories.find((cat) => cat.id === id),
    [categories]
  );

  // Refetch both categories and items
  const refetch = useCallback(() => {
    refetchCategories();
    refetchItems();
  }, [refetchCategories, refetchItems]);

  return {
    categories,
    items,
    isLoading,
    error,
    getItemById,
    getItemsByCategory,
    getCategoryById,
    refetch,
  };
};

export default useCatalog;
