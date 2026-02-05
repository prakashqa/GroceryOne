/**
 * Badge Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';

// Mock the Icon component to avoid vector-icons import issue
jest.mock('../Icon', () => ({
  Icon: ({ name, size, color }: { name: string; size: string; color: string }) => {
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
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      primaryLight: '#4CAF50',
      success: '#2E7D32',
      warning: '#F57C00',
      error: '#D32F2F',
      info: '#1976D2',
      text: '#1A1A1A',
      textSecondary: '#666666',
      textInverse: '#FFFFFF',
      border: '#E8E8E8',
      surface: '#FFFFFF',
      inCartBackground: '#F1F8E9',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
      },
    },
    borderRadius: {
      xs: 4,
      sm: 8,
      full: 9999,
    },
  }),
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    fontScale: 1,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 12,
    modalWidth: 600,
    sectionSpacing: 24,
  }),
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
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
      expect(flatStyle.backgroundColor).toBe('#F1F8E9');
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
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
      expect(flatStyle.paddingHorizontal).toBe(6);
      expect(flatStyle.paddingVertical).toBe(2);
    });

    it('renders medium size by default', () => {
      const { getByTestId } = render(
        <Badge testID="badge">Medium</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
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
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
      expect(flatStyle.borderRadius).toBe(8);
    });

    it('renders fully rounded (pill) when rounded prop is true', () => {
      const { getByTestId } = render(
        <Badge rounded testID="badge">5</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
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
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
      expect(flatStyle.minHeight).toBe(20);
      expect(flatStyle.minWidth).toBe(20);
    });

    it('renders medium badge with minimum height of 24', () => {
      const { getByTestId } = render(
        <Badge size="md" testID="badge">M</Badge>
      );

      const badge = getByTestId('badge');
      const flatStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : badge.props.style;
      expect(flatStyle.minHeight).toBe(24);
      expect(flatStyle.minWidth).toBe(24);
    });
  });
});
