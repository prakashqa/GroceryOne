/**
 * OrderTabsBar Component Tests
 * TDD: Tests written first for horizontal order tabs section
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OrderTabsBar from '../OrderTabsBar';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'picking.items') {
        return options?.count === 1 ? '1 item' : `${options?.count} items`;
      }
      if (key === 'picking.cartList') return 'Order List';
      if (key === 'picking.newCart') return '+ New Order';
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

describe('OrderTabsBar', () => {
  const mockOnCartPress = jest.fn();
  const mockOnCartListPress = jest.fn();
  const mockOnNewCartPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders active order name', () => {
      const { getByText } = render(
        <OrderTabsBar
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

    it('should NOT render item count text next to cart name', () => {
      const { queryByText } = render(
        <OrderTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={5}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(queryByText('(5 items)')).toBeNull();
      expect(queryByText(/items/)).toBeNull();
    });

    it('should NOT render cart icon emoji', () => {
      const { queryByText } = render(
        <OrderTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={5}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(queryByText('🛒')).toBeNull();
    });

    it('renders Order List button', () => {
      const { getByText } = render(
        <OrderTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('Order List')).toBeTruthy();
    });

    it('renders New Order button', () => {
      const { getByText } = render(
        <OrderTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={2}
          todaysCartCount={3}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(getByText('+ New Order')).toBeTruthy();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <OrderTabsBar
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
    it('shows todays order count badge', () => {
      const { getByTestId } = render(
        <OrderTabsBar
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

    it('does not show badge when todaysOrderCount is 0', () => {
      const { queryByTestId } = render(
        <OrderTabsBar
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

    it('does not render singular item text for single item', () => {
      const { queryByText } = render(
        <OrderTabsBar
          activeCartName="Test Cart"
          activeCartItemCount={1}
          todaysCartCount={2}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(queryByText('(1 item)')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onOrderPress when active order is pressed', () => {
      const { getByTestId } = render(
        <OrderTabsBar
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

    it('calls onOrderListPress when Order List is pressed', () => {
      const { getByTestId } = render(
        <OrderTabsBar
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

    it('calls onNewOrderPress when New Order is pressed', () => {
      const { getByTestId } = render(
        <OrderTabsBar
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
    it('does not render zero items text', () => {
      const { queryByText } = render(
        <OrderTabsBar
          activeCartName="Empty Cart"
          activeCartItemCount={0}
          todaysCartCount={1}
          onCartPress={mockOnCartPress}
          onCartListPress={mockOnCartListPress}
          onNewCartPress={mockOnNewCartPress}
        />
      );

      expect(queryByText('(0 items)')).toBeNull();
    });
  });
});
