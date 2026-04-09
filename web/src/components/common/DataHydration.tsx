'use client';

import { useTenantHydration } from '@/hooks/useTenantHydration';
import { useCatalogHydration } from '@/hooks/useCatalogHydration';
import { useMultiCartHydration } from '@/hooks/useMultiCartHydration';
import { useSettingsHydration } from '@/hooks/useSettingsHydration';

/**
 * Hydration component that loads persisted data from localStorage
 * and syncs with backend API. Must be rendered inside StoreProvider.
 */
export function DataHydration({ children }: { children: React.ReactNode }) {
  useTenantHydration();
  useCatalogHydration();
  useMultiCartHydration();
  useSettingsHydration();

  return <>{children}</>;
}
