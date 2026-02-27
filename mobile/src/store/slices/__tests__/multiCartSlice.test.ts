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
  clearMultiCartInMemory,
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

  // === Shared Mock Items ===
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

  // === Date Helpers ===
  const todayISO = () => new Date().toISOString();

  const yesterdayISO = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  };

  const twoDaysAgoISO = () => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    return date.toISOString();
  };

  // === Factory Functions ===
  const createMockCartItem = (
    item: Item,
    quantity: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    item,
    quantity,
    addedAt: new Date().toISOString(),
    ...(item.price != null ? { priceSnapshot: item.price } : {}),
    ...overrides,
  });

  const createMockCart = (
    id: string,
    name: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    id,
    name,
    items: [] as Array<{ item: Item; quantity: number; addedAt: string; priceSnapshot?: number }>,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft' as const,
    ...overrides,
  });

  const createMockState = (overrides: Partial<MultiCartState> = {}): MultiCartState => ({
    ...initialState,
    isHydrated: true,
    ...overrides,
  });

  const stateWithOneActiveCart = (
    cartOverrides: Record<string, unknown> = {},
    stateOverrides: Partial<MultiCartState> = {},
  ): MultiCartState => createMockState({
    carts: [createMockCart('cart-1', 'Cart 1', cartOverrides)],
    activeCartId: 'cart-1',
    ...stateOverrides,
  });

  const createRootState = (multiCartOverrides: Partial<MultiCartState> = {}) => ({
    multiCart: createMockState(multiCartOverrides),
  });

  // Helper for backend cart payloads (syncCartsFromBackend action format)
  const createBackendCart = (id: string, name: string, overrides: Record<string, unknown> = {}) => ({
    id,
    name,
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [] as unknown[],
    ...overrides,
  });

  // Helper for backend item payloads
  const createBackendItem = (
    itemId: string,
    name: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    itemId,
    quantity: 1,
    priceSnapshot: 60,
    addedAt: new Date().toISOString(),
    item: {
      id: itemId,
      categoryId: 'cat-1',
      name,
      unit: 'kg' as const,
      defaultQuantity: 1,
      price: 60,
    },
    ...overrides,
  });

  // Factory for paid cart states used in syncCartsFromBackend tests
  const createPaidCartState = (
    cartId: string,
    items: Array<{ item: Item; quantity: number; addedAt: string; priceSnapshot?: number }>,
    overrides: Record<string, unknown> = {},
  ): MultiCartState => createMockState({
    carts: [{
      id: cartId,
      name: 'Paid Cart',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'paid' as const,
      paidAt: new Date().toISOString(),
      paidAmount: 240,
      ...overrides,
    } as MultiCartState['carts'][0]],
    activeCartId: cartId,
  });

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

    it('should reject duplicate cart name (case-insensitive)', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Morning Cart' }));
      expect(state.carts).toHaveLength(1);

      // Same name, different case — should be rejected
      state = multiCartReducer(state, createCart({ name: 'morning cart' }));
      expect(state.carts).toHaveLength(1); // No new cart added
    });

    it('should accept carts with different names', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Morning Cart' }));
      state = multiCartReducer(state, createCart({ name: 'Afternoon Cart' }));
      expect(state.carts).toHaveLength(2);
    });

    it('should not change activeCartId when duplicate name is rejected', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Cart A' }));
      const originalActiveId = state.activeCartId;

      state = multiCartReducer(state, createCart({ name: 'Cart A' }));
      expect(state.activeCartId).toBe(originalActiveId);
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

  // Quantities are stored in base units (kg, L). increment/decrement must convert
  // defaultQuantity (in item's unit, e.g. gm) to base unit before operating.
  describe('incrementItemInActiveCart - gm/ml items', () => {
    const mockGmItem: Item = {
      id: 'cumin-1',
      categoryId: 'spices',
      name: 'Cumin Seeds',
      unit: 'gm',
      defaultQuantity: 250,
      price: 340,
    };

    it('should increment gm item by base-unit equivalent of defaultQuantity', () => {
      // 250gm = 0.25kg. Starting at 0.25kg, after increment: 0.25 + 0.25 = 0.5kg
      const stateWithGmItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockGmItem, quantity: 0.25, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = incrementItemInActiveCart(mockGmItem.id);
      const state = multiCartReducer(stateWithGmItem, action);

      expect(state.carts[0].items[0].quantity).toBeCloseTo(0.5);
    });
  });

  describe('decrementItemInActiveCart - gm/ml items', () => {
    const mockGmItem: Item = {
      id: 'cumin-1',
      categoryId: 'spices',
      name: 'Cumin Seeds',
      unit: 'gm',
      defaultQuantity: 250,
      price: 340,
    };

    it('should decrement gm item by base-unit equivalent of defaultQuantity', () => {
      // 250gm = 0.25kg. Starting at 0.5kg, after decrement: 0.5 - 0.25 = 0.25kg
      const stateWithGmItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockGmItem, quantity: 0.5, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = decrementItemInActiveCart(mockGmItem.id);
      const state = multiCartReducer(stateWithGmItem, action);

      expect(state.carts[0].items[0].quantity).toBeCloseTo(0.25);
    });

    it('should remove gm item when at base-unit default quantity', () => {
      // 250gm = 0.25kg. At 0.25kg, decrement should remove item
      const stateWithGmItem: MultiCartState = {
        ...initialState,
        carts: [{
          id: 'cart-1',
          name: 'Cart 1',
          items: [{ item: mockGmItem, quantity: 0.25, addedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        }],
        activeCartId: 'cart-1',
      };

      const action = decrementItemInActiveCart(mockGmItem.id);
      const state = multiCartReducer(stateWithGmItem, action);

      expect(state.carts[0].items).toHaveLength(0);
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
    const stateWithActiveCart = stateWithOneActiveCart();

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

      // Quantities are always stored in base units (kg, L) per addItemToActiveCart JSDoc.
      // Price is per base unit (per-kg, per-L). Formula: priceSnapshot * quantity.
      it('should calculate correct total for gm items (quantity stored in kg)', () => {
        // Cumin Seeds: price = ₹340/kg, quantity = 0.25 (250gm stored as 0.25 kg)
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
                { item: mockGmItem, quantity: 0.25, addedAt: new Date().toISOString(), priceSnapshot: 340.0 },
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
        // 340 * 0.25 = 85
        expect(total).toBe(85);
      });

      it('should calculate correct total for ml items (quantity stored in L)', () => {
        // Mouthwash: price = ₹560/L, quantity = 0.25 (250ml stored as 0.25 L)
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
                { item: mockMlItem, quantity: 0.25, addedAt: new Date().toISOString(), priceSnapshot: 560.0 },
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
        // 560 * 0.25 = 140
        expect(total).toBe(140);
      });

      it('should calculate correct total for kg unit items', () => {
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
        // 140 * 5 = 700
        expect(total).toBe(700);
      });

      it('should calculate correct grand total matching user bug report (₹760)', () => {
        // Exact scenario from bug report:
        // Cumin Seeds: ₹340/kg × 500gm (0.5 kg) = ₹170
        // Mustard Seeds: ₹280/kg × 500gm (0.5 kg) = ₹140
        // Black Pepper: ₹1800/kg × 250gm (0.25 kg) = ₹450
        const mockCumin: Item = {
          id: 'cumin-1', categoryId: 'spices', name: 'Cumin Seeds',
          unit: 'gm', defaultQuantity: 250, price: 340,
        };
        const mockMustard: Item = {
          id: 'mustard-1', categoryId: 'spices', name: 'Mustard Seeds',
          unit: 'gm', defaultQuantity: 250, price: 280,
        };
        const mockPepper: Item = {
          id: 'pepper-1', categoryId: 'spices', name: 'Black Pepper',
          unit: 'gm', defaultQuantity: 250, price: 1800,
        };

        const stateWithBugReport = {
          multiCart: {
            carts: [{
              id: 'cart-1',
              name: 'Cart 1',
              items: [
                { item: mockCumin, quantity: 0.5, addedAt: new Date().toISOString(), priceSnapshot: 340.0 },
                { item: mockMustard, quantity: 0.5, addedAt: new Date().toISOString(), priceSnapshot: 280.0 },
                { item: mockPepper, quantity: 0.25, addedAt: new Date().toISOString(), priceSnapshot: 1800.0 },
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

        const total = selectActiveCartGrandTotal(stateWithBugReport);
        // 170 + 140 + 450 = 760
        expect(total).toBe(760);
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
                { item: mockGmItem, quantity: 0.25, addedAt: new Date().toISOString(), priceSnapshot: 340.0 },
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
        // Cumin: 340 * 0.25 = 85
        // Rice: 140 * 5 = 700
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
    describe('selectTodaysCarts', () => {
      it('should return only carts created today', () => {
        const yday = yesterdayISO();
        const state = createRootState({
          carts: [
            createMockCart('cart-today-1', 'Today Cart 1'),
            createMockCart('cart-today-2', 'Today Cart 2', { status: 'completed' }),
            createMockCart('cart-yesterday', 'Yesterday Cart', { createdAt: yday, updatedAt: yday }),
          ],
          activeCartId: 'cart-today-1',
        });

        const todaysCarts = selectTodaysCarts(state);
        expect(todaysCarts).toHaveLength(2);
        expect(todaysCarts.map(c => c.id)).toEqual(['cart-today-1', 'cart-today-2']);
      });

      it('should return empty array when no carts created today', () => {
        const yday = yesterdayISO();
        const state = createRootState({
          carts: [createMockCart('cart-yesterday', 'Yesterday Cart', { createdAt: yday, updatedAt: yday })],
          activeCartId: 'cart-yesterday',
        });
        expect(selectTodaysCarts(state)).toHaveLength(0);
      });

      it('should return empty array when no carts exist', () => {
        const state = createRootState({ carts: [], activeCartId: null });
        expect(selectTodaysCarts(state)).toHaveLength(0);
      });
    });

    describe('selectCartsByStatus', () => {
      it('should count carts by status correctly', () => {
        const state = createRootState({
          carts: [
            createMockCart('1', 'C1'),
            createMockCart('2', 'C2'),
            createMockCart('3', 'C3', { status: 'printed' }),
            createMockCart('4', 'C4', { status: 'completed' }),
            createMockCart('5', 'C5', { status: 'completed' }),
            createMockCart('6', 'C6', { status: 'completed' }),
          ],
          activeCartId: '1',
        });

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(2);
        expect(statusCounts.printed).toBe(1);
        expect(statusCounts.completed).toBe(3);
      });

      it('should return zeros when no carts exist', () => {
        const state = createRootState({ carts: [], activeCartId: null });

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
        const yday = yesterdayISO();
        const state = createRootState({
          carts: [
            createMockCart('cart-1', 'Cart 1', {
              items: [createMockCartItem(mockItemWithPrice, 2), createMockCartItem(mockItemWithPrice2, 3)],
              status: 'completed',
            }),
            createMockCart('cart-2', 'Cart 2', {
              items: [createMockCartItem(mockItemWithPrice, 1)],
              status: 'printed',
            }),
            createMockCart('cart-3', 'Cart 3 (draft - not in sales)', {
              items: [createMockCartItem(mockItemWithPrice2, 5)],
            }),
            createMockCart('cart-yesterday', 'Yesterday Cart (not counted)', {
              items: [createMockCartItem(mockItemWithPrice, 10)],
              createdAt: yday, updatedAt: yday, status: 'completed',
            }),
          ],
          activeCartId: 'cart-1',
        });

        const metrics = selectTodaysMetrics(state);
        expect(metrics.cartsCreated).toBe(3);
        expect(metrics.itemsPicked).toBe(2); // 2 unique items
        expect(metrics.totalQuantity).toBe(11); // (2+3) + 1 + 5
        expect(metrics.totalSales).toBe(450); // completed: 350 + printed: 100
      });

      it('should return zeros when no carts created today', () => {
        const yday = yesterdayISO();
        const state = createRootState({
          carts: [createMockCart('cart-yesterday', 'Yesterday Cart', {
            items: [createMockCartItem(mockItemWithPrice, 10)],
            createdAt: yday, updatedAt: yday, status: 'completed',
          })],
          activeCartId: 'cart-yesterday',
        });

        const metrics = selectTodaysMetrics(state);
        expect(metrics.cartsCreated).toBe(0);
        expect(metrics.itemsPicked).toBe(0);
        expect(metrics.totalQuantity).toBe(0);
        expect(metrics.totalSales).toBe(0);
      });

      it('should handle draft carts not contributing to sales', () => {
        const state = createRootState({
          carts: [createMockCart('cart-draft', 'Draft Cart', {
            items: [createMockCartItem(mockItemWithPrice, 5)],
          })],
          activeCartId: 'cart-draft',
        });

        const metrics = selectTodaysMetrics(state);
        expect(metrics.cartsCreated).toBe(1);
        expect(metrics.itemsPicked).toBe(1);
        expect(metrics.totalQuantity).toBe(5);
        expect(metrics.totalSales).toBe(0);
      });

      it('should handle items without priceSnapshot in sales calculation', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', {
            items: [
              createMockCartItem(mockItemWithPrice, 2),
              { item: mockItemWithPrice2, quantity: 3, addedAt: todayISO() }, // No priceSnapshot
            ],
            status: 'completed',
          })],
          activeCartId: 'cart-1',
        });

        const metrics = selectTodaysMetrics(state);
        // Only priced item contributes: 2 * 100 = 200
        expect(metrics.totalSales).toBe(200);
      });

      it('should count unique items across carts (not total line entries)', () => {
        const sharedItem: Item = { id: 'shared-item', categoryId: 'test-category', name: 'Shared Product', unit: 'kg', defaultQuantity: 1, price: 75.0 };

        const state = createRootState({
          carts: [
            createMockCart('cart-a', 'Cart A', {
              items: [createMockCartItem(sharedItem, 2), createMockCartItem(mockItemWithPrice, 1)],
              status: 'completed',
            }),
            createMockCart('cart-b', 'Cart B', {
              items: [createMockCartItem(sharedItem, 3), createMockCartItem(mockItemWithPrice2, 1)],
              status: 'printed',
            }),
          ],
          activeCartId: 'cart-a',
        });

        const metrics = selectTodaysMetrics(state);
        expect(metrics.itemsPicked).toBe(3); // 3 unique products, NOT 4 line entries
        expect(metrics.totalQuantity).toBe(7); // 2 + 1 + 3 + 1
      });
    });

    describe('selectRecentCarts', () => {
      it('should return carts sorted by updatedAt descending', () => {
        const yday = yesterdayISO();
        const twoDay = twoDaysAgoISO();
        const state = createRootState({
          carts: [
            createMockCart('cart-old', 'Old Cart', { createdAt: twoDay, updatedAt: twoDay, status: 'completed' }),
            createMockCart('cart-newest', 'Newest Cart'),
            createMockCart('cart-middle', 'Middle Cart', { createdAt: yday, updatedAt: yday, status: 'printed' }),
          ],
          activeCartId: 'cart-newest',
        });

        const recentCarts = selectRecentCarts(state);
        expect(recentCarts.map(c => c.id)).toEqual(['cart-newest', 'cart-middle', 'cart-old']);
      });

      it('should limit to 5 carts by default', () => {
        const carts = Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setMinutes(date.getMinutes() - i);
          return createMockCart(`cart-${i}`, `Cart ${i}`, { createdAt: date.toISOString(), updatedAt: date.toISOString() });
        });

        const state = createRootState({ carts, activeCartId: 'cart-0' });

        const recentCarts = selectRecentCarts(state);
        expect(recentCarts).toHaveLength(5);
        expect(recentCarts[0].id).toBe('cart-0');
        expect(recentCarts[4].id).toBe('cart-4');
      });

      it('should respect custom limit parameter', () => {
        const carts = Array.from({ length: 10 }, (_, i) =>
          createMockCart(`cart-${i}`, `Cart ${i}`)
        );
        const state = createRootState({ carts, activeCartId: 'cart-0' });

        const recentCarts = selectRecentCarts(state, 3);
        expect(recentCarts).toHaveLength(3);
      });

      it('should return all carts when less than limit', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1'), createMockCart('cart-2', 'Cart 2')],
          activeCartId: 'cart-1',
        });

        const recentCarts = selectRecentCarts(state, 5);
        expect(recentCarts).toHaveLength(2);
      });

      it('should return empty array when no carts exist', () => {
        const state = createRootState({ carts: [], activeCartId: null });
        expect(selectRecentCarts(state)).toHaveLength(0);
      });
    });

    describe('selectMostRecentDraftCart', () => {
      it('should return null when no draft carts exist', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-completed', 'Completed Cart', { status: 'completed' }),
            createMockCart('cart-printed', 'Printed Cart', { status: 'printed' }),
          ],
          activeCartId: 'cart-completed',
        });
        expect(selectMostRecentDraftCart(state)).toBeNull();
      });

      it('should return the most recently updated draft cart', () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2);
        const newDate = new Date();
        newDate.setHours(newDate.getHours() - 1);

        const state = createRootState({
          carts: [
            createMockCart('cart-old-draft', 'Old Draft', { createdAt: oldDate.toISOString(), updatedAt: oldDate.toISOString() }),
            createMockCart('cart-new-draft', 'New Draft', { createdAt: newDate.toISOString(), updatedAt: newDate.toISOString() }),
          ],
          activeCartId: 'cart-old-draft',
        });

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).not.toBeNull();
        expect(draftCart?.id).toBe('cart-new-draft');
        expect(draftCart?.name).toBe('New Draft');
      });

      it('should ignore completed and printed carts', () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2);
        const newDate = new Date();

        const state = createRootState({
          carts: [
            createMockCart('cart-draft', 'Draft Cart', { createdAt: oldDate.toISOString(), updatedAt: oldDate.toISOString() }),
            createMockCart('cart-completed', 'Completed Cart (newer)', { createdAt: newDate.toISOString(), updatedAt: newDate.toISOString(), status: 'completed' }),
          ],
          activeCartId: 'cart-completed',
        });

        const draftCart = selectMostRecentDraftCart(state);
        expect(draftCart).not.toBeNull();
        expect(draftCart?.id).toBe('cart-draft');
      });

      it('should return null when no carts exist', () => {
        const state = createRootState({ carts: [], activeCartId: null });
        expect(selectMostRecentDraftCart(state)).toBeNull();
      });
    });

    describe('selectYesterdaysCarts', () => {
      it('should return only carts created yesterday', () => {
        const yday = yesterdayISO();
        const twoDay = twoDaysAgoISO();
        const state = createRootState({
          carts: [
            createMockCart('cart-today', 'Today Cart'),
            createMockCart('cart-yesterday-1', 'Yesterday Cart 1', { createdAt: yday, updatedAt: yday, status: 'paid' }),
            createMockCart('cart-yesterday-2', 'Yesterday Cart 2', { createdAt: yday, updatedAt: yday }),
            createMockCart('cart-old', 'Old Cart', { createdAt: twoDay, updatedAt: twoDay }),
          ],
          activeCartId: 'cart-today',
        });

        const yesterdaysCarts = selectYesterdaysCarts(state);
        expect(yesterdaysCarts).toHaveLength(2);
        expect(yesterdaysCarts.map(c => c.id)).toEqual(['cart-yesterday-1', 'cart-yesterday-2']);
      });

      it('should return empty array when no carts created yesterday', () => {
        const state = createRootState({
          carts: [createMockCart('cart-today', 'Today Cart')],
          activeCartId: 'cart-today',
        });
        expect(selectYesterdaysCarts(state)).toHaveLength(0);
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

        const state = createRootState({
          carts: [
            createMockCart('cart-today', 'Today Cart', { createdAt: today.toISOString(), updatedAt: today.toISOString() }),
            createMockCart('cart-yesterday', 'Yesterday Cart', { createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(), status: 'paid' }),
            createMockCart('cart-3days', '3 Days Ago Cart', { createdAt: threeDaysAgo.toISOString(), updatedAt: threeDaysAgo.toISOString() }),
            createMockCart('cart-5days', '5 Days Ago Cart', { createdAt: fiveDaysAgo.toISOString(), updatedAt: fiveDaysAgo.toISOString() }),
          ],
          activeCartId: 'cart-today',
        });

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

        const state = createRootState({
          carts: [createMockCart('cart-today', 'Today Cart', { createdAt: today.toISOString(), updatedAt: today.toISOString() })],
          activeCartId: 'cart-today',
        });

        const cartsInRange = selectCartsByDateRange(
          state,
          fifteenDaysAgo.toISOString(),
          tenDaysAgo.toISOString()
        );
        expect(cartsInRange).toHaveLength(0);
      });

      it('should include carts on boundary dates', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-1', 'Start of day', { createdAt: '2024-06-15T00:00:00.000Z', updatedAt: '2024-06-15T00:00:00.000Z' }),
            createMockCart('cart-2', 'End of day', { createdAt: '2024-06-15T23:59:59.999Z', updatedAt: '2024-06-15T23:59:59.999Z' }),
            createMockCart('cart-outside', 'Day before', { createdAt: '2024-06-14T12:00:00.000Z', updatedAt: '2024-06-14T12:00:00.000Z' }),
          ],
          activeCartId: 'cart-1',
        });

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

        const state = createRootState({
          carts: [
            createMockCart('cart-3days', '3 Days Ago Cart', { createdAt: threeDaysAgo.toISOString(), updatedAt: threeDaysAgo.toISOString() }),
            createMockCart('cart-today', 'Today Cart', { createdAt: today.toISOString(), updatedAt: today.toISOString() }),
            createMockCart('cart-yesterday', 'Yesterday Cart', { createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(), status: 'paid' }),
          ],
          activeCartId: 'cart-today',
        });

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
    describe('markActiveCartAsPaid', () => {
      // Helper to create a mock cash payment info
      const mockCashPaymentInfo = createCashPaymentInfo(200, 0);

      it('should mark active cart as paid with timestamp, amount, and paymentInfo', () => {
        const draftCartWithItem = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
        });

        const paymentInfo = createCashPaymentInfo(200, 0);
        const beforePaid = new Date().toISOString();
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(draftCartWithItem, action);
        const afterPaid = new Date().toISOString();

        expect(state.carts[0].status).toBe('paid');
        expect(state.carts[0].paidAmount).toBe(200);
        expect(state.carts[0].paidAt).toBeDefined();
        expect(state.carts[0].paidAt! >= beforePaid).toBe(true);
        expect(state.carts[0].paidAt! <= afterPaid).toBe(true);
        expect(state.carts[0].paymentInfo).toBeDefined();
        expect(state.carts[0].paymentInfo?.method).toBe('cash');
      });

      it.each([
        {
          method: 'cash' as const,
          createPayment: () => createCashPaymentInfo(250, 50),
          expectedDetails: { method: 'cash', receivedAmount: 250, changeGiven: 50 },
        },
        {
          method: 'upi' as const,
          createPayment: () => createUpiPaymentInfo('merchant@upi', 'TXN123456'),
          expectedDetails: { method: 'upi', upiId: 'merchant@upi', transactionRef: 'TXN123456' },
        },
        {
          method: 'card' as const,
          createPayment: () => createCardPaymentInfo('4242'),
          expectedDetails: { method: 'card', lastFourDigits: '4242' },
        },
      ])('should store $method payment details correctly', ({ method, createPayment, expectedDetails }) => {
        const draftCartWithItem = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
        });

        const paymentInfo = createPayment();
        const action = markActiveCartAsPaid({ amount: 200, paymentInfo });
        const state = multiCartReducer(draftCartWithItem, action);

        expect(state.carts[0].paymentInfo?.method).toBe(method);
        expect(state.carts[0].paymentInfo?.details).toEqual(expectedDetails);
      });

      it('should not mark already paid cart', () => {
        const paidCart = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
          status: 'paid', paidAt: todayISO(), paidAmount: 200,
        });

        const action = markActiveCartAsPaid({ amount: 500, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(paidCart, action);

        // Should remain unchanged
        expect(state.carts[0].paidAmount).toBe(200);
      });

      it('should not mark empty cart as paid', () => {
        const emptyCart = stateWithOneActiveCart();

        const action = markActiveCartAsPaid({ amount: 100, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(emptyCart, action);

        expect(state.carts[0].status).toBe('draft');
        expect(state.carts[0].paidAt).toBeUndefined();
      });

      it('should not mark cart with 0 amount as paid', () => {
        const draftCartWithItem = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
        });

        const action = markActiveCartAsPaid({ amount: 0, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(draftCartWithItem, action);

        expect(state.carts[0].status).toBe('draft');
        expect(state.carts[0].paidAt).toBeUndefined();
      });

      it('should update cart updatedAt timestamp when marking paid', () => {
        const oldTime = '2024-01-01T00:00:00.000Z';
        const draftCartWithItem = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
          createdAt: oldTime,
          updatedAt: oldTime,
        });

        const action = markActiveCartAsPaid({ amount: 200, paymentInfo: mockCashPaymentInfo });
        const state = multiCartReducer(draftCartWithItem, action);

        expect(state.carts[0].updatedAt).not.toBe(oldTime);
      });

      it('should do nothing if no active cart', () => {
        const stateNoActive = stateWithOneActiveCart(
          { items: [createMockCartItem(mockItemWithPrice, 2)] },
          { activeCartId: null },
        );

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
        const stateWithCarts = createMockState({
          carts: [
            createMockCart('cart-1', 'Cart 1', { items: [createMockCartItem(mockItemWithPrice, 2)] }),
            createMockCart('cart-2', 'Cart 2', { items: [createMockCartItem(mockItemWithPrice2, 3)] }),
          ],
          activeCartId: 'cart-1',
        });

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
        const draftCartWithItem = stateWithOneActiveCart({
          items: [createMockCartItem(mockItemWithPrice, 2)],
        });

        const action = markCartAsPaid({ cartId: 'non-existent', amount: 100, paymentInfo: mockUpiPaymentInfo });
        const state = multiCartReducer(draftCartWithItem, action);

        expect(state.carts[0].status).toBe('draft');
      });

      it('should save paidItemCount equal to items.length when marking cart as paid by id', () => {
        const stateWithItems = stateWithOneActiveCart({
          items: [
            createMockCartItem(mockItemWithPrice, 2),
            createMockCartItem(mockItemWithPrice, 1, { priceSnapshot: 50 }),
          ],
        });

        const action = markCartAsPaid({ cartId: 'cart-1', amount: 250, paymentInfo: mockUpiPaymentInfo });
        const state = multiCartReducer(stateWithItems, action);

        expect(state.carts[0].status).toBe('paid');
        expect(state.carts[0].paidItemCount).toBe(2);
      });
    });

    describe('selectActiveCartPaymentInfo', () => {
      it('should return payment info for paid cart', () => {
        const paymentInfo = createCashPaymentInfo(200, 0);
        const rootState = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', {
            items: [createMockCartItem(mockItemWithPrice, 2)],
            status: 'paid', paidAt: todayISO(), paidAmount: 200, paymentInfo,
          })],
          activeCartId: 'cart-1',
        });
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
        const rootState = createRootState({ carts: [], activeCartId: null });
        const result = selectActiveCartPaymentInfo(rootState as any);

        expect(result).toBeNull();
      });
    });

    describe('paid cart protection', () => {
      const stateWithPaidCart = stateWithOneActiveCart({
        items: [createMockCartItem(mockItemWithPrice, 2)],
        status: 'paid',
        paidAt: todayISO(),
        paidAmount: 200,
      });

      it.each([
        { operation: 'adding items', action: () => addItemToActiveCart({ item: mockItemWithPrice2, quantity: 1 }) },
        { operation: 'removing items', action: () => removeItemFromActiveCart('priced-1') },
        { operation: 'quantity updates', action: () => updateItemQuantityInActiveCart({ itemId: 'priced-1', quantity: 10 }) },
        { operation: 'incrementing item', action: () => incrementItemInActiveCart('priced-1') },
        { operation: 'decrementing item', action: () => decrementItemInActiveCart('priced-1') },
        { operation: 'clearing cart', action: () => clearActiveCart() },
      ])('should prevent $operation on paid cart', ({ action }) => {
        const state = multiCartReducer(stateWithPaidCart, action());

        expect(state.carts[0].items).toHaveLength(1);
        expect(state.carts[0].items[0].quantity).toBe(2);
      });

      it('should prevent deleting paid cart', () => {
        const state = multiCartReducer(stateWithPaidCart, deleteCart('cart-1'));

        expect(state.carts).toHaveLength(1);
        expect(state.carts[0].id).toBe('cart-1');
      });
    });

    describe('selectActiveCartIsPaid', () => {
      it('should return true when active cart status is paid', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', { status: 'paid', paidAt: todayISO(), paidAmount: 100 })],
          activeCartId: 'cart-1',
        });
        expect(selectActiveCartIsPaid(state)).toBe(true);
      });

      it('should return false for draft cart', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1')],
          activeCartId: 'cart-1',
        });
        expect(selectActiveCartIsPaid(state)).toBe(false);
      });

      it('should return false when no active cart', () => {
        const state = createRootState({ carts: [], activeCartId: null });
        expect(selectActiveCartIsPaid(state)).toBe(false);
      });
    });

    describe('selectCanMarkPayment', () => {
      it('should return true for draft cart with items and valid total', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', { items: [createMockCartItem(mockItemWithPrice, 2)] })],
          activeCartId: 'cart-1',
        });
        expect(selectCanMarkPayment(state)).toBe(true);
      });

      it('should return false for already paid cart', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', {
            items: [createMockCartItem(mockItemWithPrice, 2)],
            status: 'paid', paidAt: todayISO(), paidAmount: 200,
          })],
          activeCartId: 'cart-1',
        });
        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false for empty cart', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1')],
          activeCartId: 'cart-1',
        });
        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false for cart with 0 total (no priced items)', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', { items: [createMockCartItem(mockItemNoPrice, 2)] })],
          activeCartId: 'cart-1',
        });
        expect(selectCanMarkPayment(state)).toBe(false);
      });

      it('should return false when no active cart', () => {
        const state = createRootState({ carts: [], activeCartId: null });
        expect(selectCanMarkPayment(state)).toBe(false);
      });
    });

    describe('selectTodaysPaidAmount', () => {
      it('should sum paidAmount from all paid carts created today', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-1', 'Cart 1', { status: 'paid', paidAt: todayISO(), paidAmount: 200 }),
            createMockCart('cart-2', 'Cart 2', { status: 'paid', paidAt: todayISO(), paidAmount: 300 }),
            createMockCart('cart-3', 'Cart 3 (draft)'),
          ],
          activeCartId: 'cart-1',
        });
        expect(selectTodaysPaidAmount(state)).toBe(500);
      });

      it('should return 0 when no paid carts today', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1')],
          activeCartId: 'cart-1',
        });
        expect(selectTodaysPaidAmount(state)).toBe(0);
      });

      it('should exclude carts from previous days', () => {
        const yday = yesterdayISO();
        const state = createRootState({
          carts: [
            createMockCart('cart-today', 'Today Cart', { status: 'paid', paidAt: todayISO(), paidAmount: 100 }),
            createMockCart('cart-yesterday', 'Yesterday Cart', {
              createdAt: yday, updatedAt: yday, status: 'paid', paidAt: yday, paidAmount: 500,
            }),
          ],
          activeCartId: 'cart-today',
        });
        expect(selectTodaysPaidAmount(state)).toBe(100);
      });
    });

    describe('selectPendingPaymentsCount', () => {
      const oneItem = [createMockCartItem(mockItemWithPrice, 1)];

      it('should count non-paid carts with items', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-1', 'Cart 1 (draft with items)', { items: oneItem }),
            createMockCart('cart-2', 'Cart 2 (printed with items)', { items: oneItem, status: 'printed' }),
            createMockCart('cart-3', 'Cart 3 (paid)', { items: oneItem, status: 'paid', paidAt: todayISO(), paidAmount: 100 }),
          ],
          activeCartId: 'cart-1',
        });
        expect(selectPendingPaymentsCount(state)).toBe(2);
      });

      it('should exclude empty carts', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-1', 'Cart 1 (draft with items)', { items: oneItem }),
            createMockCart('cart-2', 'Cart 2 (empty draft)'),
          ],
          activeCartId: 'cart-1',
        });
        expect(selectPendingPaymentsCount(state)).toBe(1);
      });

      it('should return 0 when all carts are paid', () => {
        const state = createRootState({
          carts: [createMockCart('cart-1', 'Cart 1', { items: oneItem, status: 'paid', paidAt: todayISO(), paidAmount: 100 })],
          activeCartId: 'cart-1',
        });
        expect(selectPendingPaymentsCount(state)).toBe(0);
      });
    });

    describe('selectCartsByStatus with paid status', () => {
      it('should count paid carts separately', () => {
        const state = createRootState({
          carts: [
            createMockCart('1', 'C1'),
            createMockCart('2', 'C2', { status: 'paid', paidAt: todayISO(), paidAmount: 100 }),
            createMockCart('3', 'C3', { status: 'paid', paidAt: todayISO(), paidAmount: 200 }),
            createMockCart('4', 'C4', { status: 'completed' }),
          ],
          activeCartId: '1',
        });

        const statusCounts = selectCartsByStatus(state);
        expect(statusCounts.draft).toBe(1);
        expect(statusCounts.paid).toBe(2);
        expect(statusCounts.completed).toBe(1);
        expect(statusCounts.printed).toBe(0);
      });
    });

    describe('selectTodaysMetrics with paid carts', () => {
      it('should include paid carts in totalSales', () => {
        const state = createRootState({
          carts: [
            createMockCart('cart-paid', 'Paid Cart', {
              items: [createMockCartItem(mockItemWithPrice, 2)],
              status: 'paid', paidAt: todayISO(), paidAmount: 200,
            }),
            createMockCart('cart-completed', 'Completed Cart', {
              items: [createMockCartItem(mockItemWithPrice2, 2)],
              status: 'completed',
            }),
            createMockCart('cart-draft', 'Draft Cart (not in sales)', {
              items: [createMockCartItem(mockItemWithPrice, 5)],
            }),
          ],
          activeCartId: 'cart-paid',
        });

        const metrics = selectTodaysMetrics(state);
        // Paid: 2 * 100 = 200, Completed: 2 * 50 = 100, Draft: excluded → Total: 300
        expect(metrics.totalSales).toBe(300);
      });
    });
  });

  describe('selectActiveCartCategoryCount', () => {
    it('should return 0 when no active cart', () => {
      const state = createRootState({ carts: [], activeCartId: null, isHydrated: false });
      expect(selectActiveCartCategoryCount(state)).toBe(0);
    });

    it('should return 0 when active cart has no items', () => {
      const state = createRootState({
        carts: [createMockCart('cart-1', 'Empty Cart')],
        activeCartId: 'cart-1',
      });
      expect(selectActiveCartCategoryCount(state)).toBe(0);
    });

    it('should count unique categories from active cart items', () => {
      const state = createRootState({
        carts: [createMockCart('cart-1', 'Test Cart', {
          items: [createMockCartItem(mockItem, 1), createMockCartItem(mockItem2, 2)],
        })],
        activeCartId: 'cart-1',
      });
      // mockItem has categoryId 'atta-rice', mockItem2 has 'dal-pulses'
      expect(selectActiveCartCategoryCount(state)).toBe(2);
    });

    it('should not double-count the same category', () => {
      const mockItem3: Item = { id: 'atta-2', categoryId: 'atta-rice', name: 'Maida', unit: 'kg', defaultQuantity: 1 };
      const state = createRootState({
        carts: [createMockCart('cart-1', 'Test Cart', {
          items: [createMockCartItem(mockItem, 1), createMockCartItem(mockItem2, 2), createMockCartItem(mockItem3, 1)],
        })],
        activeCartId: 'cart-1',
      });
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

  describe('clearMultiCartInMemory', () => {
    it('should reset to initial state (same as resetMultiCart)', () => {
      const stateWithCarts: MultiCartState = {
        carts: [
          {
            id: 'cart-1',
            name: 'Test Cart',
            items: [],
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeCartId: 'cart-1',
        isHydrated: true,
        lastSyncedAt: new Date().toISOString(),
      };

      const action = clearMultiCartInMemory();
      const state = multiCartReducer(stateWithCarts, action);

      expect(state.carts).toHaveLength(0);
      expect(state.activeCartId).toBeNull();
      expect(state.isHydrated).toBe(false);
      expect(state.lastSyncedAt).toBeNull();
    });

    it('should be a no-op on already empty state', () => {
      const state = multiCartReducer(initialState, clearMultiCartInMemory());
      expect(state).toEqual(initialState);
    });
  });

  describe('syncCartsFromBackend', () => {
    it('should replace matched carts and preserve local-only carts when replaceAll is true', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Local Cart' }));
      const localCartId = state.carts[0].id;

      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [createBackendCart('backend-uuid-1', 'Backend Cart')],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(2);
      expect(state.carts.find(c => c.id === 'backend-uuid-1')).toBeDefined();
      expect(state.carts.find(c => c.id === localCartId)).toBeDefined();
    });

    it('should merge backend carts with local carts by id', () => {
      let state = multiCartReducer(initialState, createCart({ name: 'Local Cart' }));

      state = multiCartReducer(
        state,
        syncCartsFromBackend({
          carts: [createBackendCart('backend-uuid-new', 'New Backend Cart')],
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
          carts: [createBackendCart('backend-uuid-abc', 'Test Cart', {
            createdAt: state.carts[0].createdAt,
            updatedAt: state.carts[0].updatedAt,
          })],
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
            createBackendCart('uuid-a', 'Cart A'),
            createBackendCart('uuid-b', 'Cart B'),
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
          carts: [createBackendCart('uuid-123', 'Updated Name From Backend', { status: 'printed' as const })],
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
            createBackendCart('uuid-existing', 'Existing'),
            createBackendCart('uuid-brand-new', 'Brand New Cart'),
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

    it('replaceAll: true preserves local carts — AbortController in App.tsx prevents stale tenant data', () => {
      // CONTEXT: When a user switches tenants, the old tenant's in-flight
      // fetchCartsFromBackend can resolve AFTER the new tenant's carts are loaded.
      // The AbortController in App.tsx prevents this race condition.
      // Even without abort, local carts are now preserved (not discarded).

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

      // Assert: Both carts are preserved — the AbortController in App.tsx is the
      // primary defense against cross-tenant contamination (not the reducer)
      expect(state.carts).toHaveLength(2);
      expect(state.carts.find(c => c.name === 'Tenant A Cart')).toBeDefined();
      expect(state.carts.find(c => c.name === 'Tenant B Cart')).toBeDefined();
    });

    it('should preserve local items for paid carts when replaceAll is true and backend returns fewer items', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const dalItem: Item = { id: 'item-2', categoryId: 'cat-2', name: 'Dal', unit: 'kg', defaultQuantity: 1, price: 120 };
      const paidCartState = createPaidCartState('paid-cart-uuid', [
        createMockCartItem(riceItem, 2),
        createMockCartItem(dalItem, 1, { priceSnapshot: 120 }),
      ]);

      // Act: Backend returns the same paid cart but with EMPTY items (race condition)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('paid-cart-uuid', 'Paid Cart', {
            status: 'paid' as const,
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            paidAt: paidCartState.carts[0].paidAt,
            paidAmount: 240,
          })],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].id).toBe('paid-cart-uuid');
      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidAmount).toBe(240);
    });

    it('should use backend items for paid cart when backend has more items than local', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const paidCartState = createPaidCartState('paid-cart-uuid', [createMockCartItem(riceItem, 2)]);

      // Act: Backend returns 2 items (more than local)
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('paid-cart-uuid', 'Paid Cart', {
            status: 'paid' as const,
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            paidAt: paidCartState.carts[0].paidAt,
            paidAmount: 240,
            items: [
              createBackendItem('item-1', 'Rice', { quantity: 2, priceSnapshot: 60 }),
              createBackendItem('item-2', 'Dal', { quantity: 1, priceSnapshot: 120, item: { id: 'item-2', categoryId: 'cat-2', name: 'Dal', unit: 'kg' as const, defaultQuantity: 1, price: 120 } }),
            ],
          })],
          replaceAll: true,
        })
      );

      expect(state.carts[0].items).toHaveLength(2);
    });

    it('should NOT preserve local items for draft carts when replaceAll is true', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1 };
      const draftCartState = createMockState({
        carts: [createMockCart('draft-cart-uuid', 'Draft Cart', {
          items: [createMockCartItem(riceItem, 2)],
        }) as MultiCartState['carts'][0]],
        activeCartId: 'draft-cart-uuid',
      });

      // Act: Backend returns cart with no items
      const state = multiCartReducer(
        draftCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('draft-cart-uuid', 'Draft Cart', {
            createdAt: draftCartState.carts[0].createdAt,
            updatedAt: draftCartState.carts[0].updatedAt,
          })],
          replaceAll: true,
        })
      );

      // Draft carts should NOT get special protection — backend is source of truth
      expect(state.carts[0].items).toHaveLength(0);
    });

    it('should preserve local items for paid carts matched by backendId when replaceAll is true', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const dalItem: Item = { id: 'item-2', categoryId: 'cat-2', name: 'Dal', unit: 'kg', defaultQuantity: 1, price: 120 };
      const paidCartState = createPaidCartState('cart-local-123', [
        createMockCartItem(riceItem, 2),
        createMockCartItem(dalItem, 1, { priceSnapshot: 120 }),
      ], { backendId: 'backend-uuid-456' });

      // Act: Backend returns the cart with its UUID id (not the local id) — empty items
      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('backend-uuid-456', 'Paid Cart', {
            status: 'paid' as const,
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            paidAt: paidCartState.carts[0].paidAt,
            paidAmount: 240,
          })],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidAmount).toBe(240);
    });

    it.each([
      ['replaceAll: true', true, 5],
      ['replaceAll: false (merge mode)', false, 3],
    ])('should preserve paidItemCount from local paid cart when %s', (_label, replaceAll, expectedCount) => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const paidCartState = createPaidCartState('paid-cart-uuid', [createMockCartItem(riceItem, 2)], {
        paidAmount: 120,
        paidItemCount: expectedCount,
      });

      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('paid-cart-uuid', 'Paid Cart', {
            status: 'paid' as const,
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            paidAt: paidCartState.carts[0].paidAt,
            paidAmount: 120,
            items: [createBackendItem('item-1', 'Rice', { quantity: 2, priceSnapshot: 60 })],
          })],
          replaceAll,
        })
      );

      expect(state.carts[0].paidItemCount).toBe(expectedCount);
    });

    it('should preserve paidItemCount AND items for paid cart when backend returns empty items (replaceAll: true)', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const dalItem: Item = { id: 'item-2', categoryId: 'cat-2', name: 'Dal', unit: 'kg', defaultQuantity: 1, price: 120 };
      const paidCartState = createPaidCartState('paid-cart-uuid', [
        createMockCartItem(riceItem, 2),
        createMockCartItem(dalItem, 1, { priceSnapshot: 120 }),
      ], { paidItemCount: 2 });

      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('paid-cart-uuid', 'Paid Cart', {
            status: 'paid' as const,
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            paidAt: paidCartState.carts[0].paidAt,
            paidAmount: 240,
          })],
          replaceAll: true,
        })
      );

      expect(state.carts[0].items).toHaveLength(2);
      expect(state.carts[0].paidItemCount).toBe(2);
    });

    it.each([
      ['paid', 'cart-local-only-123', 'paid' as const, true],
      ['draft', 'cart-local-draft-456', 'draft' as const, false],
      ['printed', 'cart-local-printed-789', 'printed' as const, true],
    ])('replaceAll should preserve local-only %s carts not present in backend',
      (_label, localCartId, status, hasItems) => {
        const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
        const items = hasItems ? [createMockCartItem(riceItem, 2)] : [];
        const localState = createMockState({
          carts: [createMockCart(localCartId, `${status} Cart`, {
            items,
            status,
            ...(status === 'paid' ? { paidAt: yesterdayISO(), paidAmount: 120, paidItemCount: 1 } : {}),
          }) as MultiCartState['carts'][0]],
          activeCartId: localCartId,
        });

        const state = multiCartReducer(
          localState,
          syncCartsFromBackend({
            carts: [createBackendCart('backend-uuid-1', 'Backend Cart')],
            replaceAll: true,
          })
        );

        expect(state.carts).toHaveLength(2);
        expect(state.carts.find(c => c.id === localCartId)).toBeDefined();
        expect(state.carts.find(c => c.id === localCartId)?.status).toBe(status);
        if (hasItems) {
          expect(state.carts.find(c => c.id === localCartId)?.items).toHaveLength(1);
        }
      }
    );

    it('replaceAll should preserve local-only paid carts with backendId when backend does not return them', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const stateWithOrphaned = createPaidCartState('cart-local-789', [createMockCartItem(riceItem, 1)], {
        name: 'Orphaned Paid Cart',
        backendId: 'backend-uuid-orphaned',
        paidAmount: 60,
        paidItemCount: 1,
      });

      const state = multiCartReducer(
        stateWithOrphaned,
        syncCartsFromBackend({
          carts: [createBackendCart('backend-uuid-other', 'Other Cart')],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(2);
      expect(state.carts.find(c => c.id === 'cart-local-789')).toBeDefined();
      expect(state.carts.find(c => c.id === 'cart-local-789')?.status).toBe('paid');
    });

    it('should use category slug as categoryId when category relation is present in backend items', () => {
      const state = multiCartReducer(
        initialState,
        syncCartsFromBackend({
          carts: [{
            id: 'backend-uuid-1',
            name: 'Backend Cart',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: [{
              itemId: 'item-uuid-1',
              quantity: 3,
              priceSnapshot: 48.0,
              addedAt: new Date().toISOString(),
              item: {
                id: 'item-uuid-1',
                categoryId: 'category-uuid-123',
                category: { slug: 'atta-rice' },
                name: 'Atta',
                unit: 'kg' as const,
                defaultQuantity: 5,
                price: 48.0,
              },
            }],
          }],
          replaceAll: true,
        })
      );

      expect(state.carts[0].items[0].item.categoryId).toBe('atta-rice');
    });

    it('should fallback to raw categoryId when category relation is missing in syncCartsFromBackend', () => {
      const state = multiCartReducer(
        initialState,
        syncCartsFromBackend({
          carts: [{
            id: 'backend-uuid-2',
            name: 'Backend Cart 2',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: [{
              itemId: 'item-uuid-2',
              quantity: 1,
              priceSnapshot: 30.0,
              addedAt: new Date().toISOString(),
              item: {
                id: 'item-uuid-2',
                categoryId: 'raw-uuid-fallback',
                name: 'Dal',
                unit: 'kg' as const,
                defaultQuantity: 1,
                price: 30.0,
              },
            }],
          }],
          replaceAll: true,
        })
      );

      expect(state.carts[0].items[0].item.categoryId).toBe('raw-uuid-fallback');
    });

    it('replaceAll should preserve local paid status when backend returns draft (race condition)', () => {
      const riceItem: Item = { id: 'item-1', categoryId: 'atta-rice', name: 'Rice', unit: 'kg', defaultQuantity: 1, price: 60 };
      const paidCartState = createPaidCartState('cart-paid-local', [createMockCartItem(riceItem, 2)], {
        name: 'Test 1',
        backendId: 'cart-paid-uuid',
        paidAt: '2026-02-16T10:00:00.000Z',
        paidAmount: 832,
        paidItemCount: 4,
        paymentInfo: { method: 'cash' as const, cashDetails: { amountGiven: 1000, change: 168 } },
      });

      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('cart-paid-uuid', 'Test 1', {
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
            items: [createBackendItem('item-1', 'Rice', { quantity: 2, priceSnapshot: 60, item: { id: 'item-1', categoryId: 'atta-rice', name: 'Rice', unit: 'kg' as const, defaultQuantity: 1, price: 60 } })],
          })],
          replaceAll: true,
        })
      );

      expect(state.carts).toHaveLength(1);
      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].paidAt).toBe('2026-02-16T10:00:00.000Z');
      expect(state.carts[0].paidAmount).toBe(832);
      expect(state.carts[0].paidItemCount).toBe(4);
      expect(state.carts[0].paymentInfo).toEqual({
        method: 'cash',
        cashDetails: { amountGiven: 1000, change: 168 },
      });
    });

    it('replaceAll should preserve local completed status when backend returns draft', () => {
      const completedCartState = createMockState({
        carts: [createMockCart('cart-completed-uuid', 'Completed Cart', {
          status: 'completed' as const,
          paidAt: '2026-02-15T08:00:00.000Z',
          paidAmount: 500,
        }) as MultiCartState['carts'][0]],
        activeCartId: 'cart-completed-uuid',
      });

      const state = multiCartReducer(
        completedCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('cart-completed-uuid', 'Completed Cart', {
            createdAt: completedCartState.carts[0].createdAt,
            updatedAt: completedCartState.carts[0].updatedAt,
          })],
          replaceAll: true,
        })
      );

      expect(state.carts[0].status).toBe('completed');
      expect(state.carts[0].paidAt).toBe('2026-02-15T08:00:00.000Z');
      expect(state.carts[0].paidAmount).toBe(500);
    });

    it('merge (replaceAll=false) should preserve local paid status when backend returns draft', () => {
      const sugarItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Sugar', unit: 'kg', defaultQuantity: 1, price: 45 };
      const paidCartState = createPaidCartState('cart-uuid-merge', [createMockCartItem(sugarItem, 3, { priceSnapshot: 45 })], {
        name: 'Merge Test Cart',
        paidAt: '2026-02-16T11:00:00.000Z',
        paidAmount: 135,
        paidItemCount: 1,
        paymentInfo: { method: 'upi' as const },
      });

      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('cart-uuid-merge', 'Merge Test Cart', {
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
          })],
          replaceAll: false,
        })
      );

      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].paidAt).toBe('2026-02-16T11:00:00.000Z');
      expect(state.carts[0].paidAmount).toBe(135);
      expect(state.carts[0].paidItemCount).toBe(1);
      expect(state.carts[0].paymentInfo).toEqual({ method: 'upi' });
      expect(state.carts[0].items).toHaveLength(1);
    });

    it('merge with backendId match should preserve local paid status when backend returns draft', () => {
      const teaItem: Item = { id: 'item-1', categoryId: 'cat-1', name: 'Tea', unit: 'pcs', defaultQuantity: 1, price: 200 };
      const paidCartState = createPaidCartState('cart-local-123', [createMockCartItem(teaItem, 1, { priceSnapshot: 200 })], {
        name: 'BackendId Match Cart',
        backendId: 'cart-backend-uuid-456',
        paidAt: '2026-02-16T12:00:00.000Z',
        paidAmount: 200,
        paidItemCount: 1,
        paymentInfo: { method: 'cash' as const, cashDetails: { amountGiven: 200, change: 0 } },
      });

      const state = multiCartReducer(
        paidCartState,
        syncCartsFromBackend({
          carts: [createBackendCart('cart-backend-uuid-456', 'BackendId Match Cart', {
            createdAt: paidCartState.carts[0].createdAt,
            updatedAt: paidCartState.carts[0].updatedAt,
          })],
          replaceAll: false,
        })
      );

      expect(state.carts[0].status).toBe('paid');
      expect(state.carts[0].paidAt).toBe('2026-02-16T12:00:00.000Z');
      expect(state.carts[0].paidAmount).toBe(200);
      expect(state.carts[0].id).toBe('cart-local-123');
      expect(state.carts[0].backendId).toBe('cart-backend-uuid-456');
    });
  });

  describe('selector memoization (referential stability)', () => {
    it.each([
      // Note: selectTodaysCarts and selectYesterdaysCarts are intentionally plain functions
      // (not createSelector) so new Date() is always fresh — they do NOT have referential stability.
      ['selectCartsSortedByDate', selectCartsSortedByDate, () => createRootState({
        carts: [createMockCart('cart-1', 'Cart 1')],
        activeCartId: 'cart-1',
      })],
      ['selectCartsByStatus', selectCartsByStatus, () => createRootState({
        carts: [createMockCart('cart-1', 'Cart 1')],
        activeCartId: 'cart-1',
      })],
      ['selectTodaysMetrics', selectTodaysMetrics, () => createRootState({
        carts: [createMockCart('cart-1', 'Cart 1', {
          items: [createMockCartItem(mockItemWithPrice, 2)],
          status: 'completed' as const,
        })],
        activeCartId: 'cart-1',
      })],
      ['selectActiveCartItems', selectActiveCartItems, () => createRootState({
        carts: [createMockCart('cart-1', 'Cart 1', {
          items: [createMockCartItem(mockItem, 2)],
        })],
        activeCartId: 'cart-1',
      })],
    ] as [string, (state: unknown) => unknown, () => unknown][])(
      '%s should return same reference when called with same state',
      (_name, selector, createState) => {
        const state = createState();
        const result1 = selector(state);
        const result2 = selector(state);
        expect(result1).toBe(result2);
      }
    );

    it('selectActiveCartItems should return same empty array reference when no active cart', () => {
      const state = createRootState();

      const result1 = selectActiveCartItems(state);
      const result2 = selectActiveCartItems(state);
      expect(result1).toBe(result2);
      expect(result1).toEqual([]);
    });
  });

  // =========================================================================
  // Bug Fix: logout action resets multiCart state (extraReducers)
  // =========================================================================
  describe('logout action integration', () => {
    it('should reset multiCart to initialState when logout action is dispatched', () => {
      // Set up: create a cart and hydrate so isHydrated = true
      let state = multiCartReducer(undefined, createCart({ name: 'Test Cart' }));
      state = multiCartReducer(state, hydrateMultiCart({ carts: state.carts, activeCartId: state.activeCartId }));
      expect(state.isHydrated).toBe(true);
      expect(state.carts.length).toBeGreaterThan(0);

      // Dispatch logout (from authSlice)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logout } = require('../authSlice');
      state = multiCartReducer(state, logout());

      expect(state.carts).toEqual([]);
      expect(state.activeCartId).toBeNull();
      expect(state.isHydrated).toBe(false);
      expect(state.lastSyncedAt).toBeNull();
    });

    it('should reset multiCart with paid carts when logout action is dispatched', () => {
      // Set up: cart with paid status
      let state = multiCartReducer(undefined, createCart({ name: 'Paid Cart' }));
      const cartId = state.activeCartId!;
      state = multiCartReducer(state, hydrateMultiCart({ carts: state.carts, activeCartId: cartId }));
      expect(state.isHydrated).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logout } = require('../authSlice');
      state = multiCartReducer(state, logout());

      expect(state.carts).toEqual([]);
      expect(state.isHydrated).toBe(false);
    });
  });

  // =========================================================================
  // Bug Fix: selectTodaysCarts / selectYesterdaysCarts return fresh results
  // (not stale memoized values from createSelector)
  // =========================================================================
  describe('selectYesterdaysCarts freshness', () => {
    it('should return carts created yesterday', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'old-1',
              name: 'Old Cart',
              createdAt: yesterdayISO(),
              updatedAt: yesterdayISO(),
              status: 'paid',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      const result = selectYesterdaysCarts(state as any);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('old-1');
    });

    it('should return fresh results on every call with the same state reference', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'old-1',
              name: 'Old Cart',
              createdAt: yesterdayISO(),
              updatedAt: yesterdayISO(),
              status: 'paid',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      // Both calls with same state reference should return the cart
      const result1 = selectYesterdaysCarts(state as any);
      const result2 = selectYesterdaysCarts(state as any);
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe('old-1');
    });

    it('should NOT include carts from today in yesterday results', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'today-1',
              name: 'Today Cart',
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      const result = selectYesterdaysCarts(state as any);
      expect(result).toHaveLength(0);
    });
  });

  describe('selectTodaysCarts freshness', () => {
    it('should only return carts created today', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'today-1',
              name: 'Today Cart',
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft',
              items: [],
            },
            {
              id: 'old-1',
              name: 'Old Cart',
              createdAt: yesterdayISO(),
              updatedAt: yesterdayISO(),
              status: 'paid',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      const result = selectTodaysCarts(state as any);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('today-1');
    });

    it('should return fresh results on every call with the same state reference', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'today-1',
              name: 'Today Cart',
              createdAt: todayISO(),
              updatedAt: todayISO(),
              status: 'draft',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      const result1 = selectTodaysCarts(state as any);
      const result2 = selectTodaysCarts(state as any);
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe('today-1');
    });

    it('should NOT include carts from yesterday in today results', () => {
      const state = {
        multiCart: {
          carts: [
            {
              id: 'old-1',
              name: 'Old Cart',
              createdAt: yesterdayISO(),
              updatedAt: yesterdayISO(),
              status: 'paid',
              items: [],
            },
          ],
          activeCartId: null,
          isHydrated: true,
          lastSyncedAt: null,
        },
      };

      const result = selectTodaysCarts(state as any);
      expect(result).toHaveLength(0);
    });
  });
});
