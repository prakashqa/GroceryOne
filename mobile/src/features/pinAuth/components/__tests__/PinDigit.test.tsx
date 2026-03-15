/**
 * PinDigit Component Tests
 * TDD: Write tests first, then implement
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PinDigit } from '../PinDigit';
import { flattenStyle } from '../../../../__test-utils__/helpers/style-helpers';

// Mock theme hook
jest.mock('../../../../presentation/theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
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
      const flatStyle = flattenStyle(container.props.style);
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
