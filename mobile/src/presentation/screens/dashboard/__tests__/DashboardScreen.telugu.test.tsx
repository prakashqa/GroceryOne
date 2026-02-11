/**
 * DashboardScreen Telugu Translation Integration Tests
 * Verifies that the Dashboard screen renders correctly in Telugu language
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import { DashboardScreen } from '../DashboardScreen';
import i18n from '../../../../i18n/i18n.config';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: (callback: () => void) => callback(),
}));

describe('DashboardScreen - Telugu Translation Integration', () => {
  beforeEach(async () => {
    // Set language to Telugu before each test
    await i18n.changeLanguage('te');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Reset to English after all tests
    await i18n.changeLanguage('en');
  });

  it('should render dashboard title in Telugu', async () => {
    const { getByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      expect(getByText('డాష్‌బోర్డ్')).toBeTruthy();
    });
  });

  it('should render summary cards with Telugu labels', async () => {
    const { getByText, getAllByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      expect(getByText('కార్ట్‌లు')).toBeTruthy(); // Carts
      expect(getAllByText('వస్తువులు').length).toBeGreaterThanOrEqual(1); // Items (appears in summary card and Manage Items subtitle)
      expect(getByText('అమ్మకాలు')).toBeTruthy(); // Sales
    });
  });

  it('should render quick actions in Telugu', async () => {
    const { getByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      expect(getByText('త్వరిత చర్యలు')).toBeTruthy(); // Quick Actions
      expect(getByText('కొత్త కార్ట్')).toBeTruthy(); // New Cart
      expect(getByText('జాబితా స్కాన్ చేయండి')).toBeTruthy(); // Scan List
      expect(getByText('రిపోర్ట్‌లు')).toBeTruthy(); // Reports (dashboard.reports)
      expect(getByText('కేటగిరీలు నిర్వహించండి')).toBeTruthy(); // Manage Categories
      expect(getByText('వస్తువులను నిర్వహించండి')).toBeTruthy(); // Manage Items
    });
  });

  it('should render recent carts section in Telugu', async () => {
    const { getByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      expect(getByText('ఇటీవలి కార్ట్‌లు')).toBeTruthy(); // Recent Carts
    });
  });

  it('should render greeting in Telugu', async () => {
    const { queryByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      // Should NOT show English greetings
      expect(queryByText('Good morning')).toBeNull();
      expect(queryByText('Good afternoon')).toBeNull();
      expect(queryByText('Good evening')).toBeNull();
    });
  });

  it('should not contain any English text for dashboard elements', async () => {
    const { queryByText } = renderWithProviders(<DashboardScreen />, {
      preloadedState: {
        cart: {
          currentCart: null,
          savedCarts: [],
          isLoading: false,
        },
      },
    });

    await waitFor(() => {
      // Verify English text is NOT present (fallback detection)
      expect(queryByText('Dashboard')).toBeNull();
      expect(queryByText('Quick Actions')).toBeNull();
      expect(queryByText('New Cart')).toBeNull();
      expect(queryByText('Recent Carts')).toBeNull();
      expect(queryByText('Scan List')).toBeNull();
      expect(queryByText('Reports')).toBeNull();
      expect(queryByText('Manage Categories')).toBeNull();
      expect(queryByText('Manage Items')).toBeNull();
    });
  });
});
