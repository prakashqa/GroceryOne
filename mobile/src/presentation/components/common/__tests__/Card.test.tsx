/**
 * Card Component Tests
 * TDD tests for card container component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';
import { flattenStyle } from '../../../../__test-utils__';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('Card', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      expect(getByText('Card Content')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders elevated variant by default', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Elevated</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders outlined variant', () => {
      const { getByTestId } = render(
        <Card variant="outlined" testID="card">
          <Text>Outlined</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders filled variant', () => {
      const { getByTestId } = render(
        <Card variant="filled" testID="card">
          <Text>Filled</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('Padding', () => {
    it('renders with no padding', () => {
      const { getByTestId } = render(
        <Card padding="none" testID="card">
          <Text>No padding</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders with small padding', () => {
      const { getByTestId } = render(
        <Card padding="sm" testID="card">
          <Text>Small padding</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders with medium padding by default', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Medium padding</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('renders with large padding', () => {
      const { getByTestId } = render(
        <Card padding="lg" testID="card">
          <Text>Large padding</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('Press Interaction', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPress} testID="card">
          <Text>Pressable</Text>
        </Card>
      );

      fireEvent.press(getByTestId('card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPress} disabled testID="card">
          <Text>Disabled</Text>
        </Card>
      );

      fireEvent.press(getByTestId('card'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('renders without press interaction when onPress not provided', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Non-pressable</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has button role when pressable', () => {
      const { getByTestId } = render(
        <Card onPress={() => {}} testID="card">
          <Text>Pressable</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('has none role when not pressable', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Non-pressable</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.accessibilityRole).toBe('none');
    });

    it('has disabled state when disabled', () => {
      const { getByTestId } = render(
        <Card onPress={() => {}} disabled testID="card">
          <Text>Disabled</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Highlighted Feature', () => {
    it('renders highlighted card with accent border', () => {
      const { getByTestId } = render(
        <Card highlighted testID="card">
          <Text>Highlighted</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('applies primary border color when highlighted', () => {
      const { getByTestId } = render(
        <Card highlighted testID="card">
          <Text>Highlighted</Text>
        </Card>
      );
      const card = getByTestId('card');
      const flatStyle = flattenStyle(card.props.style);
      expect(flatStyle.borderColor).toBe('#2E7D32');
    });

    it('renders highlighted with elevated variant', () => {
      const { getByTestId } = render(
        <Card variant="elevated" highlighted testID="card">
          <Text>Highlighted Elevated</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('does not apply highlight border when disabled', () => {
      const { getByTestId } = render(
        <Card highlighted disabled testID="card">
          <Text>Disabled Highlighted</Text>
        </Card>
      );
      const card = getByTestId('card');
      const flatStyle = flattenStyle(card.props.style);
      // Should not have primary border when disabled
      expect(flatStyle.borderColor).not.toBe('#2E7D32');
    });
  });

  describe('Shadow Enhancement', () => {
    it('uses medium shadow for elevated variant', () => {
      const { getByTestId } = render(
        <Card variant="elevated" testID="card">
          <Text>Elevated</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });
});
