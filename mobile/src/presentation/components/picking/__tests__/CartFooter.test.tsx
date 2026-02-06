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
    t: (key: string, options?: { count?: number }) => {
      if (key === 'picking.itemsAdded') {
        return options?.count === 1 ? '1 item added' : `${options?.count} items added`;
      }
      if (key === 'picking.viewCart') {
        return 'View Cart';
      }
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textInverse: '#ffffff',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#ffffff',
      border: '#e0e0e0',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
    typography: {
      fontSize: {
        sm: 12,
        md: 14,
        lg: 16,
      },
      fontWeight: {
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
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
      },
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    contentPadding: 16,
  }),
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
});
