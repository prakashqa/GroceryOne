/**
 * PickingScreen Tests
 * TDD tests for item interactions, cart navigation, and modal integration
 * Updated for redesigned 2-column grid layout
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import PickingScreen from '../PickingScreen';
import { loadOrSeedCatalog } from '../../../../utils/storage/catalogStorage';

// Mock catalogStorage for retry tests
jest.mock('../../../../utils/storage/catalogStorage', () => ({
  loadOrSeedCatalog: jest.fn(),
}));

const mockLoadOrSeedCatalog = loadOrSeedCatalog as jest.MockedFunction<typeof loadOrSeedCatalog>;

// Seed catalog data for tests that need items to render
const seedCatalogState = {
  catalog: {
    categories: [
      { id: 'atta-rice', name: 'Atta, Rice & Grains', icon: '🌾' },
      { id: 'dal-pulses', name: 'Dal & Pulses', icon: '🫘' },
      { id: 'oils', name: 'Cooking Oils', icon: '🫒' },
    ],
    items: [
      { id: 'atta-1', name: 'Aashirvaad Atta', categoryId: 'atta-rice', unit: 'kg' as const, defaultQuantity: 5, mrp: 250 },
      { id: 'atta-2', name: 'Fortune Chakki Atta', categoryId: 'atta-rice', unit: 'kg' as const, defaultQuantity: 5, mrp: 240 },
      { id: 'rice-1', name: 'India Gate Basmati', categoryId: 'atta-rice', unit: 'kg' as const, defaultQuantity: 1, mrp: 180 },
      { id: 'dal-1', name: 'Toor Dal', categoryId: 'dal-pulses', unit: 'kg' as const, defaultQuantity: 1, mrp: 150 },
      { id: 'oil-1', name: 'Fortune Sunflower Oil', categoryId: 'oils', unit: 'l' as const, defaultQuantity: 1, mrp: 180 },
    ],
    isInitialized: true,
  },
};

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

  describe('item grid interactions', () => {
    it('should render items in the grid', async () => {
      const { getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Default category is Atta, Rice & Grains
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });
    });

    it('should open AddQuantityModal when product card is pressed', async () => {
      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the product card pressable area (not the Add button)
      const itemPressable = getByTestId('product-grid-item-atta-1-pressable');
      fireEvent.press(itemPressable);

      // Modal should be visible
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
        expect(getByText('Select Quantity')).toBeTruthy();
      });
    });

    it('should not open modal when Add button is pressed directly', async () => {
      const { getByText, getByTestId, queryByText } = renderWithProviders(
        <PickingScreen />,
        { preloadedState: seedCatalogState }
      );

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press the Add button (not the card)
      const addButton = getByTestId('product-grid-item-atta-1-add-button');
      fireEvent.press(addButton);

      // Modal should NOT be visible
      expect(queryByText('Add Atta')).toBeNull();
      expect(queryByText('Select Quantity')).toBeNull();
    });

    it('should add item with default quantity when Add button is pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press the Add button
      const addButton = getByTestId('product-grid-item-atta-1-add-button');
      fireEvent.press(addButton);

      // Item should be added to cart with default quantity
      // The item card should now show quantity controls (Add button should be gone)
      await waitFor(() => {
        // Add button should be replaced with quantity controls
        expect(queryByTestId('product-grid-item-atta-1-add-button')).toBeNull();
        expect(getByText('In Cart')).toBeTruthy();
      });
    });

    it('should add item with custom quantity when selected in modal', async () => {
      const { getByText, getByTestId, getAllByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the product card pressable area to open modal
      const itemPressable = getByTestId('product-grid-item-atta-1-pressable');
      fireEvent.press(itemPressable);

      // Wait for modal
      await waitFor(() => {
        expect(getByText('Add Atta')).toBeTruthy();
      });

      // Select quantity 2 (one of the preset quantities for kg: [0.5, 1, 2, 5])
      fireEvent.press(getByTestId('quantity-option-2'));

      // Press Add to Cart
      fireEvent.press(getByText('Add to Cart'));

      // Modal should close and item should be added with quantity 2
      await waitFor(() => {
        expect(getByText('In Cart')).toBeTruthy();
        // Find the quantity display text
        const twoTexts = getAllByText('2');
        expect(twoTexts.length).toBeGreaterThan(0);
      });
    });

    it('should close modal when close button is pressed', async () => {
      const { getByText, getByTestId, queryByText } = renderWithProviders(
        <PickingScreen />,
        { preloadedState: seedCatalogState }
      );

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Press on the product card to open modal
      const itemPressable = getByTestId('product-grid-item-atta-1-pressable');
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
  });

  describe('cart tabs navigation', () => {
    const defaultCartState = {
      ...seedCatalogState,
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

    it('should display active cart tab with cart name', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const activeCartBtn = getByTestId('cart-tabs-active-cart');
        expect(activeCartBtn).toBeTruthy();
        expect(getByText('Default Cart')).toBeTruthy();
      });
    });

    it('should display Cart List button', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartListBtn = getByTestId('cart-tabs-cart-list');
        expect(cartListBtn).toBeTruthy();
        expect(getByText('Cart List')).toBeTruthy();
      });
    });

    it('should display New Cart button', async () => {
      const { getByTestId, getByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const newCartBtn = getByTestId('cart-tabs-new-cart');
        expect(newCartBtn).toBeTruthy();
        expect(getByText('New Cart')).toBeTruthy();
      });
    });

    it('should navigate to Cart screen when active cart tab is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const activeCartBtn = getByTestId('cart-tabs-active-cart');
        expect(activeCartBtn).toBeTruthy();
      });

      const activeCartBtn = getByTestId('cart-tabs-active-cart');
      fireEvent.press(activeCartBtn);

      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });

    it('should navigate to ManageCarts screen when Cart List button is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const cartListBtn = getByTestId('cart-tabs-cart-list');
        expect(cartListBtn).toBeTruthy();
      });

      const cartListBtn = getByTestId('cart-tabs-cart-list');
      fireEvent.press(cartListBtn);

      expect(mockNavigate).toHaveBeenCalledWith('ManageCarts');
    });

    it('should navigate to CameraCapture screen when scan button is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: defaultCartState,
      });

      await waitFor(() => {
        const scanButton = getByTestId('picking-header-scan-button');
        expect(scanButton).toBeTruthy();
      });

      const scanButton = getByTestId('picking-header-scan-button');
      fireEvent.press(scanButton);

      expect(mockNavigate).toHaveBeenCalledWith('CameraCapture');
    });

    it('should show cart count badge on Cart List button when multiple carts exist', async () => {
      const multiCartState = {
        ...seedCatalogState,
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
        const badge = getByTestId('cart-tabs-list-badge');
        expect(badge).toBeTruthy();
        expect(badge.props.children).toBe(2);
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
  });

  describe('cart footer', () => {
    it('should show cart footer when items are in cart', async () => {
      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Add an item to cart
      const addButton = getByTestId('product-grid-item-atta-1-add-button');
      fireEvent.press(addButton);

      // Cart footer should appear
      await waitFor(() => {
        expect(getByTestId('cart-footer')).toBeTruthy();
        // Text can be "1 item added" or "1 items added" depending on i18n pluralization in test env
        expect(getByText(/1 items? added/)).toBeTruthy();
        expect(getByText('View Cart')).toBeTruthy();
      });
    });

    it('should navigate to Cart when View Cart is pressed', async () => {
      mockUseNavigationSpy = true;

      const { getByText, getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      // Wait for items to load
      await waitFor(() => {
        expect(getByText('Aashirvaad Atta')).toBeTruthy();
      });

      // Add an item to cart
      const addButton = getByTestId('product-grid-item-atta-1-add-button');
      fireEvent.press(addButton);

      // Wait for cart footer to appear
      await waitFor(() => {
        expect(getByTestId('cart-footer')).toBeTruthy();
      });

      // Press View Cart button
      const viewCartButton = getByTestId('cart-footer-button');
      fireEvent.press(viewCartButton);

      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });
  });

  describe('category selection', () => {
    it('should display category bar with categories', async () => {
      const { getByTestId, getAllByText } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      await waitFor(() => {
        expect(getByTestId('category-bar')).toBeTruthy();
        // Categories should be visible (icon may appear multiple times in UI)
        expect(getAllByText('🌾').length).toBeGreaterThan(0);
      });
    });

    it('should display category header with item count', async () => {
      const { getByTestId } = renderWithProviders(<PickingScreen />, {
        preloadedState: seedCatalogState,
      });

      await waitFor(() => {
        expect(getByTestId('category-header')).toBeTruthy();
      });
    });
  });
});
