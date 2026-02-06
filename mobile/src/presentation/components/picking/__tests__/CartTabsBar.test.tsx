/**
 * CartTabsBar Component Tests
 * TDD: Tests written first for horizontal cart tabs section
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CartTabsBar from '../CartTabsBar';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'picking.items') {
        return options?.count === 1 ? '1 item' : `${options?.count} items`;
      }
      if (key === 'picking.cartList') return 'Cart List';
      if (key === 'picking.newCart') return '+ New Cart';
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
      textInverse: '#ffffff',
      textSecondary: '#757575',
      headerText: '#ffffff',
      headerTextMuted: 'rgba(255, 255, 255, 0.8)',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#ffffff',
      buttonSecondary: 'rgba(255, 255, 255, 0.2)',
      buttonSecondaryText: '#ffffff',
      border: '#e0e0e0',
      borderMuted: 'rgba(255, 255, 255, 0.3)',
      warning: '#FFC107',
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

describe('CartTabsBar', () => {
  const mockOnCartPress = jest.fn();
  const mockOnCartListPress = jest.fn();
  const mockOnNewCartPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders active cart name', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Morning Order"
          activeCartItemCount={5}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('Morning Order')).toBeTruthy();
    });

    it('renders active cart item count badge', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={5}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('(5 items)')).toBeTruthy();
    });

    it('renders Cart List button', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('Cart List')).toBeTruthy();
    });

    it('renders New Cart button', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('+ New Cart')).toBeTruthy();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      expect(getByTestId('cart-tabs')).toBeTruthy();
    });
  });

  describe('Badges', () => {
    it('shows todays cart count badge', () => {
      const { getByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={5}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      expect(getByTestId('cart-tabs-list-badge')).toBeTruthy();
      expect(getByTestId('cart-tabs-list-badge').props.children).toBe(5);
    });

    it('does not show badge when todaysCartCount is 0', () => {
      const { queryByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={0}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      expect(queryByTestId('cart-tabs-list-badge')).toBeNull();
    });

    it('renders singular item text for single item', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={1}
          todaysCartCount={2}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('(1 item)')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onCartPress when active cart is pressed', () => {
      const { getByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      fireEvent.press(getByTestId('cart-tabs-active-cart'));
      expect(mockOnCartPress).toHaveBeenCalledTimes(1);
    });

    it('calls onCartListPress when Cart List is pressed', () => {
      const { getByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      fireEvent.press(getByTestId('cart-tabs-cart-list'));
      expect(mockOnCartListPress).toHaveBeenCalledTimes(1);
    });

    it('calls onNewCartPress when New Cart is pressed', () => {
      const { getByTestId } = render(
        <CartTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
          testID="cart-tabs"
        />
      );

      fireEvent.press(getByTestId('cart-tabs-new-cart'));
      expect(mockOnNewCartPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Zero Items', () => {
    it('renders zero items correctly', () => {
      const { getByText } = render(
        <CartTabsBar
          activeCartName="Empty Cart"
          activeCartItemCount={0}
          todaysCartCount={1}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('(0 items)')).toBeTruthy();
    });
  });
});
