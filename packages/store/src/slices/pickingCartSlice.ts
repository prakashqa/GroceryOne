/**
 * Picking Cart Slice (shared)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../types/picking';

export interface PickingCartItemState {
  item: Item;
  quantity: number;
  addedAt: string;
}

export interface PickingCartState {
  items: PickingCartItemState[];
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
    addToCart: (state, action: PayloadAction<{ item: Item; quantity: number }>) => {
      const { item, quantity } = action.payload;
      const existingIndex = state.items.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({ item, quantity, addedAt: new Date().toISOString() });
      }
      if (!state.createdAt) state.createdAt = new Date().toISOString();
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((ci) => ci.item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((ci) => ci.item.id !== itemId);
      } else {
        const idx = state.items.findIndex((ci) => ci.item.id === itemId);
        if (idx >= 0) state.items[idx].quantity = quantity;
      }
    },
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((ci) => ci.item.id === action.payload);
      if (idx >= 0) state.items[idx].quantity += 1;
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((ci) => ci.item.id === action.payload);
      if (idx >= 0) {
        const ci = state.items[idx];
        if (ci.quantity <= ci.item.defaultQuantity) {
          state.items = state.items.filter((item) => item.item.id !== action.payload);
        } else {
          state.items[idx].quantity -= ci.item.defaultQuantity;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.createdAt = null;
      state.status = 'draft';
    },
    setCartStatus: (state, action: PayloadAction<'draft' | 'printed' | 'completed'>) => {
      state.status = action.payload;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, incrementQuantity, decrementQuantity, clearCart, setCartStatus } = pickingCartSlice.actions;

interface RootState { pickingCart: PickingCartState }
export const selectPickingCartItems = (state: RootState) => state.pickingCart.items;
export const selectPickingCartTotalItems = (state: RootState) => state.pickingCart.items.reduce((t, i) => t + i.quantity, 0);
export const selectPickingCartItemCount = (state: RootState) => state.pickingCart.items.length;
export const selectPickingCartCreatedAt = (state: RootState) => state.pickingCart.createdAt;
export const selectPickingCartStatus = (state: RootState) => state.pickingCart.status;

export default pickingCartSlice.reducer;
