/**
 * Skeleton Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  Skeleton,
  SkeletonListItem,
  SkeletonCard,
  SkeletonSummaryCard,
  SkeletonProductItem,
  SkeletonCategoryChip,
} from '../Skeleton';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      border: '#E8E8E8',
      inputBackground: '#F5F5F5',
      surface: '#FFFFFF',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
    borderRadius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      full: 9999,
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
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    cardBorderRadius: 12,
    componentPadding: 16,
    iconContainerSize: 44,
  }),
}));

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId } = render(
        <Skeleton testID="skeleton" />
      );

      expect(getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with custom width and height', () => {
      const { getByTestId } = render(
        <Skeleton width={100} height={20} testID="skeleton" />
      );

      const skeleton = getByTestId('skeleton');
      const flatStyle = Array.isArray(skeleton.props.style)
        ? skeleton.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : skeleton.props.style;
      expect(flatStyle.width).toBe(100);
      expect(flatStyle.height).toBe(20);
    });

    it('renders with percentage width', () => {
      const { getByTestId } = render(
        <Skeleton width="50%" testID="skeleton" />
      );

      const skeleton = getByTestId('skeleton');
      const flatStyle = Array.isArray(skeleton.props.style)
        ? skeleton.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : skeleton.props.style;
      expect(flatStyle.width).toBe('50%');
    });
  });

  describe('Variants', () => {
    it('renders text variant with appropriate styling', () => {
      const { getByTestId } = render(
        <Skeleton variant="text" testID="skeleton" />
      );

      const skeleton = getByTestId('skeleton');
      const flatStyle = Array.isArray(skeleton.props.style)
        ? skeleton.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : skeleton.props.style;
      expect(flatStyle.height).toBe(16);
    });

    it('renders circular variant', () => {
      const { getByTestId } = render(
        <Skeleton variant="circular" width={48} height={48} testID="skeleton" />
      );

      const skeleton = getByTestId('skeleton');
      const flatStyle = Array.isArray(skeleton.props.style)
        ? skeleton.props.style.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : skeleton.props.style;
      expect(flatStyle.borderRadius).toBe(9999);
    });

    it('renders rectangular variant', () => {
      const { getByTestId } = render(
        <Skeleton variant="rectangular" testID="skeleton" />
      );

      expect(getByTestId('skeleton')).toBeTruthy();
    });
  });
});

describe('SkeletonListItem', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(
      <SkeletonListItem testID="skeleton-list-item" />
    );

    expect(getByTestId('skeleton-list-item')).toBeTruthy();
  });

  it('renders without avatar when hasAvatar is false', () => {
    const { getByTestId, queryByTestId } = render(
      <SkeletonListItem hasAvatar={false} testID="skeleton-list-item" />
    );

    expect(getByTestId('skeleton-list-item')).toBeTruthy();
  });

  it('renders without secondary text when hasSecondary is false', () => {
    const { getByTestId } = render(
      <SkeletonListItem hasSecondary={false} testID="skeleton-list-item" />
    );

    expect(getByTestId('skeleton-list-item')).toBeTruthy();
  });

  it('renders without action when hasAction is false', () => {
    const { getByTestId } = render(
      <SkeletonListItem hasAction={false} testID="skeleton-list-item" />
    );

    expect(getByTestId('skeleton-list-item')).toBeTruthy();
  });
});

describe('SkeletonCard', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(
      <SkeletonCard testID="skeleton-card" />
    );

    expect(getByTestId('skeleton-card')).toBeTruthy();
  });

  it('renders with action button placeholder', () => {
    const { getByTestId } = render(
      <SkeletonCard hasAction testID="skeleton-card" />
    );

    expect(getByTestId('skeleton-card')).toBeTruthy();
  });
});

describe('SkeletonSummaryCard', () => {
  it('renders with correct structure', () => {
    const { getByTestId } = render(
      <SkeletonSummaryCard testID="skeleton-summary" />
    );

    expect(getByTestId('skeleton-summary')).toBeTruthy();
  });
});

describe('SkeletonProductItem', () => {
  it('renders with image and text placeholders', () => {
    const { getByTestId } = render(
      <SkeletonProductItem testID="skeleton-product" />
    );

    expect(getByTestId('skeleton-product')).toBeTruthy();
  });
});

describe('SkeletonCategoryChip', () => {
  it('renders chip skeleton', () => {
    const { getByTestId } = render(
      <SkeletonCategoryChip testID="skeleton-chip" />
    );

    expect(getByTestId('skeleton-chip')).toBeTruthy();
  });
});
