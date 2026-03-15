/**
 * ItemManagementScreen - Category Filter Chip Tests
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import ItemManagementScreen from '../ItemManagementScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
      canGoBack: () => true,
      getParent: () => null,
      getState: () => ({ routes: [] }),
      isFocused: () => true,
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

const preloadedState = {
  catalog: {
    categories: [
      { id: 'cat-1', name: 'Rice', icon: '🍚', sortOrder: 1, isActive: true },
      { id: 'cat-2', name: 'Vegetables', icon: '🥬', sortOrder: 2, isActive: true },
    ],
    items: [
      {
        id: 'item-1',
        categoryId: 'cat-1',
        name: 'Basmati Rice',
        unit: 'kg' as const,
        defaultQuantity: 5,
      },
    ],
    isInitialized: true,
  },
};

describe('ItemManagementScreen - Inventory Item Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should NOT display inventory items (trackInventory: true)', () => {
    const stateWithInventory = {
      catalog: {
        categories: [
          { id: 'cat-1', name: 'Rice', icon: '🍚', sortOrder: 1, isActive: true },
          { id: 'cat-inv', name: 'Inventory Spices', icon: '🌶', sortOrder: 2, isActive: true, trackInventory: true },
        ],
        items: [
          {
            id: 'item-1',
            categoryId: 'cat-1',
            name: 'Basmati Rice',
            unit: 'kg' as const,
            defaultQuantity: 5,
            trackInventory: false,
          },
          {
            id: 'item-inv-1',
            categoryId: 'cat-inv',
            name: 'Salt',
            unit: 'kg' as const,
            defaultQuantity: 1,
            trackInventory: true,
          },
        ],
        isInitialized: true,
      },
    };

    const { getByText, queryByText } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState: stateWithInventory,
    });

    // Order items should appear
    expect(getByText('Basmati Rice')).toBeTruthy();

    // Inventory items should NOT appear
    expect(queryByText('Salt')).toBeNull();
  });

  it('should NOT display inventory categories in category chips', () => {
    const stateWithInventory = {
      catalog: {
        categories: [
          { id: 'cat-1', name: 'Rice', icon: '🍚', sortOrder: 1, isActive: true, trackInventory: false },
          { id: 'cat-inv', name: 'Inventory Spices', icon: '🌶', sortOrder: 2, isActive: true, trackInventory: true },
        ],
        items: [],
        isInitialized: true,
      },
    };

    const { getByTestId, queryByTestId } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState: stateWithInventory,
    });

    // Order category chip should appear
    expect(getByTestId('category-chip-cat-1')).toBeTruthy();

    // Inventory category chip should NOT appear
    expect(queryByTestId('category-chip-cat-inv')).toBeNull();
  });
});

describe('ItemManagementScreen - Category Filter Chips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the All chip and category chips with testIDs', () => {
    const { getByTestId } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState,
    });

    expect(getByTestId('category-chip-all')).toBeTruthy();
    expect(getByTestId('category-chip-cat-1')).toBeTruthy();
    expect(getByTestId('category-chip-cat-2')).toBeTruthy();
  });

  it('should apply consistent borderRadius to All chip and category chips', () => {
    const { getByTestId } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState,
    });

    const allChip = getByTestId('category-chip-all');
    const riceChip = getByTestId('category-chip-cat-1');
    const vegChip = getByTestId('category-chip-cat-2');

    const allStyle = StyleSheet.flatten(allChip.props.style);
    const riceStyle = StyleSheet.flatten(riceChip.props.style);
    const vegStyle = StyleSheet.flatten(vegChip.props.style);

    // All chips must have the same borderRadius
    expect(allStyle.borderRadius).toBeDefined();
    expect(riceStyle.borderRadius).toBeDefined();
    expect(vegStyle.borderRadius).toBeDefined();
    expect(allStyle.borderRadius).toBe(riceStyle.borderRadius);
    expect(riceStyle.borderRadius).toBe(vegStyle.borderRadius);
  });

  it('should apply consistent padding to All chip and category chips', () => {
    const { getByTestId } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState,
    });

    const allChip = getByTestId('category-chip-all');
    const riceChip = getByTestId('category-chip-cat-1');
    const vegChip = getByTestId('category-chip-cat-2');

    const allStyle = StyleSheet.flatten(allChip.props.style);
    const riceStyle = StyleSheet.flatten(riceChip.props.style);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vegStyle = StyleSheet.flatten(vegChip.props.style);

    // All chips must have the same vertical padding
    expect(allStyle.paddingVertical).toBeDefined();
    expect(riceStyle.paddingVertical).toBeDefined();
    expect(allStyle.paddingVertical).toBe(riceStyle.paddingVertical);

    // All chips must have the same horizontal padding
    expect(allStyle.paddingHorizontal).toBeDefined();
    expect(riceStyle.paddingHorizontal).toBeDefined();
    expect(allStyle.paddingHorizontal).toBe(riceStyle.paddingHorizontal);
  });

  it('should not have extra marginRight on All chip that doubles gap spacing', () => {
    const { getByTestId } = renderWithProviders(<ItemManagementScreen />, {
      preloadedState,
    });

    const allChip = getByTestId('category-chip-all');
    const riceChip = getByTestId('category-chip-cat-1');

    const allStyle = StyleSheet.flatten(allChip.props.style);
    const riceStyle = StyleSheet.flatten(riceChip.props.style);

    // Neither chip should have marginRight since gap handles spacing
    expect(allStyle.marginRight).toBeUndefined();
    expect(riceStyle.marginRight).toBeUndefined();
  });
});
