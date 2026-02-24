/**
 * CartFooter Component Tests
 * TDD: Tests written first for bottom bar with item count and View Cart button
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CartFooter from '../CartFooter';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; defaultValue?: string }) => {
      if (key === 'picking.itemsAdded') {
        return options?.count === 1 ? '1 item added' : `${options?.count} items added`;
      }
      if (key === 'picking.viewCart') {
        return 'View Cart';
      }
      if (key === 'picking.syncing') {
        return 'Syncing...';
      }
      if (key === 'picking.viewCartAccessibility') {
        return `View cart with ${options?.count} items`;
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

describe('CartFooter', () => {
  const mockOnViewCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders item count text correctly for multiple items', () => {
    const { getByText } = render(
      <CartFooter itemCount={5} onViewCart={mockOnViewCart} />
    );

    expect(getByText('5 items added')).toBeTruthy();
  });

  it('renders singular item text for single item', () => {
    const { getByText } = render(
      <CartFooter itemCount={1} onViewCart={mockOnViewCart} />
    );

    expect(getByText('1 item added')).toBeTruthy();
  });

  it('renders View Cart button', () => {
    const { getByText } = render(
      <CartFooter itemCount={3} onViewCart={mockOnViewCart} />
    );

    expect(getByText('View Cart')).toBeTruthy();
  });

  it('calls onViewCart when button is pressed', () => {
    const { getByTestId } = render(
      <CartFooter
        itemCount={3}
        onViewCart={mockOnViewCart}
        testID="cart-footer"
      />
    );

    fireEvent.press(getByTestId('cart-footer-button'));
    expect(mockOnViewCart).toHaveBeenCalledTimes(1);
  });

  it('renders with testID when provided', () => {
    const { getByTestId } = render(
      <CartFooter
        itemCount={2}
        onViewCart={mockOnViewCart}
        testID="cart-footer"
      />
    );

    expect(getByTestId('cart-footer')).toBeTruthy();
  });

  it('renders zero items correctly', () => {
    const { getByText } = render(
      <CartFooter itemCount={0} onViewCart={mockOnViewCart} />
    );

    expect(getByText('0 items added')).toBeTruthy();
  });

  it('renders chevron icon on button', () => {
    const { getByTestId } = render(
      <CartFooter
        itemCount={3}
        onViewCart={mockOnViewCart}
        testID="cart-footer"
      />
    );

    expect(getByTestId('cart-footer-chevron')).toBeTruthy();
  });

  describe('Syncing State (isSyncing)', () => {
    it('shows sync indicator when isSyncing is true', () => {
      const { getByTestId } = render(
        <CartFooter
          itemCount={3}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
          isSyncing={true}
        />
      );

      expect(getByTestId('cart-footer-sync-indicator')).toBeTruthy();
    });

    it('does not show sync indicator when isSyncing is false', () => {
      const { queryByTestId } = render(
        <CartFooter
          itemCount={3}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
          isSyncing={false}
        />
      );

      expect(queryByTestId('cart-footer-sync-indicator')).toBeNull();
    });

    it('does not show sync indicator when isSyncing is not provided', () => {
      const { queryByTestId } = render(
        <CartFooter
          itemCount={3}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
        />
      );

      expect(queryByTestId('cart-footer-sync-indicator')).toBeNull();
    });

    it('shows syncing text alongside sync indicator', () => {
      const { getByText } = render(
        <CartFooter
          itemCount={3}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
          isSyncing={true}
        />
      );

      expect(getByText('Syncing...')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has accessibility label with item count on View Cart button', () => {
      const { getByTestId } = render(
        <CartFooter
          itemCount={5}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
        />
      );

      const button = getByTestId('cart-footer-button');
      expect(button.props.accessibilityLabel).toBe('View cart with 5 items');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has correct accessibility label for single item', () => {
      const { getByTestId } = render(
        <CartFooter
          itemCount={1}
          onViewCart={mockOnViewCart}
          testID="cart-footer"
        />
      );

      const button = getByTestId('cart-footer-button');
      expect(button.props.accessibilityLabel).toBe('View cart with 1 items');
    });
  });
});
