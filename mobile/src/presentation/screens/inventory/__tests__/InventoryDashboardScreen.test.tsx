/**
 * InventoryDashboardScreen Tests
 * TDD tests for inventory management dashboard
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock responsive hooks
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({ isTablet: false, isPhone: true }),
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations = {
        'inventory.title': 'Inventory',
        'inventory.lowStock': 'Low Stock Items',
        'inventory.stockReport': 'Stock Report',
        'inventory.noLowStock': 'No low stock items',
        'inventory.allStocked': 'All items are well stocked!',
        'inventory.loading': 'Loading inventory...',
        'inventory.error': 'Failed to load inventory',
        'inventory.retry': 'Retry',
        'inventory.stock': 'Stock',
        'inventory.threshold': 'Threshold',
        'inventory.trackingDisabled': 'Tracking disabled',
        'inventory.totalItems': 'Total Items',
        'inventory.lowStockCount': 'Low Stock',
        'inventory.searchPlaceholder': 'Search inventory...',
        'inventory.addItem': 'Add Item',
        'inventory.noResults': 'No items match your search',
        'inventory.lowBadge': 'LOW',
      };
      return (translations as Record<string, string>)[key] || fallback || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock item translations
jest.mock('../../../../domain/utils/itemTranslations', () => ({
  getTranslatedItemName: (item: any) => item.name,
}));

// Mock tenant and auth state
let mockTenant = { slug: 'freshmart', name: 'FreshMart' };
let mockIsAuthenticated = true;

let mockCategories = [{ id: 'cat-1', name: 'Rice & Atta', icon: '🌾', trackInventory: true }];
let mockCategoriesLoading = false;

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    if (selector.mockName === 'selectTenant') return mockTenant;
    if (selector.mockName === 'selectIsAuthenticated') return mockIsAuthenticated;
    return undefined;
  },
  useDispatch: () => jest.fn(),
}));

jest.mock('../../../../data/api/categoryApi', () => ({
  useGetCategoriesQuery: () => ({
    data: mockCategories,
    isLoading: mockCategoriesLoading,
  }),
}));

jest.mock('../../../../store/slices/tenantSlice', () => {
  const fn: any = jest.fn();
  fn.mockName = 'selectTenant';
  return { selectTenant: fn };
});

jest.mock('../../../../store/slices/authSlice', () => {
  const fn: any = jest.fn();
  fn.mockName = 'selectIsAuthenticated';
  return { selectIsAuthenticated: fn };
});

// Mock inventory API hooks
const mockLowStockData: any[] = [];
const mockStockReportData: any[] = [];
let mockLowStockLoading = false;
let mockLowStockError = false;
let mockStockReportLoading = false;
let mockStockReportError = false;
const mockRefetchLowStock = jest.fn();
const mockRefetchStockReport = jest.fn();

// Mock ItemFormModal — capture props for assertions
let mockItemFormVisible = false;
let mockItemFormMode: string | undefined;
let mockItemFormCategories: any[] = [];
jest.mock('../../../components/management/ItemFormModal', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, onClose: _onClose, onSubmit: _onSubmit, testID, mode, categories }: any) => {
      mockItemFormVisible = visible;
      mockItemFormMode = mode;
      mockItemFormCategories = categories || [];
      if (!visible) return null;
      return (
        <View testID={testID || 'item-form-modal'}>
          <Text>ItemFormModal</Text>
        </View>
      );
    },
  };
});

// Mock productApi
const mockCreateItem = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
jest.mock('../../../../data/api/productApi', () => ({
  useCreateItemMutation: () => [mockCreateItem, { isLoading: false }],
}));

jest.mock('../../../../data/api/inventoryApi', () => ({
  useGetLowStockItemsQuery: () => ({
    data: mockLowStockError ? undefined : mockLowStockData,
    isLoading: mockLowStockLoading,
    isError: mockLowStockError,
    refetch: mockRefetchLowStock,
  }),
  useGetStockReportQuery: () => ({
    data: mockStockReportError ? undefined : mockStockReportData,
    isLoading: mockStockReportLoading,
    isError: mockStockReportError,
    refetch: mockRefetchStockReport,
  }),
}));

import InventoryDashboardScreen from '../InventoryDashboardScreen';

// Test data
const lowStockItems = [
  {
    id: 'item-1',
    name: 'Aashirvaad Atta',
    unit: 'kg',
    stockQuantity: 5,
    lowStockThreshold: 10,
    trackInventory: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'item-2',
    name: 'Sunflower Oil',
    unit: 'L',
    stockQuantity: 2,
    lowStockThreshold: 5,
    trackInventory: true,
    sortOrder: 2,
    isActive: true,
  },
];

const stockReportItems = [
  ...lowStockItems,
  {
    id: 'item-3',
    name: 'Rice',
    unit: 'kg',
    stockQuantity: 100,
    lowStockThreshold: 20,
    trackInventory: true,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'item-4',
    name: 'Untracked Item',
    unit: 'pcs',
    stockQuantity: 0,
    lowStockThreshold: 0,
    trackInventory: false,
    sortOrder: 4,
    isActive: true,
  },
];

describe('InventoryDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLowStockData.length = 0;
    mockStockReportData.length = 0;
    mockLowStockLoading = false;
    mockLowStockError = false;
    mockStockReportLoading = false;
    mockStockReportError = false;
    mockTenant = { slug: 'freshmart', name: 'FreshMart' };
    mockIsAuthenticated = true;
    mockCategories = [{ id: 'cat-1', name: 'Rice & Atta', icon: '🌾', trackInventory: true }];
    mockCategoriesLoading = false;
    mockItemFormMode = undefined;
    mockItemFormCategories = [];
  });

  describe('Core Functionality', () => {
    it('renders low stock items section with item names', () => {
      mockLowStockData.push(...lowStockItems);
      mockStockReportData.push(...stockReportItems);
      const { getByText, getAllByText } = render(<InventoryDashboardScreen />);
      expect(getByText('Low Stock Items')).toBeTruthy();
      // Items appear in both low stock and stock report sections
      expect(getAllByText('Aashirvaad Atta').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Sunflower Oil').length).toBeGreaterThanOrEqual(1);
    });

    it('renders stock report section', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByText } = render(<InventoryDashboardScreen />);
      expect(getByText('Stock Report')).toBeTruthy();
    });

    it('shows loading indicator while fetching data', () => {
      mockLowStockLoading = true;
      mockStockReportLoading = true;
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('inventory-loading')).toBeTruthy();
    });

    it('shows error state with retry button on API failure', () => {
      mockLowStockError = true;
      const { getByText } = render(<InventoryDashboardScreen />);
      expect(getByText('Failed to load inventory')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });

    it('retry button calls refetch', () => {
      mockLowStockError = true;
      const { getByText } = render(<InventoryDashboardScreen />);
      fireEvent.press(getByText('Retry'));
      expect(mockRefetchLowStock).toHaveBeenCalled();
    });

    it('shows empty state when no low stock items', () => {
      // Empty low stock data but stock report has items
      mockStockReportData.push(...stockReportItems);
      const { getByText } = render(<InventoryDashboardScreen />);
      expect(getByText('All items are well stocked!')).toBeTruthy();
    });
  });

  describe('Frontend Validations', () => {
    it('only displays items with trackInventory === true in stock report', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByText, queryByText } = render(<InventoryDashboardScreen />);
      // trackInventory=true items should be visible
      expect(getByText('Rice')).toBeTruthy();
      // trackInventory=false item should NOT be visible
      expect(queryByText('Untracked Item')).toBeNull();
    });

    it('stock quantities display with proper formatting', () => {
      mockStockReportData.push({
        id: 'item-decimal',
        name: 'Decimal Item',
        unit: 'kg',
        stockQuantity: 5.5,
        lowStockThreshold: 10,
        trackInventory: true,
        sortOrder: 1,
        isActive: true,
      });
      const { getByText } = render(<InventoryDashboardScreen />);
      expect(getByText('Decimal Item')).toBeTruthy();
      // Stock quantity should be displayed (exact format depends on implementation)
      expect(getByText(/5\.50/)).toBeTruthy();
    });

    it('handles null/undefined stock values gracefully', () => {
      mockStockReportData.push({
        id: 'item-null',
        name: 'Null Stock Item',
        unit: 'kg',
        stockQuantity: null,
        lowStockThreshold: undefined,
        trackInventory: true,
        sortOrder: 1,
        isActive: true,
      });
      const { getByText } = render(<InventoryDashboardScreen />);
      // Should render without crashing, with fallback to 0
      expect(getByText('Null Stock Item')).toBeTruthy();
      expect(getByText(/0\.00/)).toBeTruthy();
    });
  });

  describe('Frontend Validations - Auth & Tenant Guards', () => {
    it('shows loading state when tenant context is unavailable (skips API calls)', () => {
      mockTenant = null as any;
      const { getByTestId, queryByText } = render(<InventoryDashboardScreen />);
      // Should show loading, not error
      expect(getByTestId('inventory-loading')).toBeTruthy();
      expect(queryByText('Failed to load inventory')).toBeNull();
    });

    it('shows loading state when user is not authenticated (skips API calls)', () => {
      mockIsAuthenticated = false;
      const { getByTestId, queryByText } = render(<InventoryDashboardScreen />);
      // Should show loading, not error
      expect(getByTestId('inventory-loading')).toBeTruthy();
      expect(queryByText('Failed to load inventory')).toBeNull();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('does not fire API calls without tenant context', () => {
      mockTenant = null as any;
      const { getByTestId } = render(<InventoryDashboardScreen />);
      // Shows loading (skipped), not error — queries never fired
      expect(getByTestId('inventory-loading')).toBeTruthy();
    });

    it('does not navigate without tenant context', () => {
      mockTenant = null as any;
      render(<InventoryDashboardScreen />);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('displays exactly what the API returns (tenant-scoped by backend)', () => {
      const tenantItems = [
        {
          id: 'tenant-a-item',
          name: 'Tenant A Only Item',
          unit: 'kg',
          stockQuantity: 3,
          lowStockThreshold: 10,
          trackInventory: true,
          sortOrder: 1,
          isActive: true,
        },
      ];
      mockLowStockData.push(...tenantItems);
      mockStockReportData.push(...tenantItems);
      const { getAllByText, queryByText } = render(<InventoryDashboardScreen />);
      // Item appears in both low stock and stock report
      expect(getAllByText('Tenant A Only Item').length).toBeGreaterThanOrEqual(1);
      // No other items appear — only what the API returned
      expect(queryByText('Aashirvaad Atta')).toBeNull();
    });
  });

  describe('Summary Section', () => {
    it('renders total items count from stock report', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      // 3 tracked items (item-4 is untracked)
      expect(getByTestId('summary-total-count')).toBeTruthy();
      expect(getByTestId('summary-total-count').props.children.toString()).toContain('3');
    });

    it('renders low stock count', () => {
      mockLowStockData.push(...lowStockItems);
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('summary-lowstock-count')).toBeTruthy();
      expect(getByTestId('summary-lowstock-count').props.children.toString()).toContain('2');
    });

    it('summary shows 0 counts when data is empty', () => {
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('summary-total-count').props.children.toString()).toContain('0');
      expect(getByTestId('summary-lowstock-count').props.children.toString()).toContain('0');
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('inventory-search-input')).toBeTruthy();
    });

    it('search filters items by name (case-insensitive)', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId, queryByText, getByText } = render(<InventoryDashboardScreen />);
      fireEvent.changeText(getByTestId('inventory-search-input'), 'rice');
      expect(getByText('Rice')).toBeTruthy();
      expect(queryByText('Sunflower Oil')).toBeNull();
    });

    it('shows empty state when search has no matches', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId, getByText } = render(<InventoryDashboardScreen />);
      fireEvent.changeText(getByTestId('inventory-search-input'), 'zzzznotfound');
      expect(getByText('No items match your search')).toBeTruthy();
    });
  });

  describe('Add Item', () => {
    it('renders add item FAB button', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('inventory-add-item-btn')).toBeTruthy();
    });

    it('opens ItemFormModal when add button pressed', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      mockItemFormVisible = false;
      fireEvent.press(getByTestId('inventory-add-item-btn'));
      expect(mockItemFormVisible).toBe(true);
    });

    it('passes mode="inventory" to ItemFormModal', () => {
      mockStockReportData.push(...stockReportItems);
      render(<InventoryDashboardScreen />);
      expect(mockItemFormMode).toBe('inventory');
    });

    it('passes inventory categories from API to ItemFormModal', () => {
      // useGetCategoriesQuery returns inventory categories (trackInventory: true)
      mockCategories = [
        { id: 'cat-inv', name: 'Inventory Spices', icon: '🌶', trackInventory: true },
        { id: 'cat-inv-2', name: 'Inventory Oils', icon: '🫒', trackInventory: true },
      ];
      mockStockReportData.push(...stockReportItems);
      render(<InventoryDashboardScreen />);

      // Should pass all categories from API (which are already filtered by trackInventory: true)
      const categoryIds = mockItemFormCategories.map((c: any) => c.id);
      expect(categoryIds).toContain('cat-inv');
      expect(categoryIds).toContain('cat-inv-2');
    });
  });

  describe('Item Navigation', () => {
    it('navigates to InventoryItemDetail on item card press', () => {
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      fireEvent.press(getByTestId('inventory-item-card-item-3'));
      expect(mockNavigate).toHaveBeenCalledWith('InventoryItemDetail', { itemId: 'item-3' });
    });
  });

  describe('Low Stock Badge', () => {
    it('displays low stock badge on items in low stock list', () => {
      mockLowStockData.push(...lowStockItems);
      mockStockReportData.push(...stockReportItems);
      const { getByTestId } = render(<InventoryDashboardScreen />);
      expect(getByTestId('low-stock-badge-item-1')).toBeTruthy();
      expect(getByTestId('low-stock-badge-item-2')).toBeTruthy();
    });

    it('does not display low stock badge on adequately-stocked items', () => {
      mockLowStockData.push(...lowStockItems);
      mockStockReportData.push(...stockReportItems);
      const { queryByTestId } = render(<InventoryDashboardScreen />);
      expect(queryByTestId('low-stock-badge-item-3')).toBeNull();
    });
  });
});
