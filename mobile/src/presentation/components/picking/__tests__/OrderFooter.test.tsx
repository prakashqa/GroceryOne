/**
 * OrderFooter Component Tests
 * TDD: Tests written first for bottom bar with item count and View Order button
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OrderFooter from '../OrderFooter';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; price?: string; defaultValue?: string }) => {
      if (key === 'picking.itemsWithPrice') {
        return options?.count === 1
          ? `1 item ${options?.price}`
          : `${options?.count} items ${options?.price}`;
      }
      if (key === 'picking.itemsAdded') {
        return options?.count === 1 ? '1 item added' : `${options?.count} items added`;
      }
      if (key === 'picking.viewCart') {
        return 'View Order';
      }
      if (key === 'picking.syncing') {
        return 'Syncing...';
      }
      if (key === 'picking.viewCartAccessibility') {
        return `View order with ${options?.count} items`;
      }
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

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

describe('OrderFooter', () => {
  const mockOnViewOrder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders item count text correctly for multiple items', () => {
    const { getByText } = render(
      <OrderFooter itemCount={5} onViewCart={mockOnViewOrder} />
    );

    expect(getByText('5 items added')).toBeTruthy();
  });

  it('renders singular item text for single item', () => {
    const { getByText } = render(
      <OrderFooter itemCount={1} onViewCart={mockOnViewOrder} />
    );

    expect(getByText('1 item added')).toBeTruthy();
  });

  it('renders View Order button', () => {
    const { getByText } = render(
      <OrderFooter itemCount={3} onViewCart={mockOnViewOrder} />
    );

    expect(getByText('View Order')).toBeTruthy();
  });

  it('calls onViewOrder when button is pressed', () => {
    const { getByTestId } = render(
      <OrderFooter
        itemCount={3}
        onViewCart={mockOnViewOrder}
        testID="cart-footer"
      />
    );

    fireEvent.press(getByTestId('cart-footer-button'));
    expect(mockOnViewOrder).toHaveBeenCalledTimes(1);
  });

  it('renders with testID when provided', () => {
    const { getByTestId } = render(
      <OrderFooter
        itemCount={2}
        onViewCart={mockOnViewOrder}
        testID="cart-footer"
      />
    );

    expect(getByTestId('cart-footer')).toBeTruthy();
  });

  it('renders zero items correctly', () => {
    const { getByText } = render(
      <OrderFooter itemCount={0} onViewCart={mockOnViewOrder} />
    );

    expect(getByText('0 items added')).toBeTruthy();
  });

  it('renders chevron icon on button', () => {
    const { getByTestId } = render(
      <OrderFooter
        itemCount={3}
        onViewCart={mockOnViewOrder}
        testID="cart-footer"
      />
    );

    expect(getByTestId('cart-footer-chevron')).toBeTruthy();
  });

  describe('Total Price Display', () => {
    it('renders total price instead of "added" when totalPrice is provided', () => {
      const { getByText, queryByText } = render(
        <OrderFooter itemCount={2} totalPrice={380} onViewCart={mockOnViewOrder} />
      );

      expect(getByText('2 items ₹380')).toBeTruthy();
      expect(queryByText('2 items added')).toBeNull();
    });

    it('renders "added" when totalPrice is not provided (backward compatible)', () => {
      const { getByText } = render(
        <OrderFooter itemCount={2} onViewCart={mockOnViewOrder} />
      );

      expect(getByText('2 items added')).toBeTruthy();
    });

    it('renders "added" when totalPrice is 0', () => {
      const { getByText } = render(
        <OrderFooter itemCount={0} totalPrice={0} onViewCart={mockOnViewOrder} />
      );

      expect(getByText('0 items added')).toBeTruthy();
    });

    it('renders price for single item', () => {
      const { getByText } = render(
        <OrderFooter itemCount={1} totalPrice={200} onViewCart={mockOnViewOrder} />
      );

      expect(getByText('1 item ₹200')).toBeTruthy();
    });
  });

  describe('Syncing State (isSyncing)', () => {
    it('shows sync indicator when isSyncing is true', () => {
      const { getByTestId } = render(
        <OrderFooter
          itemCount={3}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
          isSyncing={true}
        />
      );

      expect(getByTestId('cart-footer-sync-indicator')).toBeTruthy();
    });

    it('does not show sync indicator when isSyncing is false', () => {
      const { queryByTestId } = render(
        <OrderFooter
          itemCount={3}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
          isSyncing={false}
        />
      );

      expect(queryByTestId('cart-footer-sync-indicator')).toBeNull();
    });

    it('does not show sync indicator when isSyncing is not provided', () => {
      const { queryByTestId } = render(
        <OrderFooter
          itemCount={3}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
        />
      );

      expect(queryByTestId('cart-footer-sync-indicator')).toBeNull();
    });

    it('shows syncing text alongside sync indicator', () => {
      const { getByText } = render(
        <OrderFooter
          itemCount={3}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
          isSyncing={true}
        />
      );

      expect(getByText('Syncing...')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has accessibility label with item count on View Order button', () => {
      const { getByTestId } = render(
        <OrderFooter
          itemCount={5}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
        />
      );

      const button = getByTestId('cart-footer-button');
      expect(button.props.accessibilityLabel).toBe('View order with 5 items');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has correct accessibility label for single item', () => {
      const { getByTestId } = render(
        <OrderFooter
          itemCount={1}
          onViewCart={mockOnViewOrder}
          testID="cart-footer"
        />
      );

      const button = getByTestId('cart-footer-button');
      expect(button.props.accessibilityLabel).toBe('View order with 1 items');
    });
  });
});
