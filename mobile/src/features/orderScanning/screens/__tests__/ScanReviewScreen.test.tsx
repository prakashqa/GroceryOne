/**
 * ScanReviewScreen Tests
 * TDD: Tests written first to verify cart validation and filtering behavior
 * Focus: Fix for scanned items not being added to paid carts
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { ScanReviewScreen } from '../ScanReviewScreen';
import multiCartReducer from '../../../../store/slices/multiCartSlice';
import scanReducer from '../../store/scanSlice';
import catalogReducer from '../../../../store/slices/catalogSlice';
import { Item, ManagedCart } from '../../../../domain/types/picking';
import { MatchResult, MatchConfidence } from '../../types/scanning.types';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'error': 'Error',
        'cancel': 'Cancel',
        'confirm': 'OK',
        'done': 'Done',
        'scan.review': 'Review Items',
        'scan.noItemsToAdd': 'No items to add',
        'scan.noActiveCart': 'No active cart. Please create or select a cart.',
        'scan.cartNotEditable': 'The selected cart cannot be modified. Please select a different cart.',
        'scan.addToCart': 'Add to Cart',
        'scan.selectCart': 'Add to',
        'scan.newCart': 'New Cart',
        'scan.detected': `${options?.count || 0} items detected`,
        'scan.addedToCart': `Added ${options?.count || 0} items to cart`,
        'scan.discardConfirm': 'Discard scanned items?',
        'scan.exact': 'Exact',
        'scan.likely': 'Likely',
        'scan.notFound': 'Not Found',
        'scan.skip': 'Skipped',
        'scan.selectItem': 'Select Item',
        'picking.viewCart': 'View Cart',
        'picking.defaultCart': 'Default Cart',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      textInverse: '#ffffff',
      headerBackground: '#1B5E20',
      headerText: '#ffffff',
      headerTextMuted: 'rgba(255, 255, 255, 0.8)',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#ffffff',
      border: '#e0e0e0',
      inputBackground: 'rgba(255, 255, 255, 0.15)',
    },
    spacing: { xs: 4, sm: 8, smd: 12, md: 16, lg: 24, xl: 32 },
    typography: {
      fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 20, xxl: 24 },
      fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 24 },
  }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock domain utils
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (id: string) => id,
}));

// Mock sub-components to keep tests focused
jest.mock('../../components/ScannedItemRow', () => ({
  ScannedItemRow: ({ matchResult }: { matchResult: MatchResult }) => {
    const { Text } = require('react-native');
    return <Text testID={`scanned-item-${matchResult.parsedItem.lineIndex}`}>{matchResult.parsedItem.itemName}</Text>;
  },
}));

jest.mock('../../components/QuantityEditModal', () => ({
  QuantityEditModal: () => null,
}));

jest.mock('../../components/MatchStatusBadge', () => ({
  MatchStatusBadge: () => null,
}));

// Spy on Alert
jest.spyOn(Alert, 'alert');

// Test data
const mockItem: Item = {
  id: 'dal-1',
  categoryId: 'dal-pulses',
  name: 'Toor Dal',
  unit: 'kg',
  defaultQuantity: 1,
};

const mockItem2: Item = {
  id: 'rice-1',
  categoryId: 'atta-rice',
  name: 'Basmati Rice',
  unit: 'kg',
  defaultQuantity: 5,
};

const mockMatchResult: MatchResult = {
  parsedItem: {
    rawText: 'Toor Dal 1 kg',
    itemName: 'Toor Dal',
    quantity: 1,
    unit: 'kg',
    language: 'en',
    lineIndex: 0,
  },
  matchedItem: mockItem,
  confidence: 'exact' as MatchConfidence,
  confidenceScore: 100,
  alternatives: [],
};

const mockMatchResult2: MatchResult = {
  parsedItem: {
    rawText: 'Basmati Rice 5 kg',
    itemName: 'Basmati Rice',
    quantity: 5,
    unit: 'kg',
    language: 'en',
    lineIndex: 1,
  },
  matchedItem: mockItem2,
  confidence: 'exact' as MatchConfidence,
  confidenceScore: 95,
  alternatives: [],
};

// Helper to create a test store
function createTestStore(overrides: {
  carts?: ManagedCart[];
  activeCartId?: string | null;
  matchResults?: MatchResult[];
}) {
  const now = new Date().toISOString();
  const carts = overrides.carts || [];
  const activeCartId = overrides.activeCartId !== undefined ? overrides.activeCartId : (carts[0]?.id || null);
  const matchResults = overrides.matchResults || [mockMatchResult, mockMatchResult2];

  return configureStore({
    reducer: {
      multiCart: multiCartReducer,
      scan: scanReducer,
      catalog: catalogReducer,
    },
    preloadedState: {
      multiCart: {
        carts,
        activeCartId,
        isHydrated: true,
        lastSyncedAt: null,
      },
      scan: {
        currentSession: {
          id: 'test-session',
          imageUri: 'file://test-image.jpg',
          status: 'reviewing' as const,
          matchResults,
          selectedCartId: null,
          ocrResult: {
            success: true,
            rawText: 'Toor Dal 1 kg\nBasmati Rice 5 kg',
            lines: ['Toor Dal 1 kg', 'Basmati Rice 5 kg'],
            detectedLanguage: 'en' as const,
          },
          createdAt: now,
        },
        isProcessing: false,
        processingStep: null,
        error: null,
      },
      catalog: {
        categories: [],
        items: [mockItem, mockItem2],
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

function renderScreen(store: ReturnType<typeof createTestStore>) {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <ScanReviewScreen />
      </NavigationContainer>
    </Provider>
  );
}

describe('ScanReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cart Selector Filtering', () => {
    it('should filter paid carts from cart selector', () => {
      const now = new Date().toISOString();
      const store = createTestStore({
        carts: [
          {
            id: 'cart-paid',
            name: 'Paid Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'paid',
          },
          {
            id: 'cart-draft',
            name: 'Draft Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'draft',
          },
        ],
        activeCartId: 'cart-draft',
      });

      const { queryByText, getByText } = renderScreen(store);

      // Paid cart should NOT appear in selector
      expect(queryByText('Paid Cart')).toBeNull();
      // Draft cart should appear
      expect(getByText('Draft Cart')).toBeTruthy();
    });

    it('should show editable carts (draft and printed) in selector', () => {
      const now = new Date().toISOString();
      const store = createTestStore({
        carts: [
          {
            id: 'cart-draft',
            name: 'Draft Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'draft',
          },
          {
            id: 'cart-printed',
            name: 'Printed Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'printed',
          },
        ],
        activeCartId: 'cart-draft',
      });

      const { getByText } = renderScreen(store);

      expect(getByText('Draft Cart')).toBeTruthy();
      expect(getByText('Printed Cart')).toBeTruthy();
    });
  });

  describe('Add to Cart Validation', () => {
    it('should auto-create a draft cart when only paid carts exist, allowing items to be added', async () => {
      const now = new Date().toISOString();
      const store = createTestStore({
        carts: [
          {
            id: 'cart-paid',
            name: 'Paid Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'paid',
          },
        ],
        activeCartId: 'cart-paid',
      });

      const { getByText } = renderScreen(store);

      // Wait for auto-create to fire
      await waitFor(() => {
        const state = store.getState();
        const editableCarts = state.multiCart.carts.filter(
          (c) => c.status !== 'paid' && c.status !== 'completed'
        );
        expect(editableCarts.length).toBeGreaterThanOrEqual(1);
      });

      // Now press Add to Cart — should succeed because auto-created cart is active
      fireEvent.press(getByText(/Add to Cart/));

      // Should show success, not error
      expect(Alert.alert).toHaveBeenCalledWith(
        'OK',
        'Added 2 items to cart',
        expect.any(Array)
      );
    });

    it('should add items to auto-created cart when no carts exist', async () => {
      const store = createTestStore({
        carts: [],
        activeCartId: null,
      });

      const { getByText } = renderScreen(store);

      // Wait for auto-create to fire
      await waitFor(() => {
        const state = store.getState();
        expect(state.multiCart.carts.length).toBeGreaterThanOrEqual(1);
      });

      // Now press Add to Cart — should succeed
      fireEvent.press(getByText(/Add to Cart/));

      expect(Alert.alert).toHaveBeenCalledWith(
        'OK',
        'Added 2 items to cart',
        expect.any(Array)
      );

      // Verify items were added
      const state = store.getState();
      const activeCart = state.multiCart.carts.find(
        (c) => c.id === state.multiCart.activeCartId
      );
      expect(activeCart?.items).toHaveLength(2);
    });

    it('should successfully add items when active cart is draft', () => {
      const now = new Date().toISOString();
      const store = createTestStore({
        carts: [
          {
            id: 'cart-draft',
            name: 'My Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'draft',
          },
        ],
        activeCartId: 'cart-draft',
      });

      const { getByText } = renderScreen(store);

      fireEvent.press(getByText(/Add to Cart/));

      // Should show success alert (not error)
      expect(Alert.alert).toHaveBeenCalledWith(
        'OK',
        'Added 2 items to cart',
        expect.any(Array)
      );

      // Verify items were actually added to the cart
      const state = store.getState();
      expect(state.multiCart.carts[0].items).toHaveLength(2);
      expect(state.multiCart.carts[0].items[0].item.id).toBe('dal-1');
      expect(state.multiCart.carts[0].items[1].item.id).toBe('rice-1');
    });
  });

  describe('Auto-create Cart', () => {
    it('should auto-create cart when no editable carts exist', async () => {
      const now = new Date().toISOString();
      const store = createTestStore({
        carts: [
          {
            id: 'cart-paid',
            name: 'Paid Cart',
            items: [],
            createdAt: now,
            updatedAt: now,
            status: 'paid',
          },
        ],
        activeCartId: 'cart-paid',
      });

      renderScreen(store);

      // Wait for useEffect to trigger cart creation
      await waitFor(() => {
        const state = store.getState();
        const editableCarts = state.multiCart.carts.filter(
          (c) => c.status !== 'paid' && c.status !== 'completed'
        );
        expect(editableCarts.length).toBeGreaterThanOrEqual(1);
      });

      // The new cart should be set as active
      const state = store.getState();
      const activeCart = state.multiCart.carts.find(
        (c) => c.id === state.multiCart.activeCartId
      );
      expect(activeCart?.status).toBe('draft');
    });
  });
});
