/**
 * Cart Hydration Utility
 * Loads carts from AsyncStorage cache (fast) and fetches from backend (source of truth).
 * Used during app startup after PIN verification to restore cart data.
 *
 * Two-phase strategy:
 * - Phase 1: loadOrFetchCarts() — tries AsyncStorage first, falls back to backend
 * - Phase 2: fetchCartsFromBackend() — background refresh to merge latest backend data
 */

import { ManagedCart, CartItemState, CartStatus } from '../../domain/types/picking';
import { loadMultiCartState } from './multiCartStorage';
import { API_CONFIG } from '../../core/config/api.config';

/**
 * Result of cart hydration operation
 */
export interface CartHydrationResult {
  carts: ManagedCart[];
  activeCartId: string | null;
  lastSyncedAt: string | null;
  fromCache: boolean;
  fromBackend: boolean;
  backendSkipped: boolean;
}

/**
 * Backend cart item shape (from GET /carts response)
 */
interface BackendCartItem {
  id: string;
  cartId: string;
  itemId: string;
  quantity: number;
  priceSnapshot?: number;
  addedAt: string;
  item?: {
    id: string;
    categoryId: string;
    name: string;
    nameTe?: string;
    unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml';
    defaultQuantity: number;
    price?: number;
  } | null;
}

/**
 * Backend cart shape (from GET /carts response)
 */
interface BackendCart {
  id: string;
  name: string;
  tenantId?: string;
  status: CartStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  paidAmount?: number | null;
  items: BackendCartItem[];
}

/**
 * Empty hydration result
 */
const EMPTY_RESULT: CartHydrationResult = {
  carts: [],
  activeCartId: null,
  lastSyncedAt: null,
  fromCache: false,
  fromBackend: false,
  backendSkipped: false,
};

/**
 * Transform a backend cart to ManagedCart format.
 * Filters out items without nested item data (e.g., deleted products).
 */
function transformBackendCart(backendCart: BackendCart): ManagedCart {
  return {
    id: backendCart.id,
    name: backendCart.name,
    status: backendCart.status,
    createdAt: backendCart.createdAt,
    updatedAt: backendCart.updatedAt,
    paidAt: backendCart.paidAt || undefined,
    paidAmount: backendCart.paidAmount || undefined,
    items: backendCart.items
      .filter((cartItem) => cartItem.item) // Only include items with valid nested item data
      .map((cartItem): CartItemState => ({
        item: {
          id: cartItem.item!.id,
          categoryId: cartItem.item!.categoryId,
          name: cartItem.item!.name,
          nameTe: cartItem.item!.nameTe,
          unit: cartItem.item!.unit,
          defaultQuantity: cartItem.item!.defaultQuantity,
          price: cartItem.item!.price,
        },
        quantity: cartItem.quantity,
        addedAt: cartItem.addedAt,
        priceSnapshot: cartItem.priceSnapshot,
      })),
  };
}

/**
 * Extract the carts array from backend response.
 * Handles both wrapped ({ success: true, data: [...] }) and unwrapped ([...]) formats.
 */
function extractCartsFromResponse(json: unknown): BackendCart[] {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object' && 'data' in json) {
    const wrapped = json as { data: unknown };
    if (Array.isArray(wrapped.data)) {
      return wrapped.data;
    }
  }
  return [];
}

/**
 * Fetch carts from backend API.
 * Uses raw fetch (not RTK Query) to avoid cache side effects during hydration.
 *
 * @param tenantSlug - Tenant identifier for X-Tenant-ID header
 * @param accessToken - JWT token for Authorization header
 * @returns CartHydrationResult with transformed carts, or null on failure
 */
export async function fetchCartsFromBackend(
  tenantSlug: string,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<CartHydrationResult | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantSlug,
      'X-API-Version': API_CONFIG.VERSION,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts`, {
      method: 'GET',
      headers,
      signal,
    });

    if (!response.ok) {
      console.warn(`[CartHydration] Backend returned status ${response.status}`);
      return null;
    }

    const json = await response.json();
    const backendCarts = extractCartsFromResponse(json);

    if (backendCarts.length === 0) {
      return {
        carts: [],
        activeCartId: null,
        lastSyncedAt: new Date().toISOString(),
        fromCache: false,
        fromBackend: false,
        backendSkipped: false,
      };
    }

    const managedCarts = backendCarts.map(transformBackendCart);

    return {
      carts: managedCarts,
      activeCartId: managedCarts.length > 0 ? managedCarts[0].id : null,
      lastSyncedAt: new Date().toISOString(),
      fromCache: false,
      fromBackend: true,
      backendSkipped: false,
    };
  } catch (error) {
    console.error('[CartHydration] Failed to fetch carts from backend:', error);
    return null;
  }
}

/**
 * Load carts from AsyncStorage cache first; if empty, fetch from backend.
 *
 * Phase 1 hydration strategy:
 * 1. Try AsyncStorage (fast, works offline)
 * 2. If empty and accessToken available, try backend (source of truth)
 * 3. Return empty result if both fail
 *
 * @param tenantSlug - Tenant identifier
 * @param accessToken - JWT token (null = skip backend fetch)
 * @returns CartHydrationResult indicating data source
 */
export async function loadOrFetchCarts(
  tenantSlug: string,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<CartHydrationResult> {
  try {
    // Phase 1: Try AsyncStorage cache
    const cachedState = await loadMultiCartState(tenantSlug);

    if (cachedState && cachedState.carts && cachedState.carts.length > 0) {
      console.log(`[CartHydration] Loaded ${cachedState.carts.length} carts from cache`);
      return {
        carts: cachedState.carts,
        activeCartId: cachedState.activeCartId || null,
        lastSyncedAt: cachedState.lastSyncedAt || null,
        fromCache: true,
        fromBackend: false,
        backendSkipped: false,
      };
    }

    // Phase 2: AsyncStorage empty — try backend (requires auth token)
    if (!accessToken) {
      console.warn('[CartHydration] No cached carts and no access token — returning empty');
      return { ...EMPTY_RESULT, backendSkipped: true };
    }

    console.log('[CartHydration] No cached carts, fetching from backend...');
    const backendResult = await fetchCartsFromBackend(tenantSlug, accessToken, signal);

    if (backendResult && backendResult.carts.length > 0) {
      return backendResult;
    }

    // Both sources empty
    return { ...EMPTY_RESULT };
  } catch (error) {
    console.error('[CartHydration] Error during cart hydration:', error);
    return { ...EMPTY_RESULT };
  }
}
