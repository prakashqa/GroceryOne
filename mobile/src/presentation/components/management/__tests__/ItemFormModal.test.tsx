/**
 * ItemFormModal Component Tests
 * Tests for translation support in Add/Edit Item modal
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItemFormModal from '../ItemFormModal';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockT = jest.fn((key: string, params?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'manageItems.addItem': 'Add Item', 'manageItems.editItem': 'Edit Item',
    'manageItems.addInventoryItem': 'Add Inventory Item', 'manageItems.editInventoryItem': 'Edit Inventory Item',
    'manageItems.itemName': 'Item Name', 'manageItems.enterItemName': 'Enter item name',
    'manageItems.selectCategory': 'Category', 'manageItems.selectUnit': 'Unit',
    'manageItems.defaultQuantity': 'Default Quantity', 'manageItems.mrp': 'MRP',
    'manageItems.salePrice': 'Sale Price', 'manageItems.enterMrp': 'Enter MRP',
    'manageItems.enterSalePrice': 'Enter sale price', 'manageItems.discount': 'Discount',
    'manageItems.percentOff': '{{percent}}% OFF', 'cancel': 'Cancel', 'save': 'Save',
    'picking.add': 'Add', 'validation.selectCategory': 'Please select a category',
    'validation.positiveQuantity': 'Quantity must be a positive number',
    'validation.salePriceExceedsMrp': 'Sale price cannot exceed MRP',
    'validation.mrpRequired': 'MRP is required', 'validation.invalidPrice': 'Please enter a valid price',
  };
  let result = translations[key] || key;
  if (params && result.includes('{{percent}}')) {
    result = result.replace('{{percent}}', String(params.percent));
  }
  return result;
});

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));

jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

// === Factories ===
const mockCategories = [
  { id: 'cat1', name: 'Category 1', icon: '🍎' },
  { id: 'cat2', name: 'Category 2', icon: '🥕' },
];

const editItem = {
  id: 'item1', name: 'Test Item', categoryId: 'cat1', unit: 'pcs' as const, defaultQuantity: 1,
};

describe('ItemFormModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const renderForm = (overrides: Record<string, any> = {}) => render(
    <ItemFormModal
      visible={true} onClose={mockOnClose}
      onSubmit={mockOnSubmit} categories={mockCategories}
      {...overrides}
    />
  );

  beforeEach(() => { jest.clearAllMocks(); });

  describe('Translation Support', () => {
    it.each([
      ['manageItems.addItem'], ['manageItems.itemName'], ['manageItems.enterItemName'],
      ['manageItems.selectCategory'], ['manageItems.selectUnit'],
      ['manageItems.defaultQuantity'], ['cancel'], ['picking.add'],
    ])('uses translation key %s in add mode', (key) => {
      renderForm();
      expect(mockT).toHaveBeenCalledWith(key);
    });

    it.each([
      ['manageItems.editItem'],
      ['save'],
    ])('uses translation key %s in edit mode', (key) => {
      renderForm({ editItem });
      expect(mockT).toHaveBeenCalledWith(key);
    });
  });

  describe('Renders correctly', () => {
    it('renders translated "Item Name" label', () => {
      expect(renderForm().getByText('Item Name')).toBeTruthy();
    });

    it('renders translated placeholder text', () => {
      expect(renderForm().getByPlaceholderText('Enter item name')).toBeTruthy();
    });
  });

  describe('Price Fields', () => {
    it.each([
      ['manageItems.mrp'],
      ['manageItems.salePrice'],
    ])('uses translation key %s', (key) => {
      renderForm();
      expect(mockT).toHaveBeenCalledWith(key);
    });

    it('renders MRP input field', () => {
      expect(renderForm().getByPlaceholderText('Enter MRP')).toBeTruthy();
    });

    it('renders Sale Price input field', () => {
      expect(renderForm().getByPlaceholderText('Enter sale price')).toBeTruthy();
    });

    it('renders MRP label text with required indicator', () => {
      expect(renderForm().getByText('MRP *')).toBeTruthy();
    });

    it('renders Sale Price label text', () => {
      expect(renderForm().getByText('Sale Price')).toBeTruthy();
    });

    it('populates price fields when editing an item with prices', () => {
      const { getByTestId } = renderForm({ editItem: { ...editItem, mrp: 100, price: 80 }, testID: 'item-form' });
      expect(getByTestId('item-form-mrp-input').props.value).toBe('100');
      expect(getByTestId('item-form-sale-price-input').props.value).toBe('80');
    });
  });

  describe('Discount Calculation', () => {
    it('displays discount badge when MRP > Sale Price', async () => {
      const { getByPlaceholderText, getByText } = renderForm();
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '100');
      fireEvent.changeText(getByPlaceholderText('Enter sale price'), '80');
      await waitFor(() => { expect(getByText('20% OFF')).toBeTruthy(); });
    });

    it('does not display discount badge when MRP equals Sale Price', async () => {
      const { getByPlaceholderText, queryByText } = renderForm();
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '100');
      fireEvent.changeText(getByPlaceholderText('Enter sale price'), '100');
      await waitFor(() => { expect(queryByText(/% OFF/)).toBeNull(); });
    });

    it('does not display discount badge when only MRP is entered', async () => {
      const { getByPlaceholderText, queryByText } = renderForm();
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '100');
      await waitFor(() => { expect(queryByText(/% OFF/)).toBeNull(); });
    });
  });

  describe('Price Validation', () => {
    it('shows error when Sale Price exceeds MRP', async () => {
      const { getByPlaceholderText, getByText } = renderForm();
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '80');
      fireEvent.changeText(getByPlaceholderText('Enter sale price'), '100');
      await waitFor(() => { expect(getByText('Sale price cannot exceed MRP')).toBeTruthy(); });
    });
  });

  describe('MRP Required Validation', () => {
    it('disables submit button when MRP is empty', () => {
      const { getByPlaceholderText, getByTestId } = renderForm({ initialCategoryId: 'cat1', testID: 'item-form' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      const submitButton = getByTestId('item-form-submit-button');
      expect(submitButton.props.accessibilityState?.disabled || submitButton.props.disabled).toBeTruthy();
    });

    it('shows required indicator on MRP label', () => {
      expect(renderForm({ testID: 'item-form' }).getByText('MRP *')).toBeTruthy();
    });

    it('shows MRP required error when name is filled but MRP is empty', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      await waitFor(() => { expect(getByText('MRP is required')).toBeTruthy(); });
    });

    it('enables submit when valid MRP is provided', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '100');
      fireEvent.press(getByText('Add'));
      await waitFor(() => { expect(mockOnSubmit).toHaveBeenCalled(); });
    });

    it('does not submit when MRP is empty', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      fireEvent.press(getByText('Add'));
      await waitFor(() => { expect(mockOnSubmit).not.toHaveBeenCalled(); });
    });
  });

  describe('Inventory Mode', () => {
    it('should NOT show MRP and Sale Price fields in inventory mode', () => {
      const { queryByPlaceholderText, queryByText } = renderForm({ mode: 'inventory' });
      expect(queryByPlaceholderText('Enter MRP')).toBeNull();
      expect(queryByPlaceholderText('Enter sale price')).toBeNull();
      expect(queryByText('MRP *')).toBeNull();
      expect(queryByText('Sale Price')).toBeNull();
    });

    it('should show Stock Quantity and Low Stock Threshold fields in inventory mode', () => {
      const { getByTestId } = renderForm({ mode: 'inventory', testID: 'item-form' });
      expect(getByTestId('item-form-stock-quantity-input')).toBeTruthy();
      expect(getByTestId('item-form-low-stock-threshold-input')).toBeTruthy();
    });

    it('should NOT require MRP in inventory mode', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ mode: 'inventory', initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Inventory Item');
      fireEvent.press(getByText('Add'));
      await waitFor(() => { expect(mockOnSubmit).toHaveBeenCalled(); });
    });

    it('should submit stockQuantity and lowStockThreshold in inventory mode', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = renderForm({ mode: 'inventory', initialCategoryId: 'cat1', testID: 'item-form' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Inventory Item');
      fireEvent.changeText(getByTestId('item-form-stock-quantity-input'), '50');
      fireEvent.changeText(getByTestId('item-form-low-stock-threshold-input'), '10');
      fireEvent.press(getByText('Add'));
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Inventory Item',
          stockQuantity: 50,
          lowStockThreshold: 10,
        }));
        // Should NOT have mrp or salePrice
        expect(mockOnSubmit.mock.calls[0][0].mrp).toBeUndefined();
        expect(mockOnSubmit.mock.calls[0][0].salePrice).toBeUndefined();
      });
    });

    it('should show MRP and Sale Price in order mode (default)', () => {
      const { getByPlaceholderText, getByText } = renderForm();
      expect(getByPlaceholderText('Enter MRP')).toBeTruthy();
      expect(getByPlaceholderText('Enter sale price')).toBeTruthy();
      expect(getByText('MRP *')).toBeTruthy();
      expect(getByText('Sale Price')).toBeTruthy();
    });

    it('should NOT show Stock Quantity and Low Stock Threshold in order mode', () => {
      const { queryByTestId } = renderForm({ testID: 'item-form' });
      expect(queryByTestId('item-form-stock-quantity-input')).toBeNull();
      expect(queryByTestId('item-form-low-stock-threshold-input')).toBeNull();
    });
  });

  describe('Mode-Aware Title', () => {
    it('should show "Add Item" title in order mode (default)', () => {
      renderForm();
      expect(mockT).toHaveBeenCalledWith('manageItems.addItem');
    });

    it('should show "Add Inventory Item" title in inventory mode', () => {
      const { getByText } = renderForm({ mode: 'inventory' });
      expect(getByText('Add Inventory Item')).toBeTruthy();
    });

    it('should show "Edit Item" title in order edit mode', () => {
      const { getByText } = renderForm({ editItem });
      expect(getByText('Edit Item')).toBeTruthy();
    });

    it('should show "Edit Inventory Item" title in inventory edit mode', () => {
      const { getByText } = renderForm({ editItem, mode: 'inventory' });
      expect(getByText('Edit Inventory Item')).toBeTruthy();
    });
  });

  describe('Form Submission with Prices', () => {
    it('includes price fields in submission data', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '100');
      fireEvent.changeText(getByPlaceholderText('Enter sale price'), '80');
      fireEvent.press(getByText('Add'));
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Item', mrp: 100, salePrice: 80 }));
      });
    });

    it('submits with MRP and without sale price when sale price is empty', async () => {
      const { getByPlaceholderText, getByText } = renderForm({ initialCategoryId: 'cat1' });
      fireEvent.changeText(getByPlaceholderText('Enter item name'), 'Test Item');
      fireEvent.changeText(getByPlaceholderText('Enter MRP'), '150');
      fireEvent.press(getByText('Add'));
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Item', mrp: 150 }));
        expect(mockOnSubmit.mock.calls[0][0].salePrice).toBeUndefined();
      });
    });
  });
});
