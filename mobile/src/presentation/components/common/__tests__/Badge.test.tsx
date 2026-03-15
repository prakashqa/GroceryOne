/**
 * Badge Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';
import { flattenStyle } from '../../../../__test-utils__';

// Mock the Icon component to avoid vector-icons import issue
jest.mock('../Icon', () => ({
  Icon: ({ name, size: _size, color: _color }: { name: string; size: string; color: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={`icon-${name}`}>
        <Text>{name}</Text>
      </View>
    );
  },
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      const { getByText } = render(
        <Badge>New</Badge>
      );

      expect(getByText('New')).toBeTruthy();
    });

    it('renders with numeric content', () => {
      const { getByText } = render(
        <Badge>5</Badge>
      );

      expect(getByText('5')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <Badge testID="badge">Label</Badge>
      );

      expect(getByTestId('badge')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      const { getByTestId } = render(
        <Badge testID="badge">Primary</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.backgroundColor).toBe('#EDF7EE');
    });

    it('renders success variant', () => {
      const { getByTestId } = render(
        <Badge variant="success" testID="badge">Success</Badge>
      );

      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });

    it('renders warning variant', () => {
      const { getByTestId } = render(
        <Badge variant="warning" testID="badge">Warning</Badge>
      );

      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });

    it('renders error variant', () => {
      const { getByTestId } = render(
        <Badge variant="error" testID="badge">Error</Badge>
      );

      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });

    it('renders muted variant', () => {
      const { getByTestId } = render(
        <Badge variant="muted" testID="badge">Muted</Badge>
      );

      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });

    it('renders info variant', () => {
      const { getByTestId } = render(
        <Badge variant="info" testID="badge">Info</Badge>
      );

      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByTestId } = render(
        <Badge size="sm" testID="badge">Small</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.paddingHorizontal).toBe(6);
      expect(flatStyle.paddingVertical).toBe(2);
    });

    it('renders medium size by default', () => {
      const { getByTestId } = render(
        <Badge testID="badge">Medium</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.paddingHorizontal).toBe(8);
      expect(flatStyle.paddingVertical).toBe(4);
    });
  });

  describe('Rounded', () => {
    it('renders with rounded corners by default', () => {
      const { getByTestId } = render(
        <Badge testID="badge">Label</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.borderRadius).toBe(8);
    });

    it('renders fully rounded (pill) when rounded prop is true', () => {
      const { getByTestId } = render(
        <Badge rounded testID="badge">5</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.borderRadius).toBe(9999);
    });
  });

  describe('Icon', () => {
    it('renders with icon when provided', () => {
      const { getByTestId } = render(
        <Badge icon="check" testID="badge">Complete</Badge>
      );

      expect(getByTestId('badge')).toBeTruthy();
    });
  });

  describe('Minimum Sizes', () => {
    it('renders small badge with minimum height of 20', () => {
      const { getByTestId } = render(
        <Badge size="sm" testID="badge">S</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.minHeight).toBe(20);
      expect(flatStyle.minWidth).toBe(20);
    });

    it('renders medium badge with minimum height of 24', () => {
      const { getByTestId } = render(
        <Badge size="md" testID="badge">M</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = flattenStyle(badge.props.style);
      expect(flatStyle.minHeight).toBe(24);
      expect(flatStyle.minWidth).toBe(24);
    });
  });
});
