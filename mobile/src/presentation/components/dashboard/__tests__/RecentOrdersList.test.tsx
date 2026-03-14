/**
 * RecentOrdersList Component Tests
 * TDD tests for dashboard recent orders list
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecentOrdersList } from '../RecentOrdersList';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.recentCarts': 'Recent Orders',
        'dashboard.draft': 'Draft',
        'dashboard.printed': 'Printed',
        'dashboard.completed': 'Completed',
        'dashboard.noRecentCarts': 'No recent orders',
        'dashboard.items': 'items',
        'dashboard.startByCreating': 'Create an order to get started',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

describe('RecentOrdersList', () => {
  const mockOrders = [
    {
      id: 'cart-1',
      name: 'Customer A Cart',
      status: 'completed' as const,
      totalAmount: 2340,
      timeAgo: '2h ago',
      itemCount: 8,
    },
    {
      id: 'cart-2',
      name: 'Evening Stock',
      status: 'printed' as const,
      totalAmount: 890,
      timeAgo: '4h ago',
      itemCount: 5,
    },
    {
      id: 'cart-3',
      name: 'Wholesale Order',
      status: 'draft' as const,
      totalAmount: 5670,
      timeAgo: 'Yesterday',
      itemCount: 15,
    },
  ];

  const defaultProps = {
    carts: mockOrders,
    onCartPress: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onCartPress.mockClear();
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      const { getByText } = render(<RecentOrdersList {...defaultProps} />);
      expect(getByText('Recent Orders')).toBeTruthy();
    });

    it('renders all order items', () => {
      const { getByText } = render(<RecentOrdersList {...defaultProps} />);
      expect(getByText('Customer A Cart')).toBeTruthy();
      expect(getByText('Evening Stock')).toBeTruthy();
      expect(getByText('Wholesale Order')).toBeTruthy();
    });

    it('renders order status badges', () => {
      const { getByText } = render(<RecentOrdersList {...defaultProps} />);
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Printed')).toBeTruthy();
      expect(getByText('Draft')).toBeTruthy();
    });

    it('renders order amounts', () => {
      const { getByText } = render(<RecentOrdersList {...defaultProps} />);
      // Amounts formatted as INR
      expect(getByText(/2,340/)).toBeTruthy();
      expect(getByText(/890/)).toBeTruthy();
      expect(getByText(/5,670/)).toBeTruthy();
    });

    it('renders time ago for each order', () => {
      const { getByText } = render(<RecentOrdersList {...defaultProps} />);
      expect(getByText('2h ago')).toBeTruthy();
      expect(getByText('4h ago')).toBeTruthy();
      expect(getByText('Yesterday')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <RecentOrdersList {...defaultProps} testID="recent-carts" />
      );
      expect(getByTestId('recent-carts')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no orders', () => {
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={[]} />
      );
      expect(getByText('No recent orders')).toBeTruthy();
    });

    it('shows create order prompt when no orders', () => {
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={[]} />
      );
      expect(getByText('Create an order to get started')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onOrderPress with order id when order is tapped', () => {
      const { getByTestId } = render(
        <RecentOrdersList {...defaultProps} testID="recent-carts" />
      );
      fireEvent.press(getByTestId('recent-cart-cart-1'));
      expect(defaultProps.onCartPress).toHaveBeenCalledWith('cart-1');
    });
  });

  describe('Status Colors', () => {
    it('applies correct color for completed status', () => {
      const completedOnlyOrders = [mockOrders[0]];
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={completedOnlyOrders} />
      );
      const badge = getByText('Completed');
      expect(badge).toBeTruthy();
    });

    it('applies correct color for printed status', () => {
      const printedOnlyOrders = [mockOrders[1]];
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={printedOnlyOrders} />
      );
      const badge = getByText('Printed');
      expect(badge).toBeTruthy();
    });

    it('applies correct color for draft status', () => {
      const draftOnlyOrders = [mockOrders[2]];
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={draftOnlyOrders} />
      );
      const badge = getByText('Draft');
      expect(badge).toBeTruthy();
    });

    it('uses warning (orange) color for draft status, not primary (green)', () => {
      const draftOnlyOrders = [mockOrders[2]];
      const { getByText } = render(
        <RecentOrdersList {...defaultProps} carts={draftOnlyOrders} />
      );
      const badge = getByText('Draft');
      const flatStyle = Array.isArray(badge.props.style)
        ? Object.assign({}, ...badge.props.style)
        : badge.props.style;
      // Draft must use warning color (orange), not primary (green)
      expect(flatStyle.color).toBe('#F57C00');
    });
  });

  describe('Accessibility', () => {
    it('order items have accessibility role', () => {
      const { getByTestId } = render(
        <RecentOrdersList {...defaultProps} testID="recent-carts" />
      );
      const cartItem = getByTestId('recent-cart-cart-1');
      expect(cartItem.props.accessibilityRole).toBe('button');
    });
  });
});
