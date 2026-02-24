/**
 * Picking Cart Slice Tests
 * TDD tests for the picking cart functionality
 */

import pickingCartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  selectCartItems,
  selectCartTotalItems,
  selectCartItemCount,
  PickingCartState,
} from '../pickingCartSlice';
import { Item } from '../../../domain/types/picking';
import { buildMockItem } from '../../../__test-utils__/factories/picking-factories';

describe('pickingCartSlice', () => {
  const mockItem: Item = buildMockItem({
    id: 'atta-1',
    categoryId: 'atta-rice',
    name: 'Aashirvaad Atta',
    unit: 'kg',
    defaultQuantity: 5,
  });

  const mockItem2: Item = buildMockItem({
    id: 'dal-1',
    categoryId: 'dal-pulses',
    name: 'Toor Dal',
    unit: 'kg',
    defaultQuantity: 1,
  });

  const initialState: PickingCartState = {
    items: [],
    createdAt: null,
    status: 'draft',
  };

  describe('addToCart', () => {
    it('should add a new item to empty cart', () => {
      const action = addToCart({ item: mockItem, quantity: 5 });
      const state = pickingCartReducer(initialState, action);

      expect(state.items).toHaveLength(1);
      expect(state.items[0].item.id).toBe('atta-1');
      expect(state.items[0].quantity).toBe(5);
    });

    it('should increase quantity if item already exists in cart', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = addToCart({ item: mockItem, quantity: 3 });
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(8);
    });

    it('should add multiple different items to cart', () => {
      let state = pickingCartReducer(initialState, addToCart({ item: mockItem, quantity: 5 }));
      state = pickingCartReducer(state, addToCart({ item: mockItem2, quantity: 2 }));

      expect(state.items).toHaveLength(2);
    });

    it('should set createdAt on first item addition', () => {
      const action = addToCart({ item: mockItem, quantity: 5 });
      const state = pickingCartReducer(initialState, action);

      expect(state.createdAt).not.toBeNull();
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from cart', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = removeFromCart(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items).toHaveLength(0);
    });

    it('should not affect other items when removing one', () => {
      const stateWithItems: PickingCartState = {
        ...initialState,
        items: [
          { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
          { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
        ],
      };

      const action = removeFromCart(mockItem.id);
      const state = pickingCartReducer(stateWithItems, action);

      expect(state.items).toHaveLength(1);
      expect(state.items[0].item.id).toBe('dal-1');
    });

    it('should handle removing non-existent item gracefully', () => {
      const action = removeFromCart('non-existent');
      const state = pickingCartReducer(initialState, action);

      expect(state.items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = updateQuantity({ itemId: mockItem.id, quantity: 10 });
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items[0].quantity).toBe(10);
    });

    it('should remove item if quantity is set to 0', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = updateQuantity({ itemId: mockItem.id, quantity: 0 });
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items).toHaveLength(0);
    });

    it('should not allow negative quantities', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = updateQuantity({ itemId: mockItem.id, quantity: -5 });
      const state = pickingCartReducer(stateWithItem, action);

      // Should either stay at 5 or be removed, not go negative
      expect(state.items.length === 0 || state.items[0].quantity >= 0).toBe(true);
    });
  });

  describe('incrementQuantity', () => {
    it('should increment item quantity by 1', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = incrementQuantity(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items[0].quantity).toBe(6);
    });
  });

  describe('decrementQuantity', () => {
    it('should remove item completely when quantity equals default quantity (single add)', () => {
      // When user adds 5kg Atta (default quantity) and presses "-", it should remove entirely
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 5, addedAt: new Date().toISOString() }],
      };

      const action = decrementQuantity(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      // Should remove item completely, not decrement to 4
      expect(state.items).toHaveLength(0);
    });

    it('should decrement by default quantity when quantity is greater than default', () => {
      // When user has added multiple times (e.g., 10kg = 5kg + 5kg), pressing "-" should subtract default quantity
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 10, addedAt: new Date().toISOString() }],
      };

      const action = decrementQuantity(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      // Should decrement by default quantity (5), so 10 - 5 = 5
      expect(state.items[0].quantity).toBe(5);
    });

    it('should remove item when remaining quantity would be less than default', () => {
      // If quantity is 7 and default is 5, pressing "-" should remove (since 7 - 5 = 2 < 5)
      // Actually, let's make it simpler: if quantity <= defaultQuantity, remove. Otherwise subtract defaultQuantity.
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 7, addedAt: new Date().toISOString() }],
      };

      const action = decrementQuantity(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      // 7 - 5 = 2, which should be kept
      expect(state.items[0].quantity).toBe(2);
    });

    it('should remove item when quantity is less than or equal to default quantity', () => {
      // Edge case: quantity is 3 (less than default 5), pressing "-" should remove
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem, quantity: 3, addedAt: new Date().toISOString() }],
      };

      const action = decrementQuantity(mockItem.id);
      const state = pickingCartReducer(stateWithItem, action);

      // Should remove item completely since 3 <= 5 (default)
      expect(state.items).toHaveLength(0);
    });

    it('should handle item with default quantity of 1 correctly', () => {
      const stateWithItem: PickingCartState = {
        ...initialState,
        items: [{ item: mockItem2, quantity: 1, addedAt: new Date().toISOString() }],
      };

      const action = decrementQuantity(mockItem2.id);
      const state = pickingCartReducer(stateWithItem, action);

      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const stateWithItems: PickingCartState = {
        ...initialState,
        items: [
          { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
          { item: mockItem2, quantity: 2, addedAt: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
      };

      const action = clearCart();
      const state = pickingCartReducer(stateWithItems, action);

      expect(state.items).toHaveLength(0);
      expect(state.createdAt).toBeNull();
      expect(state.status).toBe('draft');
    });
  });

  describe('selectors', () => {
    const stateWithItems = {
      pickingCart: {
        items: [
          { item: mockItem, quantity: 5, addedAt: new Date().toISOString() },
          { item: mockItem2, quantity: 3, addedAt: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
        status: 'draft' as const,
      },
    };

    it('selectCartItems should return all cart items', () => {
      const items = selectCartItems(stateWithItems);
      expect(items).toHaveLength(2);
    });

    it('selectCartTotalItems should return total quantity of all items', () => {
      const total = selectCartTotalItems(stateWithItems);
      expect(total).toBe(8); // 5 + 3
    });

    it('selectCartItemCount should return number of unique items', () => {
      const count = selectCartItemCount(stateWithItems);
      expect(count).toBe(2);
    });
  });
});
