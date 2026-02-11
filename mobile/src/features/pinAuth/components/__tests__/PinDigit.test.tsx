/**
 * PinDigit Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PinDigit } from '../PinDigit';

// Mock theme hook
jest.mock('../../../../presentation/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      text: '#212121',
      textLight: '#757575',
      border: '#E0E0E0',
      error: '#F44336',
      surface: '#FFFFFF',
      background: '#F5F5F5',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
    borderRadius: {
      full: 999,
      md: 8,
    },
    typography: {
      fontSize: { sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, '2xl': 28, xxxl: 32 },
      fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },
  }),
}));

describe('PinDigit', () => {
  describe('rendering', () => {
    it('should render empty state when not filled', () => {
      const { getByTestId } = render(
        <PinDigit filled={false} testID="pin-digit" />
      );
      const digit = getByTestId('pin-digit');
      expect(digit).toBeTruthy();
    });

    it('should render filled state when filled', () => {
      const { getByTestId } = render(
        <PinDigit filled={true} testID="pin-digit" />
      );
      const digit = getByTestId('pin-digit');
      expect(digit).toBeTruthy();
    });

    it('should show dot when secure and filled', () => {
      const { getByTestId } = render(
        <PinDigit filled={true} secure={true} value="5" testID="pin-digit" />
      );
      const dot = getByTestId('pin-digit-dot');
      expect(dot).toBeTruthy();
    });

    it('should not show value when secure', () => {
      const { queryByText } = render(
        <PinDigit filled={true} secure={true} value="5" testID="pin-digit" />
      );
      expect(queryByText('5')).toBeNull();
    });

    it('should show value when not secure and filled', () => {
      const { getByText } = render(
        <PinDigit filled={true} secure={false} value="7" testID="pin-digit" />
      );
      expect(getByText('7')).toBeTruthy();
    });
  });

  describe('visual states', () => {
    it('should apply different style when hasError is true', () => {
      const { getByTestId } = render(
        <PinDigit filled={true} hasError={true} testID="pin-digit" />
      );
      const container = getByTestId('pin-digit-container');
      expect(container.props.style).toBeDefined();
    });

    it('should have circular shape', () => {
      const { getByTestId } = render(
        <PinDigit filled={false} testID="pin-digit" />
      );
      const container = getByTestId('pin-digit-container');
      // Check that borderRadius is applied (circular shape)
      const flatStyle = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style)
        : container.props.style;
      expect(flatStyle.borderRadius).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('should have accessible role', () => {
      const { getByTestId } = render(
        <PinDigit filled={true} testID="pin-digit" />
      );
      const digit = getByTestId('pin-digit');
      expect(digit.props.accessibilityRole).toBe('text');
    });

    it('should indicate filled state for accessibility', () => {
      const { getByTestId } = render(
        <PinDigit filled={true} testID="pin-digit" />
      );
      const digit = getByTestId('pin-digit');
      expect(digit.props.accessibilityLabel).toContain('filled');
    });

    it('should indicate empty state for accessibility', () => {
      const { getByTestId } = render(
        <PinDigit filled={false} testID="pin-digit" />
      );
      const digit = getByTestId('pin-digit');
      expect(digit.props.accessibilityLabel).toContain('empty');
    });
  });
});
