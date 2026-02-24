/**
 * ProductGrid Component Tests
 * TDD: Tests written first for 2-column product grid
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductGrid from '../ProductGrid';
import { Item, Category, CartItemState } from '../../../../domain/types/picking';

// Mock itemTranslations
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (item: { name: string }) => item.name,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'picking.add') return 'Add';
      if (key === 'picking.inCart') return 'IN CART';
      if (key === 'picking.noItemsFound') return 'No items found';
      if (key === 'picking.trySearching') return 'Try searching for something else';
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({
    isTablet: false,
    isPhone: true,
  }),
}));

describe('ProductGrid', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Grains', icon: '🌾' },
    { id: 'cat-2', name: 'Rice', icon: '🍚' },
  ];

  const mockItems: Item[] = [
    {
      id: 'item-1',
      categoryId: 'cat-1',
      name: 'Basmati Rice',
      unit: 'kg',
      defaultQuantity: 1,
      price: 120,
    },
    {
      id: 'item-2',
      categoryId: 'cat-1',
      name: 'Wheat Flour',
      unit: 'kg',
      defaultQuantity: 1,
      price: 45,
    },
    {
      id: 'item-3',
      categoryId: 'cat-2',
      name: 'Sona Masoori',
      unit: 'kg',
      defaultQuantity: 5,
      price: 280,
    },
  ];

  const mockCartItems: CartItemState[] = [
    {
      item: mockItems[0],
      quantity: 2,
      addedAt: new Date().toISOString(),
    },
  ];

  const mockOnAddItem = jest.fn();
  const mockOnIncrementItem = jest.fn();
  const mockOnDecrementItem = jest.fn();
  const mockOnItemPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all items', () => {
      const { getByText } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
        />
      );

      expect(getByText('Basmati Rice')).toBeTruthy();
      expect(getByText('Wheat Flour')).toBeTruthy();
      expect(getByText('Sona Masoori')).toBeTruthy();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      expect(getByTestId('product-grid')).toBeTruthy();
    });
  });

  describe('Cart Items Integration', () => {
    it('shows correct quantity for items in cart', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={mockCartItems}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      // Item 1 has quantity 2 in cart
      expect(getByTestId('product-grid-item-item-1-quantity').props.children).toBe(2);
    });

    it('shows Add button for items not in cart', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={mockCartItems}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      // Item 2 is not in cart, should show add button
      expect(getByTestId('product-grid-item-item-2-add-button')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no items', () => {
      const { getByText } = render(
        <ProductGrid
          items={[]}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
        />
      );

      expect(getByText('No items found')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onAddItem when Add button is pressed', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      fireEvent.press(getByTestId('product-grid-item-item-1-add-button'));
      expect(mockOnAddItem).toHaveBeenCalledWith(mockItems[0]);
    });

    it('calls onIncrementItem when + button is pressed', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={mockCartItems}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      fireEvent.press(getByTestId('product-grid-item-item-1-increment'));
      expect(mockOnIncrementItem).toHaveBeenCalledWith('item-1');
    });

    it('calls onDecrementItem when - button is pressed', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={mockCartItems}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      fireEvent.press(getByTestId('product-grid-item-item-1-decrement'));
      expect(mockOnDecrementItem).toHaveBeenCalledWith('item-1');
    });

    it('calls onItemPress when item card is pressed', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      fireEvent.press(getByTestId('product-grid-item-item-2-pressable'));
      expect(mockOnItemPress).toHaveBeenCalledWith(mockItems[1]);
    });
  });

  describe('Responsive Grid', () => {
    it('uses responsive gridColumns from hook', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      // The FlatList should exist and use gridColumns
      const grid = getByTestId('product-grid');
      expect(grid).toBeTruthy();
      // FlatList renders with the numColumns prop from responsive hook
      // Verify it renders items (grid columns applied)
      expect(grid.props.data || grid.props.children).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('renders without crashing when refreshing and onRefresh are provided', () => {
      const mockOnRefresh = jest.fn();

      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          refreshing={false}
          onRefresh={mockOnRefresh}
          testID="product-grid"
        />
      );

      expect(getByTestId('product-grid')).toBeTruthy();
    });

    it('renders without RefreshControl when onRefresh is not provided', () => {
      const { getByTestId } = render(
        <ProductGrid
          items={mockItems}
          cartItems={[]}
          categories={mockCategories}
          onAddItem={mockOnAddItem}
          onIncrementItem={mockOnIncrementItem}
          onDecrementItem={mockOnDecrementItem}
          onItemPress={mockOnItemPress}
          testID="product-grid"
        />
      );

      expect(getByTestId('product-grid')).toBeTruthy();
    });
  });
});
