/**
 * ItemsScreen
 * Quick-add items tab — lists all items, one-tap to create cart and add item
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item, Category, ManagedCart } from '../../../domain/types/picking';
import { normalizeToBaseUnit } from '../../../domain/utils/unitConversion';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';
import { findCategoryByIdOrUuid } from '../../../domain/utils/categoryLookup';
import {
  selectCategories,
  selectItems,
} from '../../../store/slices/catalogSlice';
import {
  createCart,
  addItemToActiveCart,
  decrementItemInActiveCart,
  selectActiveCart,
  selectTodaysCarts,
  selectActiveCartItems,
} from '../../../store/slices/multiCartSlice';
import { ProductCard } from '../../components/picking/ProductCard';
import { CategoryBar } from '../../components/picking/CategoryBar';

/**
 * Generate a cart name in HHMM-DDMMYY-XX format
 */
function generateCartName(todaysCarts: ManagedCart[]): string {
  const now = new Date();
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const YY = String(now.getFullYear()).slice(-2);
  const seq = String(todaysCarts.length + 1).padStart(2, '0');
  return `${HH}${MM}-${DD}${mm}${YY}-${seq}`;
}

type ItemsStackParamList = {
  Items: undefined;
  Cart: undefined;
};

const ItemsScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ItemsStackParamList>>();

  const categories = useSelector(selectCategories);
  const items = useSelector(selectItems);
  const activeCart = useSelector(selectActiveCart);
  const todaysCarts = useSelector(selectTodaysCarts);
  const activeCartItems = useSelector(selectActiveCartItems) || [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    let filtered = items.filter((item: Item) => item.isActive !== false);

    if (selectedCategoryId !== 'all') {
      filtered = filtered.filter((item: Item) => item.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: Item) => {
        const name = getTranslatedItemName(item).toLowerCase();
        return name.includes(query);
      });
    }

    return filtered.sort((a: Item, b: Item) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [items, selectedCategoryId, searchQuery]);

  const numColumns = isTablet ? 4 : 2;

  /**
   * Add item to cart without navigating away — used by + / add buttons
   */
  const handleAddItem = useCallback(
    (item: Item) => {
      // Frontend stock validation: block out-of-stock items
      const isStockTracked = item.trackInventory ?? false;
      const availableStock = item.stockQuantity ?? 0;
      if (isStockTracked && availableStock <= 0) {
        return;
      }

      // If no active cart or active cart is paid → create new cart
      if (!activeCart || activeCart.status === 'paid') {
        const cartName = generateCartName(todaysCarts);
        dispatch(createCart({ name: cartName }));
      }

      // Add item with quantity 1 in base units
      const { quantity: baseQty } = normalizeToBaseUnit(1, item.unit);
      dispatch(
        addItemToActiveCart({
          item,
          quantity: baseQty,
          displayUnit: item.unit,
        })
      );
    },
    [activeCart, todaysCarts, dispatch]
  );

  /**
   * Card press — add item and navigate to Cart review
   */
  const handleItemPress = useCallback(
    (item: Item) => {
      // Don't navigate for out-of-stock tracked items
      const isStockTracked = item.trackInventory ?? false;
      const availableStock = item.stockQuantity ?? 0;
      if (isStockTracked && availableStock <= 0) {
        return;
      }

      handleAddItem(item);
      navigation.navigate('Cart');
    },
    [handleAddItem, navigation]
  );

  /**
   * Remove item from cart via minus button
   */
  const handleDecrement = useCallback(
    (itemId: string) => {
      dispatch(decrementItemInActiveCart(itemId));
    },
    [dispatch]
  );

  const getItemQuantityInCart = useCallback(
    (itemId: string): number => {
      const cartItem = activeCartItems.find((ci) => ci.item.id === itemId);
      return cartItem?.quantity || 0;
    },
    [activeCartItems]
  );

  const getCategoryIcon = useCallback(
    (categoryId: string): string => {
      const category = findCategoryByIdOrUuid(categories, categoryId);
      return category?.icon || '📦';
    },
    [categories]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const quantityInCart = getItemQuantityInCart(item.id);
      return (
        <View style={{ flex: 1 / numColumns, maxWidth: `${100 / numColumns}%` }}>
          <ProductCard
            item={item}
            categoryIcon={getCategoryIcon(item.categoryId)}
            quantityInCart={quantityInCart}
            onAdd={() => handleAddItem(item)}
            onIncrement={() => handleAddItem(item)}
            onDecrement={() => handleDecrement(item.id)}
            onPress={() => handleItemPress(item)}
            testID={`item-${item.id}`}
          />
        </View>
      );
    },
    [numColumns, getItemQuantityInCart, getCategoryIcon, handleAddItem, handleDecrement, handleItemPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.headerText || '#FFFFFF',
              fontSize: isTablet
                ? theme.typography.fontSize.xxl
                : theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
            },
          ]}
        >
          {t('items.title', 'Items')}
        </Text>

        {/* Search bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: theme.borderRadius.md,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          <TextInput
            style={[
              styles.searchInput,
              {
                color: '#FFFFFF',
                fontSize: theme.typography.fontSize.md,
              },
            ]}
            placeholder={t('items.searchPlaceholder', 'Search items...')}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="items-search-input"
          />
        </View>
      </View>

      {/* Category bar */}
      <CategoryBar
        categories={[{ id: 'all', name: t('items.allCategories', 'All'), icon: '📋' }, ...categories]}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        testID="items-category-bar"
      />

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            {t('items.noItems', 'No items found')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{
            padding: theme.spacing.xs,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          testID="items-grid"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerTitle: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default ItemsScreen;
