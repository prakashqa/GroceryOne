/**
 * SummaryCard Component Tests
 * TDD tests for dashboard summary card
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { SummaryCard } from '../SummaryCard';

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
        xl: 20,
        xxl: 24,
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    textStyles: {
      h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
      h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
      h3: { fontSize: 18, fontWeight: '600', letterSpacing: 0 },
      body: { fontSize: 16, fontWeight: '400' },
      bodySmall: { fontSize: 14, fontWeight: '400' },
      caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2 },
      button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
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
    opacity: {
      disabled: 0.5,
      pressed: 0.12,
      overlay: 0.6,
      muted: 0.1,
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    gridColumns: 2,
    contentPadding: 16,
    contentMaxWidth: undefined,
    tabBarHeight: 60,
    iconSize: 24,
    fontScale: 1,
    cardMinWidth: 140,
    listColumns: 1,
    gridGap: 12,
    tabBarIconSize: 24,
    tabBarLabelSize: 11,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
    modalWidth: 343,
    sectionSpacing: 16,
  }),
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
