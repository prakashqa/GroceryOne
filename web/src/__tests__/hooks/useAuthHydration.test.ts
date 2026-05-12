/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';

// Mock Redux dispatch + selector layer used by the hook
const mockDispatch = jest.fn();
let mockTenantSlug: string | undefined = 'freshmart';
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(),
}));

// Provide a minimal selectTenant mock + setTokens action creator stub.
jest.mock('@groceryone/store', () => ({
  selectTenant: () => (mockTenantSlug ? { slug: mockTenantSlug } : null),
  setTokens: (payload: any) => ({ type: 'auth/setTokens', payload }),
}));

import { useAuthHydration } from '@/hooks/useAuthHydration';
import {
  savePersistedTokens,
  loadPersistedTokens,
} from '@/lib/auth/authStorage';

describe('useAuthHydration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockDispatch.mockClear();
    mockTenantSlug = 'freshmart';
  });

  it('dispatches setTokens with the persisted tokens for the active tenant', () => {
    savePersistedTokens('freshmart', {
      accessToken: 'fm-access',
      refreshToken: 'fm-refresh',
      tenantSlug: 'freshmart',
    });

    renderHook(() => useAuthHydration());

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch.mock.calls[0][0]).toMatchObject({
      type: 'auth/setTokens',
      payload: { accessToken: 'fm-access', refreshToken: 'fm-refresh' },
    });
  });

  it('does NOT dispatch when no tokens are stored', () => {
    renderHook(() => useAuthHydration());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does NOT dispatch when tenant is not yet known', () => {
    mockTenantSlug = undefined;
    savePersistedTokens('freshmart', {
      accessToken: 'fm-access',
      refreshToken: 'fm-refresh',
      tenantSlug: 'freshmart',
    });
    renderHook(() => useAuthHydration());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does NOT load tokens belonging to a different tenant (negative tenant-mismatch test)', () => {
    // Store tokens for QuickBasket but the active tenant is FreshMart.
    savePersistedTokens('quickbasket', {
      accessToken: 'qb-access',
      refreshToken: 'qb-refresh',
      tenantSlug: 'quickbasket',
    });
    renderHook(() => useAuthHydration());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('clears the active-tenant slot if its embedded tenantSlug disagrees (anti-tamper)', () => {
    // Hand-crafted entry in the freshmart slot but with a forged slug.
    window.localStorage.setItem(
      '@auth_tokens_freshmart',
      JSON.stringify({
        accessToken: 'forged',
        refreshToken: 'forged',
        tenantSlug: 'quickbasket',
      }),
    );
    renderHook(() => useAuthHydration());
    expect(mockDispatch).not.toHaveBeenCalled();
    // The hook actively cleared the slot to remove the stale/forged entry.
    expect(loadPersistedTokens('freshmart')).toBeNull();
  });

  it('only hydrates once per mount (idempotent)', () => {
    savePersistedTokens('freshmart', {
      accessToken: 'a', refreshToken: 'r', tenantSlug: 'freshmart',
    });
    const { rerender } = renderHook(() => useAuthHydration());
    rerender();
    rerender();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
