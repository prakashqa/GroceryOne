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
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      primaryLight: '#4CAF50',
      primaryDark: '#388E3C',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      background: '#F5F5F5',
      text: '#1A1A1A',
      textSecondary: '#666666',
      textLight: '#999999',
      success: '#2E7D32',
      warning: '#F57C00',
      info: '#1976D2',
      border: '#E8E8E8',
      divider: '#E8E8E8',
      error: '#f44336',
      disabled: '#bdbdbd',
      buttonPrimary: '#2E7D32',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryPressed: '#1B5E20',
      buttonSecondaryText: '#2E7D32',
      buttonDangerText: '#FFFFFF',
      buttonGhostText: '#666666',
      buttonGhostPressed: 'rgba(0, 0, 0, 0.05)',
      inCartBackground: '#F1F8E9',
      inCartBorder: '#C8E6C9',
      iconMuted: 'rgba(46, 125, 50, 0.1)',
      modalOverlay: 'rgba(0, 0, 0, 0.6)',
      inputBackground: '#F5F5F5',
      inputFocus: '#2E7D32',
      placeholder: '#9E9E9E',
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 20,
        '2xl': 20,
        xxl: 24,
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    letterSpacing: {
      tight: -0.5,
      snug: -0.3,
      normal: 0,
      wide: 0.3,
      wider: 0.5,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    animation: {
      fast: 150,
      normal: 200,
      slow: 300,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      },
    },
    coloredShadows: {
      primary: { shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
      success: { shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
      warning: { shadowColor: '#F57C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
      info: { shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    },
    gradients: {
      primary: ['#2E7D32', '#4CAF50'],
      primarySubtle: ['#E8F5E9', '#C8E6C9'],
      success: ['#2E7D32', '#4CAF50'],
      info: ['#1976D2', '#42A5F5'],
      warning: ['#F57C00', '#FFA726'],
      card: ['#FFFFFF', '#F5F5F5'],
    },
    opacity: {
      disabled: 0.5,
      pressed: 0.12,
      overlay: 0.6,
      muted: 0.1,
    },
    buttonHeights: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    textStyles: {
      h1: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      h2: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.3,
      },
      h3: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0,
      },
      subtitle: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: 0,
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 0,
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: 0.2,
      },
      overline: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.8,
      },
      button: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
      },
    },
  }),
  useIsDarkMode: () => false,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockDispatch.mockClear();

    // Setup default selector returns
    (selectTodaysMetrics as jest.Mock).mockReturnValue(mockTodaysMetrics);
    (selectCartsByStatus as jest.Mock).mockReturnValue(mockStatusCounts);
    (selectActiveCart as jest.Mock).mockReturnValue(mockActiveCart);
    (selectActiveCartItemCount as jest.Mock).mockReturnValue(5);
    (selectActiveCartCategoryCount as jest.Mock).mockReturnValue(3);
    (selectActiveCartTotalQuantity as jest.Mock).mockReturnValue(12.5);
    (selectActiveCartGrandTotal as jest.Mock).mockReturnValue(1250);
    (selectRecentCarts as jest.Mock).mockImplementation((_state: any, _limit?: number) => mockRecentCarts);
    (selectTodaysCarts as jest.Mock).mockReturnValue(mockRecentCarts);
    (selectMostRecentDraftCart as jest.Mock).mockReturnValue(mockMostRecentDraft);
    (selectAllCarts as jest.Mock).mockReturnValue([...mockRecentCarts, mockActiveCart]);
    (selectTenant as jest.Mock).mockReturnValue(mockTenant);
    (selectCurrentUser as jest.Mock).mockReturnValue(mockCurrentUser);

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectTenant) return mockTenant;
      if (selector === selectCurrentUser) return mockCurrentUser;
      if (selector === selectTodaysMetrics) return mockTodaysMetrics;
      if (selector === selectCartsByStatus) return mockStatusCounts;
      if (selector === selectActiveCart) return mockActiveCart;
      if (selector === selectActiveCartItemCount) return 5;
      if (selector === selectActiveCartCategoryCount) return 3;
      if (selector === selectActiveCartTotalQuantity) return 12.5;
      if (selector === selectActiveCartGrandTotal) return 1250;
      if (selector === selectTodaysCarts) return mockRecentCarts;
      if (selector === selectMostRecentDraftCart) return mockMostRecentDraft;
      if (selector === selectAllCarts) return [...mockRecentCarts, mockActiveCart];
      // Handle inline selectors like (state) => selectRecentCarts(state, 3)
      if (typeof selector === 'function') {
        try { return selector({ multiCart: { carts: mockRecentCarts } }); } catch { return mockRecentCarts; }
      }
      return mockRecentCarts;
    });
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
      expect(getByText('Manage Items')).toBeTruthy();
      expect(getByText('Reports')).toBeTruthy();
    });

    it('renders Resume Draft action when draft exists', () => {
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('Resume Draft')).toBeTruthy();
      expect(getByText('My Draft Cart')).toBeTruthy(); // Draft cart name as subtitle
    });

    it('does not render Resume Draft action when no draft exists', () => {
      (selectMostRecentDraftCart as jest.Mock).mockReturnValue(null);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return mockActiveCart;
        if (selector === selectActiveCartItemCount) return 5;
        if (selector === selectActiveCartCategoryCount) return 3;
        if (selector === selectActiveCartTotalQuantity) return 12.5;
        if (selector === selectActiveCartGrandTotal) return 1250;
        if (selector === selectAllCarts) return [...mockRecentCarts, mockActiveCart];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: mockRecentCarts } }); } catch { return mockRecentCarts; }
        }
        return mockRecentCarts;
      });

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
      (selectActiveCart as jest.Mock).mockReturnValue(null);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectActiveCart) return null;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectMostRecentDraftCart) return mockMostRecentDraft;
        if (selector === selectAllCarts) return mockRecentCarts;
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: mockRecentCarts } }); } catch { return mockRecentCarts; }
        }
        return mockRecentCarts;
      });

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

    it('navigates to CategoryManagement when Manage Items is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-manage-items'));
      expect(mockNavigate).toHaveBeenCalledWith('CategoryManagement');
    });

    it('navigates to Reports when Reports is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-reports'));
      expect(mockNavigate).toHaveBeenCalledWith('Reports');
    });

    it('sets active cart and navigates to Cart when Resume Draft is pressed', () => {
      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      fireEvent.press(getByTestId('quick-action-resume-draft'));
      // Should dispatch setActiveCart with the draft cart ID
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'multiCart/setActiveCart',
          payload: 'draft-cart-1',
        })
      );
      // Should navigate to Cart screen
      expect(mockNavigate).toHaveBeenCalledWith('Cart');
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

      (selectTodaysCarts as jest.Mock).mockReturnValue([cartWithGmItems]);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return null;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectTodaysCarts) return [cartWithGmItems];
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectAllCarts) return [cartWithGmItems];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: [cartWithGmItems] } }); } catch { return [cartWithGmItems]; }
        }
        return [cartWithGmItems];
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

      (selectTodaysCarts as jest.Mock).mockReturnValue([cartWithKgItems]);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return null;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectTodaysCarts) return [cartWithKgItems];
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectAllCarts) return [cartWithKgItems];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: [cartWithKgItems] } }); } catch { return [cartWithKgItems]; }
        }
        return [cartWithKgItems];
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
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return null;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return mockActiveCart;
        if (selector === selectActiveCartItemCount) return 5;
        if (selector === selectActiveCartCategoryCount) return 3;
        if (selector === selectActiveCartTotalQuantity) return 12.5;
        if (selector === selectActiveCartGrandTotal) return 1250;
        if (selector === selectMostRecentDraftCart) return mockMostRecentDraft;
        if (selector === selectAllCarts) return [...mockRecentCarts, mockActiveCart];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: mockRecentCarts } }); } catch { return mockRecentCarts; }
        }
        return mockRecentCarts;
      });

      const { queryByTestId } = render(<DashboardScreen testID="dashboard" />);
      expect(queryByTestId('dashboard-store-name')).toBeNull();
    });

    it('should show only store name without role when user is null', () => {
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return null;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return mockActiveCart;
        if (selector === selectActiveCartItemCount) return 5;
        if (selector === selectActiveCartCategoryCount) return 3;
        if (selector === selectActiveCartTotalQuantity) return 12.5;
        if (selector === selectActiveCartGrandTotal) return 1250;
        if (selector === selectMostRecentDraftCart) return mockMostRecentDraft;
        if (selector === selectAllCarts) return [...mockRecentCarts, mockActiveCart];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: mockRecentCarts } }); } catch { return mockRecentCarts; }
        }
        return mockRecentCarts;
      });

      const { getByTestId } = render(<DashboardScreen testID="dashboard" />);
      const storeNameElement = getByTestId('dashboard-store-name');
      expect(storeNameElement).toBeTruthy();
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

      (selectTodaysCarts as jest.Mock).mockReturnValue(fiveTodayCarts);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return null;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectTodaysCarts) return fiveTodayCarts;
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectAllCarts) return fiveTodayCarts;
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: fiveTodayCarts } }); } catch { return fiveTodayCarts; }
        }
        return fiveTodayCarts;
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

      (selectTodaysCarts as jest.Mock).mockReturnValue([paidCart]);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return null;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectTodaysCarts) return [paidCart];
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectAllCarts) return [paidCart];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: [paidCart] } }); } catch { return [paidCart]; }
        }
        return [paidCart];
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

      (selectTodaysCarts as jest.Mock).mockReturnValue([paidCartNoItems]);
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectTenant) return mockTenant;
        if (selector === selectCurrentUser) return mockCurrentUser;
        if (selector === selectTodaysMetrics) return mockTodaysMetrics;
        if (selector === selectCartsByStatus) return mockStatusCounts;
        if (selector === selectActiveCart) return null;
        if (selector === selectActiveCartItemCount) return 0;
        if (selector === selectActiveCartCategoryCount) return 0;
        if (selector === selectActiveCartTotalQuantity) return 0;
        if (selector === selectActiveCartGrandTotal) return 0;
        if (selector === selectTodaysCarts) return [paidCartNoItems];
        if (selector === selectMostRecentDraftCart) return null;
        if (selector === selectAllCarts) return [paidCartNoItems];
        if (typeof selector === 'function') {
          try { return selector({ multiCart: { carts: [paidCartNoItems] } }); } catch { return [paidCartNoItems]; }
        }
        return [paidCartNoItems];
      });

      const { getByText } = render(<DashboardScreen testID="dashboard" />);

      // Should show "5 items" (from paidItemCount), not "0 items" (from items.length)
      expect(getByText(/^5\s/)).toBeTruthy();
    });
  });
});
