/**
 * Picking Screen
 * Main screen for selecting grocery items by category
 * Redesigned with 2-column grid layout
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../../navigation/BottomTabNavigator';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

import {
  Category,
  Item,
} from '../../../domain/types/picking';
import type { ItemUnit } from '../../../domain/utils/unitConversion';
import {
  selectCategories,
  selectItems,
  initializeCatalog,
} from '../../../store/slices/catalogSlice';
import {
  getTranslatedItemName,
  getTranslatedCategoryName,
} from '../../../domain/utils/itemTranslations';
import {
  addItemToActiveCart,
  incrementItemInActiveCart,
  decrementItemInActiveCart,
  selectActiveCart,
  selectActiveCartItems,
  selectActiveCartItemCount,
  selectCartCount,
  selectAllCarts,
  selectTodaysCarts,
  createCart,
} from '../../../store/slices/multiCartSlice';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { loadOrSeedCatalog } from '../../../utils/storage/catalogStorage';
import { API_CONFIG } from '../../../core/config/api.config';
import AddQuantityModal from './AddQuantityModal';
import NewCartConfirmModal from '../../components/picking/NewCartConfirmModal';
import CreateCartModal from '../../components/picking/CreateCartModal';
import PickingHeader from '../../components/picking/PickingHeader';
import CartTabsBar from '../../components/picking/CartTabsBar';
import CategoryBar from '../../components/picking/CategoryBar';
import CategoryHeader from '../../components/picking/CategoryHeader';
import ProductGrid from '../../components/picking/ProductGrid';
import CartFooter from '../../components/picking/CartFooter';
import { useTheme, useIsDarkMode } from '../../theme';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList, 'Picking'>;

const PickingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  // Catalog selectors
  const categories = useSelector(selectCategories);
  const allItems = useSelector(selectItems);
  const tenant = useSelector(selectTenant);
  const [isCatalogRetrying, setIsCatalogRetrying] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const isCatalogEmpty = categories.length === 0 && allItems.length === 0;

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [newCartModalVisible, setNewCartModalVisible] = useState(false);
  const [createCartModalVisible, setCreateCartModalVisible] = useState(false);

  // Multi-cart selectors
  const activeCart = useSelector(selectActiveCart);
  const cartItems = useSelector(selectActiveCartItems);
  const itemCount = useSelector(selectActiveCartItemCount);
  const totalCartCount = useSelector(selectCartCount);
  const todaysCarts = useSelector(selectTodaysCarts);
  const todaysCartCount = todaysCarts.length;
  const allCarts = useSelector(selectAllCarts);

  // Known default cart names in all supported languages
  const DEFAULT_CART_NAMES = ['Default Cart', 'డిఫాల్ట్ కార్ట్'];

  // Get active cart name for display
  const getTranslatedCartName = useCallback((name: string | undefined): string => {
    if (!name) return t('picking.defaultCart');
    if (DEFAULT_CART_NAMES.includes(name)) {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const activeCartName = getTranslatedCartName(activeCart?.name);

  // Get current date formatted
  const currentDate = useMemo(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  // Create default cart if none exists
  React.useEffect(() => {
    if (totalCartCount === 0) {
      dispatch(createCart({ name: t('picking.defaultCart') }));
    }
  }, [totalCartCount, dispatch, t]);

  // Set initial selected category when categories are loaded
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Retry handler for catalog loading
  const handleCatalogRetry = useCallback(async () => {
    if (!tenant?.slug) {
      setCatalogError('No tenant context. Please re-login.');
      return;
    }
    setIsCatalogRetrying(true);
    setCatalogError(null);
    try {
      const catalogData = await loadOrSeedCatalog(tenant.slug);
      dispatch(initializeCatalog(catalogData));
      if (catalogData.error) {
        setCatalogError(catalogData.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setCatalogError(msg);
    } finally {
      setIsCatalogRetrying(false);
    }
  }, [tenant?.slug, dispatch]);

  // Auto-retry catalog load when PickingScreen mounts with empty catalog
  const hasAutoRetried = useRef(false);
  React.useEffect(() => {
    if (isCatalogEmpty && tenant?.slug && !isCatalogRetrying && !hasAutoRetried.current) {
      hasAutoRetried.current = true;
      handleCatalogRetry();
    }
  }, [isCatalogEmpty, tenant?.slug, isCatalogRetrying, handleCatalogRetry]);

  const handleGoToScan = useCallback(() => {
    navigation.navigate('CameraCapture');
  }, [navigation]);

  const items = useMemo(() => {
    let filtered: typeof allItems;
    if (searchQuery) {
      filtered = allItems.filter((item) => {
        const translatedName = getTranslatedItemName(item);
        return (
          translatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    } else {
      filtered = allItems.filter((item) => item.categoryId === selectedCategory);
    }
    return [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [allItems, selectedCategory, searchQuery]);

  // Get selected category name for header
  const selectedCategoryName = useMemo(() => {
    const category = categories.find((c) => c.id === selectedCategory);
    return category ? getTranslatedCategoryName(category) : '';
  }, [categories, selectedCategory]);

  const handleAddItem = useCallback(
    (item: Item) => {
      dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));
    },
    [dispatch]
  );

  const handleIncrement = useCallback(
    (itemId: string) => {
      dispatch(incrementItemInActiveCart(itemId));
    },
    [dispatch]
  );

  const handleDecrement = useCallback(
    (itemId: string) => {
      dispatch(decrementItemInActiveCart(itemId));
    },
    [dispatch]
  );

  const handleItemPress = useCallback((item: Item) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleModalAddToCart = useCallback(
    (item: Item, quantity: number, displayUnit?: ItemUnit) => {
      dispatch(addItemToActiveCart({ item, quantity, displayUnit }));
    },
    [dispatch]
  );

  const handleGoToManageCarts = useCallback(() => {
    navigation.navigate('ManageCarts');
  }, [navigation]);

  const handleGoToCart = useCallback(() => {
    navigation.navigate('Cart');
  }, [navigation]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  }, []);

  const handleNewCart = useCallback(() => {
    if (itemCount === 0) {
      setCreateCartModalVisible(true);
    } else {
      setNewCartModalVisible(true);
    }
  }, [itemCount]);

  const handleConfirmNewCart = useCallback(() => {
    setNewCartModalVisible(false);
    setCreateCartModalVisible(true);
  }, []);

  const handleCreateCart = useCallback((name: string) => {
    dispatch(createCart({ name }));
    setCreateCartModalVisible(false);
  }, [dispatch]);

  const existingCartNames = useMemo(() => {
    return allCarts.map((cart) => cart.name);
  }, [allCarts]);

  // Render catalog empty state
  if (isCatalogEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBackground} />
        <PickingHeader
          storeName={tenant?.name || 'Store'}
          currentDate={currentDate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScanPress={handleGoToScan}
        />
        <View style={styles.emptyState} testID="catalog-empty-state">
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {t('picking.catalogEmpty', 'Could not load catalog')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {t('picking.catalogEmptySubtitle', 'Check your connection and try again')}
          </Text>
          {catalogError ? (
            <Text style={[styles.errorDetail, { color: theme.colors.error || '#ff6b6b' }]}>
              {catalogError}
            </Text>
          ) : null}
          <Text style={[styles.debugInfo, { color: theme.colors.textSecondary }]}>
            {`Server: ${API_CONFIG.BASE_URL}`}
          </Text>
          <Text style={[styles.debugInfo, { color: theme.colors.textSecondary }]}>
            {`Tenant: ${tenant?.slug || 'not set'}`}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.buttonPrimary, borderRadius: theme.borderRadius.md }]}
            onPress={handleCatalogRetry}
            disabled={isCatalogRetrying}
            testID="catalog-retry-button"
          >
            {isCatalogRetrying ? (
              <ActivityIndicator size="small" color={theme.colors.buttonPrimaryText} />
            ) : (
              <Text style={[styles.retryButtonText, { color: theme.colors.buttonPrimaryText }]}>
                {t('retry', 'Retry')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBackground} />

      {/* Header with Greeting, Store Name, Search and Scan */}
      <PickingHeader
        storeName={tenant?.name || 'Store'}
        currentDate={currentDate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onScanPress={handleGoToScan}
        testID="picking-header"
      />

      {/* Cart Tabs */}
      <View style={{ backgroundColor: theme.colors.headerBackground }}>
        <CartTabsBar
          activeCartName={activeCartName}
          activeCartItemCount={itemCount}
          todaysCartCount={todaysCartCount}
          onCartPress={handleGoToCart}
          onCartListPress={handleGoToManageCarts}
          onNewCartPress={handleNewCart}
          testID="cart-tabs"
        />
      </View>

      {/* Category Bar - hidden during search */}
      {!searchQuery && (
        <View style={{ backgroundColor: theme.colors.surface }}>
          <CategoryBar
            categories={categories}
            selectedCategoryId={selectedCategory}
            onCategorySelect={handleCategorySelect}
            testID="category-bar"
          />
        </View>
      )}

      {/* Category Header or Search Results Header */}
      {!searchQuery ? (
        <CategoryHeader
          categoryName={selectedCategoryName}
          itemCount={items.length}
          testID="category-header"
        />
      ) : (
        <View
          style={[
            styles.searchResultsHeader,
            {
              paddingHorizontal: responsiveStyles.contentPadding,
              paddingVertical: theme.spacing.smd,
            },
          ]}
        >
          <Text style={[styles.searchResultsText, { color: theme.colors.textSecondary }]}>
            {t('picking.resultsFor', { count: items.length, query: searchQuery })}
          </Text>
        </View>
      )}

      {/* Product Grid - 2 column layout */}
      <ProductGrid
        items={items}
        cartItems={cartItems}
        categories={categories}
        onAddItem={handleAddItem}
        onIncrementItem={handleIncrement}
        onDecrementItem={handleDecrement}
        onItemPress={handleItemPress}
        hasCartItems={itemCount > 0}
        testID="product-grid"
      />

      {/* Cart Footer - shows when items in cart */}
      {itemCount > 0 && (
        <CartFooter
          itemCount={itemCount}
          onViewCart={handleGoToCart}
          testID="cart-footer"
        />
      )}

      {/* Modals */}
      <AddQuantityModal
        visible={modalVisible}
        item={selectedItem}
        onClose={handleModalClose}
        onAddToCart={handleModalAddToCart}
      />

      <NewCartConfirmModal
        visible={newCartModalVisible}
        onClose={() => setNewCartModalVisible(false)}
        onConfirm={handleConfirmNewCart}
        itemCount={itemCount}
        testID="new-cart-confirm-modal"
      />

      <CreateCartModal
        visible={createCartModalVisible}
        onClose={() => setCreateCartModalVisible(false)}
        onCreateCart={handleCreateCart}
        existingNames={existingCartNames}
        testID="create-cart-modal"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchResultsHeader: {},
  searchResultsText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  errorDetail: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  debugInfo: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.6,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PickingScreen;
