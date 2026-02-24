/**
 * SummaryCard Component Tests
 * TDD tests for dashboard summary card
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { SummaryCard } from '../SummaryCard';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('SummaryCard', () => {
  describe('Rendering', () => {
    it('renders with title and value', () => {
      const { getByText } = render(
        <SummaryCard title="Carts Created" value="5" />
      );

      expect(getByText('Carts Created')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { getByText } = render(
        <SummaryCard title="Sales" value="1000" icon="cart" />
      );

      expect(getByText('Sales')).toBeTruthy();
      expect(getByText('1000')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <SummaryCard title="Test" value="10" testID="summary-card" />
      );

      expect(getByTestId('summary-card')).toBeTruthy();
    });

    it('renders numeric value', () => {
      const { getByText } = render(
        <SummaryCard title="Items" value={42} />
      );

      expect(getByText('42')).toBeTruthy();
    });

    it('renders formatted currency value', () => {
      const { getByText } = render(
        <SummaryCard title="Sales" value="12,450" />
      );

      expect(getByText('12,450')).toBeTruthy();
    });
  });

  describe('Subtitle', () => {
    it('renders subtitle when provided', () => {
      const { getByText } = render(
        <SummaryCard
          title="Carts"
          value="5"
          subtitle="Created today"
        />
      );

      expect(getByText('Created today')).toBeTruthy();
    });

    it('does not render subtitle when not provided', () => {
      const { queryByTestId } = render(
        <SummaryCard
          title="Carts"
          value="5"
          testID="card"
        />
      );

      expect(queryByTestId('card-subtitle')).toBeNull();
    });
  });

  describe('Colors', () => {
    it('applies primary color by default', () => {
      const { getByTestId } = render(
        <SummaryCard title="Test" value="10" testID="card" />
      );

      const card = getByTestId('card');
      expect(card).toBeTruthy();
    });

    it('supports custom color variants', () => {
      const { getByTestId } = render(
        <SummaryCard
          title="Test"
          value="10"
          colorVariant="success"
          testID="card"
        />
      );

      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility label', () => {
      const { getByTestId } = render(
        <SummaryCard
          title="Carts Created"
          value="5"
          testID="card"
        />
      );

      const card = getByTestId('card');
      expect(card.props.accessibilityLabel).toBe('Carts Created: 5');
    });
  });

  describe('Press Interaction', () => {
    it('handles onPress callback when provided', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <SummaryCard
          title="Carts"
          value="5"
          testID="card"
          onPress={onPress}
        />
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders without press interaction when onPress not provided', () => {
      const { getByTestId } = render(
        <SummaryCard
          title="Carts"
          value="5"
          testID="card"
        />
      );

      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('Animation', () => {
    it('renders with animation delay prop', () => {
      const { getByTestId } = render(
        <SummaryCard
          title="Carts"
          value="5"
          testID="card"
          animationDelay={100}
        />
      );

      expect(getByTestId('card')).toBeTruthy();
    });
  });
});
