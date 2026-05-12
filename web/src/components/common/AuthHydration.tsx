'use client';

import { useTenantHydration } from '@/hooks/useTenantHydration';
import { useAuthHydration } from '@/hooks/useAuthHydration';

/**
 * Lightweight hydration shell for the (auth) route group.
 *
 * Only restores tenant + auth state from localStorage. We deliberately
 * do NOT run useCatalogHydration / useMultiCartHydration here because
 * those make authenticated RTK Query calls — they belong in the
 * dashboard chain after login is complete.
 *
 * Without this, /pin-login renders with an empty Redux tenant slug
 * (the user signed up earlier but their tenant data is in localStorage,
 * not in Redux yet), and the login attempt fails with
 * "No store selected. Please set up your store first."
 */
export function AuthHydration({ children }: { children: React.ReactNode }) {
  useTenantHydration();
  useAuthHydration();
  return <>{children}</>;
}
