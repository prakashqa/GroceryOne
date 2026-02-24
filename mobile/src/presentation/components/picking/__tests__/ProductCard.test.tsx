/**
 * ProductCard Component Tests
 * TDD: Tests written first for product card in 2-column grid
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '../ProductCard';
import { Item } from '../../../../domain/types/picking';
import { flattenStyle } from '../../../../__test-utils__';

// Mock itemTranslations - MUST be before importing component
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (item: { name: string }) => item.name,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'picking.add') return 'Add';
      if (key === 'picking.inCart') return 'IN CART';
      return key;
    },
  }),
}));

jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({ isTablet: false, isPhone: true }),
}));

describe('ProductCard', () => {
  const mockItem: Item = {
    id: 'item-1', categoryId: 'cat-1', name: 'Basmati Rice', nameTe: 'బాస్మతి రైస్',
    unit: 'kg', defaultQuantity: 1, price: 120,
  };

  const mockOnAdd = jest.fn();
  const mockOnIncrement = jest.fn();
  const mockOnDecrement = jest.fn();
  const mockOnPress = jest.fn();

  const renderCard = (overrides: Record<string, any> = {}) => render(
    <ProductCard
      item={mockItem} categoryIcon="🌾" quantityInCart={0}
      onAdd={mockOnAdd} onIncrement={mockOnIncrement}
      onDecrement={mockOnDecrement} onPress={mockOnPress}
      {...overrides}
    />
  );

  beforeEach(() => { jest.clearAllMocks(); });

  describe('Basic Rendering', () => {
    it('renders product name correctly', () => {
      expect(renderCard().getByText('Basmati Rice')).toBeTruthy();
    });

    it('renders quantity with unit correctly', () => {
      expect(renderCard().getByText('1 kg')).toBeTruthy();
    });

    it('does not render category icon', () => {
      expect(renderCard().queryByText('🌾')).toBeNull();
    });

    it('renders with testID when provided', () => {
      expect(renderCard({ testID: 'product-card' }).getByTestId('product-card')).toBeTruthy();
    });
  });

  describe('Not In Cart State', () => {
    it('renders Add button when not in cart', () => {
      expect(renderCard().getByText('Add')).toBeTruthy();
    });

    it('does not show IN CART badge when not in cart', () => {
      expect(renderCard().queryByText('IN CART')).toBeNull();
    });

    it('calls onAdd when Add button is pressed', () => {
      fireEvent.press(renderCard({ testID: 'product-card' }).getByTestId('product-card-add-button'));
      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('In Cart State', () => {
    it('shows IN CART badge when item is in cart', () => {
      expect(renderCard({ quantityInCart: 2 }).getByText('IN CART')).toBeTruthy();
    });

    it('IN CART badge does not use absolute positioning to prevent overlap with product name', () => {
      const badgeView = renderCard({ quantityInCart: 2 }).getByText('IN CART').parent;
      expect(flattenStyle(badgeView?.props?.style).position).not.toBe('absolute');
    });

    it('shows quantity controls when in cart', () => {
      const { getByTestId } = renderCard({ quantityInCart: 3, testID: 'product-card' });
      expect(getByTestId('product-card-decrement')).toBeTruthy();
      expect(getByTestId('product-card-increment')).toBeTruthy();
    });

    it('displays correct quantity in cart', () => {
      expect(renderCard({ quantityInCart: 5, testID: 'product-card' }).getByTestId('product-card-quantity').props.children).toBe(5);
    });

    it('does not show Add button when in cart', () => {
      expect(renderCard({ quantityInCart: 2, testID: 'product-card' }).queryByTestId('product-card-add-button')).toBeNull();
    });

    it('calls onIncrement when + button is pressed', () => {
      fireEvent.press(renderCard({ quantityInCart: 2, testID: 'product-card' }).getByTestId('product-card-increment'));
      expect(mockOnIncrement).toHaveBeenCalledTimes(1);
    });

    it('calls onDecrement when - button is pressed', () => {
      fireEvent.press(renderCard({ quantityInCart: 2, testID: 'product-card' }).getByTestId('product-card-decrement'));
      expect(mockOnDecrement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Press', () => {
    it('calls onPress when card is pressed', () => {
      fireEvent.press(renderCard({ testID: 'product-card' }).getByTestId('product-card-pressable'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has accessibility label on card pressable', () => {
      const pressable = renderCard({ testID: 'product-card' }).getByTestId('product-card-pressable');
      expect(pressable.props.accessibilityLabel).toBe('Basmati Rice');
      expect(pressable.props.accessibilityRole).toBe('button');
    });

    it('has accessibility label on add button', () => {
      const addBtn = renderCard({ testID: 'product-card' }).getByTestId('product-card-add-button');
      expect(addBtn.props.accessibilityLabel).toBe('Add Basmati Rice to cart');
      expect(addBtn.props.accessibilityRole).toBe('button');
    });

    it('has accessibility labels on quantity control buttons', () => {
      const { getByTestId } = renderCard({ quantityInCart: 3, testID: 'product-card' });

      const decrementBtn = getByTestId('product-card-decrement');
      expect(decrementBtn.props.accessibilityLabel).toBe('Decrease quantity of Basmati Rice');
      expect(decrementBtn.props.accessibilityRole).toBe('button');

      const incrementBtn = getByTestId('product-card-increment');
      expect(incrementBtn.props.accessibilityLabel).toBe('Increase quantity of Basmati Rice');
      expect(incrementBtn.props.accessibilityRole).toBe('button');
    });

    it('has accessibility label on quantity display', () => {
      const qty = renderCard({ quantityInCart: 3, testID: 'product-card' }).getByTestId('product-card-quantity');
      expect(qty.props.accessibilityLabel).toBe('3 in cart');
    });
  });

  describe('Touch Targets', () => {
    it('quantity buttons meet minimum size of 44px on phone', () => {
      const { getByTestId } = renderCard({ quantityInCart: 2, testID: 'product-card' });

      for (const id of ['product-card-decrement', 'product-card-increment']) {
        const size = flattenStyle(getByTestId(id).props.style);
        expect(size.width).toBeGreaterThanOrEqual(44);
        expect(size.height).toBeGreaterThanOrEqual(44);
      }
    });

    it('quantity buttons have hitSlop for extended touch area', () => {
      const { getByTestId } = renderCard({ quantityInCart: 2, testID: 'product-card' });
      const expectedHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };
      expect(getByTestId('product-card-decrement').props.hitSlop).toEqual(expectedHitSlop);
      expect(getByTestId('product-card-increment').props.hitSlop).toEqual(expectedHitSlop);
    });
  });

  describe('Price Display', () => {
    it('shows price when item has a price', () => {
      // mockItem has price: 120
      expect(renderCard().getByText('₹120')).toBeTruthy();
    });

    it('shows price testID when item has a price and testID provided', () => {
      expect(renderCard({ testID: 'product-card' }).getByTestId('product-card-price')).toBeTruthy();
    });

    it('shows MRP with strikethrough when item has both price and mrp', () => {
      const { getByText } = renderCard({ item: { ...mockItem, price: 90, mrp: 150 } });
      expect(getByText('₹90')).toBeTruthy();
      expect(getByText('₹150')).toBeTruthy();
    });

    it('does not show MRP when mrp equals price', () => {
      const { queryByTestId } = renderCard({ item: { ...mockItem, price: 120, mrp: 120 }, testID: 'product-card' });
      expect(queryByTestId('product-card-mrp')).toBeNull();
    });

    it('does not show price container when item has no price', () => {
      expect(renderCard({ item: { ...mockItem, price: undefined }, testID: 'product-card' }).queryByTestId('product-card-price')).toBeNull();
    });
  });

  describe('Different Units', () => {
    it.each([
      ['gm', 500, '500 gm'],
      ['pcs', 6, '6 pcs'],
    ])('renders %s unit correctly', (unit, defaultQuantity, expected) => {
      expect(renderCard({ item: { ...mockItem, unit, defaultQuantity } }).getByText(expected)).toBeTruthy();
    });
  });

  describe('Pending State (isPending)', () => {
    it.each([
      ['increment', 2, 'product-card-increment', 'mockOnIncrement'],
      ['decrement', 2, 'product-card-decrement', 'mockOnDecrement'],
      ['Add', 0, 'product-card-add-button', 'mockOnAdd'],
    ])('disables %s button when isPending is true', (_name, quantityInCart, testId, handlerName) => {
      const handlers: Record<string, jest.Mock> = { mockOnAdd, mockOnIncrement, mockOnDecrement };
      fireEvent.press(renderCard({ quantityInCart, testID: 'product-card', isPending: true }).getByTestId(testId));
      expect(handlers[handlerName]).not.toHaveBeenCalled();
    });

    it.each([
      ['in cart', 2],
      ['not in cart', 0],
    ])('shows loading indicator when isPending is true and item is %s', (_desc, quantityInCart) => {
      expect(renderCard({ quantityInCart, testID: 'product-card', isPending: true }).getByTestId('product-card-loading')).toBeTruthy();
    });

    it('does not show loading indicator when isPending is false', () => {
      expect(renderCard({ quantityInCart: 2, testID: 'product-card', isPending: false }).queryByTestId('product-card-loading')).toBeNull();
    });

    it('reduces opacity of quantity buttons when isPending', () => {
      const { getByTestId } = renderCard({ quantityInCart: 2, testID: 'product-card', isPending: true });
      expect(flattenStyle(getByTestId('product-card-increment').props.style).opacity).toBe(0.5);
      expect(flattenStyle(getByTestId('product-card-decrement').props.style).opacity).toBe(0.5);
    });

    it('defaults isPending to false when not provided', () => {
      const { getByTestId, queryByTestId } = renderCard({ quantityInCart: 2, testID: 'product-card' });
      fireEvent.press(getByTestId('product-card-increment'));
      expect(mockOnIncrement).toHaveBeenCalledTimes(1);
      expect(queryByTestId('product-card-loading')).toBeNull();
    });
  });
});
