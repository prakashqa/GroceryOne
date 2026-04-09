'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  selectCategories,
  selectItems,
  selectIsCatalogInitialized,
  initializeCatalog,
  mergeCatalogFromBackend,
  useGetCategoriesQuery,
  useGetItemsQuery,
  selectTenant,
} from '@groceryone/store';

const CATALOG_STORAGE_KEY = '@catalog_cache';

export function useCatalogHydration() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const items = useAppSelector(selectItems);
  const isInitialized = useAppSelector(selectIsCatalogInitialized);
  const tenant = useAppSelector(selectTenant);
  const hasHydrated = useRef(false);

  // Step 1: Hydrate from localStorage once
  useEffect(() => {
    if (hasHydrated.current || isInitialized) return;
    hasHydrated.current = true;
    try {
      const tenantSlug = tenant?.slug || localStorage.getItem('@tenant_id') || 'default';
      const cached = localStorage.getItem(`${CATALOG_STORAGE_KEY}_${tenantSlug}`);
      if (cached) {
        const { categories: c, items: i } = JSON.parse(cached);
        if (c?.length > 0 || i?.length > 0) dispatch(initializeCatalog({ categories: c || [], items: i || [] }));
      }
    } catch { /* ignore */ }
  }, [dispatch, isInitialized, tenant]);

  // Step 2: Fetch from backend (RTK Query handles caching)
  const tenantSlug = tenant?.slug || '';
  const { data: apiCategories } = useGetCategoriesQuery(
    { tenantSlug, includeInactive: false },
    { skip: !tenantSlug }
  );
  const { data: apiItems } = useGetItemsQuery(
    { tenantSlug, includeInactive: false },
    { skip: !tenantSlug }
  );

  // Step 3: Merge backend data whenever it changes (allows RTK Query tag invalidation to flow through)
  useEffect(() => {
    if (!apiCategories || !apiItems) return;
    const mappedCategories = apiCategories.map((c) => ({
      id: c.slug || c.id, backendId: c.id, name: c.name, icon: c.icon || '📁', trackInventory: c.trackInventory,
    }));
    const mappedItems = apiItems.map((item) => ({
      id: item.slug || item.id, backendId: item.id,
      categoryId: item.category?.slug || item.categoryId,
      name: item.name, nameTe: item.nameTe,
      unit: item.unit as 'kg' | 'gm' | 'pcs' | 'L' | 'ml',
      defaultQuantity: item.defaultQuantity, price: item.price, mrp: item.mrp,
      sortOrder: item.sortOrder, stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold, trackInventory: item.trackInventory,
    }));
    dispatch(mergeCatalogFromBackend({ categories: mappedCategories, items: mappedItems }));
  }, [apiCategories, apiItems, dispatch]);

  // Step 4: Persist full merged state to localStorage (debounced)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isInitialized) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        const slug = tenant?.slug || localStorage.getItem('@tenant_id') || 'default';
        localStorage.setItem(`${CATALOG_STORAGE_KEY}_${slug}`, JSON.stringify({ categories, items }));
      } catch { /* ignore */ }
    }, 500);
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, [categories, items, isInitialized, tenant]);
}
