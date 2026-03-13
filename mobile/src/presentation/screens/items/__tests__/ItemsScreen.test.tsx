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
        'picking.inCart': 'In Cart',
        'picking.outOfStock': 'OUT OF STOCK',
        'picking.lowStock': 'LOW STOCK',
      };
      return translations[key] || (typeof fallback === 'string' ? fallback : key);
    },
    i18n: { language: 'en' },
  }),
}));

// Mock responsive hooks
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({ isTablet: false, isPhone: true }),
}));

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
    trackInventory: true,
    stockQuantity: 50,
  }),
  buildMockItem({
    id: 'item-2',
    name: 'Sunflower Oil',
    categoryId: 'cat-2',
    unit: 'L',
    defaultQuantity: 1,
    price: 180,
    trackInventory: true,
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
    trackInventory: true,
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
} = {}) {
  const defaults = {
    categories: mockCategories,
    items: mockItems,
    activeCart: null,
    allCarts: [],
    todaysCarts: [],
    activeCartItems: [],
    ...overrides,
  };

  // Track call order to distinguish selectors with similar toString()
  let selectorCallIndex = 0;
  mockUseSelector.mockImplementation((selector: Function) => {
    selectorCallIndex++;
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

    it('tapping item when no cart exists creates cart with HHMM-DDMMYY-XX format', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      // Should dispatch createCart with the correct format
      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeDefined();

      const cartName = createCartCall[0].payload.name;
      // Format: HHMM-DDMMYY-XX
      expect(cartName).toMatch(/^\d{4}-\d{6}-\d{2}$/);
    });

    it('tapping item when active draft cart exists adds to existing cart without creating new one', () => {
      const existingCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'draft',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setupMockSelectors({ activeCart: existingCart, todaysCarts: [existingCart] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

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
      // Active cart is paid, so a new one should be created
      setupMockSelectors({ activeCart: firstCart, todaysCarts: [firstCart] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeDefined();

      const cartName = createCartCall[0].payload.name;
      // Second cart of the day should end with -02
      expect(cartName).toMatch(/-02$/);
    });

    it('item added with quantity 1 in base units', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();
      expect(addItemCall[0].payload.quantity).toBe(1);
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

    it('pressing card navigates to Cart', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });

    it('increment button adds item without navigating to Cart', () => {
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
    it('out-of-stock items cannot be added — does not create cart or add item', () => {
      setupMockSelectors({ activeCart: null, todaysCarts: [] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Out of Stock Item'));

      // Should NOT dispatch createCart
      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeUndefined();

      // Should NOT dispatch addItemToActiveCart
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeUndefined();

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();
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
      const { getByText } = render(<ItemsScreen />);

      // item-4 has trackInventory=false and stockQuantity=0
      fireEvent.press(getByText('Untracked Item'));

      // Should create cart and add item
      const addItemCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/addItemToActiveCart'
      );
      expect(addItemCall).toBeDefined();
      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });

    it('tapping item when active cart is paid creates a new cart', () => {
      const paidCart = {
        id: 'cart-1',
        name: '1030-130326-01',
        status: 'paid',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setupMockSelectors({ activeCart: paidCart, todaysCarts: [paidCart] });
      const { getByText } = render(<ItemsScreen />);

      fireEvent.press(getByText('Aashirvaad Atta'));

      // Should dispatch createCart since active cart is paid
      const createCartCall = mockDispatch.mock.calls.find(
        (call: any) => call[0]?.type === 'multiCart/createCart'
      );
      expect(createCartCall).toBeDefined();
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
});
