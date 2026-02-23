/**
 * Cart Operations Slice Tests
 * TDD tests for tracking cart operation lifecycle (loading spinners, sync status)
 */

import { configureStore } from '@reduxjs/toolkit';
import cartOperationsReducer, {
  operationStarted,
  operationCompleted,
  operationFailed,
  clearError,
  clearAllErrors,
  resetCartOperations,
  selectIsItemPending,
  selectItemOperation,
  selectIsCartPending,
  selectSyncStatus,
  selectHasPendingOperations,
  selectErrors,
  CartOperationsState,
} from '../cartOperationsSlice';

const initialState: CartOperationsState = {
  pendingItems: {},
  pendingCarts: {},
  errors: [],
  syncStatus: 'idle',
};

describe('cartOperationsSlice', () => {
  describe('operationStarted', () => {
    it('should track item adding operation', () => {
      const state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'item', id: 'item-1', operation: 'adding' })
      );
      expect(state.pendingItems['item-1']).toBe('adding');
      expect(state.syncStatus).toBe('syncing');
    });

    it('should track item removing operation', () => {
      const state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'item', id: 'item-2', operation: 'removing' })
      );
      expect(state.pendingItems['item-2']).toBe('removing');
      expect(state.syncStatus).toBe('syncing');
    });

    it('should track item updating operation', () => {
      const state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'item', id: 'item-3', operation: 'updating' })
      );
      expect(state.pendingItems['item-3']).toBe('updating');
    });

    it('should track cart creating operation', () => {
      const state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'cart', id: 'cart-1', operation: 'creating' })
      );
      expect(state.pendingCarts['cart-1']).toBe('creating');
      expect(state.syncStatus).toBe('syncing');
    });

    it('should track cart deleting operation', () => {
      const state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'cart', id: 'cart-2', operation: 'deleting' })
      );
      expect(state.pendingCarts['cart-2']).toBe('deleting');
    });

    it('should track multiple concurrent operations', () => {
      let state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'item', id: 'item-1', operation: 'adding' })
      );
      state = cartOperationsReducer(
        state,
        operationStarted({ type: 'item', id: 'item-2', operation: 'removing' })
      );
      state = cartOperationsReducer(
        state,
        operationStarted({ type: 'cart', id: 'cart-1', operation: 'creating' })
      );

      expect(state.pendingItems['item-1']).toBe('adding');
      expect(state.pendingItems['item-2']).toBe('removing');
      expect(state.pendingCarts['cart-1']).toBe('creating');
      expect(state.syncStatus).toBe('syncing');
    });

    it('should overwrite previous operation for same item', () => {
      let state = cartOperationsReducer(
        initialState,
        operationStarted({ type: 'item', id: 'item-1', operation: 'adding' })
      );
      state = cartOperationsReducer(
        state,
        operationStarted({ type: 'item', id: 'item-1', operation: 'updating' })
      );

      expect(state.pendingItems['item-1']).toBe('updating');
    });
  });

  describe('operationCompleted', () => {
    it('should clear item pending state', () => {
      const stateWithPending: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithPending,
        operationCompleted({ type: 'item', id: 'item-1' })
      );
      expect(state.pendingItems['item-1']).toBeUndefined();
      expect(state.syncStatus).toBe('idle');
    });

    it('should clear cart pending state', () => {
      const stateWithPending: CartOperationsState = {
        ...initialState,
        pendingCarts: { 'cart-1': 'creating' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithPending,
        operationCompleted({ type: 'cart', id: 'cart-1' })
      );
      expect(state.pendingCarts['cart-1']).toBeUndefined();
      expect(state.syncStatus).toBe('idle');
    });

    it('should remain syncing if other operations are pending', () => {
      const stateWithMultiple: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding', 'item-2': 'removing' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithMultiple,
        operationCompleted({ type: 'item', id: 'item-1' })
      );
      expect(state.pendingItems['item-1']).toBeUndefined();
      expect(state.pendingItems['item-2']).toBe('removing');
      expect(state.syncStatus).toBe('syncing');
    });

    it('should remain syncing if cart operations are still pending', () => {
      const stateWithMixed: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
        pendingCarts: { 'cart-1': 'creating' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithMixed,
        operationCompleted({ type: 'item', id: 'item-1' })
      );
      expect(state.syncStatus).toBe('syncing');
    });

    it('should handle completing non-existent operation gracefully', () => {
      const state = cartOperationsReducer(
        initialState,
        operationCompleted({ type: 'item', id: 'non-existent' })
      );
      expect(state.syncStatus).toBe('idle');
    });
  });

  describe('operationFailed', () => {
    it('should clear pending state and add error', () => {
      const stateWithPending: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithPending,
        operationFailed({ type: 'item', id: 'item-1', error: 'Network error' })
      );
      expect(state.pendingItems['item-1']).toBeUndefined();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0].message).toBe('Network error');
      expect(state.errors[0].id).toBeTruthy();
      expect(state.errors[0].timestamp).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should clear cart pending state on failure', () => {
      const stateWithPending: CartOperationsState = {
        ...initialState,
        pendingCarts: { 'cart-1': 'creating' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithPending,
        operationFailed({ type: 'cart', id: 'cart-1', error: 'Server error' })
      );
      expect(state.pendingCarts['cart-1']).toBeUndefined();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0].message).toBe('Server error');
    });

    it('should keep max 10 errors', () => {
      let state: CartOperationsState = {
        ...initialState,
        errors: Array.from({ length: 10 }, (_, i) => ({
          id: `error-${i}`,
          message: `Error ${i}`,
          timestamp: new Date().toISOString(),
        })),
      };

      state = cartOperationsReducer(
        state,
        operationFailed({ type: 'item', id: 'item-x', error: 'Error 11' })
      );

      expect(state.errors).toHaveLength(10);
      expect(state.errors[state.errors.length - 1].message).toBe('Error 11');
    });

    it('should set syncStatus to error even if other operations are pending', () => {
      const stateWithMultiple: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding', 'item-2': 'removing' },
        syncStatus: 'syncing',
      };
      const state = cartOperationsReducer(
        stateWithMultiple,
        operationFailed({ type: 'item', id: 'item-1', error: 'Failed' })
      );
      expect(state.syncStatus).toBe('error');
    });
  });

  describe('clearError', () => {
    it('should remove specific error by id', () => {
      const stateWithErrors: CartOperationsState = {
        ...initialState,
        errors: [
          { id: 'err-1', message: 'Error 1', timestamp: '2026-01-01T00:00:00Z' },
          { id: 'err-2', message: 'Error 2', timestamp: '2026-01-01T00:01:00Z' },
        ],
        syncStatus: 'error',
      };

      const state = cartOperationsReducer(
        stateWithErrors,
        clearError('err-1')
      );

      expect(state.errors).toHaveLength(1);
      expect(state.errors[0].id).toBe('err-2');
    });

    it('should reset syncStatus to idle when all errors are cleared and no pending ops', () => {
      const stateWithOneError: CartOperationsState = {
        ...initialState,
        errors: [
          { id: 'err-1', message: 'Error 1', timestamp: '2026-01-01T00:00:00Z' },
        ],
        syncStatus: 'error',
      };

      const state = cartOperationsReducer(
        stateWithOneError,
        clearError('err-1')
      );

      expect(state.errors).toHaveLength(0);
      expect(state.syncStatus).toBe('idle');
    });

    it('should keep syncStatus as error if pending operations exist', () => {
      const stateWithPendingAndError: CartOperationsState = {
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
        errors: [
          { id: 'err-1', message: 'Error 1', timestamp: '2026-01-01T00:00:00Z' },
        ],
        syncStatus: 'error',
      };

      const state = cartOperationsReducer(
        stateWithPendingAndError,
        clearError('err-1')
      );

      // Errors cleared but pending operations still exist — stay syncing (not idle)
      expect(state.errors).toHaveLength(0);
      // syncStatus should not be idle because there are pending operations
      expect(state.syncStatus).not.toBe('idle');
    });
  });

  describe('clearAllErrors', () => {
    it('should remove all errors', () => {
      const stateWithErrors: CartOperationsState = {
        ...initialState,
        errors: [
          { id: 'err-1', message: 'Error 1', timestamp: '2026-01-01T00:00:00Z' },
          { id: 'err-2', message: 'Error 2', timestamp: '2026-01-01T00:01:00Z' },
        ],
        syncStatus: 'error',
      };

      const state = cartOperationsReducer(stateWithErrors, clearAllErrors());

      expect(state.errors).toHaveLength(0);
      expect(state.syncStatus).toBe('idle');
    });
  });

  describe('resetCartOperations', () => {
    it('should reset all state to initial', () => {
      const dirtyState: CartOperationsState = {
        pendingItems: { 'item-1': 'adding' },
        pendingCarts: { 'cart-1': 'creating' },
        errors: [{ id: 'err-1', message: 'Error', timestamp: '2026-01-01T00:00:00Z' }],
        syncStatus: 'syncing',
      };

      const state = cartOperationsReducer(dirtyState, resetCartOperations());

      expect(state).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const createState = (cartOps: CartOperationsState) => ({
      cartOperations: cartOps,
    });

    it('selectIsItemPending should return true for pending items', () => {
      const state = createState({
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
      });
      expect(selectIsItemPending(state, 'item-1')).toBe(true);
      expect(selectIsItemPending(state, 'item-2')).toBe(false);
    });

    it('selectItemOperation should return the operation type', () => {
      const state = createState({
        ...initialState,
        pendingItems: { 'item-1': 'removing' },
      });
      expect(selectItemOperation(state, 'item-1')).toBe('removing');
      expect(selectItemOperation(state, 'item-2')).toBeUndefined();
    });

    it('selectIsCartPending should return true for pending carts', () => {
      const state = createState({
        ...initialState,
        pendingCarts: { 'cart-1': 'creating' },
      });
      expect(selectIsCartPending(state, 'cart-1')).toBe(true);
      expect(selectIsCartPending(state, 'cart-2')).toBe(false);
    });

    it('selectSyncStatus should return the sync status', () => {
      expect(selectSyncStatus(createState(initialState))).toBe('idle');
      expect(selectSyncStatus(createState({ ...initialState, syncStatus: 'syncing' }))).toBe('syncing');
      expect(selectSyncStatus(createState({ ...initialState, syncStatus: 'error' }))).toBe('error');
    });

    it('selectHasPendingOperations should check all pending', () => {
      expect(selectHasPendingOperations(createState(initialState))).toBe(false);

      expect(selectHasPendingOperations(createState({
        ...initialState,
        pendingItems: { 'item-1': 'adding' },
      }))).toBe(true);

      expect(selectHasPendingOperations(createState({
        ...initialState,
        pendingCarts: { 'cart-1': 'creating' },
      }))).toBe(true);
    });

    it('selectErrors should return the errors array', () => {
      const errors = [
        { id: 'err-1', message: 'Error 1', timestamp: '2026-01-01T00:00:00Z' },
      ];
      const state = createState({ ...initialState, errors });
      expect(selectErrors(state)).toEqual(errors);
    });
  });

  describe('integration: full lifecycle', () => {
    it('should handle start → complete flow', () => {
      let state = initialState;

      // Start adding item
      state = cartOperationsReducer(state, operationStarted({ type: 'item', id: 'item-1', operation: 'adding' }));
      expect(state.syncStatus).toBe('syncing');
      expect(state.pendingItems['item-1']).toBe('adding');

      // Complete the operation
      state = cartOperationsReducer(state, operationCompleted({ type: 'item', id: 'item-1' }));
      expect(state.syncStatus).toBe('idle');
      expect(state.pendingItems['item-1']).toBeUndefined();
      expect(state.errors).toHaveLength(0);
    });

    it('should handle start → fail → clear error flow', () => {
      let state = initialState;

      // Start adding item
      state = cartOperationsReducer(state, operationStarted({ type: 'item', id: 'item-1', operation: 'adding' }));

      // Operation fails
      state = cartOperationsReducer(state, operationFailed({ type: 'item', id: 'item-1', error: 'Network timeout' }));
      expect(state.syncStatus).toBe('error');
      expect(state.errors).toHaveLength(1);

      // Clear the error
      state = cartOperationsReducer(state, clearError(state.errors[0].id));
      expect(state.syncStatus).toBe('idle');
      expect(state.errors).toHaveLength(0);
    });

    it('should handle multiple operations with mixed outcomes', () => {
      let state = initialState;

      // Start two operations
      state = cartOperationsReducer(state, operationStarted({ type: 'item', id: 'item-1', operation: 'adding' }));
      state = cartOperationsReducer(state, operationStarted({ type: 'item', id: 'item-2', operation: 'removing' }));

      // First succeeds
      state = cartOperationsReducer(state, operationCompleted({ type: 'item', id: 'item-1' }));
      expect(state.syncStatus).toBe('syncing'); // item-2 still pending

      // Second fails
      state = cartOperationsReducer(state, operationFailed({ type: 'item', id: 'item-2', error: 'Failed' }));
      expect(state.syncStatus).toBe('error');
      expect(state.errors).toHaveLength(1);
    });
  });
});
