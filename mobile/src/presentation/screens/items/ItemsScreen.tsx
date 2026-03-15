/**
 * ItemsScreen
 * Quick-add items tab — lists all items, one-tap to create cart and add item
 * Supports grid and list view modes with a toggle in the header
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
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item, Category, ManagedCart } from '../../../domain/types/picking';
import { normalizeToBaseUnit, type ItemUnit } from '../../../domain/utils/unitConversion';
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
  removeItemFromActiveCart,
  selectActiveCart,
  selectTodaysCarts,
  selectActiveCartItems,
  selectActiveCartItemCount,
} from '../../../store/slices/multiCartSlice';
import { ProductCard } from '../../components/picking/ProductCard';
import { CategoryBar } from '../../components/picking/CategoryBar';
import { OrderFooter } from '../../components/picking/OrderFooter';
import AddQuantityModal from '../picking/AddQuantityModal';

/**
 * Format item price as compact INR string (₹120, not ₹120.00)
 */
const formatItemPrice = (price: number): string => `₹${price}`;

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
  Order: undefined;
};

/**
 * Compact list row component for list view mode
 */
const ProductListItem: React.FC<{
  item: Item;
  categoryIcon: string;
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress: () => void;
  testID?: string;
  theme: ReturnType<typeof useTheme>;
  isTablet: boolean;
}> = ({ item, categoryIcon, quantityInCart, onAdd, onIncrement, onDecrement, onPress, testID, theme, isTablet }) => {
  const productName = getTranslatedItemName(item);
  const isInCart = quantityInCart > 0;
  const isStockTracked = item.trackInventory ?? false;
  const isOutOfStock = isStockTracked && (item.stockQuantity ?? 0) <= 0;

  return (
    <TouchableOpacity
      style={[
        styles.listItemContainer,
        {
          backgroundColor: isInCart ? theme.colors.inCartBackground : theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          marginHorizontal: theme.spacing.xs,
          marginVertical: theme.spacing.xs / 2,
          paddingHorizontal: theme.spacing.smd,
          paddingVertical: theme.spacing.sm,
          borderWidth: isInCart ? 1.5 : 0,
          borderColor: isInCart ? theme.colors.inCartBorder : 'transparent',
        },
        theme.shadows.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      {/* Left: Icon + Name + Unit */}
      <Text style={styles.listItemIcon}>{categoryIcon}</Text>
      <View style={styles.listItemInfo}>
        <Text
          style={[
            styles.listItemName,
            {
              color: theme.colors.text,
              fontSize: isTablet
                ? Math.round(theme.typography.fontSize.xl * 0.9)
                : Math.round(theme.typography.fontSize.lg * 0.9),
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          {item.defaultQuantity} {item.unit}
        </Text>
      </View>

      {/* Right: Price + Action */}
      <View style={styles.listItemRight}>
        {item.price !== undefined && (
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: isTablet
                ? theme.typography.fontSize.lg
                : theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.bold,
              marginRight: theme.spacing.sm,
            }}
          >
            {formatItemPrice(item.price)}
          </Text>
        )}
        {isInCart ? (
          <View style={[styles.listItemQuantityControls, { borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.background, padding: 2 }]}>
            <TouchableOpacity
              style={[styles.listItemQtyBtn, { backgroundColor: theme.colors.surface, borderRadius: 14 }]}
              onPress={onDecrement}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              testID={testID ? `${testID}-decrement` : undefined}
            >
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold }}>-</Text>
            </TouchableOpacity>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.bold,
                minWidth: 24,
                textAlign: 'center',
              }}
              testID={testID ? `${testID}-quantity` : undefined}
            >
              {quantityInCart}
            </Text>
            <TouchableOpacity
              style={[styles.listItemQtyBtn, { backgroundColor: theme.colors.buttonPrimary, borderRadius: 14 }]}
              onPress={onIncrement}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              testID={testID ? `${testID}-increment` : undefined}
            >
              <Text style={{ color: theme.colors.textInverse, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold }}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.listItemAddBtn,
              {
                backgroundColor: isOutOfStock ? theme.colors.textLight : theme.colors.buttonPrimary,
                borderRadius: theme.borderRadius.xl,
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.smd,
                opacity: isOutOfStock ? 0.5 : 1,
              },
            ]}
            onPress={onAdd}
            disabled={isOutOfStock}
            testID={testID ? `${testID}-add-button` : undefined}
          >
            <Text style={{ color: theme.colors.buttonPrimaryText, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>
              Add
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ItemsScreen: React.FC = () => {
  const theme = useTheme();
  const isDark = useIsDarkMode();
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
  const orderItemCount = useSelector(selectActiveCartItemCount);

  // Calculate total price from active cart items for the order footer
  const orderTotalPrice = useMemo(() => {
    return activeCartItems.reduce((sum, ci) => {
      if (ci.priceSnapshot !== undefined && ci.priceSnapshot > 0) {
        return sum + ci.priceSnapshot * ci.quantity;
      }
      return sum;
    }, 0);
  }, [activeCartItems]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    // Exclude inventory items (trackInventory === true) — only show order/POS items
    let filtered = items.filter((item: Item) => item.isActive !== false && item.trackInventory !== true);

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
   * Card press — open quantity modal for the item
   */
  const handleItemPress = useCallback(
    (item: Item) => {
      // Don't open modal for out-of-stock tracked items
      const isStockTracked = item.trackInventory ?? false;
      const availableStock = item.stockQuantity ?? 0;
      if (isStockTracked && availableStock <= 0) {
        return;
      }

      setSelectedItem(item);
      setModalVisible(true);
    },
    []
  );

  // Track selected item's current cart state for the modal
  const selectedItemCartState = useMemo(() => {
    if (!selectedItem) return { quantity: 0, displayUnit: undefined };
    const cartItem = activeCartItems.find((ci) => ci.item.id === selectedItem.id);
    return {
      quantity: cartItem?.quantity || 0,
      displayUnit: cartItem?.displayUnit || undefined,
    };
  }, [selectedItem, activeCartItems]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleModalAddToCart = useCallback(
    (item: Item, quantity: number, displayUnit?: ItemUnit) => {
      // Ensure cart exists before adding
      if (!activeCart || activeCart.status === 'paid') {
        const cartName = generateCartName(todaysCarts);
        dispatch(createCart({ name: cartName }));
      }
      dispatch(addItemToActiveCart({ item, quantity, displayUnit }));
    },
    [activeCart, todaysCarts, dispatch]
  );

  const handleModalRemove = useCallback(
    (itemId: string) => {
      dispatch(removeItemFromActiveCart(itemId));
    },
    [dispatch]
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

  const handleGoToOrder = useCallback(() => {
    navigation.navigate('Order');
  }, [navigation]);

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

  const renderGridItem = useCallback(
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

  const renderListItem = useCallback(
    ({ item }: { item: Item }) => {
      const quantityInCart = getItemQuantityInCart(item.id);
      return (
        <ProductListItem
          item={item}
          categoryIcon={getCategoryIcon(item.categoryId)}
          quantityInCart={quantityInCart}
          onAdd={() => handleAddItem(item)}
          onIncrement={() => handleAddItem(item)}
          onDecrement={() => handleDecrement(item.id)}
          onPress={() => handleItemPress(item)}
          testID={`item-${item.id}`}
          theme={theme}
          isTablet={isTablet}
        />
      );
    },
    [getItemQuantityInCart, getCategoryIcon, handleAddItem, handleDecrement, handleItemPress, theme, isTablet]
  );

  const hasOrderItems = orderItemCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.headerBackground}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.headerBackground,
            paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.smd,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.headerText,
                fontSize: isTablet
                  ? theme.typography.fontSize.xxl
                  : theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
              },
            ]}
          >
            {t('items.title', 'Items')}
          </Text>

          {/* View mode toggle */}
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={[
              styles.viewToggle,
              {
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.xs,
              },
            ]}
            accessibilityLabel={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            accessibilityRole="button"
            testID="items-view-toggle"
          >
            <Icon
              name={viewMode === 'grid' ? 'view-list' : 'view-module'}
              size={isTablet ? 28 : 24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.inputBackground,
              borderRadius: theme.borderRadius.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          <Icon
            name="search"
            size={20}
            color={theme.colors.placeholder}
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
              },
            ]}
            placeholder={t('items.searchPlaceholder', 'Search items...')}
            placeholderTextColor={theme.colors.placeholder}
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

      {/* Items grid/list */}
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
      ) : viewMode === 'grid' ? (
        <FlatList
          key={`grid-${numColumns}`}
          data={filteredItems}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{
            padding: theme.spacing.sm,
            paddingBottom: hasOrderItems ? 120 : 100,
          }}
          showsVerticalScrollIndicator={false}
          testID="items-grid"
        />
      ) : (
        <FlatList
          key="list"
          data={filteredItems}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing.sm,
            paddingBottom: hasOrderItems ? 120 : 100,
          }}
          showsVerticalScrollIndicator={false}
          testID="items-list"
        />
      )}

      {/* View Order footer — shows when items are in the active order */}
      {hasOrderItems && (
        <OrderFooter
          itemCount={orderItemCount}
          totalPrice={orderTotalPrice}
          onViewCart={handleGoToOrder}
          testID="items-order-footer"
        />
      )}

      {/* Quantity selection modal */}
      <AddQuantityModal
        visible={modalVisible}
        item={selectedItem}
        quantityInCart={selectedItemCartState.quantity}
        displayUnitInCart={selectedItemCartState.displayUnit}
        onClose={handleModalClose}
        onAddToCart={handleModalAddToCart}
        onRemove={handleModalRemove}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {},
  viewToggle: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  // List view styles
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  listItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  listItemName: {},
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemQtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemAddBtn: {
    alignItems: 'center',
  },
});

export default ItemsScreen;
