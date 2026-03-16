/**
 * Icon Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon } from '../Icon';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

describe('Icon', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId } = render(
        <Icon name="cart" testID="icon" />
      );

      expect(getByTestId('icon')).toBeTruthy();
    });

    it('renders with custom testID', () => {
      const { getByTestId } = render(
        <Icon name="settings" testID="settings-icon" />
      );

      expect(getByTestId('settings-icon')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size (16px)', () => {
      const { getByTestId } = render(
        <Icon name="cart" size="sm" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.size).toBe(16);
    });

    it('renders medium size by default (24px)', () => {
      const { getByTestId } = render(
        <Icon name="cart" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.size).toBe(24);
    });

    it('renders large size (32px)', () => {
      const { getByTestId } = render(
        <Icon name="cart" size="lg" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.size).toBe(32);
    });

    it('renders extra large size (40px)', () => {
      const { getByTestId } = render(
        <Icon name="cart" size="xl" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.size).toBe(40);
    });
  });

  describe('Colors', () => {
    it('uses icon color by default', () => {
      const { getByTestId } = render(
        <Icon name="cart" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.color).toBe('#1A1A1A');
    });

    it('applies primary color', () => {
      const { getByTestId } = render(
        <Icon name="cart" color="primary" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.color).toBe('#2E7D32');
    });

    it('applies error color', () => {
      const { getByTestId } = render(
        <Icon name="delete" color="error" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.color).toBe('#D32F2F');
    });

    it('applies warning color', () => {
      const { getByTestId } = render(
        <Icon name="warning" color="warning" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.color).toBe('#F57C00');
    });

    it('applies secondary color', () => {
      const { getByTestId } = render(
        <Icon name="info" color="secondary" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.color).toBe('#666666');
    });
  });

  describe('Icon Names', () => {
    it('maps cart icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="cart" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('cart-outline');
    });

    it('maps edit icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="edit" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('pencil-outline');
    });

    it('maps delete icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="delete" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('delete-outline');
    });

    it('maps settings icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="settings" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('cog-outline');
    });

    it('maps search icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="search" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('magnify');
    });

    it('maps close icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="close" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('close');
    });

    it('maps check icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="check" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('check');
    });

    it('maps add icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="add" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('plus');
    });

    it('maps remove icon name correctly', () => {
      const { getByTestId } = render(
        <Icon name="remove" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.name).toBe('minus');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility label by default', () => {
      const { getByTestId } = render(
        <Icon name="cart" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.accessibilityLabel).toBeUndefined();
    });

    it('applies custom accessibility label', () => {
      const { getByTestId } = render(
        <Icon name="cart" accessibilityLabel="Shopping cart" testID="icon" />
      );

      const icon = getByTestId('icon');
      expect(icon.props.accessibilityLabel).toBe('Shopping cart');
    });
  });
});
