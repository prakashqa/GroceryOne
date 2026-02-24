/**
 * DashboardScreen Tests
 * TDD tests for the main merchant dashboard screen
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: (callback: () => void) => callback(),
}));

// Mock Redux
const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: Function) => mockUseSelector(selector),
  useDispatch: () => mockDispatch,
  useStore: () => ({}),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOptions?: string | Record<string, any>) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.todaysOverview': "Today's Overview",
        'dashboard.cartsCreated': 'Carts',
        'dashboard.itemsPicked': 'Items',
        'dashboard.totalQuantity': 'Qty',
        'dashboard.salesAmount': 'Sales',
        'dashboard.quickActions': 'Quick Actions',
        'dashboard.newCart': 'New Cart',
        'dashboard.scanList': 'Scan List',
        'dashboard.viewCarts': 'View Carts',
        'dashboard.manageItems': 'Manage Items',
        'dashboard.activeCart': 'Active Cart',
        'dashboard.continue': 'Continue',
        'dashboard.recentCarts': 'Recent Carts',
        'dashboard.viewAll': 'View All',
        'dashboard.draft': 'Draft',
        'dashboard.printed': 'Printed',
        'dashboard.completed': 'Completed',
        'dashboard.items': 'items',
        'dashboard.qty': 'qty',
        'dashboard.lastUpdated': 'Last updated',
        'dashboard.noRecentCarts': 'No recent carts',
        'dashboard.startPicking': 'Start picking',
        'dashboard.ocrFromPaper': 'OCR from paper',
        'dashboard.seeAllCarts': 'See all carts',
        'dashboard.categoriesItems': 'Categories & Items',
        'dashboard.resumeDraft': 'Resume Draft',
        'manageCategories.title': 'Manage Categories',
        'manageCategories.categories': 'Categories',
        'dashboard.todaysReport': "Today's Report",
        'dashboard.viewSummary': 'View daily summary',
        'dashboard.reports': 'Reports',
        'dashboard.viewAnalytics': 'Sales & analytics',
        'dashboard.startByCreating': 'Create a cart to get started',
        'dashboard.goodMorning': 'Good morning',
        'dashboard.goodAfternoon': 'Good afternoon',
        'dashboard.goodEvening': 'Good evening',
        'time.justNow': 'Just now',
        'time.minutesAgo': '{{count}} min ago',
        'time.hoursAgo': '{{count}} hr ago',
        'time.yesterday': 'Yesterday',
        'time.daysAgo': '{{count}} days ago',
        'picking.createCart': 'Create New Cart',
        'picking.cartName': 'Cart Name',
        'picking.enterCartName': 'Enter cart name',
        'picking.create': 'Create',
        'picking.duplicateName': 'A cart with this name already exists',
        'cancel': 'Cancel',
      };
      const fallback = typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;
      let value = translations[key] || fallback || key;
      // Handle interpolation
      if (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null) {
        Object.entries(fallbackOrOptions).forEach(([k, v]) => {
          value = value.replace(`{{${k}}}`, String(v));
        });
      }
      return value;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock tenantSlice and authSlice selectors
jest.mock('../../../../store/slices/tenantSlice', () => ({
  selectTenant: jest.fn(),
}));

jest.mock('../../../../store/slices/authSlice', () => ({
  selectCurrentUser: jest.fn(),
}));

// Mock multiCartSlice selectors
jest.mock('../../../../store/slices/multiCartSlice', () => ({
  selectTodaysMetrics: jest.fn(),
  selectCartsByStatus: jest.fn(),
  selectActiveCart: jest.fn(),
  selectActiveCartItemCount: jest.fn(),
  selectActiveCartCategoryCount: jest.fn(),
  selectActiveCartTotalQuantity: jest.fn(),
  selectActiveCartGrandTotal: jest.fn(),
  selectRecentCarts: jest.fn(),
  selectTodaysCarts: jest.fn(),
  selectCartsSortedByDate: jest.fn(),
  selectMostRecentDraftCart: jest.fn(),
  selectAllCarts: jest.fn(),
  createCart: jest.fn(() => ({ type: 'multiCart/createCart' })),
  setActiveCart: jest.fn((cartId: string) => ({ type: 'multiCart/setActiveCart', payload: cartId })),
}));

import {
  selectTodaysMetrics,
  selectCartsByStatus,
  selectActiveCart,
  selectActiveCartItemCount,
  selectActiveCartCategoryCount,
  selectActiveCartTotalQuantity,
  selectActiveCartGrandTotal,
  selectRecentCarts,
  selectTodaysCarts,
  selectCartsSortedByDate,
  selectMostRecentDraftCart,
  selectAllCarts,
  setActiveCart,
} from '../../../../store/slices/multiCartSlice';

import { selectTenant } from '../../../../store/slices/tenantSlice';
import { selectCurrentUser } from '../../../../store/slices/authSlice';

describe('DashboardScreen', () => {
  const mockTodaysMetrics = {
    cartsCreated: 5,
    itemsPicked: 23,
    totalQuantity: 45.5,
    totalSales: 12450,
  };

  const mockStatusCounts = {
    draft: 2,
    printed: 1,
    completed: 2,
  };

  const mockActiveCart = {
    id: 'cart-1',
    name: 'Morning Order',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    status: 'draft' as const,
  };

  const mockRecentCarts = [
    {
      id: 'cart-2',
      name: 'Customer A Cart',
      items: [{ item: {}, quantity: 2, addedAt: '' }],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed' as const,
    },
    {
      id: 'cart-3',
      name: 'Evening Stock',
      items: [{ item: {}, quantity: 3, addedAt: '' }],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'printed' as const,
    },
  ];

  const mockMostRecentDraft = {
    id: 'draft-cart-1',
    name: 'My Draft Cart',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    status: 'draft' as const,
  };

  const mockTenant = {
    id: 'tenant-1',
    name: 'QuickBasket Groceries',
    slug: 'quickbasket',
    status: 'active' as const,
    subscriptionPlan: 'premium' as const,
    branding: {
      primaryColor: '#4CAF50',
      secondaryColor: '#2196F3',
      fontFamily: 'Roboto',
    },
    defaultLanguage: 'en' as const,
    supportedLanguages: ['en' as const],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCurrentUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@quickbasket.com',
    role: 'admin' as const,
    status: 'active' as const,
    preferredLanguage: 'en',
    notificationPreferences: {
      push: true,
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: true,
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  // === Selector mock helper ===
  const setupSelectorMock = (overrides: Record<string, any> = {}) => {
    const m = {
      tenant: mockTenant, currentUser: mockCurrentUser, todaysMetrics: mockTodaysMetrics,
      statusCounts: mockStatusCounts, activeCart: mockActiveCart, itemCount: 5, categoryCount: 3,
      totalQuantity: 12.5, grandTotal: 1250, sortedCarts: mockRecentCarts,
      mostRecentDraft: mockMostRecentDraft, allCarts: [...mockRecentCarts, mockActiveCart],
      ...overrides,
    };
    mockUseSelector.mockImplementation((selector: any) => {
      if (selector === selectTenant) return m.tenant;
      if (selector === selectCurrentUser) return m.currentUser;
      if (selector === selectTodaysMetrics) return m.todaysMetrics;
      if (selector === selectCartsByStatus) return m.statusCounts;
      if (selector === selectActiveCart) return m.activeCart;
      if (selector === selectActiveCartItemCount) return m.itemCount;
      if (selector === selectActiveCartCategoryCount) return m.categoryCount;
      if (selector === selectActiveCartTotalQuantity) return m.totalQuantity;
      if (selector === selectActiveCartGrandTotal) return m.grandTotal;
      if (selector === selectCartsSortedByDate) return m.sortedCarts;
      if (selector === selectTodaysCarts) return m.sortedCarts;
      if (selector === selectMostRecentDraftCart) return m.mostRecentDraft;
      if (selector === selectAllCarts) return m.allCarts;
      if (typeof selector === 'function') {
        try { return selector({ multiCart: { carts: m.sortedCarts } }); } catch { return m.sortedCarts; }
      }
      return m.sortedCarts;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockDispatch.mockClear();
    setupSelectorMock();
  });

  describe('Rendering', () => {
    it('renders dashboard title', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('Dashboard')).toBeTruthy();
    });

    it('renders today\'s overview section', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText("Today's Overview")).toBeTruthy();
    });

    it('renders summary cards with metrics', () => {
      const { getAllByText } = render(<DashboardScreen />);
      // Check for metric values - '5' appears in multiple places (carts created, item count)
      const fiveElements = getAllByText('5');
      expect(fiveElements.length).toBeGreaterThan(0);
    });

    it('renders quick actions section', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('Quick Actions')).toBeTruthy();
    });

    it('renders quick action buttons', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('New Cart')).toBeTruthy();
      expect(getByText('Scan List')).toBeTruthy();
      expect(getByText('Manage Categories')).toBeTruthy();
      expect(getByText('Manage Items')).toBeTruthy();
      expect(getByText('Reports')).toBeTruthy();
    });

    it('does not render Resume Draft action', () => {
      const { queryByText } = render(<DashboardScreen />);
      expect(queryByText('Resume Draft')).toBeNull();
    });

    it('renders active cart preview when active cart exists', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('Morning Order')).toBeTruthy();
    });

    it('renders recent carts section', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('Recent Carts')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      expect(getByTestId('dashboard')).toBeTruthy();
    });

    it('displays full day and date in header (e.g., Thursday, February 5)', () => {
      const { getByText } = render(<DashboardScreen />);
      const now = new Date();
      const expectedDate = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      expect(getByText(expectedDate)).toBeTruthy();
    });
  });

  describe('Without Active Cart', () => {
    it('hides active cart preview when no active cart', () => {
      setupSelectorMock({ activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0 });
      const { queryByText } = render(<DashboardScreen />);
      expect(queryByText('Morning Order')).toBeNull();
    });
  });

  describe('New Cart Creation', () => {
    it('shows CreateCartModal when New Cart is pressed', () => {
      const { getByTestId, getByText } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-new-cart'));
      // Modal should be visible with Create New Cart title
      expect(getByText('Create New Cart')).toBeTruthy();
    });

    it('does not navigate immediately when New Cart is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-new-cart'));
      // Should NOT navigate immediately - modal should be shown first
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not create cart immediately when New Cart is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-new-cart'));
      // Should NOT dispatch createCart immediately - wait for user to enter name
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {

    it('navigates to CameraCapture when Scan List is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-scan-list'));
      expect(mockNavigate).toHaveBeenCalledWith('CameraCapture');
    });

    it('navigates to CategoryManagement when Manage Categories is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-manage-categories'));
      expect(mockNavigate).toHaveBeenCalledWith('CategoryManagement');
    });

    it('navigates to ItemManagement when Manage Items is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-manage-items'));
      expect(mockNavigate).toHaveBeenCalledWith('ItemManagement');
    });

    it('navigates to Reports when Reports is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-reports'));
      expect(mockNavigate).toHaveBeenCalledWith('Reports');
    });


    it('navigates to Picking screen to add items when Continue is pressed on active cart', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('active-cart-continue-btn'));
      expect(mockNavigate).toHaveBeenCalledWith('Picking');
    });

    it('sets active cart and navigates to Cart when a Recent Cart is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      // Press the first recent cart (cart-2)
      fireEvent.press(getByTestId('recent-cart-cart-2'));
      // Should dispatch setActiveCart with the cart ID
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'multiCart/setActiveCart',
          payload: 'cart-2',
        })
      );
      // Should navigate directly to Cart screen, not CartsTab
      expect(mockNavigate).toHaveBeenCalledWith('Cart');
    });
  });

  describe('Pull to Refresh', () => {
    it('renders scroll view with refresh control', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const scrollView = getByTestId('dashboard-scroll');
      expect(scrollView).toBeTruthy();
    });
  });

  describe('Recent Carts price calculation', () => {
    it('should apply unit multiplier for gm/ml items in cart totals', () => {
      // Cart with gm items: price is per-kg, quantity is in grams
      // Correct total: 500 * 200 * 0.001 + 300 * 500 * 0.001 = 100 + 150 = 250
      // Buggy total (no multiplier): 500 * 200 + 300 * 500 = 100000 + 150000 = 250000
      const cartWithGmItems = {
        id: 'cart-gm',
        name: 'Gram Cart',
        items: [
          { item: { unit: 'gm' }, quantity: 200, addedAt: '', priceSnapshot: 500 },
          { item: { unit: 'gm' }, quantity: 500, addedAt: '', priceSnapshot: 300 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid' as const,
      };

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: [cartWithGmItems], mostRecentDraft: null, allCarts: [cartWithGmItems],
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const cartElement = getByTestId('recent-cart-cart-gm');

      // Correct total with unit multiplier: ₹250
      // The accessibility label contains the formatted amount
      expect(cartElement.props.accessibilityLabel).toContain('₹250');
    });

    it('should not inflate prices for kg/pcs items', () => {
      // Cart with kg items: price is per-kg, quantity is in kg — no multiplier needed
      // Correct total: 100 * 2 + 200 * 3 = 200 + 600 = 800
      const cartWithKgItems = {
        id: 'cart-kg',
        name: 'Kg Cart',
        items: [
          { item: { unit: 'kg' }, quantity: 2, addedAt: '', priceSnapshot: 100 },
          { item: { unit: 'pcs' }, quantity: 3, addedAt: '', priceSnapshot: 200 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid' as const,
      };

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: [cartWithKgItems], mostRecentDraft: null, allCarts: [cartWithKgItems],
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const cartElement = getByTestId('recent-cart-cart-kg');

      // Total: 100*2 + 200*3 = 800
      expect(cartElement.props.accessibilityLabel).toContain('₹800');
    });
  });

  describe('Store and User Info', () => {
    it('should display store name in header when tenant is available', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const storeNameElement = getByTestId('dashboard-store-name');
      expect(storeNameElement).toBeTruthy();
    });

    it('should display store name and user role in header', () => {
      const { getByText } = render(<DashboardScreen testID="dashboard" />);
      // Should show "QuickBasket Groceries · Admin"
      expect(getByText(/QuickBasket Groceries/)).toBeTruthy();
      expect(getByText(/Admin/)).toBeTruthy();
    });

    it('should not display store name when tenant is null', () => {
      setupSelectorMock({ tenant: null });
      const { queryByTestId } = render(<DashboardScreen testID="dashboard" />);
      expect(queryByTestId('dashboard-store-name')).toBeNull();
    });

    it('should show only store name without role when user is null', () => {
      setupSelectorMock({ currentUser: null });
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      expect(getByTestId('dashboard-store-name')).toBeTruthy();
    });
  });

  describe('Recent Carts - Today\'s carts and paidAmount', () => {
    it('should show all of today\'s carts in Recent Carts section', () => {
      const now = new Date();
      const fiveTodayCarts = [
        {
          id: 'cart-a',
          name: 'Cart A',
          items: [{ item: { unit: 'kg' }, quantity: 1, addedAt: '', priceSnapshot: 100 }],
          createdAt: now.toISOString(),
          updatedAt: new Date(now.getTime() - 1000).toISOString(),
          status: 'paid' as const,
          paidAmount: 100,
          paidAt: now.toISOString(),
        },
        {
          id: 'cart-b',
          name: 'Cart B',
          items: [{ item: { unit: 'kg' }, quantity: 2, addedAt: '', priceSnapshot: 200 }],
          createdAt: now.toISOString(),
          updatedAt: new Date(now.getTime() - 2000).toISOString(),
          status: 'paid' as const,
          paidAmount: 400,
          paidAt: now.toISOString(),
        },
        {
          id: 'cart-c',
          name: 'Cart C',
          items: [{ item: { unit: 'kg' }, quantity: 1, addedAt: '', priceSnapshot: 50 }],
          createdAt: now.toISOString(),
          updatedAt: new Date(now.getTime() - 3000).toISOString(),
          status: 'draft' as const,
        },
        {
          id: 'cart-d',
          name: 'Cart D',
          items: [],
          createdAt: now.toISOString(),
          updatedAt: new Date(now.getTime() - 4000).toISOString(),
          status: 'paid' as const,
          paidAmount: 250,
          paidAt: now.toISOString(),
        },
        {
          id: 'cart-e',
          name: 'Cart E',
          items: [{ item: { unit: 'pcs' }, quantity: 3, addedAt: '', priceSnapshot: 30 }],
          createdAt: now.toISOString(),
          updatedAt: new Date(now.getTime() - 5000).toISOString(),
          status: 'paid' as const,
          paidAmount: 90,
          paidAt: now.toISOString(),
        },
      ];

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: fiveTodayCarts, mostRecentDraft: null, allCarts: fiveTodayCarts,
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);

      // All 5 today's carts should appear, not just 3
      expect(getByTestId('recent-cart-cart-a')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-b')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-c')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-d')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-e')).toBeTruthy();
    });

    it('should display paidAmount for paid carts in Recent Carts', () => {
      const paidCart = {
        id: 'cart-paid',
        name: 'Paid Cart',
        items: [
          { item: { unit: 'kg' }, quantity: 2, addedAt: '', priceSnapshot: 100 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid' as const,
        paidAmount: 500,
        paidAt: new Date().toISOString(),
      };

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: [paidCart], mostRecentDraft: null, allCarts: [paidCart],
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const cartElement = getByTestId('recent-cart-cart-paid');

      // Should show paidAmount (₹500) not calculated total (₹200)
      expect(cartElement.props.accessibilityLabel).toContain('₹500');
    });

    it('should display paidItemCount for paid carts when items array is empty', () => {
      const paidCartNoItems = {
        id: 'cart-paid-empty',
        name: 'Paid Empty Cart',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid' as const,
        paidAmount: 750,
        paidAt: new Date().toISOString(),
        paidItemCount: 5,
      };

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: [paidCartNoItems], mostRecentDraft: null, allCarts: [paidCartNoItems],
      });

      const { getByText } = render(<DashboardScreen testID="dashboard" />);

      // Should show "5 items" (from paidItemCount), not "0 items" (from items.length)
      expect(getByText(/^5\s/)).toBeTruthy();
    });

    it('should show carts from previous days in Recent Carts section', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const mixedDateCarts = [
        {
          id: 'cart-today',
          name: 'Today Cart',
          items: [{ item: { unit: 'kg' }, quantity: 1, addedAt: '', priceSnapshot: 100 }],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          status: 'paid' as const,
          paidAmount: 100,
        },
        {
          id: 'cart-yesterday',
          name: 'Yesterday Cart',
          items: [{ item: { unit: 'kg' }, quantity: 2, addedAt: '', priceSnapshot: 200 }],
          createdAt: yesterday.toISOString(),
          updatedAt: yesterday.toISOString(),
          status: 'paid' as const,
          paidAmount: 400,
        },
        {
          id: 'cart-old',
          name: 'Old Cart',
          items: [{ item: { unit: 'pcs' }, quantity: 3, addedAt: '', priceSnapshot: 50 }],
          createdAt: twoDaysAgo.toISOString(),
          updatedAt: twoDaysAgo.toISOString(),
          status: 'paid' as const,
          paidAmount: 150,
        },
      ];

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: mixedDateCarts, mostRecentDraft: null, allCarts: mixedDateCarts,
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);

      // All carts from all dates should be visible
      expect(getByTestId('recent-cart-cart-today')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-yesterday')).toBeTruthy();
      expect(getByTestId('recent-cart-cart-old')).toBeTruthy();
    });

    it('should limit Recent Carts to 10 most recent', () => {
      const now = new Date();
      const manyCarts = Array.from({ length: 15 }, (_, i) => ({
        id: `cart-${i}`,
        name: `Cart ${i}`,
        items: [],
        createdAt: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
        status: 'paid' as const,
        paidAmount: 100 + i,
      }));

      setupSelectorMock({
        activeCart: null, itemCount: 0, categoryCount: 0, totalQuantity: 0, grandTotal: 0,
        sortedCarts: manyCarts, mostRecentDraft: null, allCarts: manyCarts,
      });

      const { queryByTestId } = render(<DashboardScreen testID="dashboard" />);

      // First 10 should be present
      for (let i = 0; i < 10; i++) {
        expect(queryByTestId(`recent-cart-cart-${i}`)).toBeTruthy();
      }
      // 11th and beyond should NOT be present
      expect(queryByTestId('recent-cart-cart-10')).toBeNull();
      expect(queryByTestId('recent-cart-cart-14')).toBeNull();
    });
  });
});
