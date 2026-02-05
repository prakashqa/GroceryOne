/**
 * CartListItem Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CartListItem from '../CartListItem';
import { ManagedCart } from '../../../../domain/types/picking';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; time?: string }) => {
      if (key === 'manageCarts.item') {
        return options?.count === 1 ? '1 item' : `${options?.count} items`;
      }
      if (key === 'manageCarts.updatedAgo') {
        return `Updated ${options?.time}`;
      }
      if (key === 'time.justNow') return 'just now';
      if (key === 'time.minutesAgo') return `${options?.count} mins ago`;
      if (key === 'time.hoursAgo') return `${options?.count} hrs ago`;
      if (key === 'time.daysAgo') return `${options?.count} days ago`;
      if (key === 'picking.defaultCart') return 'Default Cart';
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      primaryLight: '#81C784',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      border: '#e0e0e0',
      card: '#ffffff',
      warning: '#FFC107',
      disabled: '#BDBDBD',
      success: '#4CAF50',
      info: '#2196F3',
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
      },
    },
    textStyles: {
      h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
      h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
      h3: { fontSize: 18, fontWeight: '600', letterSpacing: 0 },
      body: { fontSize: 16, fontWeight: '400' },
      bodySmall: { fontSize: 14, fontWeight: '400' },
      caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2 },
      button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
  }),
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    fontScale: 1,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 12,
    modalWidth: 600,
    sectionSpacing: 24,
  }),
}));

describe('CartListItem', () => {
  const mockCart: ManagedCart = {
    id: 'cart-1',
    name: 'Morning Order',
    items: [
      {
        item: {
          id: 'item-1',
          categoryId: 'cat-1',
          name: 'Item 1',
          unit: 'kg',
          defaultQuantity: 1,
        },
        quantity: 5,
        addedAt: new Date().toISOString(),
      },
      {
        item: {
          id: 'item-2',
          categoryId: 'cat-2',
          name: 'Item 2',
          unit: 'pcs',
          defaultQuantity: 1,
        },
        quantity: 3,
        addedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    status: 'draft',
  };

  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cart name correctly', () => {
    const { getByText } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Morning Order')).toBeTruthy();
  });

  it('renders item count correctly', () => {
    const { getByText } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    // Should show "2 items" (number of unique items)
    expect(getByText('2 items')).toBeTruthy();
  });

  it('renders singular item text for single item', () => {
    const singleItemCart: ManagedCart = {
      ...mockCart,
      items: [mockCart.items[0]],
    };

    const { getByText } = render(
      <CartListItem
        cart={singleItemCart}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('1 item')).toBeTruthy();
  });

  it('shows active indicator when isActive is true', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={true}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    expect(getByTestId('cart-item-active-indicator')).toBeTruthy();
  });

  it('does not show active indicator when isActive is false', () => {
    const { queryByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    expect(queryByTestId('cart-item-active-indicator')).toBeNull();
  });

  it('calls onPress with cart ID when pressed', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    fireEvent.press(getByTestId('cart-item'));
    expect(mockOnPress).toHaveBeenCalledWith('cart-1');
  });

  it('calls onLongPress with cart ID when long pressed', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        testID="cart-item"
      />
    );

    fireEvent(getByTestId('cart-item'), 'onLongPress');
    expect(mockOnLongPress).toHaveBeenCalledWith('cart-1');
  });

  it('renders item count badge', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    expect(getByTestId('cart-item-badge')).toBeTruthy();
  });

  it('renders chevron indicator', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    expect(getByTestId('cart-item-chevron')).toBeTruthy();
  });

  it('renders empty cart correctly', () => {
    const emptyCart: ManagedCart = {
      ...mockCart,
      items: [],
    };

    const { getByText } = render(
      <CartListItem
        cart={emptyCart}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('0 items')).toBeTruthy();
  });

  it('renders cart icon', () => {
    const { getByTestId } = render(
      <CartListItem
        cart={mockCart}
        isActive={false}
        onPress={mockOnPress}
        testID="cart-item"
      />
    );

    expect(getByTestId('cart-item-icon')).toBeTruthy();
  });

  describe('Cart Name Visibility', () => {
    it('should have minWidth on cart name to prevent excessive truncation on mobile', () => {
      const { getByText } = render(
        <CartListItem
          cart={mockCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      const cartNameElement = getByText('Morning Order');
      const style = cartNameElement.props.style;

      // Flatten the style array to check for minWidth
      const flattenedStyle = Array.isArray(style)
        ? style.reduce((acc: Record<string, unknown>, s: Record<string, unknown> | undefined) => ({ ...acc, ...(s || {}) }), {})
        : style;

      // Cart name should have a minimum width to ensure visibility on mobile
      expect(flattenedStyle.minWidth).toBeGreaterThanOrEqual(60);
    });

    it('should render long cart names without excessive truncation', () => {
      const longNameCart: ManagedCart = {
        ...mockCart,
        name: 'Test Long Cart Name',
      };

      const { getByText } = render(
        <CartListItem
          cart={longNameCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // The cart name should be findable (even if truncated, it should render)
      expect(getByText('Test Long Cart Name')).toBeTruthy();
    });
  });

  describe('Default Cart Name Translation', () => {
    it('should translate English "Default Cart" name to localized version', () => {
      const defaultCart: ManagedCart = {
        ...mockCart,
        name: 'Default Cart',
      };

      const { getByText } = render(
        <CartListItem
          cart={defaultCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Should show translated name (mock returns "Default Cart" for picking.defaultCart)
      expect(getByText('Default Cart')).toBeTruthy();
    });

    it('should translate Telugu "డిఫాల్ట్ కార్ట్" name to localized version', () => {
      const teluguDefaultCart: ManagedCart = {
        ...mockCart,
        name: 'డిఫాల్ట్ కార్ట్', // Telugu default cart name
      };

      const { getByText } = render(
        <CartListItem
          cart={teluguDefaultCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Should show translated name (mock returns "Default Cart" for picking.defaultCart)
      // The cart name should be recognized as a default cart and translated
      expect(getByText('Default Cart')).toBeTruthy();
    });

    it('should NOT translate user-provided cart names', () => {
      const customCart: ManagedCart = {
        ...mockCart,
        name: 'My Custom Cart',
      };

      const { getByText } = render(
        <CartListItem
          cart={customCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Should show the exact name the user provided
      expect(getByText('My Custom Cart')).toBeTruthy();
    });
  });

  describe('Tablet Layout Support', () => {
    it('renders with flex sizing when numColumns is provided', () => {
      const { getByTestId } = render(
        <CartListItem
          cart={mockCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
          numColumns={2}
        />
      );

      const container = getByTestId('cart-item-animated-container');
      const style = container.props.style;

      // When in multi-column layout, should use flex instead of fixed margins
      const flattenedStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : style;

      expect(flattenedStyle.flex).toBe(1);
      expect(flattenedStyle.marginHorizontal).toBe(0);
    });

    it('renders with default margins when numColumns is 1 or not provided', () => {
      const { getByTestId } = render(
        <CartListItem
          cart={mockCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
          numColumns={1}
        />
      );

      const container = getByTestId('cart-item-animated-container');
      const style = container.props.style;

      const flattenedStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : style;

      // Compact layout: marginHorizontal is reduced by 20% (16 * 0.8 = ~13)
      expect(flattenedStyle.marginHorizontal).toBe(13);
    });

    it('renders with default margins when numColumns is undefined', () => {
      const { getByTestId } = render(
        <CartListItem
          cart={mockCart}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      const container = getByTestId('cart-item-animated-container');
      const style = container.props.style;

      const flattenedStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : style;

      // Compact layout: marginHorizontal is reduced by 20% (16 * 0.8 = ~13)
      expect(flattenedStyle.marginHorizontal).toBe(13);
    });
  });

  describe('Paid Cart Display', () => {
    it('should display paidAmount for paid cart with items', () => {
      const paidCartWithItems: ManagedCart = {
        id: 'cart-paid-1',
        name: 'Paid Cart',
        items: [
          {
            item: {
              id: 'item-1',
              categoryId: 'cat-1',
              name: 'Rice',
              unit: 'kg',
              defaultQuantity: 1,
              price: 60,
            },
            quantity: 2,
            addedAt: new Date().toISOString(),
            priceSnapshot: 60,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidAmount: 120,
      };

      const { getByTestId } = render(
        <CartListItem
          cart={paidCartWithItems}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      const totalElement = getByTestId('cart-item-total');
      expect(totalElement).toBeTruthy();
    });

    it('should display paidAmount for paid cart with empty items array', () => {
      const paidCartNoItems: ManagedCart = {
        id: 'cart-paid-2',
        name: 'Paid Cart Empty',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidAmount: 350,
      };

      const { getByTestId } = render(
        <CartListItem
          cart={paidCartNoItems}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Even with empty items, paidAmount should still be visible
      const totalElement = getByTestId('cart-item-total');
      expect(totalElement).toBeTruthy();
    });

    it('should display paidItemCount for paid cart with empty items array', () => {
      const paidCartWithItemCount: ManagedCart = {
        id: 'cart-paid-count',
        name: 'Paid Cart Count',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidAmount: 500,
        paidItemCount: 4,
      };

      const { getByText } = render(
        <CartListItem
          cart={paidCartWithItemCount}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Should show 4 items (from paidItemCount), not 0 items (from items.length)
      expect(getByText('4 items')).toBeTruthy();
    });

    it('should NOT display price section for unpaid cart with no priced items', () => {
      const draftCartNoPrice: ManagedCart = {
        id: 'cart-draft-1',
        name: 'Draft Cart',
        items: [
          {
            item: {
              id: 'item-1',
              categoryId: 'cat-1',
              name: 'Rice',
              unit: 'kg',
              defaultQuantity: 1,
            },
            quantity: 2,
            addedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const { queryByTestId } = render(
        <CartListItem
          cart={draftCartNoPrice}
          isActive={false}
          onPress={mockOnPress}
          testID="cart-item"
        />
      );

      // Draft cart without prices should not show total
      expect(queryByTestId('cart-item-total')).toBeNull();
    });
  });
});
