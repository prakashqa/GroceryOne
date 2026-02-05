/**
 * CategoryListItem Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryListItem from '../CategoryListItem';
import { Category } from '../../../../domain/types/picking';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      primaryLight: '#81C784',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      border: '#e0e0e0',
      card: '#ffffff',
      error: '#F44336',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'manageItems.itemsCount') {
        return `${options?.count || 0} items`;
      }
      if (key === 'edit') return 'Edit';
      if (key === 'delete') return 'Delete';
      return key;
    },
  }),
}));

// Mock itemTranslations
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedCategoryName: (category: Category) => category.name,
}));

describe('CategoryListItem', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Vegetables',
    icon: '🥬',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category name correctly', () => {
    const { getByText } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText('Vegetables')).toBeTruthy();
  });

  it('renders category icon', () => {
    const { getByText } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText('🥬')).toBeTruthy();
  });

  it('renders item count correctly', () => {
    const { getByText } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText('5 items')).toBeTruthy();
  });

  it('calls onEdit when edit button is pressed', () => {
    const { getByTestId } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        testID="category-item"
      />
    );

    fireEvent.press(getByTestId('category-item-edit-button'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockCategory);
  });

  it('calls onDelete when delete button is pressed', () => {
    const { getByTestId } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        testID="category-item"
      />
    );

    fireEvent.press(getByTestId('category-item-delete-button'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockCategory);
  });

  // NEW TEST: Verify onPress handler is called when category row is pressed
  it('calls onPress with category when the category row is pressed', () => {
    const { getByTestId } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPress={mockOnPress}
        testID="category-item"
      />
    );

    fireEvent.press(getByTestId('category-item-pressable'));
    expect(mockOnPress).toHaveBeenCalledWith(mockCategory);
  });

  it('does not crash when onPress is not provided', () => {
    const { getByTestId } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        testID="category-item"
      />
    );

    // Should render without error even when onPress is not provided
    expect(getByTestId('category-item')).toBeTruthy();
  });

  it('renders chevron icon when onPress is provided', () => {
    const { getByTestId } = render(
      <CategoryListItem
        category={mockCategory}
        itemCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPress={mockOnPress}
        testID="category-item"
      />
    );

    expect(getByTestId('category-item-chevron')).toBeTruthy();
  });
});
