/**
 * Cart Operations Slice
 * Tracks the lifecycle of async cart operations (backend sync).
 * Used to show loading spinners, disable buttons during sync,
 * and display error states in the UI.
 *
 * Architecture:
 * - multiCartSlice handles synchronous (optimistic) state updates
 * - multiCartPersistMiddleware handles async backend sync
 * - THIS slice tracks the async operation lifecycle:
 *   operationStarted → API call → operationCompleted | operationFailed
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ItemOperation = 'adding' | 'removing' | 'updating';
export type CartOperation = 'creating' | 'deleting' | 'syncing';

export interface CartOperationsState {
  /** Items currently being synced to backend: itemId → operation type */
  pendingItems: Record<string, ItemOperation>;
  /** Carts currently being synced to backend: cartId → operation type */
  pendingCarts: Record<string, CartOperation>;
  /** Recent errors from failed operations (max 10) */
  errors: Array<{ id: string; message: string; timestamp: string }>;
  /** Overall sync status */
  syncStatus: 'idle' | 'syncing' | 'error';
}

const initialState: CartOperationsState = {
  pendingItems: {},
  pendingCarts: {},
  errors: [],
  syncStatus: 'idle',
};

/**
 * Check if there are any pending operations
 */
const hasPending = (state: CartOperationsState): boolean =>
  Object.keys(state.pendingItems).length > 0 ||
  Object.keys(state.pendingCarts).length > 0;

const cartOperationsSlice = createSlice({
  name: 'cartOperations',
  initialState,
  reducers: {
    /**
     * Mark an operation as started (dispatched by middleware before API call)
     */
    operationStarted: (
      state,
      action: PayloadAction<{
        type: 'item' | 'cart';
        id: string;
        operation: ItemOperation | CartOperation;
      }>
    ) => {
      const { type, id, operation } = action.payload;
      if (type === 'item') {
        state.pendingItems[id] = operation as ItemOperation;
      } else {
        state.pendingCarts[id] = operation as CartOperation;
      }
      state.syncStatus = 'syncing';
    },

    /**
     * Mark an operation as completed (dispatched by middleware after API success)
     */
    operationCompleted: (
      state,
      action: PayloadAction<{
        type: 'item' | 'cart';
        id: string;
      }>
    ) => {
      const { type, id } = action.payload;
      if (type === 'item') {
        delete state.pendingItems[id];
      } else {
        delete state.pendingCarts[id];
      }
      // Reset to idle only if no more pending operations
      if (!hasPending(state)) {
        state.syncStatus = 'idle';
      }
    },

    /**
     * Mark an operation as failed (dispatched by middleware after API failure)
     */
    operationFailed: (
      state,
      action: PayloadAction<{
        type: 'item' | 'cart';
        id: string;
        error: string;
      }>
    ) => {
      const { type, id, error } = action.payload;
      if (type === 'item') {
        delete state.pendingItems[id];
      } else {
        delete state.pendingCarts[id];
      }
      state.errors.push({
        id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        message: error,
        timestamp: new Date().toISOString(),
      });
      // Keep max 10 errors
      if (state.errors.length > 10) {
        state.errors = state.errors.slice(-10);
      }
      state.syncStatus = 'error';
    },

    /**
     * Clear a specific error by id
     */
    clearError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((e) => e.id !== action.payload);
      if (state.errors.length === 0 && !hasPending(state)) {
        state.syncStatus = 'idle';
      }
    },

    /**
     * Clear all errors
     */
    clearAllErrors: (state) => {
      state.errors = [];
      if (!hasPending(state)) {
        state.syncStatus = 'idle';
      }
    },

    /**
     * Reset entire slice (used during tenant switch or logout)
     */
    resetCartOperations: () => initialState,
  },
});

export const {
  operationStarted,
  operationCompleted,
  operationFailed,
  clearError,
  clearAllErrors,
  resetCartOperations,
} = cartOperationsSlice.actions;

// Selectors
interface RootState {
  cartOperations: CartOperationsState;
}

/** Check if a specific item has a pending operation */
export const selectIsItemPending = (state: RootState, itemId: string): boolean =>
  !!state.cartOperations.pendingItems[itemId];

/** Get the operation type for a specific item */
export const selectItemOperation = (
  state: RootState,
  itemId: string
): ItemOperation | undefined => state.cartOperations.pendingItems[itemId];

/** Check if a specific cart has a pending operation */
export const selectIsCartPending = (state: RootState, cartId: string): boolean =>
  !!state.cartOperations.pendingCarts[cartId];

/** Get the overall sync status */
export const selectSyncStatus = (state: RootState) =>
  state.cartOperations.syncStatus;

/** Check if any operations are pending */
export const selectHasPendingOperations = (state: RootState): boolean =>
  Object.keys(state.cartOperations.pendingItems).length > 0 ||
  Object.keys(state.cartOperations.pendingCarts).length > 0;

/** Get all errors */
export const selectErrors = (state: RootState) =>
  state.cartOperations.errors;

export default cartOperationsSlice.reducer;
