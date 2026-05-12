'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  selectAllCarts,
  selectIsMultiCartHydrated,
  selectActiveCartId,
  hydrateMultiCart,
  syncCartsFromBackend,
  selectTenant,
  useGetCartsQuery,
} from '@groceryone/store';

const CART_STORAGE_KEY = '@multicart_cache';
const DEBOUNCE_MS = 800;

export function useMultiCartHydration() {
  const dispatch = useAppDispatch();
  const carts = useAppSelector(selectAllCarts);
  const activeCartId = useAppSelector(selectActiveCartId);
  const isHydrated = useAppSelector(selectIsMultiCartHydrated);
  const tenant = useAppSelector(selectTenant);
  const hasHydrated = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: Hydrate from localStorage once (fast, offline-safe)
  useEffect(() => {
    if (hasHydrated.current || isHydrated) return;
    hasHydrated.current = true;
    try {
      const tenantSlug = tenant?.slug || localStorage.getItem('@tenant_id') || 'default';
      const cached = localStorage.getItem(`${CART_STORAGE_KEY}_${tenantSlug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.carts?.length > 0) dispatch(hydrateMultiCart(parsed));
      }
    } catch { /* ignore */ }
  }, [dispatch, isHydrated, tenant]);

  // Step 2: Fetch carts from backend so the web app shows orders created on
  // other devices (e.g. mobile). Tenant-scoped via the X-Tenant-ID header
  // injected by baseApi. Skip until tenant context is known.
  const tenantSlug = tenant?.slug || '';
  const { data: apiCarts } = useGetCartsQuery({}, { skip: !tenantSlug });

  // Step 3: Merge backend carts into Redux. The slice's reducer keeps
  // local-only carts (no backend match) intact, so unsynced web-side carts
  // are not lost — matches the catalog hydration semantics.
  useEffect(() => {
    if (!apiCarts) return;
    // Map RTK Query `Cart` shape → reducer's expected shape.
    const mapped = apiCarts.map((bc) => ({
      id: bc.id,
      name: bc.name,
      status: bc.status,
      createdAt: bc.createdAt,
      updatedAt: bc.updatedAt,
      paidAt: bc.paidAt,
      paidAmount: bc.paidAmount,
      items: (bc.items || []).map((ci) => ({
        itemId: ci.itemId,
        quantity: ci.quantity,
        priceSnapshot: ci.priceSnapshot,
        addedAt: ci.addedAt,
        item: ci.item
          ? {
              id: ci.item.id,
              categoryId: (ci.item as any).category?.slug || (ci.item as any).categoryId,
              category: (ci.item as any).category,
              name: ci.item.name,
              nameTe: (ci.item as any).nameTe,
              unit: ci.item.unit as 'kg' | 'gm' | 'pcs' | 'L' | 'ml',
              defaultQuantity: ci.item.defaultQuantity,
              price: ci.item.price,
            }
          : undefined,
      })),
    }));
    dispatch(syncCartsFromBackend({ carts: mapped }));
  }, [apiCarts, dispatch]);

  // Step 4: Debounced persist to localStorage (cache for next reload)
  useEffect(() => {
    if (!isHydrated) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        const slug = tenant?.slug || localStorage.getItem('@tenant_id') || 'default';
        localStorage.setItem(`${CART_STORAGE_KEY}_${slug}`, JSON.stringify({ carts, activeCartId }));
      } catch { /* storage full */ }
    }, DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [carts, activeCartId, isHydrated, tenant]);
}
