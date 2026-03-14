/**
 * AddQuantityModal Tests
 * TDD tests for the quantity selection modal
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import AddQuantityModal from '../AddQuantityModal';
import { Item } from '../../../../domain/types/picking';

jest.mock('../../../../hooks/useResponsiveStyles', () => ({
  useResponsiveStyles: jest.fn(() => ({
    fontScale: 1, touchTargetMinSize: 48, modalWidth: 343,
    componentPadding: 16, cardBorderRadius: 12, buttonBorderRadius: 8, iconSize: 24,
  })),
}));

jest.mock('../../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn(() => ({
    isTablet: false, isLandscape: false, screenWidth: 375, screenHeight: 812, breakpoint: 'sm',
  })),
}));

describe('AddQuantityModal', () => {
  const mockItem: Item = {
    id: 'atta-1', categoryId: 'atta-rice', name: 'Aashirvaad Atta', unit: 'kg', defaultQuantity: 5,
  };

  const mockOnClose = jest.fn();
  const mockOnAddToCart = jest.fn();

  const renderModal = (overrides: Record<string, any> = {}) => renderWithProviders(
    <AddQuantityModal
      visible={true} item={mockItem}
      onClose={mockOnClose} onAddToCart={mockOnAddToCart}
      {...overrides}
    />
  );

  beforeEach(() => { jest.clearAllMocks(); });

  describe('rendering', () => {
    it('should not render when visible is false', () => {
      expect(renderModal({ visible: false }).queryByText('Add Atta')).toBeNull();
    });

    it('should render when visible is true', () => {
      expect(renderModal().getByText('Add Atta')).toBeTruthy();
    });

    it('should display item category name in title', () => {
      expect(renderModal().getByText('Add Atta')).toBeTruthy();
    });

    it('should show Select Quantity label', () => {
      expect(renderModal().getByText('Select Quantity')).toBeTruthy();
    });

    it('should display preset quantity options based on item unit', () => {
      const { getByText } = renderModal();
      for (const preset of ['0.5', '1', '2', '5']) {
        expect(getByText(preset)).toBeTruthy();
      }
    });

    it('should display custom quantity option with + indicator', () => {
      expect(renderModal().getByTestId('custom-quantity-option')).toBeTruthy();
    });

    it('should display Add to Cart button', () => {
      expect(renderModal().getByText('Add to Order')).toBeTruthy();
    });

    it('should display close button', () => {
      expect(renderModal().getByTestId('close-button')).toBeTruthy();
    });
  });

  describe('quantity selection', () => {
    it('should select default quantity initially (item defaultQuantity)', () => {
      expect(renderModal().getByTestId('quantity-option-5').props.accessibilityState?.selected).toBe(false);
    });

    it('should allow selecting preset quantity options', () => {
      const { getByTestId } = renderModal();
      const option2 = getByTestId('quantity-option-2');
      fireEvent.press(option2);
      expect(option2.props.accessibilityState?.selected).toBe(true);
    });

    it('should show custom input when custom option is selected', () => {
      const { getByTestId, queryByTestId } = renderModal();
      expect(queryByTestId('custom-quantity-input')).toBeNull();
      fireEvent.press(getByTestId('custom-quantity-option'));
      expect(getByTestId('custom-quantity-input')).toBeTruthy();
    });

    it('should allow entering custom quantity', () => {
      const { getByTestId } = renderModal();
      fireEvent.press(getByTestId('custom-quantity-option'));
      fireEvent.changeText(getByTestId('custom-quantity-input'), '8');
      expect(getByTestId('custom-quantity-display').props.children).toContain('8');
    });
  });

  describe('interactions', () => {
    it('should call onClose when close button is pressed', () => {
      fireEvent.press(renderModal().getByTestId('close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is pressed', () => {
      fireEvent.press(renderModal().getByTestId('modal-backdrop'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onAddToCart with item and selected quantity when Add to Cart is pressed', () => {
      const { getByText, getByTestId } = renderModal();
      fireEvent.press(getByTestId('quantity-option-5'));
      fireEvent.press(getByText('Add to Order'));
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 5, 'kg');
    });

    it('should call onAddToCart with custom quantity when custom is selected', () => {
      const { getByText, getByTestId } = renderModal();
      fireEvent.press(getByTestId('custom-quantity-option'));
      fireEvent.changeText(getByTestId('custom-quantity-input'), '15');
      fireEvent.press(getByText('Add to Order'));
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 15, 'kg');
    });

    it('should close modal after adding to cart', () => {
      const { getByText, getByTestId } = renderModal();
      fireEvent.press(getByTestId('quantity-option-1'));
      fireEvent.press(getByText('Add to Order'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('different item units', () => {
    it.each([
      ['gm', { id: 'snack-1', categoryId: 'chips-biscuits', name: 'Lays Classic', unit: 'gm' as const, defaultQuantity: 100 }, ['100', '250', '500', '1000']],
      ['pcs', { id: 'bath-1', categoryId: 'bath-body', name: 'Dove Soap', unit: 'pcs' as const, defaultQuantity: 3 }, ['1', '2', '3', '6']],
      ['L', { id: 'oil-1', categoryId: 'oil-ghee', name: 'Fortune Sunflower Oil', unit: 'L' as const, defaultQuantity: 1 }, ['0.5', '1', '2', '5']],
    ])('should show appropriate presets for %s unit items', (_unit, item, presets) => {
      const { getByText } = renderModal({ item });
      presets.forEach((p: string) => expect(getByText(p)).toBeTruthy());
    });
  });

  describe('edge cases', () => {
    it('should handle null item gracefully', () => {
      expect(renderModal({ item: null as unknown as Item }).queryByText('Add to Order')).toBeNull();
    });

    it('should reset selection when modal is reopened', () => {
      const { rerender, getByTestId } = renderModal();
      fireEvent.press(getByTestId('quantity-option-5'));

      rerender(
        <AddQuantityModal visible={false} item={mockItem} onClose={mockOnClose} onAddToCart={mockOnAddToCart} />
      );
      rerender(
        <AddQuantityModal visible={true} item={mockItem} onClose={mockOnClose} onAddToCart={mockOnAddToCart} />
      );

      expect(getByTestId('quantity-option-5').props.accessibilityState?.selected).toBe(false);
    });

    it('should not allow 0 or negative custom quantities', () => {
      const { getByText, getByTestId } = renderModal();
      fireEvent.press(getByTestId('custom-quantity-option'));
      fireEvent.changeText(getByTestId('custom-quantity-input'), '0');
      fireEvent.press(getByText('Add to Order'));
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });
  });

  describe('cart-aware behavior', () => {
    const mockOnRemove = jest.fn();

    it('should show in-cart banner when quantityInCart > 0', () => {
      const { getByTestId } = renderModal({ quantityInCart: 5 });
      expect(getByTestId('in-cart-banner')).toBeTruthy();
    });

    it('should not show in-cart banner when quantityInCart is 0', () => {
      const { queryByTestId } = renderModal();
      expect(queryByTestId('in-cart-banner')).toBeNull();
    });

    it('should display formatted cart quantity in banner', () => {
      const { getByTestId } = renderModal({ quantityInCart: 5 });
      const banner = getByTestId('in-cart-banner');
      // Should contain "5 kg in cart" text
      expect(banner).toBeTruthy();
    });

    it('should show Update Order button text when item is in cart', () => {
      const { getByText } = renderModal({ quantityInCart: 5 });
      expect(getByText('Update Order')).toBeTruthy();
    });

    it('should show Add to Order button text when item is NOT in cart', () => {
      const { getByText } = renderModal();
      expect(getByText('Add to Order')).toBeTruthy();
    });

    it('should show Remove from Cart button when item is in cart and onRemove provided', () => {
      const { getByTestId } = renderModal({ quantityInCart: 5, onRemove: mockOnRemove });
      expect(getByTestId('remove-from-cart-button')).toBeTruthy();
    });

    it('should not show Remove button when item is NOT in cart', () => {
      const { queryByTestId } = renderModal({ onRemove: mockOnRemove });
      expect(queryByTestId('remove-from-cart-button')).toBeNull();
    });

    it('should not show Remove button when onRemove is not provided', () => {
      const { queryByTestId } = renderModal({ quantityInCart: 5 });
      expect(queryByTestId('remove-from-cart-button')).toBeNull();
    });

    it('should call onRemove with itemId and close modal when Remove is pressed', () => {
      const { getByTestId } = renderModal({ quantityInCart: 5, onRemove: mockOnRemove });
      fireEvent.press(getByTestId('remove-from-cart-button'));
      expect(mockOnRemove).toHaveBeenCalledWith(mockItem.id);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('responsive styling', () => {
    const { useResponsiveStyles } = require('../../../../hooks/useResponsiveStyles');

    const tabletResponsive = {
      fontScale: 1.25, touchTargetMinSize: 58, modalWidth: 500,
      componentPadding: 24, cardBorderRadius: 16, buttonBorderRadius: 12, iconSize: 34,
    };

    it('should use responsive fontScale for text sizing', () => {
      useResponsiveStyles.mockReturnValue(tabletResponsive);
      expect(renderModal().getByText('Add Atta')).toBeTruthy();
    });

    it('should use responsive touchTargetMinSize for buttons', () => {
      useResponsiveStyles.mockReturnValue(tabletResponsive);
      const { getByTestId } = renderModal();
      expect(getByTestId('close-button')).toBeTruthy();
      expect(getByTestId('quantity-option-1')).toBeTruthy();
    });

    it('should use responsive modalWidth for container sizing', () => {
      useResponsiveStyles.mockReturnValue({
        ...tabletResponsive, fontScale: 1.35, touchTargetMinSize: 64,
        modalWidth: 600, componentPadding: 28, cardBorderRadius: 20, iconSize: 38,
      });
      expect(renderModal().getByText('Add to Order')).toBeTruthy();
    });
  });
});
