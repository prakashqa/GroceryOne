/**
 * ItemsScreen Tests
 * TDD tests for the Items tab quick-add-to-cart screen
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Redux
const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: Function) => mockUseSelector(selector),
  useDispatch: () => mockDispatch,
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, any>) => {
      const translations: Record<string, string> = {
        'items.title': 'Items',
        'items.searchPlaceholder': 'Search items...',
        'items.allCategories': 'All',
        'items.noItems': 'No items found',
        'items.addedToCart': 'Added to cart',
        'picking.add': 'Add',
        'picking.inOrder': 'In Order',
        'picking.outOfStock': 'OUT OF STOCK',
        'picking.lowStock': 'LOW STOCK',
        'picking.viewCart': 'View Order',
        'picking.itemsAdded': '{{count}} items added',
      };
      return translations[key] || (typeof fallback === 'string' ? fallback : key);
    },
    i18n: { language: 'en' },
  }),
}));

// Mock responsive hooks
const mockDeviceType = { isTablet: false, isPhone: true };
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => mockDeviceType,
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock safe area insets (used by OrderFooter)
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock AddQuantityModal
jest.mock('../../picking/AddQuantityModal', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      props.visible ? <View testID="add-quantity-modal" /> : null,
  };
});

// Mock item translations
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (item: any) => item.name,
  getTranslatedCategoryName: (cat: any) => cat.name,
}));

// Mock unit conversion
jest.mock('../../../../domain/utils/unitConversion', () => ({
  normalizeToBaseUnit: (qty: number, unit: string) => ({ quantity: qty, baseUnit: unit }),
}));

// Mock category lookup
jest.mock('../../../../domain/utils/categoryLookup', () => ({
  findCategoryByIdOrUuid: (categories: any[], id: string) =>
    categories.find((c: any) => c.id === id),
}));

import { buildMockItem, buildMockCategory } from '../../../../__test-utils__';

// Test data
const mockCategories = [
  buildMockCategory({ id: 'cat-1', name: 'Rice & Atta', icon: '🌾' }),
  buildMockCategory({ id: 'cat-2', name: 'Oils', icon: '🫒' }),
];

const mockItems = [
  buildMockItem({
    id: 'item-1',
    name: 'Aashirvaad Atta',
    categoryId: 'cat-1',
    unit: 'kg',
    defaultQuantity: 5,
    price: 250,
    trackInventory: false, // Order item with stock tracking disabled
    stockQuantity: 50,
  }),
  buildMockItem({
    id: 'item-2',
    name: 'Sunflower Oil',
    categoryId: 'cat-2',
    unit: 'L',
    defaultQuantity: 1,
    price: 180,
    trackInventory: false, // Order item
    stockQuantity: 10,
    lowStockThreshold: 15,
  }),
  buildMockItem({
    id: 'item-3',
    name: 'Out of Stock Item',
    categoryId: 'cat-1',
    unit: 'kg',
    defaultQuantity: 1,
    price: 100,
    trackInventory: false, // Order item — out of stock
    stockQuantity: 0,
  }),
  buildMockItem({
    id: 'item-4',
    name: 'Untracked Item',
    categoryId: 'cat-2',
    unit: 'pcs',
    defaultQuantity: 1,
    price: 50,
    trackInventory: false,
    stockQuantity: 0,
  }),
];

// Helper to set up mock selector returns
function setupMockSelectors(overrides: {
  categories?: any[];
  items?: any[];
  activeCart?: any;
  allCarts?: any[];
  todaysCarts?: any[];
  activeCartItems?: any[];
  orderItemCount?: number;
} = {}) {
  const defaults = {
    categories: mockCategories,
    items: mockItems,
    activeCart: null,
    allCarts: [],
    todaysCarts: [],
    activeCartItems: [],
    orderItemCount: 0,
    ...overrides,
  };

  mockUseSelector.mockImplementation((selector: Function) => {
    const selectorStr = selector.toString();
    if (selectorStr.includes('catalog.categories') || selectorStr.includes('selectCategories')) {
      return defaults.categories;
    }
    if (selectorStr.includes('catalog.items') || selectorStr.includes('selectItems')) {
      return defaults.items;
    }
    if (selectorStr.includes('activeCartId') && selectorStr.includes('find')) {
      return defaults.activeCart;
    }
    if (selectorStr.includes('carts') && selectorStr.includes('filter')) {
      return defaults.todaysCarts;
    }
    // selectActiveCartItemCount — plain function that calls selectActiveCartItems internally
    if (selectorStr.includes('selectActiveCartItems') && selectorStr.includes('length')) {
      return defaults.orderItemCount;
    }
    // selectActiveCartItems — reselect memoized selector (function with resultFunc)
    if (typeof (selector as any).resultFunc === 'function') {
      return defaults.activeCartItems;
    }
    if (selectorStr.includes('carts')) {
      return defaults.allCarts;
    }
    return undefined;
  });
}

// Import the component under test (will fail in RED phase)
import ItemsScreen from '../ItemsScreen';

describe('ItemsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('renders list of items from catalog', () => {
      setupMockSelectors();
      const { getByText } = render(<ItemsScreen />);

      expect(getByText('Aashirvaad Atta')).toBeTruthy();
      expect(getByText('Sunflower Oil')).toBeTruthy();
      expect(getByText('Untracked Item')).toBeTruthy();
    });

    it('tapping item opens quantity modal (does not auto-add or navigate)', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText, getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      // Should show modal, not dispatch or navigate
      expect(getByTestId('add-quantity-modal')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();

      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeUndefined();
    });

    it('add button creates cart when none exists and adds item with quantity 1', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-add-button'));

      // Should dispatch createCart with HHMM-DDMMYY-XX format
      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeDefined();
      expect(createCartCall[0].payload.name).toMatch(/^\d{4}-\d{6}-\d{2}$/);

      // Should dispatch addItemToActiveCart with quantity 1
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();
      expect(addItemCall[0].payload.quantity).toBe(1);
    });

    it('add button uses existing draft cart without creating new one', () => {
      const existingCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'draft',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setupMockSelectors({ activeCart: existingCart, todaysCarts: [existingCart] });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-add-button'));

      // Should NOT dispatch createCart
      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeUndefined();

      // Should dispatch addItemToActiveCart
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();
    });

    it('cart name sequence: first cart is -01, second is -02', () => {
      const firstCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'paid',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Active cart is paid, so add button should create a new one
      setupMockSelectors({ activeCart: firstCart, todaysCarts: [firstCart] });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-add-button'));

      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeDefined();
      expect(createCartCall[0].payload.name).toMatch(/-02$/);
    });

    it('add button adds item without navigating to Cart', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-add-button'));

      // Should dispatch addItemToActiveCart
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();

      // Should NOT navigate — user stays on Items screen
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('pressing card opens quantity modal instead of navigating to Order', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText, getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      // Should show AddQuantityModal
      expect(getByTestId('add-quantity-modal')).toBeTruthy();

      // Should NOT navigate to Order
      expect(mockNavigate).not.toHaveBeenCalled();

      // Should NOT dispatch addItemToActiveCart (modal handles that)
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeUndefined();
    });

    it('increment button adds item without navigating to Order', () => {
      const existingCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'draft',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cartItems = [
        { item: mockItems[0], quantity: 1, displayUnit: 'kg' },
      ];
      setupMockSelectors({
        activeCart: existingCart,
        todaysCarts: [existingCart],
        activeCartItems: cartItems,
      });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-increment'));

      // Should dispatch addItemToActiveCart
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Frontend Validations', () => {
    it('order items with stockQuantity=0 and trackInventory=false can still be tapped (no stock blocking)', () => {
      // Order items (trackInventory=false) with stockQuantity=0 are always addable
      // because stock tracking is disabled for them
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText, getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByText('Out of Stock Item'));

      // Should open quantity modal (not blocked by stock check)
      expect(getByTestId('add-quantity-modal')).toBeTruthy();
    });

    it('decrement button dispatches decrementItemInActiveCart', () => {
      const existingCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'draft',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cartItems = [
        { item: mockItems[0], quantity: 1, displayUnit: 'kg' },
      ];
      setupMockSelectors({
        activeCart: existingCart,
        todaysCarts: [existingCart],
        activeCartItems: cartItems,
      });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-decrement'));

      const decrementCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/decrementItemInActiveCart'
      );
      expect(decrementCall).toBeDefined();
      expect(decrementCall[0].payload).toBe('item-1');
    });

    it('decrement button does not navigate away', () => {
      const existingCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'draft',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cartItems = [
        { item: mockItems[0], quantity: 1, displayUnit: 'kg' },
      ];
      setupMockSelectors({
        activeCart: existingCart,
        todaysCarts: [existingCart],
        activeCartItems: cartItems,
      });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('item-item-1-decrement'));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('items with trackInventory=false are always addable regardless of stockQuantity', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText, getByTestId } = render(<ItemsScreen />);

      // item-4 has trackInventory=false and stockQuantity=0
      fireEvent.press(getByText('Untracked Item'));

      // Should open quantity modal (not be blocked by stock check)
      expect(getByTestId('add-quantity-modal')).toBeTruthy();
    });

    it('tapping item when active cart is paid opens quantity modal (does not auto-create cart)', () => {
      const paidCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'paid',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setupMockSelectors({ activeCart: paidCart, todaysCarts: [paidCart] });
      const { getByText, getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      // Should open modal, cart creation happens when user confirms in modal
      expect(getByTestId('add-quantity-modal')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Inventory Item Filtering', () => {
    it('should NOT display inventory items (trackInventory: true) on Items screen', () => {
      const mixedItems = [
        buildMockItem({ id: 'order-1', name: 'Chicken Fry', trackInventory: false }),
        buildMockItem({ id: 'order-2', name: 'Brinjal Curry', trackInventory: undefined }),
        buildMockItem({ id: 'inv-1', name: 'Salt', trackInventory: true }),
        buildMockItem({ id: 'inv-2', name: 'Toor Dal', trackInventory: true }),
      ];
      setupMockSelectors({ items: mixedItems });
      const { getByText, queryByText } = render(<ItemsScreen />);

      // Order items should appear
      expect(getByText('Chicken Fry')).toBeTruthy();
      expect(getByText('Brinjal Curry')).toBeTruthy();

      // Inventory items should NOT appear
      expect(queryByText('Salt')).toBeNull();
      expect(queryByText('Toor Dal')).toBeNull();
    });

    it('should display items with trackInventory=undefined (defaults to order item)', () => {
      const items = [
        buildMockItem({ id: 'item-no-flag', name: 'No Flag Item', trackInventory: undefined }),
      ];
      setupMockSelectors({ items });
      const { getByText } = render(<ItemsScreen />);
      expect(getByText('No Flag Item')).toBeTruthy();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('items displayed come from tenant-scoped catalog selector', () => {
      // Items are sourced from selectItems which reads from catalogSlice
      // catalogSlice is populated by initializeCatalog with tenant-scoped API data
      const tenantItems = [
        buildMockItem({ id: 'tenant-item-1', name: 'Tenant A Item' }),
      ];
      setupMockSelectors({ items: tenantItems });
      const { getByText, queryByText } = render(<ItemsScreen />);

      expect(getByText('Tenant A Item')).toBeTruthy();
      // Items from other tenants should not appear
      expect(queryByText('Aashirvaad Atta')).toBeNull();
    });
  });

  describe('View Mode Toggle', () => {
    it('renders view toggle button', () => {
      setupMockSelectors();
      const { getByTestId } = render(<ItemsScreen />);
      expect(getByTestId('items-view-toggle')).toBeTruthy();
    });

    it('defaults to grid view', () => {
      setupMockSelectors();
      const { getByTestId, queryByTestId } = render(<ItemsScreen />);
      expect(getByTestId('items-grid')).toBeTruthy();
      expect(queryByTestId('items-list')).toBeNull();
    });

    it('switches to list view when toggle is pressed', () => {
      setupMockSelectors();
      const { getByTestId, queryByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('items-view-toggle'));

      expect(getByTestId('items-list')).toBeTruthy();
      expect(queryByTestId('items-grid')).toBeNull();
    });

    it('switches back to grid view on second toggle press', () => {
      setupMockSelectors();
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('items-view-toggle'));
      fireEvent.press(getByTestId('items-view-toggle'));

      expect(getByTestId('items-grid')).toBeTruthy();
    });

    it('list view renders all items', () => {
      setupMockSelectors();
      const { getByTestId, getByText } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('items-view-toggle'));

      expect(getByText('Aashirvaad Atta')).toBeTruthy();
      expect(getByText('Sunflower Oil')).toBeTruthy();
    });
  });

  describe('Landscape Orientation — FlatList numColumns', () => {
    it('grid renders correctly in phone mode (numColumns=2)', () => {
      mockDeviceType.isTablet = false;
      setupMockSelectors();
      const { getByTestId, getByText } = render(<ItemsScreen />);

      expect(getByTestId('items-grid')).toBeTruthy();
      expect(getByText('Aashirvaad Atta')).toBeTruthy();
    });

    it('grid renders correctly in tablet/landscape mode (numColumns=4)', () => {
      mockDeviceType.isTablet = true;
      setupMockSelectors();
      const { getByTestId, getByText } = render(<ItemsScreen />);

      expect(getByTestId('items-grid')).toBeTruthy();
      expect(getByText('Aashirvaad Atta')).toBeTruthy();

      // Restore
      mockDeviceType.isTablet = false;
    });

    it('grid renders in both phone and tablet modes without crash', () => {
      // Simulates orientation change: phone → tablet → phone
      mockDeviceType.isTablet = false;
      setupMockSelectors();
      const { getByTestId, unmount } = render(<ItemsScreen />);
      expect(getByTestId('items-grid')).toBeTruthy();
      unmount();

      mockDeviceType.isTablet = true;
      setupMockSelectors();
      const { getByTestId: getById2, unmount: unmount2 } = render(<ItemsScreen />);
      expect(getById2('items-grid')).toBeTruthy();
      unmount2();

      mockDeviceType.isTablet = false;
      setupMockSelectors();
      const { getByTestId: getById3 } = render(<ItemsScreen />);
      expect(getById3('items-grid')).toBeTruthy();
    });
  });

  describe('Order Footer', () => {
    it('does not show footer when cart is empty', () => {
      setupMockSelectors({ orderItemCount: 0 });
      const { queryByTestId } = render(<ItemsScreen />);
      expect(queryByTestId('items-order-footer')).toBeNull();
    });

    it('shows footer when items are in the active order', () => {
      setupMockSelectors({ orderItemCount: 3 });
      const { getByTestId } = render(<ItemsScreen />);
      expect(getByTestId('items-order-footer')).toBeTruthy();
    });

    it('footer View Order button navigates to Order screen', () => {
      setupMockSelectors({ orderItemCount: 2 });
      const { getByTestId } = render(<ItemsScreen />);

      fireEvent.press(getByTestId('items-order-footer-button'));

      expect(mockNavigate).toHaveBeenCalledWith('Order');
    });
  });
});
