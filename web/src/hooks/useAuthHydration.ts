'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { selectTenant, setTokens } from '@groceryone/store';
import { loadPersistedTokens, clearPersistedTokens } from '@/lib/auth/authStorage';

/**
 * Restore the access/refresh JWTs from localStorage on mount so RTK Query
 * can authenticate cart/order requests without the user re-typing their
 * PIN every reload.
 *
 * Tenant-scoped: only loads tokens whose namespace AND embedded
 * `tenantSlug` match the currently active tenant. If the persisted entry
 * is for a different tenant, it is left in place but ignored — and we
 * actively *clear* the active tenant's slot if a stored entry's slug
 * disagrees with the namespace, to defend against tampering / drift.
 */
export function useAuthHydration() {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(selectTenant);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    const tenantSlug = tenant?.slug;
    if (!tenantSlug) return; // wait until tenant is known

    hasHydrated.current = true;

    const stored = loadPersistedTokens(tenantSlug);
    if (!stored) return;

    // Belt-and-suspenders: drop tokens whose embedded slug disagrees with
    // the current tenant. `loadPersistedTokens` already filters this, but
    // we also actively clear the slot to remove the stale entry.
    if (stored.tenantSlug !== tenantSlug) {
      clearPersistedTokens(tenantSlug);
      return;
    }

    dispatch(
      setTokens({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        expiresIn: 3600,
      } as any),
    );
  }, [dispatch, tenant?.slug]);
}
