'use client';

import { useTenantHydration } from '@/hooks/useTenantHydration';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useCatalogHydration } from '@/hooks/useCatalogHydration';
import { useMultiCartHydration } from '@/hooks/useMultiCartHydration';
import { useSettingsHydration } from '@/hooks/useSettingsHydration';

/**
 * Hydration component that loads persisted data from localStorage
 * and syncs with backend API. Must be rendered inside StoreProvider.
 *
 * Order matters: tenant → auth → catalog/cart. The cart and catalog
 * hooks issue authenticated RTK Query requests, so the access token
 * must already be in Redux by the time those fire.
 */
export function DataHydration({ children }: { children: React.ReactNode }) {
  useTenantHydration();
  useAuthHydration();
  useCatalogHydration();
  useMultiCartHydration();
  useSettingsHydration();

  return <>{children}</>;
}
