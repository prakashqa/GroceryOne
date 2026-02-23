/**
 * CategoryBar Component Tests
 * TDD: Tests written first for horizontal category icon selector
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryBar from '../CategoryBar';
import { Category } from '../../../../domain/types/picking';

// Mock itemTranslations
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedCategoryName: (category: { name: string }) => category.name,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      border: '#e0e0e0',
      inCartBackground: '#E8F5E9',
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 12,
      md: 16,
      lg: 24,
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    contentPadding: 16,
  }),
  useDeviceType: () => ({
    isTablet: false,
    isPhone: true,
  }),
}));

describe('CategoryBar', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Grains', icon: '🌾' },
    { id: 'cat-2', name: 'Rice', icon: '🍚' },
    { id: 'cat-3', name: 'Dals', icon: '🫘' },
    { id: 'cat-4', name: 'Oils', icon: '🫒' },
    { id: 'cat-5', name: 'Spices', icon: '🌶️' },
  ];

  const mockOnCategorySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all categories', () => {
      const { getByText } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
        />
      );

      expect(getByText('Grains')).toBeTruthy();
      expect(getByText('Rice')).toBeTruthy();
      expect(getByText('Dals')).toBeTruthy();
      expect(getByText('Oils')).toBeTruthy();
      expect(getByText('Spices')).toBeTruthy();
    });

    it('renders category icons', () => {
      const { getByText } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
        />
      );

      expect(getByText('🌾')).toBeTruthy();
      expect(getByText('🍚')).toBeTruthy();
      expect(getByText('🫘')).toBeTruthy();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      expect(getByTestId('category-bar')).toBeTruthy();
    });
  });

  describe('Selection State', () => {
    it('marks the selected category', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-2"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      expect(getByTestId('category-bar-item-cat-2-selected')).toBeTruthy();
    });

    it('does not mark unselected categories', () => {
      const { queryByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-2"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      expect(queryByTestId('category-bar-item-cat-1-selected')).toBeNull();
      expect(queryByTestId('category-bar-item-cat-3-selected')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onCategorySelect when a category is pressed', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      fireEvent.press(getByTestId('category-bar-item-cat-3'));
      expect(mockOnCategorySelect).toHaveBeenCalledWith('cat-3');
    });

    it('calls onCategorySelect with correct id for each category', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      fireEvent.press(getByTestId('category-bar-item-cat-5'));
      expect(mockOnCategorySelect).toHaveBeenCalledWith('cat-5');
    });
  });

  describe('Empty State', () => {
    it('renders empty when no categories provided', () => {
      const { queryByTestId } = render(
        <CategoryBar
          categories={[]}
          selectedCategoryId=""
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      expect(queryByTestId('category-bar-item-cat-1')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('has accessibility role tab on category items', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      const categoryItem = getByTestId('category-bar-item-cat-1');
      expect(categoryItem.props.accessibilityRole).toBe('tab');
    });

    it('has accessibilityLabel with category name', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-1"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      const categoryItem = getByTestId('category-bar-item-cat-2');
      expect(categoryItem.props.accessibilityLabel).toBe('Rice');
    });

    it('has accessibilityState selected for active category', () => {
      const { getByTestId } = render(
        <CategoryBar
          categories={mockCategories}
          selectedCategoryId="cat-2"
          onCategorySelect={mockOnCategorySelect}
          testID="category-bar"
        />
      );

      const selectedItem = getByTestId('category-bar-item-cat-2');
      expect(selectedItem.props.accessibilityState).toEqual({ selected: true });

      const unselectedItem = getByTestId('category-bar-item-cat-1');
      expect(unselectedItem.props.accessibilityState).toEqual({ selected: false });
    });
  });
});
