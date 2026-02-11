/**
 * Multi-Cart Slice Tests
 * TDD tests for multi-cart management functionality
 */

import multiCartReducer, {
  createCart,
  deleteCart,
  renameCart,
  setActiveCart,
  addItemToActiveCart,
  removeItemFromActiveCart,
  updateItemQuantityInActiveCart,
  incrementItemInActiveCart,
  decrementItemInActiveCart,
  clearActiveCart,
  setActiveCartStatus,
  hydrateMultiCart,
  refreshActiveCartPrices,
  resetMultiCart,
  syncCartsFromBackend,
  // Payment actions
  markActiveCartAsPaid,
  markCartAsPaid,
  selectAllCarts,
  selectActiveCartId,
  selectActiveCart,
  selectActiveCartItems,
  selectActiveCartItemCount,
  selectActiveCartTotalQuantity,
  selectCartCount,
  selectIsMultiCartHydrated,
  selectActiveCartGrandTotal,
  selectActiveCartHasPrices,
  selectActiveCartCategoryCount,
  // New dashboard selectors
  selectTodaysCarts,
  selectYesterdaysCarts,
  selectCartsByDateRange,
  selectCartsSortedByDate,
  selectCartsByStatus,
  selectTodaysMetrics,
  selectRecentCarts,
  selectMostRecentDraftCart,
  // Payment selectors
  selectActiveCartIsPaid,
  selectCanMarkPayment,
  selectTodaysPaidAmount,
  selectPendingPaymentsCount,
  selectActiveCartPaymentInfo,
  MultiCartState,
} from '../multiCartSlice';
import { Item } from '../../../domain/types/picking';
import {
  PaymentInfo,
  createCashPaymentInfo,
  createUpiPaymentInfo,
  createCardPaymentInfo,
} from '../../../domain/types/payment';

