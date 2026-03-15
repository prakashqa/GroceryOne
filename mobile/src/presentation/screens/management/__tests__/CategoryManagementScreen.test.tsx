/**
 * CategoryManagementScreen - Inventory Category Filtering Tests
 * TDD: These tests verify that inventory categories (trackInventory: true)
 * are excluded from the order/POS category management screen.
 */

import React from 'react';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import CategoryManagementScreen from '../CategoryManagementScreen';

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
  };
});

describe('CategoryManagementScreen - Inventory Category Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should NOT display inventory categories (trackInventory: true)', () => {
    const stateWithInventory = {
      catalog: {
        categories: [
          { id: 'cat-chicken', name: 'Chicken Items', icon: '🍗', sortOrder: 1, trackInventory: false },
          { id: 'cat-veg', name: 'Veg Items', icon: '🥬', sortOrder: 2, trackInventory: false },
          { id: 'cat-inv-rice', name: 'Rice', icon: '🍚', sortOrder: 5, trackInventory: true },
          { id: 'cat-inv-dal', name: 'Dal', icon: '🫘', sortOrder: 6, trackInventory: true },
        ],
        items: [],
        isInitialized: true,
      },
    };

    const { getByText, queryByText } = renderWithProviders(<CategoryManagementScreen />, {
      preloadedState: stateWithInventory,
    });

    // Order categories should appear
    expect(getByText('Chicken Items')).toBeTruthy();
    expect(getByText('Veg Items')).toBeTruthy();

    // Inventory categories should NOT appear
    expect(queryByText('Rice')).toBeNull();
    expect(queryByText('Dal')).toBeNull();
  });

  it('should show correct count of only order categories in footer', () => {
    const stateWithInventory = {
      catalog: {
        categories: [
          { id: 'cat-1', name: 'Chicken Items', icon: '🍗', sortOrder: 1, trackInventory: false },
          { id: 'cat-2', name: 'Veg Items', icon: '🥬', sortOrder: 2, trackInventory: false },
          { id: 'cat-3', name: 'Sea Food Items', icon: '🐟', sortOrder: 3, trackInventory: false },
          { id: 'cat-4', name: 'Rice Items', icon: '🍚', sortOrder: 4, trackInventory: false },
          { id: 'cat-inv-1', name: 'Inv Rice', icon: '🍚', sortOrder: 5, trackInventory: true },
          { id: 'cat-inv-2', name: 'Inv Dal', icon: '🫘', sortOrder: 6, trackInventory: true },
          { id: 'cat-inv-3', name: 'Inv Oil', icon: '🫗', sortOrder: 7, trackInventory: true },
        ],
        items: [],
        isInitialized: true,
      },
    };

    const { getByText } = renderWithProviders(<CategoryManagementScreen />, {
      preloadedState: stateWithInventory,
    });

    // Footer should show 4 categories (not 7)
    expect(getByText('4 Categories')).toBeTruthy();
  });

  it('should display all categories when none have trackInventory set', () => {
    const stateNoTracking = {
      catalog: {
        categories: [
          { id: 'cat-1', name: 'Rice', icon: '🍚', sortOrder: 1 },
          { id: 'cat-2', name: 'Vegetables', icon: '🥬', sortOrder: 2 },
        ],
        items: [],
        isInitialized: true,
      },
    };

    const { getByText } = renderWithProviders(<CategoryManagementScreen />, {
      preloadedState: stateNoTracking,
    });

    // Both categories should appear (undefined trackInventory defaults to order category)
    expect(getByText('Rice')).toBeTruthy();
    expect(getByText('Vegetables')).toBeTruthy();
  });

  it('should count only non-inventory items per category', () => {
    const stateWithMixedItems = {
      catalog: {
        categories: [
          { id: 'cat-order', name: 'Chicken Items', icon: '🍗', sortOrder: 1, trackInventory: false },
        ],
        items: [
          { id: 'item-1', categoryId: 'cat-order', name: 'Chicken Fry', unit: 'pcs' as const, defaultQuantity: 1, trackInventory: false },
          { id: 'item-2', categoryId: 'cat-order', name: 'Chicken Curry', unit: 'pcs' as const, defaultQuantity: 1, trackInventory: false },
        ],
        isInitialized: true,
      },
    };

    const { getByText } = renderWithProviders(<CategoryManagementScreen />, {
      preloadedState: stateWithMixedItems,
    });

    // Category should show with correct item count
    expect(getByText('Chicken Items')).toBeTruthy();
    expect(getByText('2 Items')).toBeTruthy();
  });
});
