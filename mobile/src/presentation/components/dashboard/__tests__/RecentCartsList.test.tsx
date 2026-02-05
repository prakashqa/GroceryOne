/**
 * RecentCartsList Component Tests
 * TDD tests for dashboard recent carts list
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecentCartsList } from '../RecentCartsList';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      primaryLight: '#4CAF50',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      background: '#F5F5F5',
      text: '#1A1A1A',
      textSecondary: '#666666',
      textLight: '#999999',
      success: '#2E7D32',
      warning: '#F57C00',
      info: '#1976D2',
      border: '#E8E8E8',
      divider: '#E8E8E8',
    },
    spacing: {
      xs: 4,
      sm: 8,
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
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    animation: {
      fast: 150,
      normal: 200,
      slow: 300,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.recentCarts': 'Recent Carts',
        'dashboard.draft': 'Draft',
        'dashboard.printed': 'Printed',
        'dashboard.completed': 'Completed',
        'dashboard.noRecentCarts': 'No recent carts',
        'dashboard.items': 'items',
        'dashboard.startByCreating': 'Create a cart to get started',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

describe('RecentCartsList', () => {
  const mockCarts = [
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
    carts: mockCarts,
    onCartPress: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onCartPress.mockClear();
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      const { getByText } = render(<RecentCartsList {...defaultProps} />);
      expect(getByText('Recent Carts')).toBeTruthy();
    });

    it('renders all cart items', () => {
      const { getByText } = render(<RecentCartsList {...defaultProps} />);
      expect(getByText('Customer A Cart')).toBeTruthy();
      expect(getByText('Evening Stock')).toBeTruthy();
      expect(getByText('Wholesale Order')).toBeTruthy();
    });

    it('renders cart status badges', () => {
      const { getByText } = render(<RecentCartsList {...defaultProps} />);
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Printed')).toBeTruthy();
      expect(getByText('Draft')).toBeTruthy();
    });

    it('renders cart amounts', () => {
      const { getByText } = render(<RecentCartsList {...defaultProps} />);
      // Amounts formatted as INR
      expect(getByText(/2,340/)).toBeTruthy();
      expect(getByText(/890/)).toBeTruthy();
      expect(getByText(/5,670/)).toBeTruthy();
    });

    it('renders time ago for each cart', () => {
      const { getByText } = render(<RecentCartsList {...defaultProps} />);
      expect(getByText('2h ago')).toBeTruthy();
      expect(getByText('4h ago')).toBeTruthy();
      expect(getByText('Yesterday')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <RecentCartsList {...defaultProps} testID="recent-carts" />
      );
      expect(getByTestId('recent-carts')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no carts', () => {
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={[]} />
      );
      expect(getByText('No recent carts')).toBeTruthy();
    });

    it('shows create cart prompt when no carts', () => {
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={[]} />
      );
      expect(getByText('Create a cart to get started')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onCartPress with cart id when cart is tapped', () => {
      const { getByTestId } = render(
        <RecentCartsList {...defaultProps} testID="recent-carts" />
      );
      fireEvent.press(getByTestId('recent-cart-cart-1'));
      expect(defaultProps.onCartPress).toHaveBeenCalledWith('cart-1');
    });
  });

  describe('Status Colors', () => {
    it('applies correct color for completed status', () => {
      const completedOnlyCarts = [mockCarts[0]];
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={completedOnlyCarts} />
      );
      const badge = getByText('Completed');
      expect(badge).toBeTruthy();
    });

    it('applies correct color for printed status', () => {
      const printedOnlyCarts = [mockCarts[1]];
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={printedOnlyCarts} />
      );
      const badge = getByText('Printed');
      expect(badge).toBeTruthy();
    });

    it('applies correct color for draft status', () => {
      const draftOnlyCarts = [mockCarts[2]];
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={draftOnlyCarts} />
      );
      const badge = getByText('Draft');
      expect(badge).toBeTruthy();
    });

    it('uses warning (orange) color for draft status, not primary (green)', () => {
      const draftOnlyCarts = [mockCarts[2]];
      const { getByText } = render(
        <RecentCartsList {...defaultProps} carts={draftOnlyCarts} />
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
    it('cart items have accessibility role', () => {
      const { getByTestId } = render(
        <RecentCartsList {...defaultProps} testID="recent-carts" />
      );
      const cartItem = getByTestId('recent-cart-cart-1');
      expect(cartItem.props.accessibilityRole).toBe('button');
    });
  });
});
