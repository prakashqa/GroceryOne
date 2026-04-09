/**
 * Cart Operations Slice (shared)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ItemOperation = 'adding' | 'removing' | 'updating';
export type CartOperation = 'creating' | 'deleting' | 'syncing';

export interface CartOperationsState {
  pendingItems: Record<string, ItemOperation>;
  pendingCarts: Record<string, CartOperation>;
  errors: Array<{ id: string; message: string; timestamp: string }>;
  syncStatus: 'idle' | 'syncing' | 'error';
}

const initialState: CartOperationsState = {
  pendingItems: {},
  pendingCarts: {},
  errors: [],
  syncStatus: 'idle',
};

const hasPending = (state: CartOperationsState): boolean =>
  Object.keys(state.pendingItems).length > 0 || Object.keys(state.pendingCarts).length > 0;

const cartOperationsSlice = createSlice({
  name: 'cartOperations',
  initialState,
  reducers: {
    operationStarted: (state, action: PayloadAction<{ type: 'item' | 'cart'; id: string; operation: ItemOperation | CartOperation }>) => {
      const { type, id, operation } = action.payload;
      if (type === 'item') state.pendingItems[id] = operation as ItemOperation;
      else state.pendingCarts[id] = operation as CartOperation;
      state.syncStatus = 'syncing';
    },
    operationCompleted: (state, action: PayloadAction<{ type: 'item' | 'cart'; id: string }>) => {
      const { type, id } = action.payload;
      if (type === 'item') delete state.pendingItems[id];
      else delete state.pendingCarts[id];
      if (!hasPending(state)) state.syncStatus = 'idle';
    },
    operationFailed: (state, action: PayloadAction<{ type: 'item' | 'cart'; id: string; error: string }>) => {
      const { type, id, error } = action.payload;
      if (type === 'item') delete state.pendingItems[id];
      else delete state.pendingCarts[id];
      state.errors.push({ id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, message: error, timestamp: new Date().toISOString() });
      if (state.errors.length > 10) state.errors = state.errors.slice(-10);
      state.syncStatus = 'error';
    },
    clearError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((e) => e.id !== action.payload);
      if (state.errors.length === 0 && !hasPending(state)) state.syncStatus = 'idle';
    },
    clearAllErrors: (state) => {
      state.errors = [];
      if (!hasPending(state)) state.syncStatus = 'idle';
    },
    resetCartOperations: () => initialState,
  },
});

export const { operationStarted, operationCompleted, operationFailed, clearError, clearAllErrors, resetCartOperations } = cartOperationsSlice.actions;

interface RootState { cartOperations: CartOperationsState }
export const selectIsItemPending = (state: RootState, itemId: string): boolean => !!state.cartOperations.pendingItems[itemId];
export const selectItemOperation = (state: RootState, itemId: string): ItemOperation | undefined => state.cartOperations.pendingItems[itemId];
export const selectIsCartPending = (state: RootState, cartId: string): boolean => !!state.cartOperations.pendingCarts[cartId];
export const selectSyncStatus = (state: RootState) => state.cartOperations.syncStatus;
export const selectHasPendingOperations = (state: RootState): boolean =>
  Object.keys(state.cartOperations.pendingItems).length > 0 || Object.keys(state.cartOperations.pendingCarts).length > 0;
export const selectErrors = (state: RootState) => state.cartOperations.errors;

export default cartOperationsSlice.reducer;
