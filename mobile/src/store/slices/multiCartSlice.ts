/**
 * Multi-Cart Slice
 * Redux slice for managing multiple carts
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Item, ManagedCart, MultiCartState, CartItemState, CartStatus } from '../../domain/types/picking';
import type { PaymentInfo, MarkPaidPayload, MarkCartPaidPayload } from '../../domain/types/payment';
import { getHardcodedItemPrice } from '../../domain/utils/priceUtils';
import type { ItemUnit } from '../../domain/utils/unitConversion';

/**
 * Generate a unique ID for carts
 */
const generateCartId = (): string => {
  return `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: MultiCartState = {
  carts: [],
  activeCartId: null,
  isHydrated: false,
  lastSyncedAt: null,
};

const multiCartSlice = createSlice({
  name: 'multiCart',
  initialState,
  reducers: {
    /**
     * Create a new cart and set it as active
     */
    createCart: (state, action: PayloadAction<{ name: string }>) => {
      const now = new Date().toISOString();
      const newCart: ManagedCart = {
        id: generateCartId(),
        name: action.payload.name,
        items: [],
        createdAt: now,
        updatedAt: now,
        status: 'draft',
      };
      state.carts.push(newCart);
      state.activeCartId = newCart.id;
    },

    /**
     * Delete a cart by ID
     * Note: Paid carts cannot be deleted (protected)
     */
    deleteCart: (state, action: PayloadAction<string>) => {
      const cartId = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);

      // Prevent deletion of paid carts
      if (cart?.status === 'paid') return;

      const index = state.carts.findIndex((c) => c.id === cartId);

      if (index !== -1) {
        state.carts.splice(index, 1);

        // Handle active cart reassignment
        if (state.activeCartId === cartId) {
          if (state.carts.length > 0) {
            state.activeCartId = state.carts[0].id;
          } else {
            state.activeCartId = null;
          }
        }
      }
    },

    /**
     * Rename a cart
     */
    renameCart: (state, action: PayloadAction<{ cartId: string; name: string }>) => {
      const { cartId, name } = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);

      if (cart) {
        cart.name = name;
        cart.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Set the active cart
     */
    setActiveCart: (state, action: PayloadAction<string>) => {
      const cartId = action.payload;
      const exists = state.carts.some((cart) => cart.id === cartId);

      if (exists) {
        state.activeCartId = cartId;
      }
    },

    /**
     * Add an item to the active cart
     * Captures the price at the time of adding (priceSnapshot) for accurate billing
     * Note: Paid carts cannot be modified
     * @param item - The item to add
     * @param quantity - Quantity in base unit (kg, L)
     * @param displayUnit - User's selected display unit (e.g., 'gm' if they entered in grams)
     */
    addItemToActiveCart: (
      state,
      action: PayloadAction<{ item: Item; quantity: number; displayUnit?: ItemUnit }>
    ) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block modifications to paid carts
      if (cart.status === 'paid') return;

      const { item, quantity, displayUnit } = action.payload;
      const existingIndex = cart.items.findIndex(
        (cartItem) => cartItem.item.id === item.id
      );

      if (existingIndex >= 0) {
        // Preserve the original priceSnapshot when incrementing quantity
        cart.items[existingIndex].quantity += quantity;
        // Update displayUnit to user's latest preference
        if (displayUnit) {
          cart.items[existingIndex].displayUnit = displayUnit;
        }
      } else {
        // Capture price at time of adding to cart
        cart.items.push({
          item,
          quantity,
          addedAt: new Date().toISOString(),
          priceSnapshot: item.price, // Capture price at add time
          displayUnit, // Store user's selected display unit
        });
      }

      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Remove an item from the active cart
     * Note: Paid carts cannot be modified
     */
    removeItemFromActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block modifications to paid carts
      if (cart.status === 'paid') return;

      const itemId = action.payload;
      cart.items = cart.items.filter((cartItem) => cartItem.item.id !== itemId);
      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Remove an item from a specific cart by cartId
     * Note: Paid carts cannot be modified
     */
    removeItemFromCart: (
      state,
      action: PayloadAction<{ cartId: string; itemId: string }>
    ) => {
      const { cartId, itemId } = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);

      if (cart) {
        // Block modifications to paid carts
        if (cart.status === 'paid') return;

        cart.items = cart.items.filter((cartItem) => cartItem.item.id !== itemId);
        cart.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Update item quantity in active cart
     * Note: Paid carts cannot be modified
     */
    updateItemQuantityInActiveCart: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block modifications to paid carts
      if (cart.status === 'paid') return;

      const { itemId, quantity } = action.payload;

      if (quantity <= 0) {
        cart.items = cart.items.filter((cartItem) => cartItem.item.id !== itemId);
      } else {
        const existingIndex = cart.items.findIndex(
          (cartItem) => cartItem.item.id === itemId
        );
        if (existingIndex >= 0) {
          cart.items[existingIndex].quantity = quantity;
        }
      }

      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Increment item quantity by its default quantity
     * Note: Paid carts cannot be modified
     */
    incrementItemInActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block modifications to paid carts
      if (cart.status === 'paid') return;

      const itemId = action.payload;
      const existingIndex = cart.items.findIndex(
        (cartItem) => cartItem.item.id === itemId
      );

      if (existingIndex >= 0) {
        const cartItem = cart.items[existingIndex];
        cart.items[existingIndex].quantity += cartItem.item.defaultQuantity;
        cart.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Decrement item quantity by its default quantity
     * Removes item if quantity would be less than or equal to default
     * Note: Paid carts cannot be modified
     */
    decrementItemInActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block modifications to paid carts
      if (cart.status === 'paid') return;

      const itemId = action.payload;
      const existingIndex = cart.items.findIndex(
        (cartItem) => cartItem.item.id === itemId
      );

      if (existingIndex >= 0) {
        const cartItem = cart.items[existingIndex];
        const defaultQty = cartItem.item.defaultQuantity;

        if (cartItem.quantity <= defaultQty) {
          cart.items = cart.items.filter((ci) => ci.item.id !== itemId);
        } else {
          cart.items[existingIndex].quantity -= defaultQty;
        }

        cart.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Clear all items from active cart
     * Note: Paid carts cannot be cleared
     */
    clearActiveCart: (state) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Block clearing paid carts
      if (cart.status === 'paid') return;

      cart.items = [];
      cart.status = 'draft';
      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Set the status of the active cart
     */
    setActiveCartStatus: (
      state,
      action: PayloadAction<CartStatus>
    ) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      cart.status = action.payload;
      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Refresh prices for all items in the active cart
     * Updates priceSnapshot from current catalog prices
     * Uses ID matching first, falls back to name matching if ID doesn't match
     * Falls back to hardcoded ITEMS if catalog items don't have prices
     */
    refreshActiveCartPrices: (state, action: PayloadAction<Item[]>) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      const catalogItems = action.payload;

      // Update priceSnapshot for each cart item by looking up current price from catalog
      cart.items.forEach((cartItem) => {
        // Try exact ID match first in catalog
        let catalogItem = catalogItems.find((item) => item.id === cartItem.item.id);

        // If no ID match or ID match has no price, try fallback by name (case-insensitive) in catalog
        if (!catalogItem || catalogItem.price === undefined) {
          const nameMatch = catalogItems.find(
            (item) =>
              item.name.toLowerCase() === cartItem.item.name.toLowerCase() &&
              item.price !== undefined
          );
          if (nameMatch) {
            catalogItem = nameMatch;
          }
        }

        // Final fallback: use hardcoded ITEMS if catalog doesn't have prices
        if (!catalogItem || catalogItem.price === undefined) {
          const hardcodedPrice = getHardcodedItemPrice(
            cartItem.item.id,
            cartItem.item.name
          );

          if (hardcodedPrice !== undefined) {
            cartItem.priceSnapshot = hardcodedPrice;
            cartItem.item.price = hardcodedPrice;
            return; // Skip the general update below since we've handled it
          }
        }

        if (catalogItem && catalogItem.price !== undefined) {
          // Update both priceSnapshot and the item's price field
          cartItem.priceSnapshot = catalogItem.price;
          cartItem.item.price = catalogItem.price;
        }
      });

      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Mark the active cart as paid
     * Business rules:
     * - Cart must have items
     * - Amount must be > 0
     * - Cart must not already be paid
     *
     * @param payload - MarkPaidPayload with amount and paymentInfo
     */
    markActiveCartAsPaid: (state, action: PayloadAction<MarkPaidPayload>) => {
      if (!state.activeCartId) return;

      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;

      // Business rules validation
      if (cart.status === 'paid') return; // Already paid
      if (cart.items.length === 0) return; // Empty cart

      const { amount, paymentInfo } = action.payload;
      if (amount <= 0) return; // Invalid amount

      cart.status = 'paid';
      cart.paidAt = new Date().toISOString();
      cart.paidAmount = amount;
      cart.paidItemCount = cart.items.length;
      cart.paymentInfo = paymentInfo;
      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Mark a specific cart as paid by cartId
     * Business rules:
     * - Cart must exist
     * - Cart must have items
     * - Amount must be > 0
     * - Cart must not already be paid
     *
     * @param payload - MarkCartPaidPayload with cartId, amount and paymentInfo
     */
    markCartAsPaid: (
      state,
      action: PayloadAction<MarkCartPaidPayload>
    ) => {
      const { cartId, amount, paymentInfo } = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);

      if (!cart) return;

      // Business rules validation
      if (cart.status === 'paid') return; // Already paid
      if (cart.items.length === 0) return; // Empty cart
      if (amount <= 0) return; // Invalid amount

      cart.status = 'paid';
      cart.paidAt = new Date().toISOString();
      cart.paidAmount = amount;
      cart.paidItemCount = cart.items.length;
      cart.paymentInfo = paymentInfo;
      cart.updatedAt = new Date().toISOString();
    },

    /**
     * Hydrate state from persisted storage
     */
    hydrateMultiCart: (state, action: PayloadAction<Partial<MultiCartState>>) => {
      const { carts, activeCartId, lastSyncedAt } = action.payload;

      if (carts) {
        state.carts = carts;
      }
      if (activeCartId !== undefined) {
        state.activeCartId = activeCartId;
      }
      if (lastSyncedAt) {
        state.lastSyncedAt = lastSyncedAt;
      }
      state.isHydrated = true;
    },

    /**
     * Sync carts from backend API
     * Merges backend carts with local carts, avoiding duplicates by ID
     * Backend carts take precedence for matching IDs
     */
    syncCartsFromBackend: (
      state,
      action: PayloadAction<{
        carts: Array<{
          id: string;
          name: string;
          status: CartStatus;
          createdAt: string;
          updatedAt: string;
          paidAt?: string;
          paidAmount?: number;
          items: Array<{
            itemId: string;
            quantity: number;
            priceSnapshot?: number;
            addedAt: string;
            item?: {
              id: string;
              categoryId: string;
              category?: { slug: string };
              name: string;
              nameTe?: string;
              unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml';
              defaultQuantity: number;
              price?: number;
            };
          }>;
        }>;
        replaceAll?: boolean;
      }>
    ) => {
      const { carts: backendCarts, replaceAll = false } = action.payload;

      // Convert backend carts to ManagedCart format
      const convertedCarts: ManagedCart[] = backendCarts.map((backendCart) => ({
        id: backendCart.id,
        name: backendCart.name,
        status: backendCart.status,
        createdAt: backendCart.createdAt,
        updatedAt: backendCart.updatedAt,
        paidAt: backendCart.paidAt,
        paidAmount: backendCart.paidAmount,
        items: backendCart.items
          .filter((item) => item.item) // Only include items with item data
          .map((item) => ({
            item: {
              id: item.item!.id,
              categoryId: item.item!.category?.slug || item.item!.categoryId,
              name: item.item!.name,
              nameTe: item.item!.nameTe,
              unit: item.item!.unit,
              defaultQuantity: item.item!.defaultQuantity,
              price: item.item!.price,
            },
            quantity: item.quantity,
            addedAt: item.addedAt,
            priceSnapshot: item.priceSnapshot,
          })),
      }));

      if (replaceAll) {
        // Merge backend carts with local state, preserving local payment status.
        // This handles the race condition where the user marks a cart as paid locally,
        // but the payment PUT hasn't reached the backend yet, so the backend still
        // returns status: 'draft'. Local 'paid'/'completed' status always wins.
        const mergedCarts = convertedCarts.map((backendCart) => {
          // Match local cart by id or backendId (local carts use cart-xxx ids, backend uses UUIDs)
          const localCart = state.carts.find(
            (c) => c.id === backendCart.id || c.backendId === backendCart.id
          );

          // LOCAL WINS: if local cart is paid/completed, preserve ALL payment state
          // regardless of backend status (handles race condition during payment sync)
          if (localCart && (localCart.status === 'paid' || localCart.status === 'completed')) {
            const items = localCart.items.length > backendCart.items.length
              ? localCart.items : backendCart.items;
            return {
              ...backendCart,
              status: localCart.status,
              paidAt: localCart.paidAt ?? backendCart.paidAt,
              paidAmount: localCart.paidAmount ?? backendCart.paidAmount,
              paidItemCount: localCart.paidItemCount ?? backendCart.paidItemCount,
              paymentInfo: localCart.paymentInfo ?? backendCart.paymentInfo,
              items,
            };
          }

          return backendCart;
        });

        // Preserve local-only paid/completed carts not present in backend.
        // These carts exist locally (e.g., from AsyncStorage cache) but the backend
        // doesn't know about them (sync failed or created offline).
        const backendCartIds = new Set(convertedCarts.map((c) => c.id));
        const localOnlyCarts = state.carts.filter((localCart) => {
          if (localCart.status !== 'paid' && localCart.status !== 'completed') {
            return false;
          }
          const matchedById = backendCartIds.has(localCart.id);
          const matchedByBackendId = localCart.backendId
            ? backendCartIds.has(localCart.backendId)
            : false;
          return !matchedById && !matchedByBackendId;
        });

        const finalCarts = [...mergedCarts, ...localOnlyCarts];
        state.carts = finalCarts;
        // Reset active cart if it no longer exists
        if (state.activeCartId && !finalCarts.find((c) => c.id === state.activeCartId)) {
          state.activeCartId = finalCarts.length > 0 ? finalCarts[0].id : null;
        }
      } else {
        // Merge: backend carts take precedence, add new ones
        // Also check backendId to prevent duplicates when local carts
        // (with cart-* ids) have been synced to backend (with UUID ids)
        const existingIds = new Set(state.carts.map((c) => c.id));

        // Update existing carts that are in backend (match by id or backendId)
        state.carts = state.carts.map((cart) => {
          const backendCart = convertedCarts.find((c) => c.id === cart.id);
          if (backendCart) {
            // LOCAL WINS: preserve paid/completed status and all payment metadata
            // Handles race condition where payment PUT hasn't reached backend yet
            if (cart.status === 'paid' || cart.status === 'completed') {
              return {
                ...backendCart,
                status: cart.status,
                paidAt: cart.paidAt ?? backendCart.paidAt,
                paidAmount: cart.paidAmount ?? backendCart.paidAmount,
                paidItemCount: cart.paidItemCount ?? backendCart.paidItemCount,
                paymentInfo: cart.paymentInfo ?? backendCart.paymentInfo,
                items: cart.items.length > backendCart.items.length
                  ? cart.items : backendCart.items,
              };
            }
            return backendCart;
          }
          // Check if a backend cart matches this local cart's backendId
          const matchByBackendId = convertedCarts.find((c) => c.id === cart.backendId);
          if (matchByBackendId) {
            // LOCAL WINS: preserve paid/completed status and all payment metadata
            if (cart.status === 'paid' || cart.status === 'completed') {
              return {
                ...matchByBackendId,
                id: cart.id,
                backendId: cart.backendId,
                status: cart.status,
                paidAt: cart.paidAt ?? matchByBackendId.paidAt,
                paidAmount: cart.paidAmount ?? matchByBackendId.paidAmount,
                paidItemCount: cart.paidItemCount ?? matchByBackendId.paidItemCount,
                paymentInfo: cart.paymentInfo ?? matchByBackendId.paymentInfo,
                items: cart.items.length > matchByBackendId.items.length
                  ? cart.items : matchByBackendId.items,
              };
            }
            // Merge backend data but preserve local id and backendId
            return {
              ...matchByBackendId,
              id: cart.id,
              backendId: cart.backendId,
            };
          }
          return cart;
        });

        // Add new carts from backend that don't exist locally
        // Check both id and backendId to prevent duplicates
        const allLocalBackendIds = new Set(
          state.carts.map((c) => c.backendId).filter(Boolean)
        );
        const newCarts = convertedCarts.filter(
          (c) => !existingIds.has(c.id) && !allLocalBackendIds.has(c.id)
        );
        state.carts.push(...newCarts);
      }

      state.lastSyncedAt = new Date().toISOString();
      state.isHydrated = true;
    },

    /**
     * Update a cart's backend ID after successful sync
     * Maps local cart ID to backend UUID
     */
    updateCartBackendId: (
      state,
      action: PayloadAction<{ localId: string; backendId: string }>
    ) => {
      const { localId, backendId } = action.payload;
      const cart = state.carts.find((c) => c.id === localId);

      if (cart) {
        cart.backendId = backendId;
        cart.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Reset entire multi-cart state (used during tenant switch)
     * Clears all carts and resets to initial state
     */
    resetMultiCart: () => initialState,
  },
});

// Export actions
export const {
  createCart,
  deleteCart,
  renameCart,
  setActiveCart,
  addItemToActiveCart,
  removeItemFromActiveCart,
  removeItemFromCart,
  updateItemQuantityInActiveCart,
  incrementItemInActiveCart,
  decrementItemInActiveCart,
  clearActiveCart,
  setActiveCartStatus,
  refreshActiveCartPrices,
  markActiveCartAsPaid,
  markCartAsPaid,
  hydrateMultiCart,
  syncCartsFromBackend,
  updateCartBackendId,
  resetMultiCart,
} = multiCartSlice.actions;

// Selectors
interface RootState {
  multiCart: MultiCartState;
}

export const selectAllCarts = (state: RootState) => state.multiCart.carts;

export const selectActiveCartId = (state: RootState) => state.multiCart.activeCartId;

export const selectActiveCart = (state: RootState): ManagedCart | null => {
  const { carts, activeCartId } = state.multiCart;
  return carts.find((cart) => cart.id === activeCartId) || null;
};

const EMPTY_ITEMS: CartItemState[] = [];

export const selectActiveCartItems = createSelector(
  [selectActiveCart],
  (activeCart): CartItemState[] => activeCart?.items || EMPTY_ITEMS
);

export const selectActiveCartItemCount = (state: RootState): number => {
  return selectActiveCartItems(state).length;
};

/**
 * Count unique categories in the active cart
 * Returns the number of distinct categoryId values across all cart items
 */
export const selectActiveCartCategoryCount = (state: RootState): number => {
  const items = selectActiveCartItems(state);
  const uniqueCategories = new Set(items.map(item => item.item.categoryId));
  return uniqueCategories.size;
};

export const selectActiveCartTotalQuantity = (state: RootState): number => {
  return selectActiveCartItems(state).reduce(
    (total, item) => total + item.quantity,
    0
  );
};

export const selectCartCount = (state: RootState): number => state.multiCart.carts.length;

export const selectIsMultiCartHydrated = (state: RootState): boolean =>
  state.multiCart.isHydrated;

/**
 * Get unit multiplier for price calculation
 * For 'gm' and 'ml' units, prices are stored per-KG/per-L, so multiply by 0.001
 * For 'kg', 'L', 'pcs' units, no conversion needed (multiplier = 1)
 */
const getUnitMultiplier = (unit: string): number => {
  if (unit === 'gm' || unit === 'ml') return 0.001;
  return 1;
};

/**
 * Calculate the grand total of all priced items in the active cart
 * Only includes items with a valid priceSnapshot
 * Applies unit multiplier for gm/ml items (prices stored per-KG/per-L)
 */
export const selectActiveCartGrandTotal = (state: RootState): number => {
  const items = selectActiveCartItems(state);
  return items.reduce((total, item) => {
    if (item.priceSnapshot && item.priceSnapshot > 0) {
      const multiplier = getUnitMultiplier(item.item.unit);
      return total + item.priceSnapshot * item.quantity * multiplier;
    }
    return total;
  }, 0);
};

/**
 * Check if the active cart has any items with prices
 * Returns true if at least one item has a valid priceSnapshot > 0
 */
export const selectActiveCartHasPrices = (state: RootState): boolean => {
  const items = selectActiveCartItems(state);
  return items.some(
    (item) => item.priceSnapshot !== undefined && item.priceSnapshot > 0
  );
};

// ============================================
// Dashboard Selectors
// ============================================

/**
 * Get all carts created today
 * Compares cart createdAt date with today's date
 */
export const selectTodaysCarts = createSelector(
  [selectAllCarts],
  (carts): ManagedCart[] => {
    const today = new Date().toDateString();
    return carts.filter(
      (cart) => new Date(cart.createdAt).toDateString() === today
    );
  }
);

/**
 * Get all carts created yesterday
 * Compares cart createdAt date with yesterday's date
 */
export const selectYesterdaysCarts = createSelector(
  [selectAllCarts],
  (carts): ManagedCart[] => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    return carts.filter(
      (cart) => new Date(cart.createdAt).toDateString() === yesterdayStr
    );
  }
);

/**
 * Get all carts within a specific date range (inclusive)
 * Uses createdAt timestamp for filtering
 * @param state Redux state
 * @param startDate ISO string for start of range
 * @param endDate ISO string for end of range
 */
export const selectCartsByDateRange = (
  state: RootState,
  startDate: string,
  endDate: string
): ManagedCart[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return state.multiCart.carts.filter((cart) => {
    const cartTime = new Date(cart.createdAt).getTime();
    return cartTime >= start && cartTime <= end;
  });
};

/**
 * Get all carts sorted by updatedAt (most recent first)
 * Useful for displaying carts in chronological order
 */
export const selectCartsSortedByDate = createSelector(
  [selectAllCarts],
  (carts): ManagedCart[] =>
    [...carts].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
);

/**
 * Count carts by status
 * Returns counts for draft, printed, paid, and completed carts
 */
export const selectCartsByStatus = createSelector(
  [selectAllCarts],
  (carts): { draft: number; printed: number; paid: number; completed: number } => ({
    draft: carts.filter((c) => c.status === 'draft').length,
    printed: carts.filter((c) => c.status === 'printed').length,
    paid: carts.filter((c) => c.status === 'paid').length,
    completed: carts.filter((c) => c.status === 'completed').length,
  })
);

/**
 * Calculate today's business metrics
 * - cartsCreated: Number of carts created today
 * - itemsPicked: Total unique items across today's carts
 * - totalQuantity: Sum of all quantities in today's carts
 * - totalSales: Sales amount from completed and printed carts (not drafts)
 */
export const selectTodaysMetrics = createSelector(
  [selectTodaysCarts],
  (todaysCarts): {
    cartsCreated: number;
    itemsPicked: number;
    totalQuantity: number;
    totalSales: number;
  } => {
    const totalItems = todaysCarts.reduce(
      (sum, cart) => sum + cart.items.length,
      0
    );

    const totalQuantity = todaysCarts.reduce(
      (sum, cart) =>
        sum + cart.items.reduce((q, item) => q + item.quantity, 0),
      0
    );

    // Sales only from completed, printed, and paid carts (not drafts)
    // Apply unit multiplier for gm/ml items (prices stored per-KG/per-L)
    const totalSales = todaysCarts
      .filter((c) => c.status === 'completed' || c.status === 'printed' || c.status === 'paid')
      .reduce((sum, cart) => {
        return (
          sum +
          cart.items.reduce(
            (s, item) => {
              const multiplier = getUnitMultiplier(item.item.unit);
              return s + (item.priceSnapshot || 0) * item.quantity * multiplier;
            },
            0
          )
        );
      }, 0);

    return {
      cartsCreated: todaysCarts.length,
      itemsPicked: totalItems,
      totalQuantity,
      totalSales,
    };
  }
);

/**
 * Get recent carts sorted by updatedAt (most recent first)
 * @param state Redux state
 * @param limit Maximum number of carts to return (default: 5)
 */
export const selectRecentCarts = (
  state: RootState,
  limit = 5
): ManagedCart[] => {
  return [...state.multiCart.carts]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, limit);
};

/**
 * Get the most recently updated draft cart
 * Used for "Resume Last Draft" quick action on dashboard
 * @param state Redux state
 * @returns Most recent draft cart or null if no drafts exist
 */
export const selectMostRecentDraftCart = (state: RootState): ManagedCart | null => {
  const draftCarts = state.multiCart.carts.filter(cart => cart.status === 'draft');
  if (draftCarts.length === 0) return null;

  return draftCarts.reduce((latest, cart) =>
    new Date(cart.updatedAt).getTime() > new Date(latest.updatedAt).getTime() ? cart : latest
  );
};

// ============================================
// Payment Selectors
// ============================================

/**
 * Check if the active cart is paid
 * Returns true if status is 'paid'
 */
export const selectActiveCartIsPaid = (state: RootState): boolean => {
  const activeCart = selectActiveCart(state);
  return activeCart?.status === 'paid';
};

/**
 * Get payment info for the active cart
 * Returns null if cart is not paid or doesn't exist
 */
export const selectActiveCartPaymentInfo = (state: RootState): PaymentInfo | null => {
  const activeCart = selectActiveCart(state);
  return activeCart?.paymentInfo || null;
};

/**
 * Check if payment can be marked on the active cart
 * Business rules:
 * - Cart must exist
 * - Cart must not be already paid
 * - Cart must have items
 * - Grand total must be > 0
 */
export const selectCanMarkPayment = (state: RootState): boolean => {
  const activeCart = selectActiveCart(state);
  if (!activeCart) return false;
  if (activeCart.status === 'paid') return false;
  if (activeCart.items.length === 0) return false;
  return selectActiveCartGrandTotal(state) > 0;
};

/**
 * Get the total paid amount from today's paid carts
 */
export const selectTodaysPaidAmount = (state: RootState): number => {
  const todaysCarts = selectTodaysCarts(state);
  return todaysCarts
    .filter((c) => c.status === 'paid')
    .reduce((sum, cart) => sum + (cart.paidAmount || 0), 0);
};

/**
 * Get the count of non-paid carts with items (pending payments)
 * Only counts today's carts
 */
export const selectPendingPaymentsCount = (state: RootState): number => {
  const todaysCarts = selectTodaysCarts(state);
  return todaysCarts.filter(
    (c) => c.status !== 'paid' && c.items.length > 0
  ).length;
};

// Re-export the state type for tests
export type { MultiCartState };

// Export reducer
export default multiCartSlice.reducer;
