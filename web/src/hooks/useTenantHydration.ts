'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { selectTenant, setTenant } from '@groceryone/store';

const TENANT_STORAGE_KEY = '@tenant_data';
const DEFAULT_TENANT_SLUG = 'freshmart';

/**
 * Hydrates tenant state from localStorage on mount.
 * If no tenant is saved, auto-resolves the default tenant from the backend API.
 * Persists tenant changes back to localStorage.
 */
export function useTenantHydration() {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(selectTenant);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current || tenant) return;
    hasHydrated.current = true;

    // Try localStorage first
    try {
      const cached = localStorage.getItem(TENANT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.slug) {
          dispatch(setTenant(parsed));
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // No tenant in localStorage — auto-resolve default tenant from backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    fetch(`${apiUrl}/auth/resolve-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
      body: JSON.stringify({ identifier: `admin@${DEFAULT_TENANT_SLUG}.com` }),
    })
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || json;
        if (data.tenantSlug) {
          const tenantObj = {
            id: data.tenantSlug,
            slug: data.tenantSlug,
            name: data.tenantName || data.tenantSlug,
            status: 'active',
            subscriptionPlan: 'premium',
            branding: { primaryColor: '#2E7D32', secondaryColor: '#66BB6A', fontFamily: 'system' },
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'te'],
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            config: { features: {}, limits: {}, paymentGateways: [] },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('@tenant_id', data.tenantSlug);
          localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenantObj));
          dispatch(setTenant(tenantObj as any));
        }
      })
      .catch(() => {
        // Backend not available — set minimal tenant so UI doesn't break
        const fallback = {
          id: DEFAULT_TENANT_SLUG,
          slug: DEFAULT_TENANT_SLUG,
          name: 'GroOne Store',
          status: 'active',
          subscriptionPlan: 'premium',
          branding: { primaryColor: '#2E7D32', secondaryColor: '#66BB6A', fontFamily: 'system' },
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'te'],
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          config: { features: {}, limits: {}, paymentGateways: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('@tenant_id', DEFAULT_TENANT_SLUG);
        localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(fallback));
        dispatch(setTenant(fallback as any));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Persist to localStorage on tenant change (only happens once on login)
  useEffect(() => {
    if (!tenant) return;
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
      localStorage.setItem('@tenant_id', tenant.slug);
    } catch { /* storage full */ }
  }, [tenant]);
}
