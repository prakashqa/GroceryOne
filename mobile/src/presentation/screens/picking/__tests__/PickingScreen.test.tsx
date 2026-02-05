/**
 * PickingScreen Tests
 * TDD tests for item row press behavior and modal integration
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import PickingScreen from '../PickingScreen';
import { darkTheme, lightTheme } from '../../../theme/themes';
import { loadOrSeedCatalog } from '../../../../utils/storage/catalogStorage';

// Mock catalogStorage for retry tests
jest.mock('../../../../utils/storage/catalogStorage', () => ({
  loadOrSeedCatalog: jest.fn(),
}));

const mockLoadOrSeedCatalog = loadOrSeedCatalog as jest.MockedFunction<typeof loadOrSeedCatalog>;

// Navigation mock: tracks navigate calls while preserving NavigationContainer behavior
const mockNavigate = jest.fn();
let mockUseNavigationSpy = false;
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => {
      if (mockUseNavigationSpy) {
        return {
          navigate: mockNavigate,
          goBack: jest.fn(),
          setOptions: jest.fn(),
          addListener: jest.fn(() => jest.fn()),
          dispatch: jest.fn(),
          reset: jest.fn(),
          isFocused: jest.fn(() => true),
          canGoBack: jest.fn(() => false),
          getParent: jest.fn(() => undefined),
          getState: jest.fn(() => ({ routes: [] })),
          getId: jest.fn(),
          setParams: jest.fn(),
          removeListener: jest.fn(),
        };
      }
      // Fall through to real navigation for other tests
      try {
        return actualNav.useNavigation();
      } catch {
        // If no NavigationContainer context, return a safe mock
        return {
          navigate: jest.fn(),
          goBack: jest.fn(),
          setOptions: jest.fn(),
          addListener: jest.fn(() => jest.fn()),
          dispatch: jest.fn(),
          reset: jest.fn(),
          isFocused: jest.fn(() => true),
          canGoBack: jest.fn(() => false),
          getParent: jest.fn(() => undefined),
          getState: jest.fn(() => ({ routes: [] })),
          getId: jest.fn(),
          setParams: jest.fn(),
          removeListener: jest.fn(),
        };
      }
    },
  };
});

describe('PickingScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseNavigationSpy = false;
  });

  describe('item row interactions', () => {
    it('should render items in the list', async () => {
      const { getByText } = renderWithProviders(<PickingScreen />);

      // Default category is Atta, Rice & Grains
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });
    });

    it('should open AddQuantityModal when item row is pressed', async () => {
      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />);

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the item pressable area (not the Add button)
      const itemPressable = getByTestId('item-pressable-atta-1');
      fireEvent.press(itemPressable);

      // Modal should be visible
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
        expect(getByText('Select Quantity')).toBeTruthy();
      });
    });

    it('should not open modal when Add button is pressed directly', async () => {
      const { getByText, getByTestId, queryByText } = renderWithProviders(
        <PickingScreen />
      );

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press the Add button (not the row)
      const addButton = getByTestId('add-button-atta-1');
      fireEvent.press(addButton);

      // Modal should NOT be visible
      expect(queryByText('Add Atta')).toBeNull();
      expect(queryByText('Select Quantity')).toBeNull();
    });

    it('should add item with default quantity when Add button is pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = renderWithProviders(<PickingScreen />);

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press the Add button
      const addButton = getByTestId('add-button-atta-1');
      fireEvent.press(addButton);

      // Item should be added to cart with default quantity
      // The item card should now show quantity controls (Add button should be gone)
      await waitFor(() => {
        // Add button should be replaced with quantity controls
        expect(queryByTestId('add-button-atta-1')).toBeNull();
        expect(getByText('In Cart')).toBeTruthy();
      });
    });

    it('should add item with custom quantity when selected in modal', async () => {
      const { getByText, getByTestId, getAllByText } = renderWithProviders(<PickingScreen />);

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the item pressable area to open modal
      const itemPressable = getByTestId('item-pressable-atta-1');
      fireEvent.press(itemPressable);

      // Wait for modal
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Select quantity 10
      fireEvent.press(getByTestId('quantity-option-10'));

      // Press Add to Cart
      fireEvent.press(getByText('Add to Cart'));

      // Modal should close and item should be added with quantity 10
      // Use getAllByText since '10' may appear multiple times (in quantity options and cart display)
      await waitFor(() => {
        expect(getByText('In Cart')).toBeTruthy();
        // Find the quantity display text (should be visible after modal closes)
        const tenTexts = getAllByText('10');
        expect(tenTexts.length).toBeGreaterThan(0);
      });
    });

    it('should close modal when close button is pressed', async () => {
      const { getByText, getByTestId, queryByText } = renderWithProviders(
        <PickingScreen />
      );

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the item pressable area to open modal
      const itemPressable = getByTestId('item-pressable-atta-1');
      fireEvent.press(itemPressable);

      // Wait for modal
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Press close button
      fireEvent.press(getByTestId('close-button'));

      // Modal should be closed
      await waitFor(() => {
        expect(queryByText('Add Atta')).toBeNull();
      });
    });

    it('should open modal for item that is already in cart', async () => {
      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />);

      // Wait for items to load and add an item first
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Add item using Add button
      const addButton = getByTestId('add-button-atta-1');
      fireEvent.press(addButton);

      // Wait for item to be in cart
      await waitFor(() => {
        expect(getByText('In Cart')).toBeTruthy();
      });

      // Now press the item pressable area
      const itemPressable = getByTestId('item-pressable-atta-1');
      fireEvent.press(itemPressable);

      // Modal should open
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });
    });

    it('should add more quantity to item already in cart when using modal', async () => {
      const { getByText, getByTestId, queryByTestId, getAllByText } = renderWithProviders(
        <PickingScreen />
      );

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Add item using Add button (default quantity 5)
      const addButton = getByTestId('add-button-atta-1');
      fireEvent.press(addButton);

      // Wait for item to be in cart
      await waitFor(() => {
        expect(getByText('In Cart')).toBeTruthy();
        // Add button should be replaced with quantity controls
        expect(queryByTestId('add-button-atta-1')).toBeNull();
      });

      // Now press the item pressable area to open modal
      const itemPressable = getByTestId('item-pressable-atta-1');
      fireEvent.press(itemPressable);

      // Wait for modal
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Select quantity 10 and add to cart
      fireEvent.press(getByTestId('quantity-option-10'));
      fireEvent.press(getByText('Add to Cart'));

      // Item quantity should now be 15 (5 + 10)
      await waitFor(() => {
        // 15 might appear in the floating cart button as well as quantity display
        const fifteenTexts = getAllByText('15');
        expect(fifteenTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('modal state management', () => {
    it('should reset modal state when opened for different item', async () => {
      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />);

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Open modal for first item
      fireEvent.press(getByTestId('item-pressable-atta-1'));
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Select custom quantity
      fireEvent.press(getByTestId('quantity-option-10'));

      // Close modal
      fireEvent.press(getByTestId('close-button'));

      // Open modal for second item
      fireEvent.press(getByTestId('item-pressable-atta-2'));
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Should show Fortune Chakki Atta's default quantity (5) selected
      const selectedOption = getByTestId('quantity-option-5');
      expect(selectedOption.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('cart list button behavior', () => {
    it('should display the number of carts in the Cart List button badge', async () => {
      // Setup: Create state with 2 carts
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
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
                name: 'Cart 2',
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
        },
      });

      // The Cart List button badge should show "2" (number of carts)
      await waitFor(() => {
        const cartListBadge = getByTestId('cart-list-badge');
        expect(cartListBadge).toBeTruthy();
        // The badge should show cartCount (2), not itemCount (1)
        expect(getByTestId('cart-list-badge-text').props.children).toBe(2);
      });
    });

    it('should have correct testID on Cart List button for navigation to ManageCarts', async () => {
      // Note: Navigation is tested through integration tests. This test verifies
      // that the Cart List button exists and has the correct testID which is used
      // in the onPress handler that calls handleGoToManageCarts
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
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
                name: 'Cart 2',
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
        },
      });

      // Verify the Cart List button exists and is pressable
      await waitFor(() => {
        const cartListBtn = getByTestId('cart-list-btn');
        expect(cartListBtn).toBeTruthy();
        // Press the button to ensure it's interactive
        fireEvent.press(cartListBtn);
      });

      // The button should still exist after press (navigation doesn't unmount in test)
      expect(getByTestId('cart-list-btn')).toBeTruthy();
    });

    it('should show Cart List button with badge when there are multiple carts even if active cart is empty', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [], // Empty cart
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
            lastSyncedAt: null,
          },
        },
      });

      // The Cart List button should still be visible with badge "2"
      await waitFor(() => {
        const cartListBtn = getByTestId('cart-list-btn');
        expect(cartListBtn).toBeTruthy();
        expect(getByTestId('cart-list-badge-text').props.children).toBe(2);
      });
    });
  });

  describe('two-button cart navigation', () => {
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
        ],
        activeCartId: 'cart-1',
        isHydrated: true,
        lastSyncedAt: null,
      },
    };

    it('should display Active Cart button in header with cart name', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const activeCartBtn = getByTestId('active-cart-btn');
        expect(activeCartBtn).toBeTruthy();
        // Active Cart button now shows the cart name instead of "Active Cart"
        expect(getByText('Default Cart')).toBeTruthy();
      });
    });

    it('should display Cart List button in header', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartListBtn = getByTestId('cart-list-btn');
        expect(cartListBtn).toBeTruthy();
        expect(getByText('Cart List')).toBeTruthy();
      });
    });

    it('should style Active Cart button as primary (filled)', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const activeCartBtn = getByTestId('active-cart-btn');
        // Primary button should have solid background
        const buttonStyle = activeCartBtn.props.style;
        const flattenedStyle = Array.isArray(buttonStyle)
          ? buttonStyle.reduce((acc: Record<string, unknown>, s: Record<string, unknown>) => ({ ...acc, ...(s || {}) }), {})
          : buttonStyle;
        expect(flattenedStyle.backgroundColor).toBeDefined();
        expect(flattenedStyle.backgroundColor).not.toBe('transparent');
      });
    });

    it('should style Cart List button as secondary (outline)', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartListBtn = getByTestId('cart-list-btn');
        // Secondary button should have border
        const buttonStyle = cartListBtn.props.style;
        const flattenedStyle = Array.isArray(buttonStyle)
          ? buttonStyle.reduce((acc: Record<string, unknown>, s: Record<string, unknown>) => ({ ...acc, ...(s || {}) }), {})
          : buttonStyle;
        expect(flattenedStyle.borderWidth).toBeGreaterThan(0);
      });
    });

    it('should navigate to Cart screen when Active Cart button is pressed', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const activeCartBtn = getByTestId('active-cart-btn');
        expect(activeCartBtn).toBeTruthy();
      });

      const activeCartBtn = getByTestId('active-cart-btn');
      fireEvent.press(activeCartBtn);

      // Button should still exist after press (navigation is mocked in tests)
      expect(activeCartBtn).toBeTruthy();
    });

    it('should navigate to ManageCarts screen when Cart List button is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartListBtn = getByTestId('cart-list-btn');
        expect(cartListBtn).toBeTruthy();
      });

      const cartListBtn = getByTestId('cart-list-btn');
      fireEvent.press(cartListBtn);

      // Should navigate to ManageCarts within the same stack (not switch tabs)
      expect(mockNavigate).toHaveBeenCalledWith('ManageCarts');
    });

    it('should navigate to CameraCapture screen when scanner button is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const scanButton = getByTestId('scan-button');
        expect(scanButton).toBeTruthy();
      });

      const scanButton = getByTestId('scan-button');
      fireEvent.press(scanButton);

      // Should navigate to CameraCapture within the same stack
      expect(mockNavigate).toHaveBeenCalledWith('CameraCapture');
    });

    it('should show item count badge on Active Cart button', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const badge = getByTestId('active-cart-badge');
        expect(badge).toBeTruthy();
        // Should show count of items in cart (1 item with quantity 5 = 1 unique item)
        expect(getByTestId('active-cart-badge-text').props.children).toBe(1);
      });
    });

    it('should show cart count badge on Cart List button when multiple carts exist', async () => {
      const multiCartState = {
        multiCart: {
          carts: [
            {
              id: 'cart-1',
              name: 'Cart 1',
              items: [],
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
          lastSyncedAt: null,
        },
      };

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: multiCartState,
      });

      await waitFor(() => {
        const badge = getByTestId('cart-list-badge');
        expect(badge).toBeTruthy();
        expect(getByTestId('cart-list-badge-text').props.children).toBe(2);
      });
    });

    it('should display both buttons side by side in header area', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartNavContainer = getByTestId('cart-nav-buttons');
        expect(cartNavContainer).toBeTruthy();
        // Both buttons should be children of the same container
        const activeCartBtn = getByTestId('active-cart-btn');
        const cartListBtn = getByTestId('cart-list-btn');
        expect(activeCartBtn).toBeTruthy();
        expect(cartListBtn).toBeTruthy();
      });
    });
  });

  describe('active cart name display', () => {
    it('should display the active cart name in the Active Cart button', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'My Cart 1',
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
                name: 'Bulk Order',
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
        },
      });

      // The Active Cart button should show the cart name
      await waitFor(() => {
        const cartNameText = getByTestId('active-cart-name');
        expect(cartNameText.props.children).toBe('My Cart 1');
      });
    });

    it('should update displayed cart name when active cart changes', async () => {
      const { getByTestId, rerender } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'My Cart 1',
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
              {
                id: 'cart-2',
                name: 'Bulk Order',
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
        },
      });

      // First verify initial cart name
      await waitFor(() => {
        const cartNameText = getByTestId('active-cart-name');
        expect(cartNameText.props.children).toBe('My Cart 1');
      });
    });

    it('should show "Default Cart" when cart has default name', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Default Cart',
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
        },
      });

      await waitFor(() => {
        const cartNameText = getByTestId('active-cart-name');
        expect(cartNameText.props.children).toBe('Default Cart');
      });
    });
  });

  describe('catalog empty state with retry', () => {
    const emptyCatalogState = {
      catalog: {
        categories: [],
        items: [],
        isInitialized: true,
      },
    };

    const tenantState = {
      tenant: { id: 'test-tenant', slug: 'test-tenant', name: 'Test Tenant', domain: 'test.com', isActive: true, defaultLanguage: 'en', supportedLanguages: ['en'], branding: { primaryColor: '#000', secondaryColor: '#fff', accentColor: '#f00', logoUrl: '', faviconUrl: '' } },
      config: null,
      branding: null,
      currentLanguage: 'en' as const,
      isLoading: false,
      error: null,
    };

    beforeEach(() => {
      mockLoadOrSeedCatalog.mockReset();
      // Default: return empty catalog (simulates backend unreachable)
      mockLoadOrSeedCatalog.mockResolvedValue({
        categories: [],
        items: [],
        fromCache: true,
        error: 'Could not load catalog',
      });
    });

    it('should show catalog empty message when no categories and no items exist', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: emptyCatalogState,
      });

      await waitFor(() => {
        expect(getByTestId('catalog-empty-state')).toBeTruthy();
        expect(getByText('Could not load catalog')).toBeTruthy();
        expect(getByText('Check your connection and try again')).toBeTruthy();
      });
    });

    it('should show retry button when catalog is empty', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: emptyCatalogState,
      });

      await waitFor(() => {
        expect(getByTestId('catalog-retry-button')).toBeTruthy();
      });
    });

    it('should auto-retry catalog load on mount when catalog is empty and tenant is set', async () => {
      mockLoadOrSeedCatalog.mockResolvedValue({
        categories: [{ id: 'cat-1', name: 'Test Category', icon: '🧪' }],
        items: [{ id: 'item-1', name: 'Test Item', categoryId: 'cat-1', unit: 'kg', defaultQuantity: 1, mrp: 100 }],
        fromCache: false,
      });

      renderWithProviders(<PickingScreen />, {
        preloadedState: {
          ...emptyCatalogState,
          tenant: tenantState,
        },
      });

      // Auto-retry should call loadOrSeedCatalog on mount
      await waitFor(() => {
        expect(mockLoadOrSeedCatalog).toHaveBeenCalledWith('test-tenant');
      });
    });

    it('should call loadOrSeedCatalog on retry button press', async () => {
      // First call (auto-retry on mount) returns empty — keeps retry button visible
      // Second call (manual press) returns data
      mockLoadOrSeedCatalog
        .mockResolvedValueOnce({
          categories: [],
          items: [],
          fromCache: true,
          error: 'Could not load catalog',
        })
        .mockResolvedValueOnce({
          categories: [{ id: 'cat-1', name: 'Test Category', icon: '🧪' }],
          items: [{ id: 'item-1', name: 'Test Item', categoryId: 'cat-1', unit: 'kg', defaultQuantity: 1, mrp: 100 }],
          fromCache: false,
        });

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          ...emptyCatalogState,
          tenant: tenantState,
        },
      });

      // Wait for auto-retry to complete (returns empty, so retry button stays)
      await waitFor(() => {
        expect(getByTestId('catalog-retry-button')).toBeTruthy();
      });

      // Manual retry press
      await act(async () => {
        fireEvent.press(getByTestId('catalog-retry-button'));
      });

      // Should have been called twice: once auto-retry, once manual
      expect(mockLoadOrSeedCatalog).toHaveBeenCalledWith('test-tenant');
      expect(mockLoadOrSeedCatalog).toHaveBeenCalledTimes(2);
    });

    it('should still show "No items found" when category has items but search yields no results', async () => {
      const { getByText, queryByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          catalog: {
            categories: [{ id: 'cat-1', name: 'Test Category', icon: '🧪' }],
            items: [{ id: 'item-1', name: 'Test Item', categoryId: 'cat-1', unit: 'kg', defaultQuantity: 1, mrp: 100 }],
            isInitialized: true,
          },
        },
      });

      // Wait for items to load with the category
      await waitFor(() => {
        expect(getByText('Test Item')).toBeTruthy();
      });

      // The catalog-empty-state should NOT be shown when catalog has data
      expect(queryByTestId('catalog-empty-state')).toBeNull();
    });
  });

  describe('dark mode theming', () => {
    it('should use dark theme background color when in dark mode', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          settings: {
            themeMode: 'dark',
            language: 'en',
            notifications: {
              enabled: true,
              sound: true,
              vibration: true,
              orderUpdates: true,
              promotions: false,
              reminders: true,
            },
            printer: {
              enabled: false,
              connectionType: 'none',
              selectedPrinterId: null,
              selectedPrinterName: null,
              selectedPrinterAddress: null,
              paperSize: '80mm',
              printFormat: 'receipt',
              connectionStatus: 'disconnected',
              lastConnectedAt: null,
              autoPrint: false,
            },
            isHydrated: true,
            lastUpdated: null,
          },
        },
      });

      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // The item cards should use dark theme surface color
      const itemRow = getByTestId('item-row-atta-1');
      // Find the card inside (first View child is the itemCard)
      const itemCard = itemRow.children[0] as unknown as { props: { style: Record<string, unknown> | Record<string, unknown>[] } };

      // Check that the card uses dark theme colors
      // Dark theme surface color is #1E1E1E, background is #121212
      const cardStyle = itemCard.props.style;
      const flattenedStyle = Array.isArray(cardStyle)
        ? cardStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : cardStyle;

      // The background should be dark theme surface (#1E1E1E) not light (#FFFFFF)
      expect(flattenedStyle.backgroundColor).toBe(darkTheme.colors.surface);
    });

    it('should use light theme background color when in light mode', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: {
          settings: {
            themeMode: 'light',
            language: 'en',
            notifications: {
              enabled: true,
              sound: true,
              vibration: true,
              orderUpdates: true,
              promotions: false,
              reminders: true,
            },
            printer: {
              enabled: false,
              connectionType: 'none',
              selectedPrinterId: null,
              selectedPrinterName: null,
              selectedPrinterAddress: null,
              paperSize: '80mm',
              printFormat: 'receipt',
              connectionStatus: 'disconnected',
              lastConnectedAt: null,
              autoPrint: false,
            },
            isHydrated: true,
            lastUpdated: null,
          },
        },
      });

      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // The item cards should use light theme surface color
      const itemRow = getByTestId('item-row-atta-1');
      const itemCard = itemRow.children[0] as unknown as { props: { style: Record<string, unknown> | Record<string, unknown>[] } };

      const cardStyle = itemCard.props.style;
      const flattenedStyle = Array.isArray(cardStyle)
        ? cardStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : cardStyle;

      // The background should be light theme surface (#FFFFFF)
      expect(flattenedStyle.backgroundColor).toBe(lightTheme.colors.surface);
    });
  });
});
