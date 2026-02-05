/**
 * Picking List Domain Types
 * Types for the grocery picking list feature
 *
 * NOTE: Categories and items data is fetched from the backend API.
 * Use the useCatalog hook or Redux selectors to access the data.
 *
 * @example
 * // Using the useCatalog hook
 * import { useCatalog } from '../hooks/useCatalog';
 * const { categories, items, getItemById } = useCatalog();
 *
 * // Using Redux selectors
 * import { selectCategories, selectItems } from '../store/slices/catalogSlice';
 * const categories = useSelector(selectCategories);
 */

import type { PaymentInfo } from './payment';

export interface Category {
  id: string;
  name: string;
  nameTe?: string; // Telugu name
  icon: string;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  nameTe?: string; // Telugu name
  unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml';
  defaultQuantity: number;
  price?: number; // Sale price (selling price per unit)
  mrp?: number; // MRP / compareAtPrice (Maximum Retail Price)
  sortOrder?: number; // Display order within category
}

export interface CartItem {
  item: Item;
  quantity: number;
  addedAt: Date;
}

/**
 * Cart status type
 */
export type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

export interface PickingCart {
  id: string;
  items: CartItem[];
  createdAt: Date;
  status: CartStatus;
}

/**
 * Cart item state for Redux store (uses string dates for serializability)
 */
export interface CartItemState {
  item: Item;
  quantity: number; // Always stored in base unit (kg, L)
  addedAt: string;
  priceSnapshot?: number; // Price captured at time of adding to cart
  displayUnit?: 'kg' | 'gm' | 'L' | 'ml' | 'pcs'; // User's selected unit for display
}

/**
 * Represents a single cart in the multi-cart management system
 */
export interface ManagedCart {
  id: string;
  backendId?: string; // UUID from backend database after sync
  name: string;
  items: CartItemState[];
  createdAt: string;
  updatedAt: string;
  status: CartStatus;
  paidAt?: string; // ISO timestamp when payment was marked done
  paidAmount?: number; // Captured grand total at payment time
  paidItemCount?: number; // Captured item count at payment time
  paymentInfo?: PaymentInfo; // Detailed payment information (method, details)
}

/**
 * State shape for multi-cart management
 */
export interface MultiCartState {
  carts: ManagedCart[];
  activeCartId: string | null;
  isHydrated: boolean;
  lastSyncedAt: string | null;
}

// =============================================================================
// REMOVED: Hardcoded data - now fetched from backend API
// =============================================================================
//
// The following have been removed as data is now fetched from the backend:
// - CATEGORIES array
// - ITEMS array
// - getItemsByCategory() function
// - getCategoryById() function
// - getItemById() function
//
// Use one of these alternatives:
//
// 1. useCatalog hook (recommended for components):
//    import { useCatalog } from '../hooks/useCatalog';
//    const { categories, items, getItemById, getItemsByCategory, getCategoryById } = useCatalog();
//
// 2. Redux selectors (for use in other slices or non-component code):
//    import { selectCategories, selectItems, selectItemById } from '../store/slices/catalogSlice';
//
// 3. RTK Query hooks (for direct API access):
//    import { useGetCategoriesQuery, useGetItemsQuery } from '../data/api/categoryApi';
//    import { useGetItemsQuery, useGetItemByIdQuery } from '../data/api/productApi';
//
// =============================================================================
