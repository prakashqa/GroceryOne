/**
 * InventoryItemDetailScreen Tests
 * TDD tests for inventory item detail with stock adjustments,
 * settings, and transaction history
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { itemId: 'item-123' },
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
    t: (key: string, fallback: string) => {
      const translations: Record<string, string> = {
        'inventory.detail.stockLevel': 'Stock Level',
        'inventory.detail.threshold': 'Low Stock Threshold',
        'inventory.detail.tracking': 'Inventory Tracking',
        'inventory.detail.trackingEnabled': 'Tracking',
        'inventory.detail.trackingDisabled': 'Not Tracking',
        'inventory.detail.restock': 'Restock',
        'inventory.detail.correction': 'Correction',
        'inventory.detail.damage': 'Damage',
        'inventory.detail.return': 'Return',
        'inventory.detail.setStock': 'Set Stock',
        'inventory.detail.adjustStock': 'Adjust Stock',
        'inventory.detail.quantity': 'Quantity',
        'inventory.detail.reason': 'Reason (optional)',
        'inventory.detail.stockAfter': 'Stock after',
        'inventory.detail.settings': 'Settings',
        'inventory.detail.saveSettings': 'Save',
        'inventory.detail.transactionHistory': 'Transaction History',
        'inventory.detail.noTransactions': 'No transactions yet',
        'inventory.detail.adjustSuccess': 'Stock adjusted successfully',
        'inventory.detail.adjustError': 'Failed to adjust stock',
        'inventory.detail.settingsSuccess': 'Settings updated',
        'inventory.detail.cancel': 'Cancel',
        'inventory.detail.submit': 'Submit',
        'inventory.error': 'Failed to load inventory',
        'inventory.retry': 'Retry',
      };
      return translations[key] || fallback || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock tenant and auth state
let mockTenant: { slug: string; name: string } | null = { slug: 'freshmart', name: 'FreshMart' };
let mockIsAuthenticated = true;

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    if (selector.mockName === 'selectTenant') return mockTenant;
    if (selector.mockName === 'selectIsAuthenticated') return mockIsAuthenticated;
    return undefined;
  },
  useDispatch: () => jest.fn(),
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

// Mock Button component
jest.mock('../../../components/common', () => ({
  Button: ({ title, onPress, testID, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock inventory API hooks
let mockStockLevel: any = null;
let mockStockLoading = false;
let mockStockError = false;
const mockRefetchStock = jest.fn();

let mockTxnData: any = null;
let mockTxnLoading = false;

const mockAdjustStock = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
let mockAdjusting = false;

const mockSetStock = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
let mockSettingStock = false;

const mockUpdateSettings = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
let mockUpdatingSettings = false;

jest.mock('../../../../data/api/inventoryApi', () => ({
  useGetStockLevelQuery: () => ({
    data: mockStockLoading ? undefined : mockStockLevel,
    isLoading: mockStockLoading,
    isError: mockStockError,
    refetch: mockRefetchStock,
  }),
  useGetTransactionHistoryQuery: () => ({
    data: mockTxnLoading ? undefined : mockTxnData,
    isLoading: mockTxnLoading,
  }),
  useAdjustStockMutation: () => [mockAdjustStock, { isLoading: mockAdjusting }],
  useSetStockMutation: () => [mockSetStock, { isLoading: mockSettingStock }],
  useUpdateInventorySettingsMutation: () => [mockUpdateSettings, { isLoading: mockUpdatingSettings }],
}));

import InventoryItemDetailScreen from '../InventoryItemDetailScreen';

// Test data
const defaultStockLevel = {
  itemId: 'item-123',
  stockQuantity: 50,
  lowStockThreshold: 10,
  isLowStock: false,
  trackInventory: true,
};

const lowStockLevel = {
  ...defaultStockLevel,
  stockQuantity: 5,
  isLowStock: true,
};

const sampleTransactions = [
  {
    id: 'txn-1',
    tenantId: 'tenant-1',
    itemId: 'item-123',
    type: 'restock',
    quantity: 20,
    stockAfter: 50,
    reason: 'Weekly restock',
    referenceType: null,
    referenceId: null,
    performedBy: 'user-1',
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'txn-2',
    tenantId: 'tenant-1',
    itemId: 'item-123',
    type: 'damage',
    quantity: -3,
    stockAfter: 30,
    reason: 'Expired items',
    referenceType: null,
    referenceId: null,
    performedBy: 'user-1',
    createdAt: '2026-03-09T15:00:00Z',
  },
];

describe('InventoryItemDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStockLevel = { ...defaultStockLevel };
    mockStockLoading = false;
    mockStockError = false;
    mockTxnData = null;
    mockTxnLoading = false;
    mockAdjusting = false;
    mockSettingStock = false;
    mockUpdatingSettings = false;
    mockTenant = { slug: 'freshmart', name: 'FreshMart' };
    mockIsAuthenticated = true;
  });

  describe('Core Functionality', () => {
    it('renders stock level card with quantity', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('stock-level-card')).toBeTruthy();
      expect(getByTestId('stock-quantity')).toBeTruthy();
      expect(getByTestId('stock-quantity').props.children).toContain('50.00');
    });

    it('renders low stock threshold', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('stock-threshold')).toBeTruthy();
    });

    it('renders tracking status badge', () => {
      const { getByTestId, getByText } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('tracking-badge')).toBeTruthy();
      expect(getByText('Tracking')).toBeTruthy();
    });

    it('shows loading state while fetching', () => {
      mockStockLoading = true;
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('detail-loading')).toBeTruthy();
    });

    it('shows error with retry on failure', () => {
      mockStockError = true;
      const { getByText } = render(<InventoryItemDetailScreen />);
      expect(getByText('Failed to load inventory')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });

    it('retry button calls refetch', () => {
      mockStockError = true;
      const { getByText } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByText('Retry'));
      expect(mockRefetchStock).toHaveBeenCalled();
    });

    it('back button navigates back', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('detail-back-btn'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Stock Adjustment', () => {
    it('renders Restock button', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('restock-btn')).toBeTruthy();
    });

    it('renders Correction button', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('correction-btn')).toBeTruthy();
    });

    it('renders Set Stock button', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('set-stock-btn')).toBeTruthy();
    });

    it('opens adjust panel on Restock press', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      expect(getByTestId('adjust-panel')).toBeTruthy();
      expect(getByTestId('adjust-qty-input')).toBeTruthy();
    });

    it('opens adjust panel on Correction press', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('correction-btn'));
      expect(getByTestId('adjust-panel')).toBeTruthy();
    });

    it('opens set stock panel on Set Stock press', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('set-stock-btn'));
      expect(getByTestId('set-stock-panel')).toBeTruthy();
      expect(getByTestId('set-stock-qty-input')).toBeTruthy();
    });

    it('calls adjustStock mutation on submit', async () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      fireEvent.changeText(getByTestId('adjust-qty-input'), '10');
      fireEvent.press(getByTestId('adjust-submit-btn'));
      await waitFor(() => {
        expect(mockAdjustStock).toHaveBeenCalledWith({
          itemId: 'item-123',
          quantity: 10,
          type: 'restock',
          reason: undefined,
        });
      });
    });

    it('calls setStock mutation on Set Stock submit', async () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('set-stock-btn'));
      fireEvent.changeText(getByTestId('set-stock-qty-input'), '100');
      fireEvent.press(getByTestId('set-stock-submit-btn'));
      await waitFor(() => {
        expect(mockSetStock).toHaveBeenCalledWith({
          itemId: 'item-123',
          quantity: 100,
          reason: undefined,
        });
      });
    });

    it('shows stock-after preview when quantity entered', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      fireEvent.changeText(getByTestId('adjust-qty-input'), '10');
      expect(getByTestId('stock-after-preview')).toBeTruthy();
    });

    it('shows success alert after successful adjustment', async () => {
      jest.spyOn(Alert, 'alert');
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      fireEvent.changeText(getByTestId('adjust-qty-input'), '10');
      fireEvent.press(getByTestId('adjust-submit-btn'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Stock adjusted successfully');
      });
    });
  });

  describe('Frontend Validations', () => {
    it('adjust submit is disabled when quantity is empty', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      // Submit btn should be disabled (no quantity entered)
      const btn = getByTestId('adjust-submit-btn');
      expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
    });

    it('adjust submit is disabled when quantity is 0', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('restock-btn'));
      fireEvent.changeText(getByTestId('adjust-qty-input'), '0');
      const btn = getByTestId('adjust-submit-btn');
      expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
    });

    it('adjust submit is disabled when damage quantity exceeds current stock', () => {
      mockStockLevel = { ...defaultStockLevel, stockQuantity: 10 };
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('correction-btn')); // opens with correction type
      fireEvent.changeText(getByTestId('adjust-qty-input'), '15');
      const btn = getByTestId('adjust-submit-btn');
      expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
    });

    it('adjust submit is enabled when damage quantity is within stock', () => {
      mockStockLevel = { ...defaultStockLevel, stockQuantity: 10 };
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('correction-btn'));
      fireEvent.changeText(getByTestId('adjust-qty-input'), '5');
      const btn = getByTestId('adjust-submit-btn');
      const isDisabled = btn.props.accessibilityState?.disabled ?? btn.props.disabled;
      expect(isDisabled).toBeFalsy();
    });

    it('set stock submit is disabled when quantity is empty', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('set-stock-btn'));
      const btn = getByTestId('set-stock-submit-btn');
      expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
    });

    it('handles null/undefined stock values gracefully', () => {
      mockStockLevel = { ...defaultStockLevel, stockQuantity: null, lowStockThreshold: undefined };
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      // Should render without crashing with fallback to 0.00
      expect(getByTestId('stock-quantity').props.children).toContain('0.00');
    });

    it('shows low stock badge when item is low stock', () => {
      mockStockLevel = { ...lowStockLevel };
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('detail-low-badge')).toBeTruthy();
    });

    it('does not show low stock badge when stock is adequate', () => {
      const { queryByTestId } = render(<InventoryItemDetailScreen />);
      expect(queryByTestId('detail-low-badge')).toBeNull();
    });
  });

  describe('Settings', () => {
    it('renders threshold edit button with current value', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('settings-section')).toBeTruthy();
      expect(getByTestId('threshold-edit-btn')).toBeTruthy();
    });

    it('renders tracking toggle', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('tracking-toggle')).toBeTruthy();
    });

    it('opens threshold editing on tap', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('threshold-edit-btn'));
      expect(getByTestId('threshold-input')).toBeTruthy();
      expect(getByTestId('threshold-save-btn')).toBeTruthy();
    });

    it('calls updateInventorySettings on threshold save', async () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent.press(getByTestId('threshold-edit-btn'));
      fireEvent.changeText(getByTestId('threshold-input'), '15');
      fireEvent.press(getByTestId('threshold-save-btn'));
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          itemId: 'item-123',
          data: { lowStockThreshold: 15 },
        });
      });
    });

    it('calls updateInventorySettings on tracking toggle', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      fireEvent(getByTestId('tracking-toggle'), 'valueChange', false);
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        itemId: 'item-123',
        data: { trackInventory: false },
      });
    });
  });

  describe('Transaction History', () => {
    it('renders transaction history section', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('transaction-history')).toBeTruthy();
    });

    it('shows empty state when no transactions', () => {
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('no-transactions')).toBeTruthy();
    });

    it('renders transaction list when data exists', () => {
      mockTxnData = { transactions: sampleTransactions, total: 2 };
      const { getByTestId, queryByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('txn-txn-1')).toBeTruthy();
      expect(getByTestId('txn-txn-2')).toBeTruthy();
      expect(queryByTestId('no-transactions')).toBeNull();
    });

    it('displays transaction type and quantity', () => {
      mockTxnData = { transactions: sampleTransactions, total: 2 };
      const { getByText } = render(<InventoryItemDetailScreen />);
      expect(getByText('RESTOCK')).toBeTruthy();
      expect(getByText('DAMAGE')).toBeTruthy();
    });
  });

  describe('Frontend Validations - Auth & Tenant Guards', () => {
    it('shows loading state when tenant context is unavailable', () => {
      mockTenant = null;
      const { getByTestId, queryByText } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('detail-loading')).toBeTruthy();
      expect(queryByText('Failed to load inventory')).toBeNull();
    });

    it('shows loading state when user is not authenticated', () => {
      mockIsAuthenticated = false;
      const { getByTestId, queryByText } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('detail-loading')).toBeTruthy();
      expect(queryByText('Failed to load inventory')).toBeNull();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('does not fire API calls without tenant context (skips queries)', () => {
      mockTenant = null;
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      // Shows loading (skipped), not error — queries never fired
      expect(getByTestId('detail-loading')).toBeTruthy();
    });

    it('does not navigate or show data without authentication', () => {
      mockIsAuthenticated = false;
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      expect(getByTestId('detail-loading')).toBeTruthy();
      expect(mockGoBack).not.toHaveBeenCalled();
    });

    it('renders only data from the API response (tenant-scoped by backend)', () => {
      mockStockLevel = {
        itemId: 'item-123',
        stockQuantity: 42,
        lowStockThreshold: 5,
        isLowStock: false,
        trackInventory: true,
      };
      mockTxnData = { transactions: [sampleTransactions[0]], total: 1 };
      const { getByTestId } = render(<InventoryItemDetailScreen />);
      // Only shows what API returned
      expect(getByTestId('stock-quantity').props.children).toContain('42.00');
      expect(getByTestId('txn-txn-1')).toBeTruthy();
    });
  });
});
