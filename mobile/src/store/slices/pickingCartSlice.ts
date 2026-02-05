/**
 * Picking Cart Slice
 * Redux slice for managing the picking cart state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../../domain/types/picking';

export interface CartItemState {
  item: Item;
  quantity: number;
  addedAt: string;
}

export interface PickingCartState {
  items: CartItemState[];
  createdAt: string | null;
  status: 'draft' | 'printed' | 'completed';
}

const initialState: PickingCartState = {
  items: [],
  createdAt: null,
  status: 'draft',
};

const pickingCartSlice = createSlice({
  name: 'pickingCart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{ item: Item; quantity: number }>
    ) => {
      const { item, quantity } = action.payload;
      const existingIndex = state.items.findIndex(
        (cartItem) => cartItem.item.id === item.id
      );

      if (existingIndex >= 0) {
        // Item exists, increase quantity
        state.items[existingIndex].quantity += quantity;
      } else {
        // New item, add to cart
        state.items.push({
          item,
          quantity,
          addedAt: new Date().toISOString(),
        });
      }

      // Set createdAt on first item addition
      if (!state.createdAt) {
        state.createdAt = new Date().toISOString();
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter(
        (cartItem) => cartItem.item.id !== itemId
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        state.items = state.items.filter(
          (cartItem) => cartItem.item.id !== itemId
        );
      } else {
        const existingIndex = state.items.findIndex(
          (cartItem) => cartItem.item.id === itemId
        );
        if (existingIndex >= 0) {
          state.items[existingIndex].quantity = quantity;
        }
      }
    },

    incrementQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingIndex = state.items.findIndex(
        (cartItem) => cartItem.item.id === itemId
      );
      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += 1;
      }
    },

    decrementQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingIndex = state.items.findIndex(
        (cartItem) => cartItem.item.id === itemId
      );
      if (existingIndex >= 0) {
        const cartItem = state.items[existingIndex];
        const defaultQty = cartItem.item.defaultQuantity;

        // If quantity is less than or equal to default, remove the item
        if (cartItem.quantity <= defaultQty) {
          state.items = state.items.filter(
            (ci) => ci.item.id !== itemId
          );
        } else {
          // Subtract the default quantity
          state.items[existingIndex].quantity -= defaultQty;
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.createdAt = null;
      state.status = 'draft';
    },

    setCartStatus: (
      state,
      action: PayloadAction<'draft' | 'printed' | 'completed'>
    ) => {
      state.status = action.payload;
    },
  },
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  setCartStatus,
} = pickingCartSlice.actions;

// Selectors
interface RootState {
  pickingCart: PickingCartState;
}

export const selectCartItems = (state: RootState) => state.pickingCart.items;

export const selectCartTotalItems = (state: RootState) =>
  state.pickingCart.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartItemCount = (state: RootState) =>
  state.pickingCart.items.length;

export const selectCartCreatedAt = (state: RootState) =>
  state.pickingCart.createdAt;

export const selectCartStatus = (state: RootState) => state.pickingCart.status;

// Export reducer
export default pickingCartSlice.reducer;
