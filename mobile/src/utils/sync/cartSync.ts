/**
 * Cart Sync Utility
 * Handles synchronization of cart data between local storage and backend API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ManagedCart, CartItemState } from '../../domain/types/picking';
import { API_CONFIG } from '../../core/config/api.config';

// Storage keys
const MULTI_CART_STORAGE_KEY = '@groceryone/multi_cart';

export interface LocalCartData {
  carts: ManagedCart[];
  activeCartId: string | null;
  isHydrated: boolean;
  lastSyncedAt: string | null;
}

export interface CartSyncReport {
  success: boolean;
  cartsMigrated: number;
  itemsMigrated: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Get local cart data from AsyncStorage
 */
export async function getLocalCartData(): Promise<LocalCartData | null> {
  try {
    const stored = await AsyncStorage.getItem(MULTI_CART_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get local cart data:', error);
    return null;
  }
}

/**
 * Migrate local carts to backend
 */
export async function migrateCartsToBackend(
  carts: ManagedCart[],
  activeCartId: string | null,
  options?: {
    tenantId?: string;
    accessToken?: string;
    deviceId?: string;
    userId?: string;
  }
): Promise<CartSyncReport> {
  const report: CartSyncReport = {
    success: false,
    cartsMigrated: 0,
    itemsMigrated: 0,
    errors: [],
    timestamp: new Date(),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  // Map from local cart ID to backend cart ID
  const cartIdMap = new Map<string, string>();

  for (const cart of carts) {
    try {
      // Create cart in backend
      const createResponse = await fetch(`${API_CONFIG.BASE_URL}/carts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: cart.name,
          userId: options?.userId,
          deviceId: options?.deviceId,
          status: cart.status,
        }),
      });

      if (!createResponse.ok) {
        report.errors.push(`Cart ${cart.name}: Failed to create (${createResponse.status})`);
        continue;
      }

      const createdCart = await createResponse.json();
      cartIdMap.set(cart.id, createdCart.id);
      report.cartsMigrated++;

      // Set as active if it was the active cart
      if (cart.id === activeCartId) {
        await fetch(`${API_CONFIG.BASE_URL}/carts/${createdCart.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isActive: true }),
        });
      }

      // Add items to cart
      for (const cartItem of cart.items) {
        try {
          const addItemResponse = await fetch(`${API_CONFIG.BASE_URL}/carts/${createdCart.id}/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              itemId: cartItem.item.id, // This needs to be the backend item ID
              quantity: cartItem.quantity,
            }),
          });

          if (addItemResponse.ok) {
            report.itemsMigrated++;
          } else {
            report.errors.push(`Cart ${cart.name}, Item ${cartItem.item.name}: Failed to add (${addItemResponse.status})`);
          }
        } catch (error) {
          report.errors.push(`Cart ${cart.name}, Item ${cartItem.item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      report.errors.push(`Cart ${cart.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  report.success = report.errors.length === 0;
  return report;
}

/**
 * Fetch carts from backend
 */
export async function fetchCartsFromBackend(options?: {
  tenantId?: string;
  accessToken?: string;
  deviceId?: string;
  userId?: string;
}): Promise<ManagedCart[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const params = new URLSearchParams();
  if (options?.userId) params.append('userId', options.userId);
  if (options?.deviceId) params.append('deviceId', options.deviceId);

  const response = await fetch(`${API_CONFIG.BASE_URL}/carts?${params}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch carts: ${response.status}`);
  }

  const data = await response.json();

  // Map backend format to local format
  return data.map((cart: {
    id: string;
    name: string;
    status: string;
    isActive: boolean;
    items: Array<{
      itemId: string;
      item: {
        id: string;
        slug: string;
        name: string;
        categoryId: string;
        unit: string;
        defaultQuantity: number;
      };
      quantity: number;
      addedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }) => ({
    id: cart.id,
    name: cart.name,
    status: cart.status as ManagedCart['status'],
    items: cart.items?.map((ci) => ({
      item: {
        id: ci.item?.slug || ci.itemId,
        name: ci.item?.name || 'Unknown',
        categoryId: ci.item?.categoryId || '',
        unit: (ci.item?.unit || 'pcs') as CartItemState['item']['unit'],
        defaultQuantity: ci.item?.defaultQuantity || 1,
      },
      quantity: ci.quantity,
      addedAt: ci.addedAt,
    })) || [],
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  }));
}

/**
 * Full migration from local to backend
 */
export async function syncLocalCartsToBackend(options?: {
  tenantId?: string;
  accessToken?: string;
  deviceId?: string;
  userId?: string;
}): Promise<CartSyncReport> {
  const localData = await getLocalCartData();

  if (!localData || localData.carts.length === 0) {
    return {
      success: true,
      cartsMigrated: 0,
      itemsMigrated: 0,
      errors: [],
      timestamp: new Date(),
    };
  }

  return migrateCartsToBackend(localData.carts, localData.activeCartId, options);
}

/**
 * Clear local cart data after successful migration
 */
export async function clearLocalCartData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MULTI_CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear local cart data:', error);
  }
}
