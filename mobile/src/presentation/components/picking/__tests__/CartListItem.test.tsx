/**
 * CartListItem Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CartListItem from '../CartListItem';
import { ManagedCart } from '../../../../domain/types/picking';
import { flattenStyle } from '../../../../__test-utils__';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; time?: string }) => {
      if (key === 'manageCarts.item') return options?.count === 1 ? '1 item' : `${options?.count} items`;
      if (key === 'manageCarts.updatedAgo') return `Updated ${options?.time}`;
      if (key === 'time.justNow') return 'just now';
      if (key === 'time.minutesAgo') return `${options?.count} mins ago`;
      if (key === 'time.hoursAgo') return `${options?.count} hrs ago`;
      if (key === 'time.daysAgo') return `${options?.count} days ago`;
      if (key === 'picking.defaultCart') return 'Default Cart';
      return key;
    },
  }),
}));

jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

const createMockItem = (id: string, overrides: Record<string, any> = {}) => ({
  item: { id, categoryId: 'cat-1', name: `Item ${id}`, unit: 'kg', defaultQuantity: 1, ...overrides },
  quantity: 1, addedAt: new Date().toISOString(),
});

describe('CartListItem', () => {
  const mockCart: ManagedCart = {
    id: 'cart-1', name: 'Morning Order',
    items: [
      { ...createMockItem('item-1'), quantity: 5 },
      { ...createMockItem('item-2', { categoryId: 'cat-2', name: 'Item 2', unit: 'pcs' }), quantity: 3 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'draft',
  };

  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  const renderCartItem = (cartOverrides: Partial<ManagedCart> = {}, propOverrides: Record<string, any> = {}) => render(
    <CartListItem
      cart={{ ...mockCart, ...cartOverrides } as ManagedCart}
      isActive={false}
      onPress={mockOnPress}
      {...propOverrides}
    />
  );

  const createPaidCart = (overrides: Record<string, any> = {}): Partial<ManagedCart> => ({
    id: 'cart-paid', name: 'Paid Cart',
    status: 'paid' as const, paidAt: new Date().toISOString(), paidAmount: 120,
    ...overrides,
  });

  beforeEach(() => { jest.clearAllMocks(); });

  it('renders cart name correctly', () => {
    expect(renderCartItem().getByText('Morning Order')).toBeTruthy();
  });

  it('renders item count correctly', () => {
    expect(renderCartItem().getByText('2 items')).toBeTruthy();
  });

  it('renders singular item text for single item', () => {
    expect(renderCartItem({ items: [mockCart.items[0]] }).getByText('1 item')).toBeTruthy();
  });

  it('shows active indicator when isActive is true', () => {
    expect(renderCartItem({}, { isActive: true, testID: 'cart-item' }).getByTestId('cart-item-active-indicator')).toBeTruthy();
  });

  it('does not show active indicator when isActive is false', () => {
    expect(renderCartItem({}, { testID: 'cart-item' }).queryByTestId('cart-item-active-indicator')).toBeNull();
  });

  it('calls onPress with cart ID when pressed', () => {
    fireEvent.press(renderCartItem({}, { testID: 'cart-item' }).getByTestId('cart-item'));
    expect(mockOnPress).toHaveBeenCalledWith('cart-1');
  });

  it('calls onLongPress with cart ID when long pressed', () => {
    const { getByTestId } = renderCartItem({}, { testID: 'cart-item', onLongPress: mockOnLongPress });
    fireEvent(getByTestId('cart-item'), 'onLongPress');
    expect(mockOnLongPress).toHaveBeenCalledWith('cart-1');
  });

  it('renders item count badge', () => {
    expect(renderCartItem({}, { testID: 'cart-item' }).getByTestId('cart-item-badge')).toBeTruthy();
  });

  it('renders chevron indicator', () => {
    expect(renderCartItem({}, { testID: 'cart-item' }).getByTestId('cart-item-chevron')).toBeTruthy();
  });

  it('renders empty cart correctly', () => {
    expect(renderCartItem({ items: [] }).getByText('0 items')).toBeTruthy();
  });

  it('renders cart icon', () => {
    expect(renderCartItem({}, { testID: 'cart-item' }).getByTestId('cart-item-icon')).toBeTruthy();
  });

  describe('Cart Name Visibility', () => {
    it('should have minWidth on cart name to prevent excessive truncation on mobile', () => {
      const style = flattenStyle(renderCartItem({}, { testID: 'cart-item' }).getByText('Morning Order').props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(60);
    });

    it('should render long cart names without excessive truncation', () => {
      expect(renderCartItem({ name: 'Test Long Cart Name' }).getByText('Test Long Cart Name')).toBeTruthy();
    });
  });

  describe('Default Cart Name Translation', () => {
    it.each([
      ['English "Default Cart"', 'Default Cart'],
      ['Telugu "డిఫాల్ట్ కార్ట్"', 'డిఫాల్ట్ కార్ట్'],
    ])('should translate %s to localized version', (_desc, name) => {
      expect(renderCartItem({ name }).getByText('Default Cart')).toBeTruthy();
    });

    it('should NOT translate user-provided cart names', () => {
      expect(renderCartItem({ name: 'My Custom Cart' }).getByText('My Custom Cart')).toBeTruthy();
    });
  });

  describe('Tablet Layout Support', () => {
    it('renders with flex sizing when numColumns is provided', () => {
      const { getByTestId } = renderCartItem({}, { testID: 'cart-item', numColumns: 2 });
      const style = flattenStyle(getByTestId('cart-item-animated-container').props.style);
      expect(style.flex).toBe(1);
      expect(style.marginHorizontal).toBe(0);
    });

    it('renders with default margins when numColumns is 1 or not provided', () => {
      const { getByTestId } = renderCartItem({}, { testID: 'cart-item', numColumns: 1 });
      expect(flattenStyle(getByTestId('cart-item-animated-container').props.style).marginHorizontal).toBe(0);
    });

    it('renders with default margins when numColumns is undefined', () => {
      const { getByTestId } = renderCartItem({}, { testID: 'cart-item' });
      expect(flattenStyle(getByTestId('cart-item-animated-container').props.style).marginHorizontal).toBe(0);
    });
  });

  describe('Paid Cart Display', () => {
    it('should display paidAmount for paid cart with items', () => {
      const paidItems = [{ ...createMockItem('item-1', { price: 60 }), quantity: 2, priceSnapshot: 60 }];
      expect(renderCartItem(createPaidCart({ items: paidItems }), { testID: 'cart-item' }).getByTestId('cart-item-total')).toBeTruthy();
    });

    it('should display paidAmount for paid cart with empty items array', () => {
      expect(renderCartItem(createPaidCart({ id: 'cart-paid-2', name: 'Paid Cart Empty', items: [], paidAmount: 350 }), { testID: 'cart-item' }).getByTestId('cart-item-total')).toBeTruthy();
    });

    it('should display paidItemCount for paid cart with empty items array', () => {
      expect(renderCartItem(createPaidCart({ id: 'cart-paid-count', name: 'Paid Cart Count', items: [], paidAmount: 500, paidItemCount: 4 })).getByText('4 items')).toBeTruthy();
    });

    it('should NOT display price section for unpaid cart with no priced items', () => {
      const draftItems = [{ ...createMockItem('item-1'), quantity: 2 }];
      expect(renderCartItem({ id: 'cart-draft-1', name: 'Draft Cart', items: draftItems, status: 'draft' as const }, { testID: 'cart-item' }).queryByTestId('cart-item-total')).toBeNull();
    });
  });
});