describe('multiCartSlice', () => {
  const mockItem: Item = {
    id: 'atta-1',
    categoryId: 'atta-rice',
    name: 'Aashirvaad Atta',
    unit: 'kg',
    defaultQuantity: 5,
  };

  const mockItem2: Item = {
    id: 'dal-1',
    categoryId: 'dal-pulses',
    name: 'Toor Dal',
    unit: 'kg',
    defaultQuantity: 1,
  };

  const initialState: MultiCartState = {
    carts: [],
    activeCartId: null,
    isHydrated: false,
    lastSyncedAt: null,
  };

  describe('createCart', () => {
    it('should create a new cart with unique ID', () => {
      const action = createCart({ name: 'Cart 1' });
      const state = multiCartReducer(initialState, action);

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].name).toBe('Cart 1');
      expect(state.carts[0].id).toBeDefined();
      expect(state.carts[0].items).toEqual([]);
      expect(state.carts[0].status).toBe('draft');
    });

    it('should set new cart as active if no active cart exists', () => {
      const action = createCart({ name: 'Cart 1' });
      const state = multiCartReducer(initialState, action);

      expect(state.activeCartId).toBe(state.carts[0].id);
    });

    it('should set new cart as active when created (always)', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'existing-cart',
          name: 'Existing Cart',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'existing-cart',
      };

      const action = createCart({ name: 'New Cart' });
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts).toHaveLength(2);
      expect(state.activeCartId).toBe(state.carts[1].id);
    });

    it('should initialize cart with timestamps', () => {
      const beforeCreate = new Date().toISOString();
      const action = createCart({ name: 'Cart 1' });
      const state = multiCartReducer(initialState, action);
      const afterCreate = new Date().toISOString();

      expect(state.carts[0].createdAt).toBeDefined();
      expect(state.carts[0].updatedAt).toBeDefined();
      expect(state.carts[0].createdAt >= beforeCreate).toBe(true);
      expect(state.carts[0].createdAt <= afterCreate).toBe(true);
    });

    it('should generate unique IDs for each cart', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Cart 1' }));
      state = multiCartReducer(state, createCart({ name: 'Cart 2' }));

      expect(state.carts[0].id).not.toBe(state.carts[1].id);
    });

    it('should create cart without backendId initially', () => {
      const action = createCart({ name: 'Cart 1' });
      const state = multiCartReducer(initialState, action);

      expect(state.carts[0].backendId).toBeUndefined();
    });
  });

  describe('updateCartBackendId', () => {
    it('should set backendId on cart after sync', () => {
      // First create a cart
      let state = multiCartReducer(initialState, createCart({ name: 'Cart 1' }));
      const localId = state.carts[0].id;

      // Import the action
      const { updateCartBackendId } = require('../multiCartSlice');

      // Then update with backend ID
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId, backendId: 'backend-uuid-123' })
      );

      expect(state.carts[0].backendId).toBe('backend-uuid-123');
    });

    it('should update updatedAt timestamp when setting backendId', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Cart 1' }));
      const localId = state.carts[0].id;
      const originalUpdatedAt = state.carts[0].updatedAt;

      const { updateCartBackendId } = require('../multiCartSlice');

      // Small delay to ensure different timestamp
      const beforeUpdate = new Date().toISOString();
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId, backendId: 'backend-uuid-456' })
      );

      expect(state.carts[0].updatedAt >= beforeUpdate).toBe(true);
    });

    it('should not modify state if cart does not exist', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Cart 1' }));
      const { updateCartBackendId } = require('../multiCartSlice');

      state = multiCartReducer(
        state,
        updateCartBackendId({ localId: 'non-existent', backendId: 'backend-uuid-789' })
      );

      expect(state.carts[0].backendId).toBeUndefined();
    });
  });

  describe('deleteCart', () => {
    it('should remove cart from carts array', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = deleteCart('cart-1');
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts).toHaveLength(0);
    });

    it('should set another cart as active if deleted cart was active', () => {
      const stateWithCarts: MultiCartState = {
        ...initialState,
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'cart-1',
      };

      const action = deleteCart('cart-1');
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.activeCartId).toBe('cart-2');
    });

    it('should set activeCartId to null if last cart is deleted', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = deleteCart('cart-1');
      const state = multiCartReducer(stateWithCart, action);

      expect(state.activeCartId).toBeNull();
    });

    it('should not affect other carts when deleting one', () => {
      const stateWithCarts: MultiCartState = {
        ...initialState,
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [{ item: mockItem2, quantity: 2, addedAt: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'cart-2',
      };

      const action = deleteCart('cart-1');
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].id).toBe('cart-2');
      expect(state.carts[0].items).toHaveLength(1);
    });

    it('should not change active cart if deleted cart was not active', () => {
      const stateWithCarts: MultiCartState = {
        ...initialState,
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'cart-2',
      };

      const action = deleteCart('cart-1');
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.activeCartId).toBe('cart-2');
    });
  });

  describe('renameCart', () => {
    it('should update cart name', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = renameCart({ cartId: 'cart-1', name: 'Morning Order' });
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts[0].name).toBe('Morning Order');
    });

    it('should update the updatedAt timestamp when renamed', () => {
      const originalTime = '2024-01-01T00:00:00.000Z';
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: originalTime,
          updatedAt: originalTime,
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = renameCart({ cartId: 'cart-1', name: 'Morning Order' });
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts[0].updatedAt).not.toBe(originalTime);
    });

    it('should not change other cart properties when renamed', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'printed',
        }],
        activeCartId: 'cart-1',
      };

      const action = renameCart({ cartId: 'cart-1', name: 'New Name' });
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts[0].items).toHaveLength(1);
      expect(state.carts[0].status).toBe('printed');
    });
  });

  describe('setActiveCart', () => {
    it('should update activeCartId', () => {
      const stateWithCarts: MultiCartState = {
        ...initialState,
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'cart-1',
      };

      const action = setActiveCart('cart-2');
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.activeCartId).toBe('cart-2');
    });

    it('should not change if cart ID does not exist', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = setActiveCart('non-existent');
      const state = multiCartReducer(stateWithCart, action);

      expect(state.activeCartId).toBe('cart-1');
    });
  });

  describe('addItemToActiveCart', () => {
    const stateWithActiveCart: MultiCartState = {
      ...initialState,
      carts: [{
        id: 'cart-1',
        name: 'Cart 1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      }],
      activeCartId: 'cart-1',
    };

    it('should add new item to active cart', () => {
      const action = addItemToActiveCart({ item: mockItem, quantity: 5 });
      const state = multiCartReducer(stateWithActiveCart, action);

      expect(state.carts[0].items).toHaveLength(1);
      expect(state.carts[0].items[0].item.id).toBe('atta-1');
      expect(state.carts[0].items[0].quantity).toBe(5);
    });

    it('should increase quantity if item exists in active cart', () => {
      const stateWithItem: MultiCartState = {
        ...stateWithActiveCart,
        carts: [{
          ...stateWithActiveCart.carts[0],
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
        }],
      };

      const action = addItemToActiveCart({ item: mockItem, quantity: 3 });
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items).toHaveLength(1);
      expect(state.carts[0].items[0].quantity).toBe(8);
    });

    it('should update cart updatedAt timestamp', () => {
      const originalTime = '2024-01-01T00:00:00.000Z';
      const stateWithOldTimestamp: MultiCartState = {
        ...stateWithActiveCart,
        carts: [{
          ...stateWithActiveCart.carts[0],
          updatedAt: originalTime,
        }],
      };

      const action = addItemToActiveCart({ item: mockItem, quantity: 5 });
      const state = multiCartReducer(stateWithOldTimestamp, action);

      expect(state.carts[0].updatedAt).not.toBe(originalTime);
    });

    it('should do nothing if no active cart', () => {
      const stateNoActive: MultiCartState = {
        ...stateWithActiveCart,
        activeCartId: null,
      };

      const action = addItemToActiveCart({ item: mockItem, quantity: 5 });
      const state = multiCartReducer(stateNoActive, action);

      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should not affect other carts when adding to active cart', () => {
      const stateWithMultipleCarts: MultiCartState = {
        ...initialState,
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'cart-1',
      };

      const action = addItemToActiveCart({ item: mockItem, quantity: 5 });
      const state = multiCartReducer(stateWithMultipleCarts, action);

      expect(state.carts[0].items).toHaveLength(1);
      expect(state.carts[1].items).toHaveLength(0);
    });
  });

  describe('removeItemFromActiveCart', () => {
    it('should remove item from active cart', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = removeItemFromActiveCart(mockItem.id);
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should not affect other items when removing one', () => {
      const stateWithItems: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [
            { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
            { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = removeItemFromActiveCart(mockItem.id);
      const state = multiCartReducer(stateWithItems, action);

      expect(state.carts[0].items).toHaveLength(1);
      expect(state.carts[0].items[0].item.id).toBe('dal-1');
    });
  });

  describe('updateItemQuantityInActiveCart', () => {
    it('should update item quantity in active cart', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = updateItemQuantityInActiveCart({ itemId: mockItem.id, quantity: 10 });
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items[0].quantity).toBe(10);
    });

    it('should remove item if quantity is set to 0', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = updateItemQuantityInActiveCart({ itemId: mockItem.id, quantity: 0 });
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items).toHaveLength(0);
    });
  });

  describe('incrementItemInActiveCart', () => {
    it('should increment item quantity by default quantity', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = incrementItemInActiveCart(mockItem.id);
      const state = multiCartReducer(stateWithItem, action);

      // mockItem has defaultQuantity of 5, so 5 + 5 = 10
      expect(state.carts[0].items[0].quantity).toBe(10);
    });
  });

  describe('decrementItemInActiveCart', () => {
    it('should remove item when quantity equals default quantity', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = decrementItemInActiveCart(mockItem.id);
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should decrement by default quantity when quantity is greater', () => {
      const stateWithItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 10, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = decrementItemInActiveCart(mockItem.id);
      const state = multiCartReducer(stateWithItem, action);

      expect(state.carts[0].items[0].quantity).toBe(5);
    });
  });

  describe('clearActiveCart', () => {
    it('should remove all items from active cart', () => {
      const stateWithItems: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [
            { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
            { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = clearActiveCart();
      const state = multiCartReducer(stateWithItems, action);

      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should reset cart status to draft', () => {
      const stateWithPrintedCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'printed',
        }],
        activeCartId: 'cart-1',
      };

      const action = clearActiveCart();
      const state = multiCartReducer(stateWithPrintedCart, action);

      expect(state.carts[0].status).toBe('draft');
    });
  });

  describe('setActiveCartStatus', () => {
    it('should update active cart status', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = setActiveCartStatus('printed');
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts[0].status).toBe('printed');
    });

    it('should allow setting to completed', () => {
      const stateWithCart: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = setActiveCartStatus('completed');
      const state = multiCartReducer(stateWithCart, action);

      expect(state.carts[0].status).toBe('completed');
    });
  });

  describe('hydrateMultiCart', () => {
    it('should load persisted state', () => {
      const persistedState = {
        carts: [{
          id: 'cart-1',
          name: 'Persisted Cart',
          items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft' as const,
        }],
        activeCartId: 'cart-1',
        lastSyncedAt: new Date().toISOString(),
      };

      const action = hydrateMultiCart(persistedState);
      const state = multiCartReducer(initialState, action);

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].name).toBe('Persisted Cart');
      expect(state.activeCartId).toBe('cart-1');
      expect(state.isHydrated).toBe(true);
    });

    it('should set isHydrated to true even with empty state', () => {
      const action = hydrateMultiCart({});
      const state = multiCartReducer(initialState, action);

      expect(state.isHydrated).toBe(true);
    });
  });

  describe('selectors', () => {
    const stateWithCarts = {
      multiCart: {
        carts: [
          {
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
              { item: mockItem2, quantity: 3, addedAt: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft' as const,
          },
          {
            id: 'cart-2',
            name: 'Cart 2',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft' as const,
          },
        ],
        activeCartId: 'cart-1',
        isHydrated: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };

    it('selectAllCarts should return all carts', () => {
      const carts = selectAllCarts(stateWithCarts);
      expect(carts).toHaveLength(2);
    });

    it('selectActiveCartId should return active cart ID', () => {
      const activeId = selectActiveCartId(stateWithCarts);
      expect(activeId).toBe('cart-1');
    });

    it('selectActiveCart should return the active cart object', () => {
      const activeCart = selectActiveCart(stateWithCarts);
      expect(activeCart?.name).toBe('Cart 1');
    });

    it('selectActiveCart should return null if no active cart', () => {
      const stateNoActive = {
        multiCart: { ...stateWithCarts.multiCart, activeCartId: null },
      };
      const activeCart = selectActiveCart(stateNoActive);
      expect(activeCart).toBeNull();
    });

    it('selectActiveCartItems should return items of active cart', () => {
      const items = selectActiveCartItems(stateWithCarts);
      expect(items).toHaveLength(2);
    });

    it('selectActiveCartItems should return empty array if no active cart', () => {
      const stateNoActive = {
        multiCart: { ...stateWithCarts.multiCart, activeCartId: null },
      };
      const items = selectActiveCartItems(stateNoActive);
      expect(items).toEqual([]);
    });

    it('selectActiveCartItemCount should return number of unique items', () => {
      const count = selectActiveCartItemCount(stateWithCarts);
      expect(count).toBe(2);
    });

    it('selectActiveCartTotalQuantity should return total quantity', () => {
      const total = selectActiveCartTotalQuantity(stateWithCarts);
      expect(total).toBe(8); // 5 + 3
    });

    it('selectCartCount should return number of carts', () => {
      const count = selectCartCount(stateWithCarts);
      expect(count).toBe(2);
    });

    it('selectIsMultiCartHydrated should return hydration status', () => {
      const isHydrated = selectIsMultiCartHydrated(stateWithCarts);
      expect(isHydrated).toBe(true);
    });
  });

  describe('pricing functionality', () => {
    const mockItemWithPrice: Item = {
      id: 'priced-1',
      categoryId: 'test-category',
      name: 'Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 100.0,
    };

    const mockItemWithPrice2: Item = {
      id: 'priced-2',
      categoryId: 'test-category',
      name: 'Another Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 50.0,
    };

    const mockItemNoPrice: Item = {
      id: 'no-price-1',
      categoryId: 'test-category',
      name: 'Item Without Price',
      unit: 'pcs',
      defaultQuantity: 1,
    };

    const stateWithActiveCart: MultiCartState = {
      carts: [{
        id: 'cart-1',
        name: 'Cart 1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      }],
      activeCartId: 'cart-1',
      isHydrated: true,
      lastSyncedAt: null,
    };

    describe('addItemToActiveCart with price', () => {
      it('should capture priceSnapshot when adding item with price', () => {
        const action = addItemToActiveCart({ item: mockItemWithPrice, quantity: 2 });
        const state = multiCartReducer(stateWithActiveCart, action);

        expect(state.carts[0].items[0].priceSnapshot).toBe(100.0);
      });

      it('should handle item without price (priceSnapshot undefined)', () => {
        const action = addItemToActiveCart({ item: mockItemNoPrice, quantity: 2 });
        const state = multiCartReducer(stateWithActiveCart, action);

        expect(state.carts[0].items[0].priceSnapshot).toBeUndefined();
      });

      it('should preserve original priceSnapshot when incrementing existing item quantity', () => {
        // First add item at price 100
        const stateWithItem: MultiCartState = {
          ...stateWithActiveCart,
          carts: [{
            ...stateWithActiveCart.carts[0],
            items: [{
              item: mockItemWithPrice,
              quantity: 1,
              addedAt: new Date().toISOString(),
              priceSnapshot: 100.0,
            }],
          }],
        };

        // Now add same item again (simulating price change scenario - even though item.price is same,
        // we test that original priceSnapshot is preserved)
        const action = addItemToActiveCart({ item: mockItemWithPrice, quantity: 2 });
        const state = multiCartReducer(stateWithItem, action);

        // Quantity should increase
        expect(state.carts[0].items[0].quantity).toBe(3);
        // But priceSnapshot should remain the original captured price
        expect(state.carts[0].items[0].priceSnapshot).toBe(100.0);
      });

      it('should preserve priceSnapshot when using incrementItemInActiveCart', () => {
        const stateWithItem: MultiCartState = {
          ...stateWithActiveCart,
          carts: [{
            ...stateWithActiveCart.carts[0],
            items: [{
              item: mockItemWithPrice,
              quantity: 1,
              addedAt: new Date().toISOString(),
              priceSnapshot: 100.0,
            }],
          }],
        };

        const action = incrementItemInActiveCart('priced-1');
        const state = multiCartReducer(stateWithItem, action);

        // priceSnapshot should be preserved after increment
        expect(state.carts[0].items[0].priceSnapshot).toBe(100.0);
      });

      it('should preserve priceSnapshot when using decrementItemInActiveCart', () => {
        const stateWithItem: MultiCartState = {
          ...stateWithActiveCart,
          carts: [{
            ...stateWithActiveCart.carts[0],
            items: [{
              item: { ...mockItemWithPrice, defaultQuantity: 1 },
              quantity: 5,
              addedAt: new Date().toISOString(),
              priceSnapshot: 100.0,
            }],
          }],
        };

        const action = decrementItemInActiveCart('priced-1');
        const state = multiCartReducer(stateWithItem, action);

        // priceSnapshot should be preserved after decrement
        expect(state.carts[0].items[0].priceSnapshot).toBe(100.0);
      });
    });

    describe('selectActiveCartGrandTotal', () => {
      it('should calculate grand total correctly for priced items', () => {
        const stateWithPricedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: new Date().toISOString(), priceSnapshot: 100.0 },
                { item: mockItemWithPrice2, quantity: 3, addedAt: new Date().toISOString(), priceSnapshot: 50.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithPricedItems);
        // (2 * 100) + (3 * 50) = 200 + 150 = 350
        expect(total).toBe(350);
      });

      it('should return 0 for items without priceSnapshot', () => {
        const stateWithUnpricedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemNoPrice, quantity: 5, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithUnpricedItems);
        expect(total).toBe(0);
      });

      it('should handle mixed cart with priced and unpriced items', () => {
        const stateWithMixedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: new Date().toISOString(), priceSnapshot: 100.0 },
                { item: mockItemNoPrice, quantity: 5, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithMixedItems);
        // Only priced item contributes: 2 * 100 = 200
        expect(total).toBe(200);
      });

      it('should return 0 for empty cart', () => {
        const stateWithEmptyCart = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithEmptyCart);
        expect(total).toBe(0);
      });

      it('should return 0 when no active cart', () => {
        const stateNoActiveCart = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateNoActiveCart);
        expect(total).toBe(0);
      });

      // TDD: Unit multiplier tests for gm/ml items
      it('should apply 0.001 multiplier for gm unit items', () => {
        // Cumin Seeds: price = 340/kg, quantity = 250gm
        // Expected total: 340 * 250 * 0.001 = 85
        const mockGmItem: Item = {
          id: 'cumin-1',
          categoryId: 'spices',
          name: 'Cumin Seeds',
          unit: 'gm',
          defaultQuantity: 250,
          price: 340, // Price per KG
        };

        const stateWithGmItem = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockGmItem, quantity: 250, addedAt: new Date().toISOString(), priceSnapshot: 340.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithGmItem);
        // 340 * 250 * 0.001 = 85
        expect(total).toBe(85);
      });

      it('should apply 0.001 multiplier for ml unit items', () => {
        // Mouthwash: price = 560/L, quantity = 250ml
        // Expected total: 560 * 250 * 0.001 = 140
        const mockMlItem: Item = {
          id: 'mouthwash-1',
          categoryId: 'personal-care',
          name: 'Mouthwash',
          unit: 'ml',
          defaultQuantity: 250,
          price: 560, // Price per Liter
        };

        const stateWithMlItem = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockMlItem, quantity: 250, addedAt: new Date().toISOString(), priceSnapshot: 560.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithMlItem);
        // 560 * 250 * 0.001 = 140
        expect(total).toBe(140);
      });

      it('should NOT apply multiplier for kg unit items (multiplier = 1)', () => {
        const mockKgItem: Item = {
          id: 'rice-1',
          categoryId: 'rice',
          name: 'Basmati Rice',
          unit: 'kg',
          defaultQuantity: 5,
          price: 140,
        };

        const stateWithKgItem = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockKgItem, quantity: 5, addedAt: new Date().toISOString(), priceSnapshot: 140.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithKgItem);
        // 140 * 5 * 1 = 700
        expect(total).toBe(700);
      });

      it('should handle mixed units in cart correctly', () => {
        const mockGmItem: Item = {
          id: 'cumin-1',
          categoryId: 'spices',
          name: 'Cumin Seeds',
          unit: 'gm',
          defaultQuantity: 250,
          price: 340,
        };
        const mockKgItem: Item = {
          id: 'rice-1',
          categoryId: 'rice',
          name: 'Basmati Rice',
          unit: 'kg',
          defaultQuantity: 5,
          price: 140,
        };

        const stateWithMixedUnits = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockGmItem, quantity: 250, addedAt: new Date().toISOString(), priceSnapshot: 340.0 },
                { item: mockKgItem, quantity: 5, addedAt: new Date().toISOString(), priceSnapshot: 140.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const total = selectActiveCartGrandTotal(stateWithMixedUnits);
        // Cumin: 340 * 250 * 0.001 = 85
        // Rice: 140 * 5 * 1 = 700
        // Total: 85 + 700 = 785
        expect(total).toBe(785);
      });
    });

    describe('selectActiveCartHasPrices', () => {
      it('should return true when cart has items with priceSnapshot', () => {
        const stateWithPricedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: new Date().toISOString(), priceSnapshot: 100.0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const hasPrices = selectActiveCartHasPrices(stateWithPricedItems);
        expect(hasPrices).toBe(true);
      });

      it('should return false when cart has only items without priceSnapshot', () => {
        const stateWithUnpricedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemNoPrice, quantity: 5, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const hasPrices = selectActiveCartHasPrices(stateWithUnpricedItems);
        expect(hasPrices).toBe(false);
      });

      it('should return true for mixed cart with at least one priced item', () => {
        const stateWithMixedItems = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: new Date().toISOString(), priceSnapshot: 100.0 },
                { item: mockItemNoPrice, quantity: 5, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const hasPrices = selectActiveCartHasPrices(stateWithMixedItems);
        expect(hasPrices).toBe(true);
      });

      it('should return false for empty cart', () => {
        const stateWithEmptyCart = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const hasPrices = selectActiveCartHasPrices(stateWithEmptyCart);
        expect(hasPrices).toBe(false);
      });

      it('should return false when priceSnapshot is 0', () => {
        const stateWithZeroPriceItem = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: new Date().toISOString(), priceSnapshot: 0 },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        // Items with priceSnapshot of 0 should be treated as not having a meaningful price
        const hasPrices = selectActiveCartHasPrices(stateWithZeroPriceItem);
        expect(hasPrices).toBe(false);
      });
    });

    describe('refreshActiveCartPrices', () => {
      it('should update priceSnapshot when catalog item ID matches cart item ID', () => {
        const cartItemWithoutPrice: Item = {
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
          // No price initially
        };

        const stateWithUnpricedItem: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItemWithoutPrice,
              quantity: 5,
              addedAt: new Date().toISOString(),
              // priceSnapshot is undefined
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        // Catalog has the same item with price
        const catalogItems: Item[] = [{
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
          price: 48,
        }];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithUnpricedItem, action);

        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
        expect(state.carts[0].items[0].item.price).toBe(48);
      });

      it('should update priceSnapshot using name fallback when ID does not match', () => {
        // Cart item has different ID but same name
        const cartItemWithOldId: Item = {
          id: 'old-generated-id-123',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
        };

        const stateWithMismatchedId: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItemWithOldId,
              quantity: 5,
              addedAt: new Date().toISOString(),
              // priceSnapshot is undefined
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        // Catalog has item with different ID but matching name
        const catalogItems: Item[] = [{
          id: 'gf-001', // Different ID
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta', // Same name
          unit: 'kg',
          defaultQuantity: 5,
          price: 48,
        }];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithMismatchedId, action);

        // Should match by name and update price
        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
        expect(state.carts[0].items[0].item.price).toBe(48);
      });

      it('should use case-insensitive name matching for fallback', () => {
        const cartItemWithDifferentCase: Item = {
          id: 'old-id',
          categoryId: 'grains-flour',
          name: 'wheat flour / atta', // lowercase
          unit: 'kg',
          defaultQuantity: 5,
        };

        const stateWithDifferentCase: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItemWithDifferentCase,
              quantity: 5,
              addedAt: new Date().toISOString(),
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const catalogItems: Item[] = [{
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta', // Title case
          unit: 'kg',
          defaultQuantity: 5,
          price: 48,
        }];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithDifferentCase, action);

        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
      });

      it('should prefer ID match over name match when both exist', () => {
        const cartItem: Item = {
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
        };

        const stateWithItem: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItem,
              quantity: 5,
              addedAt: new Date().toISOString(),
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        // Catalog has item with same ID (price 48) and another with same name (price 100)
        const catalogItems: Item[] = [
          {
            id: 'gf-001', // Same ID
            categoryId: 'grains-flour',
            name: 'Wheat Flour / Atta',
            unit: 'kg',
            defaultQuantity: 5,
            price: 48, // ID match should use this price
          },
          {
            id: 'different-id',
            categoryId: 'grains-flour',
            name: 'Wheat Flour / Atta', // Same name
            unit: 'kg',
            defaultQuantity: 5,
            price: 100, // Name match would use this if ID didn't match
          },
        ];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithItem, action);

        // Should prefer ID match, so price should be 48 not 100
        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
      });

      it('should not update priceSnapshot if no matching item found', () => {
        const cartItem: Item = {
          id: 'unknown-id',
          categoryId: 'unknown-category',
          name: 'Unknown Item',
          unit: 'kg',
          defaultQuantity: 1,
        };

        const stateWithUnknownItem: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItem,
              quantity: 5,
              addedAt: new Date().toISOString(),
              priceSnapshot: undefined,
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const catalogItems: Item[] = [{
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
          price: 48,
        }];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithUnknownItem, action);

        // Should remain undefined since no match
        expect(state.carts[0].items[0].priceSnapshot).toBeUndefined();
      });

      it('should use hardcoded ITEMS as fallback when catalog items have no prices', () => {
        // This test reproduces the bug where backend returns items without prices
        // Cart has item matching hardcoded ITEMS by name
        const cartItemWithoutPrice: Item = {
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta', // Matches ITEMS in picking.ts
          unit: 'kg',
          defaultQuantity: 5,
          // No price
        };

        const stateWithUnpricedItem: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [{
              item: cartItemWithoutPrice,
              quantity: 5,
              addedAt: new Date().toISOString(),
              // priceSnapshot is undefined
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        // Catalog items WITHOUT prices (simulating backend not seeded)
        const catalogItemsNoPrices: Item[] = [{
          id: 'gf-001',
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
          // No price - simulating backend without price data
        }];

        const action = refreshActiveCartPrices(catalogItemsNoPrices);
        const state = multiCartReducer(stateWithUnpricedItem, action);

        // Should fall back to hardcoded ITEMS price (48 for Wheat Flour / Atta)
        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
        expect(state.carts[0].items[0].item.price).toBe(48);
      });

      it('should update multiple cart items with mixed ID and name matches', () => {
        const cartItem1: Item = {
          id: 'gf-001', // Will match by ID
          categoryId: 'grains-flour',
          name: 'Wheat Flour / Atta',
          unit: 'kg',
          defaultQuantity: 5,
        };

        const cartItem2: Item = {
          id: 'old-id-for-rice', // Will need name fallback
          categoryId: 'rice',
          name: 'Basmati Rice',
          unit: 'kg',
          defaultQuantity: 5,
        };

        const stateWithMultipleItems: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: cartItem1, quantity: 5, addedAt: new Date().toISOString() },
              { item: cartItem2, quantity: 5, addedAt: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const catalogItems: Item[] = [
          {
            id: 'gf-001',
            categoryId: 'grains-flour',
            name: 'Wheat Flour / Atta',
            unit: 'kg',
            defaultQuantity: 5,
            price: 48,
          },
          {
            id: 'rc-001', // Different from cart item ID
            categoryId: 'rice',
            name: 'Basmati Rice',
            unit: 'kg',
            defaultQuantity: 5,
            price: 140,
          },
        ];

        const action = refreshActiveCartPrices(catalogItems);
        const state = multiCartReducer(stateWithMultipleItems, action);

        // First item matched by ID
        expect(state.carts[0].items[0].priceSnapshot).toBe(48);
        // Second item matched by name fallback
        expect(state.carts[0].items[1].priceSnapshot).toBe(140);
      });
    });
  });

  /**
   * Dashboard Selectors Tests
   * TDD tests for dashboard metrics and filtering
   */
  describe('dashboard selectors', () => {
    const mockItemWithPrice: Item = {
      id: 'priced-1',
      categoryId: 'test-category',
      name: 'Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 100.0,
    };

    const mockItemWithPrice2: Item = {
      id: 'priced-2',
      categoryId: 'test-category',
      name: 'Another Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 50.0,
    };

    // Helper to create a date string for today
    const todayISO = () => new Date().toISOString();

    // Helper to create a date string for yesterday
    const yesterdayISO = () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    };

    // Helper to create a date string for 2 days ago
    const twoDaysAgoISO = () => {
      const date = new Date();
      date.setDate(date.getDate() - 2);
      return date.toISOString();
    };

    describe('selectTodaysCarts', () => {
      it('should return only carts created today', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today-1',
                name: 'Today Cart 1',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-today-2',
                name: 'Today Cart 2',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'completed' as const,
              },
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-today-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const todaysCarts = selectTodaysCarts(state);
        expect(todaysCarts).toHaveLength(2);
        expect(todaysCarts.map(c => c.id)).toEqual(['cart-today-1', 'cart-today-2']);
      });

      it('should return empty array when no carts created today', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-yesterday',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const todaysCarts = selectTodaysCarts(state);
        expect(todaysCarts).toHaveLength(0);
      });

      it('should return empty array when no carts exist', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const todaysCarts = selectTodaysCarts(state);
        expect(todaysCarts).toHaveLength(0);
      });
    });

    describe('selectCartsByStatus', () => {
      it('should count carts by status correctly', () => {
        const state = {
          multiCart: {
            carts: [
              { id: '1', name: 'C1', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'draft' as const },
              { id: '2', name: 'C2', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'draft' as const },
              { id: '3', name: 'C3', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'printed' as const },
              { id: '4', name: 'C4', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
              { id: '5', name: 'C5', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
              { id: '6', name: 'C6', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
            ],
            activeCartId: '1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(2);
        expect(statusCounts.printed).toBe(1);
        expect(statusCounts.completed).toBe(3);
      });

      it('should return zeros when no carts exist', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(0);
        expect(statusCounts.printed).toBe(0);
        expect(statusCounts.completed).toBe(0);
      });

      it('should handle all carts having same status', () => {
        const state = {
          multiCart: {
            carts: [
              { id: '1', name: 'C1', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
              { id: '2', name: 'C2', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
            ],
            activeCartId: '1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(0);
        expect(statusCounts.printed).toBe(0);
        expect(statusCounts.completed).toBe(2);
      });
    });

    describe('selectTodaysMetrics', () => {
      it('should calculate all metrics for today\'s carts correctly', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
                  { item: mockItemWithPrice2, quantity: 3, addedAt: todayISO(), priceSnapshot: 50 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'completed' as const,
              },
              {
                id: 'cart-2',
                name: 'Cart 2',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'printed' as const,
              },
              {
                id: 'cart-3',
                name: 'Cart 3 (draft - not in sales)',
                items: [
                  { item: mockItemWithPrice2, quantity: 5, addedAt: todayISO(), priceSnapshot: 50 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart (not counted)',
                items: [
                  { item: mockItemWithPrice, quantity: 10, addedAt: yesterdayISO(), priceSnapshot: 100 },
                ],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'completed' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const metrics = selectTodaysMetrics(state);

        // 3 carts created today (cart-1, cart-2, cart-3)
        expect(metrics.cartsCreated).toBe(3);

        // Total items: 2 items in cart-1 + 1 in cart-2 + 1 in cart-3 = 4
        expect(metrics.itemsPicked).toBe(4);

        // Total quantity: (2+3) + 1 + 5 = 11
        expect(metrics.totalQuantity).toBe(11);

        // Sales only from completed and printed carts (not draft):
        // Cart 1 (completed): (2 * 100) + (3 * 50) = 200 + 150 = 350
        // Cart 2 (printed): 1 * 100 = 100
        // Total: 450
        expect(metrics.totalSales).toBe(450);
      });

      it('should return zeros when no carts created today', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [
                  { item: mockItemWithPrice, quantity: 10, addedAt: yesterdayISO(), priceSnapshot: 100 },
                ],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'completed' as const,
              },
            ],
            activeCartId: 'cart-yesterday',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const metrics = selectTodaysMetrics(state);
        expect(metrics.cartsCreated).toBe(0);
        expect(metrics.itemsPicked).toBe(0);
        expect(metrics.totalQuantity).toBe(0);
        expect(metrics.totalSales).toBe(0);
      });

      it('should handle draft carts not contributing to sales', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-draft',
                name: 'Draft Cart',
                items: [
                  { item: mockItemWithPrice, quantity: 5, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-draft',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const metrics = selectTodaysMetrics(state);
        expect(metrics.cartsCreated).toBe(1);
        expect(metrics.itemsPicked).toBe(1);
        expect(metrics.totalQuantity).toBe(5);
        // Draft carts don't count toward sales
        expect(metrics.totalSales).toBe(0);
      });

      it('should handle items without priceSnapshot in sales calculation', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
                  { item: mockItemWithPrice2, quantity: 3, addedAt: todayISO() }, // No priceSnapshot
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'completed' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const metrics = selectTodaysMetrics(state);
        // Only priced item contributes: 2 * 100 = 200
        expect(metrics.totalSales).toBe(200);
      });
    });

    describe('selectRecentCarts', () => {
      it('should return carts sorted by updatedAt descending', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-old',
                name: 'Old Cart',
                items: [],
                createdAt: twoDaysAgoISO(),
                updatedAt: twoDaysAgoISO(),
                status: 'completed' as const,
              },
              {
                id: 'cart-newest',
                name: 'Newest Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-middle',
                name: 'Middle Cart',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'printed' as const,
              },
            ],
            activeCartId: 'cart-newest',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const recentCarts = selectRecentCarts(state);
        expect(recentCarts.map(c => c.id)).toEqual(['cart-newest', 'cart-middle', 'cart-old']);
      });

      it('should limit to 5 carts by default', () => {
        const carts = Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setMinutes(date.getMinutes() - i); // Each cart 1 minute older
          return {
            id: `cart-${i}`,
            name: `Cart ${i}`,
            items: [],
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            status: 'draft' as const,
          };
        });

        const state = {
          multiCart: {
            carts,
            activeCartId: 'cart-0',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const recentCarts = selectRecentCarts(state);
        expect(recentCarts).toHaveLength(5);
        // Most recent first
        expect(recentCarts[0].id).toBe('cart-0');
        expect(recentCarts[4].id).toBe('cart-4');
      });

      it('should respect custom limit parameter', () => {
        const carts = Array.from({ length: 10 }, (_, i) => ({
          id: `cart-${i}`,
          name: `Cart ${i}`,
          items: [],
          createdAt: todayISO(),
          updatedAt: todayISO(),
          status: 'draft' as const,
        }));

        const state = {
          multiCart: {
            carts,
            activeCartId: 'cart-0',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const recentCarts = selectRecentCarts(state, 3);
        expect(recentCarts).toHaveLength(3);
      });

      it('should return all carts when less than limit', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-2',
                name: 'Cart 2',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const recentCarts = selectRecentCarts(state, 5);
        expect(recentCarts).toHaveLength(2);
      });

      it('should return empty array when no carts exist', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const recentCarts = selectRecentCarts(state);
        expect(recentCarts).toHaveLength(0);
      });
    });

    describe('selectMostRecentDraftCart', () => {
      it('should return null when no draft carts exist', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-completed',
                name: 'Completed Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'completed' as const,
              },
              {
                id: 'cart-printed',
                name: 'Printed Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'printed' as const,
              },
            ],
            activeCartId: 'cart-completed',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).toBeNull();
      });

      it('should return the most recently updated draft cart', () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2);
        const newDate = new Date();
        newDate.setHours(newDate.getHours() - 1);

        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-old-draft',
                name: 'Old Draft',
                items: [],
                createdAt: oldDate.toISOString(),
                updatedAt: oldDate.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-new-draft',
                name: 'New Draft',
                items: [],
                createdAt: newDate.toISOString(),
                updatedAt: newDate.toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-old-draft',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).not.toBeNull();
        expect(draftCart?.id).toBe('cart-new-draft');
        expect(draftCart?.name).toBe('New Draft');
      });

      it('should ignore completed and printed carts', () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2);
        const newDate = new Date();

        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-draft',
                name: 'Draft Cart',
                items: [],
                createdAt: oldDate.toISOString(),
                updatedAt: oldDate.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-completed',
                name: 'Completed Cart (newer)',
                items: [],
                createdAt: newDate.toISOString(),
                updatedAt: newDate.toISOString(),
                status: 'completed' as const,
              },
            ],
            activeCartId: 'cart-completed',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).not.toBeNull();
        expect(draftCart?.id).toBe('cart-draft');
      });

      it('should return null when no carts exist', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).toBeNull();
      });
    });

    describe('selectYesterdaysCarts', () => {
      it('should return only carts created yesterday', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-yesterday-1',
                name: 'Yesterday Cart 1',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'paid' as const,
              },
              {
                id: 'cart-yesterday-2',
                name: 'Yesterday Cart 2',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-old',
                name: 'Old Cart',
                items: [],
                createdAt: twoDaysAgoISO(),
                updatedAt: twoDaysAgoISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const yesterdaysCarts = selectYesterdaysCarts(state);
        expect(yesterdaysCarts).toHaveLength(2);
        expect(yesterdaysCarts.map(c => c.id)).toEqual(['cart-yesterday-1', 'cart-yesterday-2']);
      });

      it('should return empty array when no carts created yesterday', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const yesterdaysCarts = selectYesterdaysCarts(state);
        expect(yesterdaysCarts).toHaveLength(0);
      });
    });

    describe('selectCartsByDateRange', () => {
      it('should return carts within the specified date range', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: today.toISOString(),
                updatedAt: today.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [],
                createdAt: yesterday.toISOString(),
                updatedAt: yesterday.toISOString(),
                status: 'paid' as const,
              },
              {
                id: 'cart-3days',
                name: '3 Days Ago Cart',
                items: [],
                createdAt: threeDaysAgo.toISOString(),
                updatedAt: threeDaysAgo.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-5days',
                name: '5 Days Ago Cart',
                items: [],
                createdAt: fiveDaysAgo.toISOString(),
                updatedAt: fiveDaysAgo.toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        // Get carts from 3 days ago to yesterday (inclusive)
        const startDate = threeDaysAgo.toISOString();
        const endDate = yesterday.toISOString();

        const cartsInRange = selectCartsByDateRange(state, startDate, endDate);
        expect(cartsInRange).toHaveLength(2);
        expect(cartsInRange.map(c => c.id).sort()).toEqual(['cart-3days', 'cart-yesterday'].sort());
      });

      it('should return empty array when no carts in date range', () => {
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: today.toISOString(),
                updatedAt: today.toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const cartsInRange = selectCartsByDateRange(
          state,
          fifteenDaysAgo.toISOString(),
          tenDaysAgo.toISOString()
        );
        expect(cartsInRange).toHaveLength(0);
      });

      it('should include carts on boundary dates', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Start of day',
                items: [],
                createdAt: '2024-06-15T00:00:00.000Z',
                updatedAt: '2024-06-15T00:00:00.000Z',
                status: 'draft' as const,
              },
              {
                id: 'cart-2',
                name: 'End of day',
                items: [],
                createdAt: '2024-06-15T23:59:59.999Z',
                updatedAt: '2024-06-15T23:59:59.999Z',
                status: 'draft' as const,
              },
              {
                id: 'cart-outside',
                name: 'Day before',
                items: [],
                createdAt: '2024-06-14T12:00:00.000Z',
                updatedAt: '2024-06-14T12:00:00.000Z',
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const cartsInRange = selectCartsByDateRange(
          state,
          '2024-06-15T00:00:00.000Z',
          '2024-06-15T23:59:59.999Z'
        );
        expect(cartsInRange).toHaveLength(2);
        expect(cartsInRange.map(c => c.id).sort()).toEqual(['cart-1', 'cart-2']);
      });
    });

    describe('selectCartsSortedByDate', () => {
      it('should return carts sorted by updatedAt descending (most recent first)', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-3days',
                name: '3 Days Ago Cart',
                items: [],
                createdAt: threeDaysAgo.toISOString(),
                updatedAt: threeDaysAgo.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: today.toISOString(),
                updatedAt: today.toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [],
                createdAt: yesterday.toISOString(),
                updatedAt: yesterday.toISOString(),
                status: 'paid' as const,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const sortedCarts = selectCartsSortedByDate(state);
        expect(sortedCarts).toHaveLength(3);
        expect(sortedCarts[0].id).toBe('cart-today');
        expect(sortedCarts[1].id).toBe('cart-yesterday');
        expect(sortedCarts[2].id).toBe('cart-3days');
      });
    });
  });

  /**
   * Payment Feature Tests
   * TDD tests for payment done functionality
   */
  describe('payment feature', () => {
    const mockItemWithPrice: Item = {
      id: 'priced-1',
      categoryId: 'test-category',
      name: 'Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 100.0,
    };

    const mockItemWithPrice2: Item = {
      id: 'priced-2',
      categoryId: 'test-category',
      name: 'Another Priced Item',
      unit: 'kg',
      defaultQuantity: 1,
      price: 50.0,
    };

    // Helper to create a date string for today
    const todayISO = () => new Date().toISOString();

    // Helper to create a date string for yesterday
    const yesterdayISO = () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    };

    describe('markActiveCartAsPaid', () => {
      // Helper to create a mock cash payment info
      const mockCashPaymentInfo = createCashPaymentInfo(200, 0);

      it('should mark active cart as paid with timestamp, amount, and paymentInfo', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const paymentInfo = createCashPaymentInfo(200, 0);
        const beforePaid = new Date().toISOString();
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(stateWithCart, action);
        const afterPaid = new Date().toISOString();

        expect(state.carts[0].status).toBe('paid');
        expect(state.carts[0].paidAmount).toBe(200);
        expect(state.carts[0].paidAt).toBeDefined();
        expect(state.carts[0].paidAt! >= beforePaid).toBe(true);
        expect(state.carts[0].paidAt! <= afterPaid).toBe(true);
        expect(state.carts[0].paymentInfo).toBeDefined();
        expect(state.carts[0].paymentInfo?.method).toBe('cash');
      });

      it('should store cash payment details correctly', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const paymentInfo = createCashPaymentInfo(250, 50);
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].paymentInfo?.method).toBe('cash');
        expect(state.carts[0].paymentInfo?.details).toEqual({
          method: 'cash',
          receivedAmount: 250,
          changeGiven: 50,
        });
      });

      it('should store UPI payment details correctly', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const paymentInfo = createUpiPaymentInfo('merchant@upi', 'TXN123456');
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].paymentInfo?.method).toBe('upi');
        expect(state.carts[0].paymentInfo?.details).toEqual({
          method: 'upi',
          upiId: 'merchant@upi',
          transactionRef: 'TXN123456',
        });
      });

      it('should store card payment details correctly', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const paymentInfo = createCardPaymentInfo('4242');
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].paymentInfo?.method).toBe('card');
        expect(state.carts[0].paymentInfo?.details).toEqual({
          method: 'card',
          lastFourDigits: '4242',
        });
      });

      it('should not mark already paid cart', () => {
        const stateWithPaidCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'paid',
            paidAt: todayISO(),
            paidAmount: 200,
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 500, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateWithPaidCart, action);

        // Should remain unchanged
        expect(state.carts[0].paidAmount).toBe(200);
      });

      it('should not mark empty cart as paid', () => {
        const stateWithEmptyCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 100, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateWithEmptyCart, action);

        expect(state.carts[0].status).toBe('draft');
        expect(state.carts[0].paidAt).toBeUndefined();
      });

      it('should not mark cart with 0 amount as paid', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 0, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].status).toBe('draft');
        expect(state.carts[0].paidAt).toBeUndefined();
      });

      it('should update cart updatedAt timestamp when marking paid', () => {
        const oldTime = '2024-01-01T00:00:00.000Z';
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: oldTime,
            updatedAt: oldTime,
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 200, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].updatedAt).not.toBe(oldTime);
      });

      it('should do nothing if no active cart', () => {
        const stateNoActive: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 200, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateNoActive, action);

        expect(state.carts[0].status).toBe('draft');
      });

      it('should save paidItemCount equal to items.length when marking cart as paid', () => {
        const stateWithItems: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
              { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 50 },
              { item: mockItemWithPrice, quantity: 3, addedAt: todayISO(), priceSnapshot: 75 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markActiveCartAsPaid({ amount: 325, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(stateWithItems, action);

        expect(state.carts[0].status).toBe('paid');
        expect(state.carts[0].paidItemCount).toBe(3);
      });
    });

    describe('markCartAsPaid', () => {
      // Helper to create a mock payment info
      const mockUpiPaymentInfo = createUpiPaymentInfo('merchant@upi');

      it('should mark specific cart as paid by cartId with paymentInfo', () => {
        const stateWithCarts: MultiCartState = {
          carts: [
            {
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft',
            },
            {
              id: 'cart-2',
              name: 'Cart 2',
              items: [
                { item: mockItemWithPrice2, quantity: 3, addedAt: todayISO(), priceSnapshot: 50 },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft',
            },
          ],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markCartAsPaid({ cartId: 'cart-2', amount: 150, paymentInfo: mockUpiPaymentInfo });
        const state = multiCartReducer(stateWithCarts, action);

        // cart-1 should remain draft
        expect(state.carts[0].status).toBe('draft');
        // cart-2 should be paid
        expect(state.carts[1].status).toBe('paid');
        expect(state.carts[1].paidAmount).toBe(150);
        expect(state.carts[1].paymentInfo).toBeDefined();
        expect(state.carts[1].paymentInfo?.method).toBe('upi');
      });

      it('should not mark non-existent cart', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markCartAsPaid({ cartId: 'non-existent', amount: 100, paymentInfo: mockUpiPaymentInfo });
        const state = multiCartReducer(stateWithCart, action);

        expect(state.carts[0].status).toBe('draft');
      });

      it('should save paidItemCount equal to items.length when marking cart as paid by id', () => {
        const stateWithItems: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
              { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 50 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const action = markCartAsPaid({ cartId: 'cart-1', amount: 250, paymentInfo: mockUpiPaymentInfo });
        const state = multiCartReducer(stateWithItems, action);

        expect(state.carts[0].status).toBe('paid');
        expect(state.carts[0].paidItemCount).toBe(2);
      });
    });

    describe('selectActiveCartPaymentInfo', () => {
      it('should return payment info for paid cart', () => {
        const paymentInfo = createCashPaymentInfo(200, 0);
        const stateWithPaidCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'paid',
            paidAt: todayISO(),
            paidAmount: 200,
            paymentInfo,
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const rootState = { multiCart: stateWithPaidCart };
        const result = selectActiveCartPaymentInfo(rootState as any);

        expect(result).toBeDefined();
        expect(result?.method).toBe('cash');
      });

      it('should return null for unpaid cart', () => {
        const stateWithCart: MultiCartState = {
          carts: [{
            id: 'cart-1',
            name: 'Cart 1',
            items: [
              { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
            ],
            createdAt: todayISO(),
            updatedAt: todayISO(),
            status: 'draft',
          }],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        };

        const rootState = { multiCart: stateWithCart };
        const result = selectActiveCartPaymentInfo(rootState as any);

        expect(result).toBeNull();
      });

      it('should return null when no active cart', () => {
        const stateNoActive: MultiCartState = {
          carts: [],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        };

        const rootState = { multiCart: stateNoActive };
        const result = selectActiveCartPaymentInfo(rootState as any);

        expect(result).toBeNull();
      });
    });

    describe('paid cart protection', () => {
      const stateWithPaidCart: MultiCartState = {
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [
            { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
          ],
          createdAt: todayISO(),
          updatedAt: todayISO(),
          status: 'paid',
          paidAt: todayISO(),
          paidAmount: 200,
        }],
        activeCartId: 'cart-1',
        isHydrated: true,
        lastSyncedAt: null,
      };

      it('should prevent adding items to paid cart', () => {
        const action = addItemToActiveCart({ item: mockItemWithPrice2, quantity: 1 });
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items).toHaveLength(1);
        expect(state.carts[0].items[0].item.id).toBe('priced-1');
      });

      it('should prevent removing items from paid cart', () => {
        const action = removeItemFromActiveCart('priced-1');
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items).toHaveLength(1);
      });

      it('should prevent quantity updates on paid cart', () => {
        const action = updateItemQuantityInActiveCart({ itemId: 'priced-1', quantity: 10 });
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items[0].quantity).toBe(2);
      });

      it('should prevent incrementing item in paid cart', () => {
        const action = incrementItemInActiveCart('priced-1');
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items[0].quantity).toBe(2);
      });

      it('should prevent decrementing item in paid cart', () => {
        const action = decrementItemInActiveCart('priced-1');
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items[0].quantity).toBe(2);
      });

      it('should prevent clearing paid cart', () => {
        const action = clearActiveCart();
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts[0].items).toHaveLength(1);
        expect(state.carts[0].status).toBe('paid');
      });

      it('should prevent deleting paid cart', () => {
        const action = deleteCart('cart-1');
        const state = multiCartReducer(stateWithPaidCart, action);

        expect(state.carts).toHaveLength(1);
        expect(state.carts[0].id).toBe('cart-1');
      });
    });

    describe('selectActiveCartIsPaid', () => {
      it('should return true when active cart status is paid', () => {
        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'paid' as const,
              paidAt: todayISO(),
              paidAmount: 100,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectActiveCartIsPaid(state)).toBe(true);
      });

      it('should return false for draft cart', () => {
        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectActiveCartIsPaid(state)).toBe(false);
      });

      it('should return false when no active cart', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectActiveCartIsPaid(state)).toBe(false);
      });
    });

    describe('selectCanMarkPayment', () => {
      it('should return true for draft cart with items and valid total', () => {
        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectCanMarkPayment(state)).toBe(true);
      });

      it('should return false for already paid cart', () => {
        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'paid' as const,
              paidAt: todayISO(),
              paidAmount: 200,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false for empty cart', () => {
        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false for cart with 0 total (no priced items)', () => {
        const mockItemNoPrice: Item = {
          id: 'no-price',
          categoryId: 'test',
          name: 'No Price Item',
          unit: 'pcs',
          defaultQuantity: 1,
        };

        const state = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockItemNoPrice, quantity: 2, addedAt: todayISO() },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft' as const,
            }],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false when no active cart', () => {
        const state = {
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectCanMarkPayment(state)).toBe(false);
      });
    });

    describe('selectTodaysPaidAmount', () => {
      it('should sum paidAmount from all paid carts created today', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 200,
              },
              {
                id: 'cart-2',
                name: 'Cart 2',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 300,
              },
              {
                id: 'cart-3',
                name: 'Cart 3 (draft)',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectTodaysPaidAmount(state)).toBe(500);
      });

      it('should return 0 when no paid carts today', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectTodaysPaidAmount(state)).toBe(0);
      });

      it('should exclude carts from previous days', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-today',
                name: 'Today Cart',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 100,
              },
              {
                id: 'cart-yesterday',
                name: 'Yesterday Cart',
                items: [],
                createdAt: yesterdayISO(),
                updatedAt: yesterdayISO(),
                status: 'paid' as const,
                paidAt: yesterdayISO(),
                paidAmount: 500,
              },
            ],
            activeCartId: 'cart-today',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectTodaysPaidAmount(state)).toBe(100);
      });
    });

    describe('selectPendingPaymentsCount', () => {
      it('should count non-paid carts with items', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1 (draft with items)',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-2',
                name: 'Cart 2 (printed with items)',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'printed' as const,
              },
              {
                id: 'cart-3',
                name: 'Cart 3 (paid)',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 100,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectPendingPaymentsCount(state)).toBe(2);
      });

      it('should exclude empty carts', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1 (draft with items)',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
              {
                id: 'cart-2',
                name: 'Cart 2 (empty draft)',
                items: [],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectPendingPaymentsCount(state)).toBe(1);
      });

      it('should return 0 when all carts are paid', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  { item: mockItemWithPrice, quantity: 1, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 100,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        expect(selectPendingPaymentsCount(state)).toBe(0);
      });
    });

    describe('selectCartsByStatus with paid status', () => {
      it('should count paid carts separately', () => {
        const state = {
          multiCart: {
            carts: [
              { id: '1', name: 'C1', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'draft' as const },
              { id: '2', name: 'C2', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'paid' as const, paidAt: todayISO(), paidAmount: 100 },
              { id: '3', name: 'C3', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'paid' as const, paidAt: todayISO(), paidAmount: 200 },
              { id: '4', name: 'C4', items: [], createdAt: todayISO(), updatedAt: todayISO(), status: 'completed' as const },
            ],
            activeCartId: '1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(1);
        expect(statusCounts.paid).toBe(2);
        expect(statusCounts.completed).toBe(1);
        expect(statusCounts.printed).toBe(0);
      });
    });

    describe('selectTodaysMetrics with paid carts', () => {
      it('should include paid carts in totalSales', () => {
        const state = {
          multiCart: {
            carts: [
              {
                id: 'cart-paid',
                name: 'Paid Cart',
                items: [
                  { item: mockItemWithPrice, quantity: 2, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'paid' as const,
                paidAt: todayISO(),
                paidAmount: 200,
              },
              {
                id: 'cart-completed',
                name: 'Completed Cart',
                items: [
                  { item: mockItemWithPrice2, quantity: 2, addedAt: todayISO(), priceSnapshot: 50 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'completed' as const,
              },
              {
                id: 'cart-draft',
                name: 'Draft Cart (not in sales)',
                items: [
                  { item: mockItemWithPrice, quantity: 5, addedAt: todayISO(), priceSnapshot: 100 },
                ],
                createdAt: todayISO(),
                updatedAt: todayISO(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-paid',
            isHydrated: true,
            lastSyncedAt: null,
          },
        };

        const metrics = selectTodaysMetrics(state);
        // Paid: 2 * 100 = 200
        // Completed: 2 * 50 = 100
        // Draft: excluded
        // Total: 300
        expect(metrics.totalSales).toBe(300);
      });
    });
  });

  describe('selectActiveCartCategoryCount', () => {
    it('should return 0 when no active cart', () => {
      const state = {
        multiCart: {
          carts: [],
          activeCartId: null,
          isHydrated: false,
          lastSyncedAt: null,
        },
      };
      expect(selectActiveCartCategoryCount(state)).toBe(0);
    });

    it('should return 0 when active cart has no items', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'cart-1',
              name: 'Empty Cart',
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            },
          ],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        },
      };
      expect(selectActiveCartCategoryCount(state)).toBe(0);
    });

    it('should count unique categories from active cart items', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'cart-1',
              name: 'Test Cart',
              items: [
                { item: mockItem, quantity: 1, addedAt: new Date().toISOString() },
                { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            },
          ],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        },
      };
      // mockItem has categoryId 'atta-rice', mockItem2 has 'dal-pulses'
      expect(selectActiveCartCategoryCount(state)).toBe(2);
    });

    it('should not double-count the same category', () => {
      const mockItem3: Item = {
        id: 'atta-2',
        categoryId: 'atta-rice', // Same category as mockItem
        name: 'Maida',
        unit: 'kg',
        defaultQuantity: 1,
      };
      const state = {
        multiCart: {
          carts: [
            {
              id: 'cart-1',
              name: 'Test Cart',
              items: [
                { item: mockItem, quantity: 1, addedAt: new Date().toISOString() },
                { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
                { item: mockItem3, quantity: 1, addedAt: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft' as const,
            },
          ],
          activeCartId: 'cart-1',
          isHydrated: true,
          lastSyncedAt: null,
        },
      };
      // 3 items but only 2 unique categories: 'atta-rice' and 'dal-pulses'
      expect(selectActiveCartCategoryCount(state)).toBe(2);
    });
  });

  describe('resetMultiCart', () => {
    it('should reset to initial state', () => {
      // Start with a state that has carts
      const stateWithCarts: MultiCartState = {
        carts: [
          {
            id: 'cart-1',
            name: 'Test Cart',
            items: [{ itemId: 'atta-1', quantity: 5 }],
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeCartId: 'cart-1',
        isHydrated: true,
        lastSyncedAt: new Date().toISOString(),
      };

      const action = resetMultiCart();
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.carts).toHaveLength(0);
      expect(state.activeCartId).toBeNull();
      expect(state.isHydrated).toBe(false);
      expect(state.lastSyncedAt).toBeNull();
    });

    it('should be a no-op on already empty state', () => {
      const state = multiCartReducer(initialState, resetMultiCart());

      expect(state).toEqual(initialState);
    });
  });

  describe('syncCartsFromBackend', () => {
    it('should replace all carts when replaceAll is true', () => {
      // Setup: state has one local cart
      let state = multiCartReducer(initialState, createCart({ name: 'Local Cart' }));

      // Act: sync with replaceAll=true
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'backend-uuid-1',
              name: 'Backend Cart',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
          ],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].id).toBe('backend-uuid-1');
      expect(state.carts[0].name).toBe('Backend Cart');
    });

    it('should merge backend carts with local carts by id', () => {
      // Setup: state has one local cart
      let state = multiCartReducer(initialState, createCart({ name: 'Local Cart' }));

      // Act: sync with a different backend cart (different id)
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'backend-uuid-new',
              name: 'New Backend Cart',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
          ],
          replaceAll: false,
        })
      );

      expect(state.carts).toHaveLength(2);
    });

    it('should NOT create duplicate when backend cart id matches local cart backendId', () => {
      // Setup: create local cart, then set its backendId
      let state = multiCartReducer(initialState, createCart({ name: 'Test Cart' }));
      const localCartId = state.carts[0].id;

      // Simulate middleware setting backendId after POST /carts
      const { updateCartBackendId } = require('../multiCartSlice');
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId: localCartId, backendId: 'backend-uuid-abc' })
      );
      expect(state.carts[0].backendId).toBe('backend-uuid-abc');

      // Act: Phase 2 fetches the same cart from backend (with UUID as id)
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'backend-uuid-abc', // Same as local cart's backendId
              name: 'Test Cart',
              status: 'draft',
              createdAt: state.carts[0].createdAt,
              updatedAt: state.carts[0].updatedAt,
              items: [],
            },
          ],
          replaceAll: false,
        })
      );

      // Assert: should still be 1 cart, not 2
      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].id).toBe(localCartId); // Local ID preserved
      expect(state.carts[0].backendId).toBe('backend-uuid-abc');
    });

    it('should not duplicate when multiple local carts have backendIds matching backend carts', () => {
      // Setup: create two local carts with backendIds
      let state = multiCartReducer(initialState, createCart({ name: 'Cart A' }));
      state = multiCartReducer(state, createCart({ name: 'Cart B' }));
      const localIdA = state.carts[0].id;
      const localIdB = state.carts[1].id;

      const { updateCartBackendId } = require('../multiCartSlice');
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId: localIdA, backendId: 'uuid-a' })
      );
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId: localIdB, backendId: 'uuid-b' })
      );

      // Act: backend returns both carts with their UUID ids
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'uuid-a',
              name: 'Cart A',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
            {
              id: 'uuid-b',
              name: 'Cart B',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
          ],
          replaceAll: false,
        })
      );

      // Assert: still 2 carts, not 4
      expect(state.carts).toHaveLength(2);
    });

    it('should update local cart data from backend when matched by backendId', () => {
      // Setup: local cart with backendId
      let state = multiCartReducer(initialState, createCart({ name: 'Old Name' }));
      const localId = state.carts[0].id;

      const { updateCartBackendId } = require('../multiCartSlice');
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId, backendId: 'uuid-123' })
      );

      // Act: backend returns updated name
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'uuid-123',
              name: 'Updated Name From Backend',
              status: 'printed',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
          ],
          replaceAll: false,
        })
      );

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].name).toBe('Updated Name From Backend');
      expect(state.carts[0].status).toBe('printed');
      expect(state.carts[0].id).toBe(localId); // Local ID preserved
    });

    it('should add genuinely new backend carts that have no local match', () => {
      // Setup: local cart with a known backendId
      let state = multiCartReducer(initialState, createCart({ name: 'Existing' }));
      const localId = state.carts[0].id;

      const { updateCartBackendId } = require('../multiCartSlice');
      state = multiCartReducer(
        state,
        updateCartBackendId({ localId, backendId: 'uuid-existing' })
      );

      // Act: backend returns both the existing cart AND a new one
      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [
            {
              id: 'uuid-existing',
              name: 'Existing',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
            {
              id: 'uuid-brand-new',
              name: 'Brand New Cart',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [],
            },
          ],
          replaceAll: false,
        })
      );

      // Assert: 2 carts -- the existing one + the genuinely new one
      expect(state.carts).toHaveLength(2);
      expect(state.carts.find(c => c.name === 'Brand New Cart')).toBeDefined();
    });

    it('should set lastSyncedAt and isHydrated after sync', () => {
      const state = multiCartReducer(
        initialState,
        syncCartsFromBackend({ carts: [], replaceAll: false })
      );

      expect(state.lastSyncedAt).not.toBeNull();
      expect(state.isHydrated).toBe(true);
    });

    it('replaceAll: true overwrites ALL carts — documents why App.tsx abort guard is needed', () => {
      // CONTEXT: When a user switches tenants, the old tenant's in-flight
      // fetchCartsFromBackend can resolve AFTER the new tenant's carts are loaded.
      // syncCartsFromBackend({ replaceAll: true }) blindly replaces ALL carts.
      // Without the AbortController abort guard in App.tsx, this causes
      // old tenant carts to overwrite new tenant carts.

      // Arrange: Simulate new tenant's carts already loaded
      let state = multiCartReducer(initialState, hydrateMultiCart({
        carts: [
          { id: 'new-tenant-cart', name: 'Tenant B Cart', status: 'draft', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        activeCartId: 'new-tenant-cart',
      }));
      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].name).toBe('Tenant B Cart');

      // Act: Simulate stale response from OLD tenant arriving via syncCartsFromBackend
      state = multiCartReducer(state, syncCartsFromBackend({
        carts: [
          { id: 'old-tenant-cart', name: 'Tenant A Cart', status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [] },
        ],
        replaceAll: true,
      }));

      // Assert: replaceAll: true OVERWRITES everything — Tenant B's cart is gone
      // This is the race condition that the AbortController in App.tsx prevents
      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].name).toBe('Tenant A Cart');
      expect(state.carts.find(c => c.name === 'Tenant B Cart')).toBeUndefined();
    });

    it('should preserve local items for paid carts when replaceAll is true and backend returns fewer items', () => {
      // Setup: Local state has a paid cart WITH items
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
              {
                item: {
                  id: 'item-2',
                  categoryId: 'cat-2',
                  name: 'Dal',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 120,
                },
                quantity: 1,
                addedAt: new Date().toISOString(),
                priceSnapshot: 120,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 240,
          },
        ],
        activeCartId: 'paid-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns the same paid cart but with EMPTY items (race condition)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'paid-cart-uuid',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 240,
              items: [],
            },
          ],
          replaceAll: true,
        })
      );

      // Assert: Local items should be preserved for paid cart
      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].id).toBe('paid-cart-uuid');
      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidAmount).toBe(240);
    });

    it('should use backend items for paid cart when backend has more items than local', () => {
      // Setup: Local paid cart with 1 item
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 240,
          },
        ],
        activeCartId: 'paid-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns 2 items (more than local)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'paid-cart-uuid',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 240,
              items: [
                {
                  itemId: 'item-1',
                  quantity: 2,
                  priceSnapshot: 60,
                  addedAt: new Date().toISOString(),
                  item: { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg' as const, defaultQuantity: 1, price: 60 },
                },
                {
                  itemId: 'item-2',
                  quantity: 1,
                  priceSnapshot: 120,
                  addedAt: new Date().toISOString(),
                  item: { id: 'item-2', categoryId: 'cat-2', name: 'Dal', unit: 'kg' as const, defaultQuantity: 1, price: 120 },
                },
              ],
            },
          ],
          replaceAll: true,
        })
      );

      // Assert: Backend has more items, so use backend items
      expect(state.carts[0].items).toHaveLength(2);
    });

    it('should NOT preserve local items for draft carts when replaceAll is true', () => {
      // Setup: Local draft cart with items
      const draftCartState: MultiCartState = {
        carts: [
          {
            id: 'draft-cart-uuid',
            name: 'Draft Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
          },
        ],
        activeCartId: 'draft-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns cart with no items
      const state = multiCartReducer(
        draftCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'draft-cart-uuid',
              name: 'Draft Cart',
              status: 'draft',
              createdAt: draftCartState.carts[0].createdAt,
              updatedAt: draftCartState.carts[0].updatedAt,
              items: [],
            },
          ],
          replaceAll: true,
        })
      );

      // Draft carts should NOT get special protection — backend is source of truth
      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should preserve local items for paid carts matched by backendId when replaceAll is true', () => {
      // Setup: Local cart has local ID (cart-xxx) and backendId (UUID)
      // This is the real-world scenario where a locally-created cart was synced to backend
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'cart-local-123',
            backendId: 'backend-uuid-456',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
              {
                item: {
                  id: 'item-2',
                  categoryId: 'cat-2',
                  name: 'Dal',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 120,
                },
                quantity: 1,
                addedAt: new Date().toISOString(),
                priceSnapshot: 120,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 240,
          },
        ],
        activeCartId: 'cart-local-123',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns the cart with its UUID id (not the local id)
      // and with EMPTY items (race condition — items not yet synced or filtered out)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'backend-uuid-456',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 240,
              items: [],
            },
          ],
          replaceAll: true,
        })
      );

      // Assert: Local items should be preserved even though IDs differ
      // The match should work via backendId
      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidAmount).toBe(240);
    });

    it('should preserve paidItemCount from local paid cart when replaceAll is true and backend has no paidItemCount', () => {
      // Setup: Local paid cart with paidItemCount captured at payment time
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 120,
            paidItemCount: 5, // Captured at payment time (items may have been modified since)
          },
        ],
        activeCartId: 'paid-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns paid cart with items but NO paidItemCount field
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'paid-cart-uuid',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 120,
              items: [
                {
                  itemId: 'item-1',
                  quantity: 2,
                  priceSnapshot: 60,
                  addedAt: new Date().toISOString(),
                  item: { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg' as const, defaultQuantity: 1, price: 60 },
                },
              ],
            },
          ],
          replaceAll: true,
        })
      );

      // Assert: paidItemCount should be preserved from local state
      expect(state.carts[0].paidItemCount).toBe(5);
    });

    it('should preserve paidItemCount from local paid cart when replaceAll is false (merge mode)', () => {
      // Setup: Local paid cart with paidItemCount
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 120,
            paidItemCount: 3,
          },
        ],
        activeCartId: 'paid-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend sync with replaceAll: false (merge mode)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'paid-cart-uuid',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 120,
              items: [
                {
                  itemId: 'item-1',
                  quantity: 2,
                  priceSnapshot: 60,
                  addedAt: new Date().toISOString(),
                  item: { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg' as const, defaultQuantity: 1, price: 60 },
                },
              ],
            },
          ],
          replaceAll: false,
        })
      );

      // Assert: paidItemCount should be preserved from local state
      expect(state.carts[0].paidItemCount).toBe(3);
    });

    it('should preserve paidItemCount AND items for paid cart when backend returns empty items (replaceAll: true)', () => {
      // Setup: Local paid cart with items and paidItemCount
      const paidCartState: MultiCartState = {
        carts: [
          {
            id: 'paid-cart-uuid',
            name: 'Paid Cart',
            items: [
              {
                item: {
                  id: 'item-1',
                  categoryId: 'cat-1',
                  name: 'Rice',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 60,
                },
                quantity: 2,
                addedAt: new Date().toISOString(),
                priceSnapshot: 60,
              },
              {
                item: {
                  id: 'item-2',
                  categoryId: 'cat-2',
                  name: 'Dal',
                  unit: 'kg' as const,
                  defaultQuantity: 1,
                  price: 120,
                },
                quantity: 1,
                addedAt: new Date().toISOString(),
                priceSnapshot: 120,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidAmount: 240,
            paidItemCount: 2,
          },
        ],
        activeCartId: 'paid-cart-uuid',
        isHydrated: true,
        lastSyncedAt: null,
      };

      // Act: Backend returns paid cart with EMPTY items array
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [
            {
              id: 'paid-cart-uuid',
              name: 'Paid Cart',
              status: 'paid',
              createdAt: paidCartState.carts[0].createdAt,
              updatedAt: paidCartState.carts[0].updatedAt,
              paidAt: paidCartState.carts[0].paidAt,
              paidAmount: 240,
              items: [],
            },
          ],
          replaceAll: true,
        })
      );

      // Assert: Both items AND paidItemCount should be preserved
      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidItemCount).toBe(2);
    });
  });
});
