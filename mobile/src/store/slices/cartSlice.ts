/**
 * Cart Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Cart, CartItem } from '@groceryone/shared';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.error = null;
    },

    addItem: (state, action: PayloadAction<CartItem>) => {
      if (state.cart) {
        const existingIndex = state.cart.items.findIndex(
          (item) =>
            item.productId === action.payload.productId &&
            item.variantId === action.payload.variantId
        );

        if (existingIndex >= 0) {
          state.cart.items[existingIndex].quantity += action.payload.quantity;
        } else {
          state.cart.items.push(action.payload);
        }

        // Recalculate totals
        state.cart.totalItems = state.cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.cart.subtotal = state.cart.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      }
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      if (state.cart) {
        const item = state.cart.items.find((i) => i.id === action.payload.itemId);
        if (item) {
          item.quantity = action.payload.quantity;

          // Recalculate totals
          state.cart.totalItems = state.cart.items.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          state.cart.subtotal = state.cart.items.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity,
            0
          );
        }
      }
    },

    removeItem: (state, action: PayloadAction<string>) => {
      if (state.cart) {
        state.cart.items = state.cart.items.filter(
          (item) => item.id !== action.payload
        );

        // Recalculate totals
        state.cart.totalItems = state.cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.cart.subtotal = state.cart.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      }
    },

    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; discount: number }>
    ) => {
      if (state.cart) {
        state.cart.couponCode = action.payload.code;
        state.cart.discountAmount = action.payload.discount;
      }
    },

    removeCoupon: (state) => {
      if (state.cart) {
        state.cart.couponCode = undefined;
        state.cart.discountAmount = 0;
      }
    },

    clearCart: (state) => {
      state.cart = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCart,
  addItem,
  updateItemQuantity,
  removeItem,
  applyCoupon,
  removeCoupon,
  clearCart,
  setLoading,
  setError,
} = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartItems = (state: { cart: CartState }) =>
  state.cart.cart?.items ?? [];
export const selectCartTotalItems = (state: { cart: CartState }) =>
  state.cart.cart?.totalItems ?? 0;
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.cart?.subtotal ?? 0;
export const selectCartDiscount = (state: { cart: CartState }) =>
  state.cart.cart?.discountAmount ?? 0;
export const selectCartLoading = (state: { cart: CartState }) =>
  state.cart.isLoading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
