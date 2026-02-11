/**
 * ProductCard Component Tests
 * TDD: Tests written first for product card in 2-column grid
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '../ProductCard';
import { Item } from '../../../../domain/types/picking';

// Mock itemTranslations - MUST be before importing component
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (item: { name: string }) => item.name,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'picking.add') return 'Add';
      if (key === 'picking.inCart') return 'IN CART';
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      textInverse: '#ffffff',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#ffffff',
      border: '#e0e0e0',
      inCartBackground: '#E8F5E9',
      inCartBorder: '#4CAF50',
      inCartBadge: '#4CAF50',
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 12,
      md: 16,
      lg: 24,
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    contentPadding: 16,
    touchTargetMinSize: 44,
  }),
  useDeviceType: () => ({
    isTablet: false,
    isPhone: true,
  }),
}));

describe('ProductCard', () => {
  const mockItem: Item = {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Basmati Rice',
    nameTe: 'బాస్మతి రైస్',
    unit: 'kg',
    defaultQuantity: 1,
    price: 120,
  };

  const mockOnAdd = jest.fn();
  const mockOnIncrement = jest.fn();
  const mockOnDecrement = jest.fn();
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders product name correctly', () => {
      const { getByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Basmati Rice')).toBeTruthy();
    });

    it('renders quantity with unit correctly', () => {
      const { getByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('1 kg')).toBeTruthy();
    });

    it('does not render category icon', () => {
      const { queryByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('🌾')).toBeNull();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      expect(getByTestId('product-card')).toBeTruthy();
    });
  });

  describe('Not In Cart State', () => {
    it('renders Add button when not in cart', () => {
      const { getByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Add')).toBeTruthy();
    });

    it('does not show IN CART badge when not in cart', () => {
      const { queryByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('IN CART')).toBeNull();
    });

    it('calls onAdd when Add button is pressed', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      fireEvent.press(getByTestId('product-card-add-button'));
      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('In Cart State', () => {
    it('shows IN CART badge when item is in cart', () => {
      const { getByText } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={2}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('IN CART')).toBeTruthy();
    });

    it('IN CART badge does not use absolute positioning to prevent overlap with product name', () => {
      const { getByText, UNSAFE_root } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={2}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      // Verify badge renders and is not absolutely positioned
      const badgeText = getByText('IN CART');
      expect(badgeText).toBeTruthy();

      // Walk up from badge text to find the badge container View
      // and verify it does NOT have position: 'absolute' in any of its styles
      const badgeView = badgeText.parent;
      const badgeStyles = badgeView?.props?.style;
      const flatStyle = Array.isArray(badgeStyles)
        ? badgeStyles.reduce((acc: Record<string, unknown>, s: Record<string, unknown> | null | undefined) => (s ? { ...acc, ...s } : acc), {})
        : badgeStyles || {};
      expect(flatStyle.position).not.toBe('absolute');
    });

    it('shows quantity controls when in cart', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={3}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      expect(getByTestId('product-card-decrement')).toBeTruthy();
      expect(getByTestId('product-card-increment')).toBeTruthy();
    });

    it('displays correct quantity in cart', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={5}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      expect(getByTestId('product-card-quantity').props.children).toBe(5);
    });

    it('does not show Add button when in cart', () => {
      const { queryByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={2}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      expect(queryByTestId('product-card-add-button')).toBeNull();
    });

    it('calls onIncrement when + button is pressed', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={2}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      fireEvent.press(getByTestId('product-card-increment'));
      expect(mockOnIncrement).toHaveBeenCalledTimes(1);
    });

    it('calls onDecrement when - button is pressed', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={2}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      fireEvent.press(getByTestId('product-card-decrement'));
      expect(mockOnDecrement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Press', () => {
    it('calls onPress when card is pressed', () => {
      const { getByTestId } = render(
        <ProductCard
          item={mockItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
          testID="product-card"
        />
      );

      fireEvent.press(getByTestId('product-card-pressable'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different Units', () => {
    it('renders gm unit correctly', () => {
      const gmItem: Item = { ...mockItem, unit: 'gm', defaultQuantity: 500 };
      const { getByText } = render(
        <ProductCard
          item={gmItem}
          categoryIcon="🌾"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('500 gm')).toBeTruthy();
    });

    it('renders pcs unit correctly', () => {
      const pcsItem: Item = { ...mockItem, unit: 'pcs', defaultQuantity: 6 };
      const { getByText } = render(
        <ProductCard
          item={pcsItem}
          categoryIcon="🍌"
          quantityInCart={0}
          onAdd={mockOnAdd}
          onIncrement={mockOnIncrement}
          onDecrement={mockOnDecrement}
          onPress={mockOnPress}
        />
      );

      expect(getByText('6 pcs')).toBeTruthy();
    });
  });
});
