/**
 * ProductGrid Component
 * Responsive column grid container for product cards on the picking screen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item, Category, CartItemState } from '../../../domain/types/picking';
import { findCategoryByIdOrUuid } from '../../../domain/utils/categoryLookup';
import { formatQuantityWithUnit, getBaseUnit } from '../../../domain/utils/unitConversion';
import ProductCard from './ProductCard';

interface ProductGridProps {
  items: Item[];
  cartItems: CartItemState[];
  categories: Category[];
  onAddItem: (item: Item) => void;
  onIncrementItem: (itemId: string) => void;
  onDecrementItem: (itemId: string) => void;
  onItemPress: (item: Item) => void;
  hasCartItems?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Map of itemId → pending status for showing loading spinners */
  pendingItems?: Record<string, string>;
  testID?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  items,
  cartItems,
  categories,
  onAddItem,
  onIncrementItem,
  onDecrementItem,
  onItemPress,
  hasCartItems = false,
  refreshing = false,
  onRefresh,
  pendingItems = {},
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const numColumns = responsiveStyles.gridColumns || 2;

  const getItemQuantityInCart = useCallback(
    (itemId: string): number => {
      const cartItem = cartItems.find((ci) => ci.item.id === itemId);
      return cartItem?.quantity || 0;
    },
    [cartItems]
  );

  const getCategoryIcon = useCallback(
    (categoryId: string): string => {
      const category = findCategoryByIdOrUuid(categories, categoryId);
      return category?.icon || '📦';
    },
    [categories]
  );

  const getFormattedQuantity = useCallback(
    (itemId: string): string => {
      const cartItem = cartItems.find((ci) => ci.item.id === itemId);
      if (!cartItem || cartItem.quantity === 0) return '0';
      return formatQuantityWithUnit(
        cartItem.quantity,
        getBaseUnit(cartItem.item.unit),
        cartItem.displayUnit || cartItem.item.unit
      ).formatted;
    },
    [cartItems]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const quantityInCart = getItemQuantityInCart(item.id);
      const categoryIcon = getCategoryIcon(item.categoryId);
      const formattedQuantity = getFormattedQuantity(item.id);

      return (
        <ProductCard
          item={item}
          categoryIcon={categoryIcon}
          quantityInCart={quantityInCart}
          formattedQuantity={formattedQuantity}
          onAdd={() => onAddItem(item)}
          onIncrement={() => onIncrementItem(item.id)}
          onDecrement={() => onDecrementItem(item.id)}
          onPress={() => onItemPress(item)}
          isPending={!!pendingItems[item.id]}
          testID={testID ? `${testID}-item-${item.id}` : undefined}
        />
      );
    },
    [
      getItemQuantityInCart,
      getFormattedQuantity,
      getCategoryIcon,
      onAddItem,
      onIncrementItem,
      onDecrementItem,
      onItemPress,
      pendingItems,
      testID,
    ]
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyContainer,
        {
          padding: theme.spacing.lg,
        },
      ]}
    >
      <Text
        style={[
          styles.emptyTitle,
          {
            color: theme.colors.text,
            fontSize: isTablet
              ? theme.typography.fontSize.xl
              : theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {t('picking.noItemsFound')}
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          {
            color: theme.colors.textSecondary,
            fontSize: isTablet
              ? theme.typography.fontSize.lg
              : theme.typography.fontSize.md,
          },
        ]}
      >
        {t('picking.trySearching')}
      </Text>
    </View>
  );

  return (
    <FlatList
      key={`grid-${numColumns}`}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingHorizontal: responsiveStyles.contentPadding - theme.spacing.xs,
          paddingBottom: hasCartItems ? 80 : theme.spacing.lg,
        },
      ]}
      columnWrapperStyle={styles.columnWrapper}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});

export default ProductGrid;
