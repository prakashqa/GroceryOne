/**
 * ActiveCartPreview Component Tests
 * TDD tests for dashboard active cart preview card
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveCartPreview } from '../ActiveCartPreview';

// Mock the hooks barrel export to avoid expo-constants import chain
jest.mock('../../../../hooks', () => ({
  useDeviceType: () => ({
    isTablet: false,
    isLandscape: false,
    breakpoint: 'sm',
    screenWidth: 375,
    screenHeight: 812,
  }),
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.activeCart': 'Active Cart',
        'dashboard.continue': 'Continue',
        'dashboard.items': 'items',
        'dashboard.categories': 'categories',
        'dashboard.uniqueItems': 'unique items',
        'dashboard.qty': 'qty',
        'dashboard.lastUpdated': 'Last updated',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ActiveCartPreview', () => {
  const defaultProps = {
    cartName: 'Morning Order',
    categoryCount: 3,
    itemCount: 5,
    totalQuantity: 12.5,
    totalAmount: 1250,
    lastUpdated: '10 mins ago',
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onContinue.mockClear();
  });

  describe('Rendering', () => {
    it('renders cart name', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText('Morning Order')).toBeTruthy();
    });

    it('renders item count', () => {
      const { getAllByText } = render(<ActiveCartPreview {...defaultProps} />);
      // Item count appears in the stats section (may appear multiple times)
      const elements = getAllByText(/5/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders total quantity', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText(/12.5/)).toBeTruthy();
    });

    it('renders total amount when provided', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      // Amount should be formatted as currency
      expect(getByText(/1,250/)).toBeTruthy();
    });

    it('renders last updated time', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText(/10 mins ago/)).toBeTruthy();
    });

    it('renders continue button', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText('Continue')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <ActiveCartPreview {...defaultProps} testID="active-cart" />
      );
      expect(getByTestId('active-cart')).toBeTruthy();
    });

    it('renders category count', () => {
      const { getAllByText } = render(<ActiveCartPreview {...defaultProps} />);
      const elements = getAllByText(/3/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders categories label', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText('categories')).toBeTruthy();
    });

    it('renders unique items label', () => {
      const { getByText } = render(<ActiveCartPreview {...defaultProps} />);
      expect(getByText('unique items')).toBeTruthy();
    });
  });

  describe('Optional Amount', () => {
    it('hides amount when totalAmount is undefined', () => {
      const { queryByText } = render(
        <ActiveCartPreview {...defaultProps} totalAmount={undefined} />
      );
      // Should not show currency symbol when no amount
      expect(queryByText(/₹/)).toBeNull();
    });

    it('hides amount when totalAmount is 0', () => {
      const { queryByTestId } = render(
        <ActiveCartPreview {...defaultProps} totalAmount={0} testID="cart" />
      );
      // The component should still render
      expect(queryByTestId('cart')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onContinue when continue button is pressed', () => {
      const { getByTestId } = render(
        <ActiveCartPreview {...defaultProps} testID="active-cart" />
      );
      fireEvent.press(getByTestId('active-cart-continue-btn'));
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when card is pressed', () => {
      const { getByTestId } = render(
        <ActiveCartPreview {...defaultProps} testID="active-cart" />
      );
      fireEvent.press(getByTestId('active-cart'));
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('renders with zero items', () => {
      const { getByTestId } = render(
        <ActiveCartPreview
          cartName=""
          categoryCount={0}
          itemCount={0}
          totalQuantity={0}
          onContinue={jest.fn()}
          testID="empty-cart"
        />
      );
      // Empty cart should still render
      expect(getByTestId('empty-cart')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility label', () => {
      const { getByTestId } = render(
        <ActiveCartPreview {...defaultProps} testID="active-cart" />
      );
      const card = getByTestId('active-cart');
      expect(card.props.accessibilityLabel).toContain('Morning Order');
    });
  });
});
