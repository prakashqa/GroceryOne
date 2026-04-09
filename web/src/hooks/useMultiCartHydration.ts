'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  selectAllCarts,
  selectIsMultiCartHydrated,
  selectActiveCartId,
  hydrateMultiCart,
  selectTenant,
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

  // Debounced persist to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        const tenantSlug = tenant?.slug || localStorage.getItem('@tenant_id') || 'default';
        localStorage.setItem(`${CART_STORAGE_KEY}_${tenantSlug}`, JSON.stringify({ carts, activeCartId }));
      } catch { /* storage full */ }
    }, DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [carts, activeCartId, isHydrated, tenant]);
}
