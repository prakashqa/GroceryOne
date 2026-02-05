/**
 * ItemFormModal Component Tests
 * Tests for translation support in Add/Edit Item modal
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItemFormModal from '../ItemFormModal';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Track translation calls
const mockT = jest.fn((key: string, params?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'manageItems.addItem': 'Add Item',
    'manageItems.editItem': 'Edit Item',
    'manageItems.itemName': 'Item Name',
    'manageItems.enterItemName': 'Enter item name',
    'manageItems.selectCategory': 'Category',
    'manageItems.selectUnit': 'Unit',
    'manageItems.defaultQuantity': 'Default Quantity',
    'manageItems.mrp': 'MRP',
    'manageItems.salePrice': 'Sale Price',
    'manageItems.enterMrp': 'Enter MRP',
    'manageItems.enterSalePrice': 'Enter sale price',
    'manageItems.discount': 'Discount',
    'manageItems.percentOff': '{{percent}}% OFF',
    'cancel': 'Cancel',
    'save': 'Save',
    'picking.add': 'Add',
    'validation.selectCategory': 'Please select a category',
    'validation.positiveQuantity': 'Quantity must be a positive number',
    'validation.salePriceExceedsMrp': 'Sale price cannot exceed MRP',
    'validation.mrpRequired': 'MRP is required',
    'validation.invalidPrice': 'Please enter a valid price',
  };
  let result = translations[key] || key;
  // Handle interpolation for percentOff
  if (params && result.includes('{{percent}}')) {
    result = result.replace('{{percent}}', String(params.percent));
  }
  return result;
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      primaryDark: '#388E3C',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      border: '#e0e0e0',
      card: '#ffffff',
      error: '#f44336',
      disabled: '#bdbdbd',
      buttonPrimary: '#2E7D32',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryPressed: '#1B5E20',
      buttonSecondaryText: '#2E7D32',
      buttonDangerText: '#FFFFFF',
      buttonGhostText: '#666666',
      buttonGhostPressed: 'rgba(0, 0, 0, 0.05)',
      iconMuted: 'rgba(46, 125, 50, 0.1)',
      modalOverlay: 'rgba(0, 0, 0, 0.6)',
      inputBackground: '#F5F5F5',
      inputFocus: '#2E7D32',
      placeholder: '#9E9E9E',
    },
    spacing: {
      xs: 4,
      sm: 8,
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
        xl: 18,
        xxl: 24,
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    shadows: {
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      },
    },
    buttonHeights: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    textStyles: {
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
      h2: {
        fontSize: 20,
        fontWeight: '600',
      },
    },
  }),
  useResponsiveStyles: () => ({
    fontScale: 1,
    horizontalPadding: 16,
    isSmallScreen: false,
    isMediumScreen: true,
    isLargeScreen: false,
  }),
}));

const mockCategories = [
  { id: 'cat1', name: 'Category 1', icon: '🍎' },
  { id: 'cat2', name: 'Category 2', icon: '🥕' },
];

describe('ItemFormModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Translation Support', () => {
    it('uses translation key for "Add Item" title', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.addItem');
    });

    it('uses translation key for "Edit Item" title when editing', () => {
      const editItem = {
        id: 'item1',
        name: 'Test Item',
        categoryId: 'cat1',
        unit: 'pcs' as const,
        defaultQuantity: 1,
      };

      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          editItem={editItem}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.editItem');
    });

    it('uses translation key for "Item Name" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.itemName');
    });

    it('uses translation key for item name placeholder', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.enterItemName');
    });

    it('uses translation key for "Category" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.selectCategory');
    });

    it('uses translation key for "Unit" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.selectUnit');
    });

    it('uses translation key for "Default Quantity" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.defaultQuantity');
    });

    it('uses translation key for Cancel button', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('cancel');
    });

    it('uses translation key for Add button', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('picking.add');
    });

    it('uses translation key for Save button when editing', () => {
      const editItem = {
        id: 'item1',
        name: 'Test Item',
        categoryId: 'cat1',
        unit: 'pcs' as const,
        defaultQuantity: 1,
      };

      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          editItem={editItem}
        />
      );

      expect(mockT).toHaveBeenCalledWith('save');
    });
  });

  describe('Renders correctly', () => {
    it('renders translated "Item Name" label', () => {
      const { getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByText('Item Name')).toBeTruthy();
    });

    it('renders translated placeholder text', () => {
      const { getByPlaceholderText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByPlaceholderText('Enter item name')).toBeTruthy();
    });
  });

  describe('Price Fields', () => {
    it('uses translation key for "MRP" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.mrp');
    });

    it('uses translation key for "Sale Price" label', () => {
      render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(mockT).toHaveBeenCalledWith('manageItems.salePrice');
    });

    it('renders MRP input field', () => {
      const { getByPlaceholderText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByPlaceholderText('Enter MRP')).toBeTruthy();
    });

    it('renders Sale Price input field', () => {
      const { getByPlaceholderText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByPlaceholderText('Enter sale price')).toBeTruthy();
    });

    it('renders MRP label text with required indicator', () => {
      const { getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByText('MRP *')).toBeTruthy();
    });

    it('renders Sale Price label text', () => {
      const { getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      expect(getByText('Sale Price')).toBeTruthy();
    });

    it('populates price fields when editing an item with prices', () => {
      const editItem = {
        id: 'item1',
        name: 'Test Item',
        categoryId: 'cat1',
        unit: 'pcs' as const,
        defaultQuantity: 1,
        mrp: 100,
        price: 80,
      };

      const { getByTestId } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          editItem={editItem}
          testID="item-form"
        />
      );

      const mrpInput = getByTestId('item-form-mrp-input');
      const salePriceInput = getByTestId('item-form-sale-price-input');

      expect(mrpInput.props.value).toBe('100');
      expect(salePriceInput.props.value).toBe('80');
    });
  });

  describe('Discount Calculation', () => {
    it('displays discount badge when MRP > Sale Price', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      const mrpInput = getByPlaceholderText('Enter MRP');
      const salePriceInput = getByPlaceholderText('Enter sale price');

      fireEvent.changeText(mrpInput, '100');
      fireEvent.changeText(salePriceInput, '80');

      await waitFor(() => {
        expect(getByText('20% OFF')).toBeTruthy();
      });
    });

    it('does not display discount badge when MRP equals Sale Price', async () => {
      const { getByPlaceholderText, queryByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      const mrpInput = getByPlaceholderText('Enter MRP');
      const salePriceInput = getByPlaceholderText('Enter sale price');

      fireEvent.changeText(mrpInput, '100');
      fireEvent.changeText(salePriceInput, '100');

      await waitFor(() => {
        expect(queryByText(/% OFF/)).toBeNull();
      });
    });

    it('does not display discount badge when only MRP is entered', async () => {
      const { getByPlaceholderText, queryByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      const mrpInput = getByPlaceholderText('Enter MRP');
      fireEvent.changeText(mrpInput, '100');

      await waitFor(() => {
        expect(queryByText(/% OFF/)).toBeNull();
      });
    });
  });

  describe('Price Validation', () => {
    it('shows error when Sale Price exceeds MRP', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
        />
      );

      const mrpInput = getByPlaceholderText('Enter MRP');
      const salePriceInput = getByPlaceholderText('Enter sale price');

      fireEvent.changeText(mrpInput, '80');
      fireEvent.changeText(salePriceInput, '100');

      await waitFor(() => {
        expect(getByText('Sale price cannot exceed MRP')).toBeTruthy();
      });
    });
  });

  describe('MRP Required Validation', () => {
    it('disables submit button when MRP is empty', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
          testID="item-form"
        />
      );

      // Fill in name but leave MRP empty
      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      // Submit button should be disabled
      const submitButton = getByTestId('item-form-submit-button');
      expect(submitButton.props.accessibilityState?.disabled || submitButton.props.disabled).toBeTruthy();
    });

    it('shows required indicator on MRP label', () => {
      const { getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          testID="item-form"
        />
      );

      // MRP label should show required indicator (asterisk)
      expect(getByText('MRP *')).toBeTruthy();
    });

    it('shows MRP required error when name is filled but MRP is empty', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
        />
      );

      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      await waitFor(() => {
        expect(getByText('MRP is required')).toBeTruthy();
      });
    });

    it('enables submit when valid MRP is provided', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
        />
      );

      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      const mrpInput = getByPlaceholderText('Enter MRP');
      fireEvent.changeText(mrpInput, '100');

      // Submit form - should succeed
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('does not submit when MRP is empty', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
        />
      );

      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      // Try to submit without MRP
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission with Prices', () => {
    it('includes price fields in submission data', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
        />
      );

      // Fill in required fields
      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      // Fill in price fields
      const mrpInput = getByPlaceholderText('Enter MRP');
      const salePriceInput = getByPlaceholderText('Enter sale price');
      fireEvent.changeText(mrpInput, '100');
      fireEvent.changeText(salePriceInput, '80');

      // Submit the form
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Item',
            mrp: 100,
            salePrice: 80,
          })
        );
      });
    });

    it('submits with MRP and without sale price when sale price is empty', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ItemFormModal
          visible={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          categories={mockCategories}
          initialCategoryId="cat1"
        />
      );

      // Fill in required fields including MRP
      const nameInput = getByPlaceholderText('Enter item name');
      fireEvent.changeText(nameInput, 'Test Item');

      const mrpInput = getByPlaceholderText('Enter MRP');
      fireEvent.changeText(mrpInput, '150');

      // Submit the form without filling sale price
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Item',
            mrp: 150,
          })
        );
        // Ensure salePrice is undefined when not provided
        const callArg = mockOnSubmit.mock.calls[0][0];
        expect(callArg.salePrice).toBeUndefined();
      });
    });
  });
});
