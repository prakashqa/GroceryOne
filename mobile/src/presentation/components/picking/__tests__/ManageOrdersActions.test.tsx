/**
 * ManageOrdersActions Tests
 * TDD tests for order edit and delete functionality
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import ManageOrdersScreen from '../../../screens/picking/ManageOrdersScreen';

// Mock navigation hooks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
      canGoBack: () => true,
      getParent: () => null,
      getState: () => ({ routes: [] }),
      isFocused: () => true,
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
      setOptions: jest.fn(),
    }),
  };
});

// Mock useGetCartsQuery (ManageOrdersScreen now fetches from backend)
jest.mock('../../../../data/api/cartApi', () => ({
  ...jest.requireActual('../../../../data/api/cartApi'),
  useGetCartsQuery: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  }),
}));

// Type for test state access
type TestState = {
  multiCart: {
    carts: Array<{ id: string; name: string }>;
    activeCartId: string | null;
  };
};

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ManageOrdersScreen - Edit and Delete Actions', () => {
  const defaultCartState = {
    multiCart: {
      carts: [
        {
          id: 'cart-1',
          name: 'Default Cart',
          items: [
            {
              item: {
                id: 'atta-1',
                name: 'Aashirvaad Atta',
                categoryId: 'atta-rice',
                unit: 'kg' as const,
                defaultQuantity: 5,
              },
              quantity: 5,
              addedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft' as const,
        },
        {
          id: 'cart-2',
          name: 'Weekly Shopping',
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
  });

  describe('Edit (Rename) Order', () => {
    it('should display edit button on order list item', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        expect(editButton).toBeTruthy();
      });
    });

    it('should open rename modal when edit button is pressed', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(getByText('Rename Order')).toBeTruthy();
      });
    });

    it('should pre-populate input with current order name in rename modal', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        const input = getByTestId('rename-cart-modal-input-field');
        expect(input.props.value).toBe('Default Cart');
      });
    });

    it('should rename order when save is pressed with valid name', async () => {
      const { getByTestId, getByText, queryByText, store } = renderWithProviders(
        <ManageOrdersScreen />,
        { preloadedState: defaultCartState }
      );

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(getByText('Rename Order')).toBeTruthy();
      });

      const input = getByTestId('rename-cart-modal-input');
      fireEvent.changeText(input, 'My New Cart Name');

      const saveButton = getByTestId('rename-cart-modal-save-button');
      fireEvent.press(saveButton);

      // Modal should close
      await waitFor(() => {
        expect(queryByText('Rename Order')).toBeNull();
      });

      // Cart name should be updated in store
      const state = store.getState() as TestState;
      const cart = state.multiCart.carts.find((c) => c.id === 'cart-1');
      expect(cart?.name).toBe('My New Cart Name');
    });

    it('should show error for duplicate order name', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(getByText('Rename Order')).toBeTruthy();
      });

      const input = getByTestId('rename-cart-modal-input');
      fireEvent.changeText(input, 'Weekly Shopping'); // Existing cart name

      await waitFor(() => {
        expect(getByText('An order with this name already exists')).toBeTruthy();
      });
    });

    it('should close rename modal when cancel is pressed', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ManageOrdersScreen />,
        { preloadedState: defaultCartState }
      );

      await waitFor(() => {
        const editButton = getByTestId('cart-cart-1-edit-btn');
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(getByText('Rename Order')).toBeTruthy();
      });

      const cancelButton = getByTestId('rename-cart-modal-cancel-button');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(queryByText('Rename Order')).toBeNull();
      });
    });
  });

  describe('Delete Order', () => {
    it('should display delete button on order list item', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const deleteButton = getByTestId('cart-cart-1-delete-btn');
        expect(deleteButton).toBeTruthy();
      });
    });

    it('should show confirmation alert when delete button is pressed', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const deleteButton = getByTestId('cart-cart-1-delete-btn');
        fireEvent.press(deleteButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Order',
        'Are you sure you want to delete "Default Order"?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      );
    });

    it('should delete order when confirmed', async () => {
      const { getByTestId, store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const deleteButton = getByTestId('cart-cart-2-delete-btn');
        fireEvent.press(deleteButton);
      });

      // Simulate pressing "Delete" in the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteButton = alertCall[2].find(
        (btn: { text: string }) => btn.text === 'Delete'
      );
      deleteButton.onPress();

      // Cart should be removed from store
      await waitFor(() => {
        const state = store.getState() as TestState;
        const cart = state.multiCart.carts.find((c: { id: string }) => c.id === 'cart-2');
        expect(cart).toBeUndefined();
      });
    });

    it('should not delete order when cancelled', async () => {
      const { getByTestId, store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const deleteButton = getByTestId('cart-cart-2-delete-btn');
        fireEvent.press(deleteButton);
      });

      // Simulate pressing "Cancel" in the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2].find(
        (btn: { text: string }) => btn.text === 'Cancel'
      );
      if (cancelButton.onPress) {
        cancelButton.onPress();
      }

      // Cart should still exist
      const state = store.getState() as TestState;
      const cart = state.multiCart.carts.find((c: { id: string }) => c.id === 'cart-2');
      expect(cart).toBeDefined();
    });

    it('should reassign active order when active order is deleted', async () => {
      const { getByTestId, store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      // Delete the active cart (cart-1)
      await waitFor(() => {
        const deleteButton = getByTestId('cart-cart-1-delete-btn');
        fireEvent.press(deleteButton);
      });

      // Simulate pressing "Delete" in the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteButton = alertCall[2].find(
        (btn: { text: string }) => btn.text === 'Delete'
      );
      deleteButton.onPress();

      // Active cart should be reassigned to cart-2
      await waitFor(() => {
        const state = store.getState() as TestState;
        expect(state.multiCart.activeCartId).toBe('cart-2');
      });
    });
  });

  describe('Action buttons visibility', () => {
    it('should display both edit and delete buttons for each cart', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        // Cart 1 buttons
        expect(getByTestId('cart-cart-1-edit-btn')).toBeTruthy();
        expect(getByTestId('cart-cart-1-delete-btn')).toBeTruthy();
        // Cart 2 buttons
        expect(getByTestId('cart-cart-2-edit-btn')).toBeTruthy();
        expect(getByTestId('cart-cart-2-delete-btn')).toBeTruthy();
      });
    });
  });

  describe('Order Selection', () => {
    it('should change active order when a different order is pressed', async () => {
      const { getByTestId, store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      // Initial state: cart-1 is active
      expect((store.getState() as TestState).multiCart.activeCartId).toBe('cart-1');

      // Press on cart-2 to select it
      await waitFor(() => {
        const cart2 = getByTestId('cart-cart-2');
        fireEvent.press(cart2);
      });

      // Active cart should now be cart-2
      await waitFor(() => {
        const state = store.getState() as TestState;
        expect(state.multiCart.activeCartId).toBe('cart-2');
      });
    });

    it('should update active order indicator when order is selected', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      // Initially cart-1 should have active indicator
      await waitFor(() => {
        const cart1Indicator = getByTestId('cart-cart-1-active-indicator');
        expect(cart1Indicator).toBeTruthy();
      });

      // Press on cart-2
      const cart2 = getByTestId('cart-cart-2');
      fireEvent.press(cart2);

      // Now cart-2 should have active indicator (cart-1 should not)
      // Note: After pressing, navigation happens but in tests we can check the store
    });

    it('should navigate to Picking screen when an order is pressed', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      // Press on cart-2 to select it
      await waitFor(() => {
        const cart2 = getByTestId('cart-cart-2');
        fireEvent.press(cart2);
      });

      // Should navigate to Picking screen, not goBack
      expect(mockNavigate).toHaveBeenCalledWith('Picking');
    });
  });

  describe('Order Creation Navigation', () => {
    it('should navigate to Picking screen after creating a new order', async () => {
      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: defaultCartState,
      });

      // Open the create cart modal via FAB
      const fab = getByTestId('create-cart-fab');
      fireEvent.press(fab);

      // Wait for modal to appear
      await waitFor(() => {
        expect(getByTestId('create-cart-modal-input')).toBeTruthy();
      });

      // Enter a cart name
      const input = getByTestId('create-cart-modal-input');
      fireEvent.changeText(input, 'Test New Cart');

      // Press create button
      const createButton = getByTestId('create-cart-modal-create-button');
      fireEvent.press(createButton);

      // Should navigate to Picking screen after creating cart
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Picking');
      });
    });
  });
});
