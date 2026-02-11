/**
 * ProductGrid Component
 * 2-column grid container for product cards on the picking screen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item, Category, CartItemState } from '../../../domain/types/picking';
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
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const getItemQuantityInCart = useCallback(
    (itemId: string): number => {
      const cartItem = cartItems.find((ci) => ci.item.id === itemId);
      return cartItem?.quantity || 0;
    },
    [cartItems]
  );

  const getCategoryIcon = useCallback(
    (categoryId: string): string => {
      const category = categories.find((c) => c.id === categoryId);
      return category?.icon || '📦';
    },
    [categories]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const quantityInCart = getItemQuantityInCart(item.id);
      const categoryIcon = getCategoryIcon(item.categoryId);

      return (
        <ProductCard
          item={item}
          categoryIcon={categoryIcon}
          quantityInCart={quantityInCart}
          onAdd={() => onAddItem(item)}
          onIncrement={() => onIncrementItem(item.id)}
          onDecrement={() => onDecrementItem(item.id)}
          onPress={() => onItemPress(item)}
          testID={testID ? `${testID}-item-${item.id}` : undefined}
        />
      );
    },
    [
      getItemQuantityInCart,
      getCategoryIcon,
      onAddItem,
      onIncrementItem,
      onDecrementItem,
      onItemPress,
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
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
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
