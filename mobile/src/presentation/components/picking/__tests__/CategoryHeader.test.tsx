/**
 * CategoryHeader Component Tests
 * TDD: Tests written first for category title with item count display
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import CategoryHeader from '../CategoryHeader';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'picking.itemCount') {
        return options?.count === 1 ? '1 item' : `${options?.count} items`;
      }
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({
    isTablet: false,
    isPhone: true,
  }),
}));

describe('CategoryHeader', () => {
  it('renders category name correctly', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="Grains" itemCount={6} />
    );

    expect(getByText('Grains')).toBeTruthy();
  });

  it('renders item count correctly for multiple items', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="Rice" itemCount={10} />
    );

    expect(getByText('10 items')).toBeTruthy();
  });

  it('renders singular item text for single item', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="Dals" itemCount={1} />
    );

    expect(getByText('1 item')).toBeTruthy();
  });

  it('renders zero items correctly', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="Oils" itemCount={0} />
    );

    expect(getByText('0 items')).toBeTruthy();
  });

  it('renders with testID when provided', () => {
    const { getByTestId } = render(
      <CategoryHeader
        categoryName="Spices"
        itemCount={15}
        testID="category-header"
      />
    );

    expect(getByTestId('category-header')).toBeTruthy();
  });

  it('renders category name with special characters', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="Dals & Pulses" itemCount={8} />
    );

    expect(getByText('Dals & Pulses')).toBeTruthy();
  });

  it('renders Telugu category name', () => {
    const { getByText } = render(
      <CategoryHeader categoryName="ధాన్యాలు" itemCount={6} />
    );

    expect(getByText('ధాన్యాలు')).toBeTruthy();
  });
});
