/**
 * Multi-Cart Slice (shared)
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Item, ManagedCart, MultiCartState, CartItemState, CartStatus } from '../types/picking';
import type { PaymentInfo, MarkPaidPayload, MarkCartPaidPayload } from '../types/payment';
import type { ItemUnit } from '../utils/unitConversion';
import { normalizeToBaseUnit } from '../utils/unitConversion';
import { logout } from './authSlice';

const generateCartId = (): string =>
  `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const initialState: MultiCartState = {
  carts: [],
  activeCartId: null,
  isHydrated: false,
  lastSyncedAt: null,
  deletedCartIds: [],
};

const multiCartSlice = createSlice({
  name: 'multiCart',
  initialState,
  reducers: {
    createCart: (state, action: PayloadAction<{ name: string }>) => {
      const { name } = action.payload;
      if (state.carts.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
      const now = new Date().toISOString();
      const newCart: ManagedCart = { id: generateCartId(), name, items: [], createdAt: now, updatedAt: now, status: 'draft' };
      state.carts.push(newCart);
      state.activeCartId = newCart.id;
    },
    deleteCart: (state, action: PayloadAction<string>) => {
      const cartId = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);
      if (cart?.status === 'paid') return;
      const index = state.carts.findIndex((c) => c.id === cartId);
      if (index !== -1) {
        if (!state.deletedCartIds) state.deletedCartIds = [];
        state.deletedCartIds.push(cartId);
        if (cart?.backendId) state.deletedCartIds.push(cart.backendId);
        state.carts.splice(index, 1);
        if (state.activeCartId === cartId) {
          state.activeCartId = state.carts.length > 0 ? state.carts[0].id : null;
        }
      }
    },
    renameCart: (state, action: PayloadAction<{ cartId: string; name: string }>) => {
      const cart = state.carts.find((c) => c.id === action.payload.cartId);
      if (cart) { cart.name = action.payload.name; cart.updatedAt = new Date().toISOString(); }
    },
    setActiveCart: (state, action: PayloadAction<string>) => {
      if (state.carts.some((c) => c.id === action.payload)) state.activeCartId = action.payload;
    },
    addItemToActiveCart: (state, action: PayloadAction<{ item: Item; quantity: number; displayUnit?: ItemUnit }>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      const { item, quantity, displayUnit } = action.payload;
      const existingIndex = cart.items.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
        if (displayUnit) cart.items[existingIndex].displayUnit = displayUnit;
      } else {
        cart.items.push({ item, quantity, addedAt: new Date().toISOString(), priceSnapshot: item.price, displayUnit });
      }
      cart.updatedAt = new Date().toISOString();
    },
    removeItemFromActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      cart.items = cart.items.filter((ci) => ci.item.id !== action.payload);
      cart.updatedAt = new Date().toISOString();
    },
    removeItemFromCart: (state, action: PayloadAction<{ cartId: string; itemId: string }>) => {
      const cart = state.carts.find((c) => c.id === action.payload.cartId);
      if (!cart || cart.status === 'paid') return;
      cart.items = cart.items.filter((ci) => ci.item.id !== action.payload.itemId);
      cart.updatedAt = new Date().toISOString();
    },
    updateItemQuantityInActiveCart: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        cart.items = cart.items.filter((ci) => ci.item.id !== itemId);
      } else {
        const idx = cart.items.findIndex((ci) => ci.item.id === itemId);
        if (idx >= 0) cart.items[idx].quantity = quantity;
      }
      cart.updatedAt = new Date().toISOString();
    },
    incrementItemInActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      const idx = cart.items.findIndex((ci) => ci.item.id === action.payload);
      if (idx >= 0) {
        const { quantity: baseIncrement } = normalizeToBaseUnit(cart.items[idx].item.defaultQuantity, cart.items[idx].item.unit);
        cart.items[idx].quantity += baseIncrement;
        cart.updatedAt = new Date().toISOString();
      }
    },
    decrementItemInActiveCart: (state, action: PayloadAction<string>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      const idx = cart.items.findIndex((ci) => ci.item.id === action.payload);
      if (idx >= 0) {
        cart.items = cart.items.filter((ci) => ci.item.id !== action.payload);
        cart.updatedAt = new Date().toISOString();
      }
    },
    clearActiveCart: (state) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid') return;
      cart.items = [];
      cart.status = 'draft';
      cart.updatedAt = new Date().toISOString();
    },
    setActiveCartStatus: (state, action: PayloadAction<CartStatus>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;
      cart.status = action.payload;
      cart.updatedAt = new Date().toISOString();
    },
    refreshActiveCartPrices: (state, action: PayloadAction<Item[]>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart) return;
      const catalogItems = action.payload;
      cart.items.forEach((cartItem) => {
        let catalogItem = catalogItems.find((item) => item.id === cartItem.item.id);
        if (!catalogItem || catalogItem.price === undefined) {
          const nameMatch = catalogItems.find((item) => item.name.toLowerCase() === cartItem.item.name.toLowerCase() && item.price !== undefined);
          if (nameMatch) catalogItem = nameMatch;
        }
        // No hardcoded fallback — prices must come from the tenant-scoped
        // catalog passed in. If both id and name misses, leave priceSnapshot
        // untouched so the UI can surface "price unavailable".
        if (catalogItem && catalogItem.price !== undefined) {
          cartItem.priceSnapshot = catalogItem.price;
          cartItem.item.price = catalogItem.price;
        }
      });
      cart.updatedAt = new Date().toISOString();
    },
    markActiveCartAsPaid: (state, action: PayloadAction<MarkPaidPayload>) => {
      if (!state.activeCartId) return;
      const cart = state.carts.find((c) => c.id === state.activeCartId);
      if (!cart || cart.status === 'paid' || cart.items.length === 0) return;
      const { amount, paymentInfo } = action.payload;
      if (amount <= 0) return;
      cart.status = 'paid';
      cart.paidAt = new Date().toISOString();
      cart.paidAmount = amount;
      cart.paidItemCount = cart.items.length;
      cart.paymentInfo = paymentInfo;
      cart.updatedAt = new Date().toISOString();
    },
    markCartAsPaid: (state, action: PayloadAction<MarkCartPaidPayload>) => {
      const { cartId, amount, paymentInfo } = action.payload;
      const cart = state.carts.find((c) => c.id === cartId);
      if (!cart || cart.status === 'paid' || cart.items.length === 0 || amount <= 0) return;
      cart.status = 'paid';
      cart.paidAt = new Date().toISOString();
      cart.paidAmount = amount;
      cart.paidItemCount = cart.items.length;
      cart.paymentInfo = paymentInfo;
      cart.updatedAt = new Date().toISOString();
    },
    hydrateMultiCart: (state, action: PayloadAction<Partial<MultiCartState>>) => {
      const { carts, activeCartId, lastSyncedAt } = action.payload;
      if (carts) state.carts = carts;
      if (activeCartId !== undefined) state.activeCartId = activeCartId;
      if (lastSyncedAt) state.lastSyncedAt = lastSyncedAt;
      state.isHydrated = true;
    },
    syncCartsFromBackend: (
      state,
      action: PayloadAction<{
        carts: Array<{
          id: string; name: string; status: CartStatus; createdAt: string; updatedAt: string;
          paidAt?: string; paidAmount?: number;
          items: Array<{
            itemId: string; quantity: number; priceSnapshot?: number; addedAt: string;
            item?: { id: string; categoryId: string; category?: { id: string; slug: string; name: string; nameTe?: string; icon: string } | null; name: string; nameTe?: string; unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml'; defaultQuantity: number; price?: number };
          }>;
        }>;
        replaceAll?: boolean;
      }>
    ) => {
      const { carts: backendCarts, replaceAll = false } = action.payload;
      const convertedCarts: ManagedCart[] = backendCarts.map((bc) => ({
        id: bc.id, name: bc.name,
        // Status normalization: paidAt is load-bearing proof of payment. If the
        // backend says draft but has a paidAt timestamp, the payment-sync PUT
        // was never persisted (common failure when backendId was missing at
        // mark-paid time). Trust paidAt.
        status: (bc.paidAt && bc.status !== 'paid' && bc.status !== 'completed') ? 'paid' : bc.status,
        createdAt: bc.createdAt, updatedAt: bc.updatedAt,
        paidAt: bc.paidAt, paidAmount: bc.paidAmount,
        items: bc.items.filter((i) => i.item).map((i) => ({
          item: { id: i.item!.id, categoryId: i.item!.category?.slug || i.item!.categoryId, name: i.item!.name, nameTe: i.item!.nameTe, unit: i.item!.unit, defaultQuantity: i.item!.defaultQuantity, price: i.item!.price },
          quantity: i.quantity, addedAt: i.addedAt, priceSnapshot: i.priceSnapshot,
        })),
      })).filter((c) => !(state.deletedCartIds ?? []).includes(c.id));

      if (replaceAll) {
        const mergedCarts = convertedCarts.map((bc) => {
          const lc = state.carts.find((c) => c.id === bc.id || c.backendId === bc.id);
          if (lc) {
            const preservedCreatedAt = lc.createdAt && bc.createdAt ? (new Date(lc.createdAt) < new Date(bc.createdAt) ? lc.createdAt : bc.createdAt) : bc.createdAt;
            if (lc.status === 'paid' || lc.status === 'completed' || lc.paidAt) {
              // Normalize: if we entered this branch via lc.paidAt (not lc.status), the
              // local status may be stale ('draft'). paidAt is authoritative → force 'paid'.
              const resolvedStatus: CartStatus = (lc.status === 'paid' || lc.status === 'completed') ? lc.status : 'paid';
              return { ...bc, createdAt: preservedCreatedAt, status: resolvedStatus, paidAt: lc.paidAt ?? bc.paidAt, paidAmount: lc.paidAmount ?? bc.paidAmount, paidItemCount: lc.paidItemCount ?? bc.paidItemCount, paymentInfo: lc.paymentInfo ?? bc.paymentInfo, items: lc.items.length > bc.items.length ? lc.items : bc.items };
            }
            return { ...bc, createdAt: preservedCreatedAt };
          }
          return bc;
        });
        const backendCartIds = new Set(convertedCarts.map((c) => c.id));
        const localOnlyCarts = state.carts.filter((lc) => !backendCartIds.has(lc.id) && !(lc.backendId && backendCartIds.has(lc.backendId)));
        const finalCarts = [...mergedCarts, ...localOnlyCarts];
        state.carts = finalCarts;
        if (state.activeCartId && !finalCarts.find((c) => c.id === state.activeCartId)) {
          state.activeCartId = finalCarts.length > 0 ? finalCarts[0].id : null;
        }
      } else {
        const existingIds = new Set(state.carts.map((c) => c.id));
        state.carts = state.carts.map((cart) => {
          const bc = convertedCarts.find((c) => c.id === cart.id);
          if (bc) {
            const preservedCreatedAt = cart.createdAt && bc.createdAt ? (new Date(cart.createdAt) < new Date(bc.createdAt) ? cart.createdAt : bc.createdAt) : bc.createdAt;
            if (cart.status === 'paid' || cart.status === 'completed' || cart.paidAt) {
              const resolvedStatus: CartStatus = (cart.status === 'paid' || cart.status === 'completed') ? cart.status : 'paid';
              return { ...bc, createdAt: preservedCreatedAt, status: resolvedStatus, paidAt: cart.paidAt ?? bc.paidAt, paidAmount: cart.paidAmount ?? bc.paidAmount, paidItemCount: cart.paidItemCount ?? bc.paidItemCount, paymentInfo: cart.paymentInfo ?? bc.paymentInfo, items: cart.items.length > bc.items.length ? cart.items : bc.items };
            }
            return { ...bc, createdAt: preservedCreatedAt };
          }
          const matchByBackendId = convertedCarts.find((c) => c.id === cart.backendId);
          if (matchByBackendId) {
            const preservedCreatedAt = cart.createdAt && matchByBackendId.createdAt ? (new Date(cart.createdAt) < new Date(matchByBackendId.createdAt) ? cart.createdAt : matchByBackendId.createdAt) : matchByBackendId.createdAt;
            if (cart.status === 'paid' || cart.status === 'completed' || cart.paidAt) {
              const resolvedStatus: CartStatus = (cart.status === 'paid' || cart.status === 'completed') ? cart.status : 'paid';
              return { ...matchByBackendId, id: cart.id, backendId: cart.backendId, createdAt: preservedCreatedAt, status: resolvedStatus, paidAt: cart.paidAt ?? matchByBackendId.paidAt, paidAmount: cart.paidAmount ?? matchByBackendId.paidAmount, paidItemCount: cart.paidItemCount ?? matchByBackendId.paidItemCount, paymentInfo: cart.paymentInfo ?? matchByBackendId.paymentInfo, items: cart.items.length > matchByBackendId.items.length ? cart.items : matchByBackendId.items };
            }
            return { ...matchByBackendId, id: cart.id, backendId: cart.backendId, createdAt: preservedCreatedAt };
          }
          return cart;
        });
        const allLocalBackendIds = new Set(state.carts.map((c) => c.backendId).filter(Boolean));
        const newCarts = convertedCarts.filter((c) => !existingIds.has(c.id) && !allLocalBackendIds.has(c.id));
        state.carts.push(...newCarts);
      }
      state.lastSyncedAt = new Date().toISOString();
      state.isHydrated = true;
    },
    updateCartBackendId: (state, action: PayloadAction<{ localId: string; backendId: string }>) => {
      const cart = state.carts.find((c) => c.id === action.payload.localId);
      if (cart) { cart.backendId = action.payload.backendId; cart.updatedAt = new Date().toISOString(); }
    },
    resetMultiCart: () => initialState,
    clearMultiCartInMemory: () => initialState,
    clearDeletedCartId: (state, action: PayloadAction<string>) => {
      state.deletedCartIds = (state.deletedCartIds ?? []).filter((id) => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  createCart, deleteCart, renameCart, setActiveCart,
  addItemToActiveCart, removeItemFromActiveCart, removeItemFromCart,
  updateItemQuantityInActiveCart, incrementItemInActiveCart, decrementItemInActiveCart,
  clearActiveCart, setActiveCartStatus, refreshActiveCartPrices,
  markActiveCartAsPaid, markCartAsPaid,
  hydrateMultiCart, syncCartsFromBackend, updateCartBackendId,
  resetMultiCart, clearMultiCartInMemory, clearDeletedCartId,
} = multiCartSlice.actions;

// Selectors
interface RootState { multiCart: MultiCartState }

export const selectAllCarts = (state: RootState) => state.multiCart.carts;
export const selectActiveCartId = (state: RootState) => state.multiCart.activeCartId;
export const selectActiveCart = (state: RootState): ManagedCart | null => {
  const { carts, activeCartId } = state.multiCart;
  return carts.find((cart) => cart.id === activeCartId) || null;
};

const EMPTY_ITEMS: CartItemState[] = [];
export const selectActiveCartItems = createSelector([selectActiveCart], (activeCart): CartItemState[] => activeCart?.items || EMPTY_ITEMS);
export const selectActiveCartItemCount = (state: RootState): number => selectActiveCartItems(state).length;
export const selectActiveCartCategoryCount = (state: RootState): number => { const items = selectActiveCartItems(state); return new Set(items.map(i => i.item.categoryId)).size; };
export const selectActiveCartTotalQuantity = (state: RootState): number => selectActiveCartItems(state).reduce((t, i) => t + i.quantity, 0);
export const selectCartCount = (state: RootState): number => state.multiCart.carts.length;
export const selectIsMultiCartHydrated = (state: RootState): boolean => state.multiCart.isHydrated;

export const selectActiveCartGrandTotal = (state: RootState): number => {
  return selectActiveCartItems(state).reduce((total, item) => {
    if (item.priceSnapshot && item.priceSnapshot > 0) return total + item.priceSnapshot * item.quantity;
    return total;
  }, 0);
};

export const selectActiveCartHasPrices = (state: RootState): boolean =>
  selectActiveCartItems(state).some((item) => item.priceSnapshot !== undefined && item.priceSnapshot > 0);

export const selectTodaysCarts = (state: RootState): ManagedCart[] => {
  const today = new Date().toDateString();
  return state.multiCart.carts.filter((cart) => new Date(cart.createdAt).toDateString() === today);
};

export const selectYesterdaysCarts = (state: RootState): ManagedCart[] => {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return state.multiCart.carts.filter((cart) => new Date(cart.createdAt).toDateString() === yesterday.toDateString());
};

export const selectCartsByDateRange = (state: RootState, startDate: string, endDate: string): ManagedCart[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return state.multiCart.carts.filter((cart) => { const t = new Date(cart.createdAt).getTime(); return t >= start && t <= end; });
};

export const selectCartsSortedByDate = createSelector([selectAllCarts], (carts): ManagedCart[] =>
  [...carts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
);

export const selectCartsByStatus = createSelector([selectAllCarts], (carts) => ({
  draft: carts.filter((c) => c.status === 'draft').length,
  printed: carts.filter((c) => c.status === 'printed').length,
  paid: carts.filter((c) => c.status === 'paid').length,
  completed: carts.filter((c) => c.status === 'completed').length,
}));

export const selectTodaysMetrics = createSelector([selectTodaysCarts], (todaysCarts) => {
  const uniqueItems = new Set<string>();
  todaysCarts.forEach((cart) => cart.items.forEach((item) => uniqueItems.add(item.item.id)));
  const totalQuantity = todaysCarts.reduce((sum, cart) => sum + cart.items.reduce((q, item) => q + item.quantity, 0), 0);
  const totalSales = todaysCarts.filter((c) => ['completed', 'printed', 'paid'].includes(c.status))
    .reduce((sum, cart) => sum + cart.items.reduce((s, item) => s + (item.priceSnapshot || 0) * item.quantity, 0), 0);
  return { cartsCreated: todaysCarts.length, itemsPicked: uniqueItems.size, totalQuantity, totalSales };
});

export const selectRecentCarts = (state: RootState, limit = 5): ManagedCart[] =>
  [...state.multiCart.carts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);

export const selectMostRecentDraftCart = (state: RootState): ManagedCart | null => {
  const draftCarts = state.multiCart.carts.filter((c) => c.status === 'draft');
  if (draftCarts.length === 0) return null;
  return draftCarts.reduce((latest, cart) => new Date(cart.updatedAt).getTime() > new Date(latest.updatedAt).getTime() ? cart : latest);
};

export const selectActiveCartIsPaid = (state: RootState): boolean => selectActiveCart(state)?.status === 'paid';
export const selectActiveCartPaymentInfo = (state: RootState): PaymentInfo | null => selectActiveCart(state)?.paymentInfo || null;
export const selectCanMarkPayment = (state: RootState): boolean => {
  const ac = selectActiveCart(state);
  if (!ac || ac.status === 'paid' || ac.items.length === 0) return false;
  return selectActiveCartGrandTotal(state) > 0;
};
export const selectTodaysPaidAmount = (state: RootState): number =>
  selectTodaysCarts(state).filter((c) => c.status === 'paid').reduce((sum, cart) => sum + (cart.paidAmount || 0), 0);
export const selectPendingPaymentsCount = (state: RootState): number =>
  selectTodaysCarts(state).filter((c) => c.status !== 'paid' && c.items.length > 0).length;

export type { MultiCartState };
export default multiCartSlice.reducer;
