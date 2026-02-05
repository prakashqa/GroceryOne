/**
 * Picking Screen
 * Main screen for selecting grocery items by category
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../../navigation/BottomTabNavigator';
import { Icon, ListItemAnimator } from '../../components/common';
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
  const styles = useMemo(() => createStyles(theme, responsiveStyles), [theme, responsiveStyles]);

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
  const searchInputRef = useRef<TextInputType>(null);

  // Known default cart names in all supported languages
  const DEFAULT_CART_NAMES = ['Default Cart', 'డిఫాల్ట్ కార్ట్'];

  // Get active cart name for display
  // If the cart name matches any known default cart name, show the translated version
  const getTranslatedCartName = useCallback((name: string | undefined): string => {
    if (!name) return t('picking.defaultCart');
    // Check if the name matches any known default cart name
    if (DEFAULT_CART_NAMES.includes(name)) {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const activeCartName = getTranslatedCartName(activeCart?.name);

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
    console.log('[PickingScreen] Retry: loading catalog for tenant:', tenant.slug, '| API:', API_CONFIG.BASE_URL);
    try {
      const catalogData = await loadOrSeedCatalog(tenant.slug);
      console.log('[PickingScreen] Retry result:', {
        categories: catalogData.categories.length,
        items: catalogData.items.length,
        fromCache: catalogData.fromCache,
        error: catalogData.error,
      });
      dispatch(initializeCatalog(catalogData));
      if (catalogData.error) {
        setCatalogError(catalogData.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PickingScreen] Retry failed:', msg);
      setCatalogError(msg);
    } finally {
      setIsCatalogRetrying(false);
    }
  }, [tenant?.slug, dispatch]);

  // Auto-retry catalog load when PickingScreen mounts with empty catalog
  // This acts as a safety net if App.tsx catalog loading failed or had a timing issue
  const hasAutoRetried = useRef(false);
  React.useEffect(() => {
    if (isCatalogEmpty && tenant?.slug && !isCatalogRetrying && !hasAutoRetried.current) {
      console.log('[PickingScreen] Auto-retry: catalog is empty, tenant available, triggering load...');
      hasAutoRetried.current = true;
      handleCatalogRetry();
    }
  }, [isCatalogEmpty, tenant?.slug, isCatalogRetrying, handleCatalogRetry]);

  // Colors that adapt based on theme for "in cart" state
  const inCartBgColor = theme.colors.inCartBackground;
  const inCartIconBgColor = isDarkMode ? theme.colors.primaryMuted : theme.colors.iconMuted;
  const selectedCategoryBgColor = theme.colors.inCartBackground;

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
    // Sort by sortOrder for consistent display across screens
    return [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [allItems, selectedCategory, searchQuery]);

  const getItemQuantityInCart = useCallback(
    (itemId: string) => {
      const cartItem = cartItems.find((ci) => ci.item.id === itemId);
      return cartItem?.quantity || 0;
    },
    [cartItems]
  );

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

  // Handle New Cart button press
  const handleNewCart = useCallback(() => {
    if (itemCount === 0) {
      // Cart is empty, show create cart modal directly
      setCreateCartModalVisible(true);
    } else {
      // Cart has items, show confirmation modal first
      setNewCartModalVisible(true);
    }
  }, [itemCount]);

  // Handle confirmation to create new cart (after confirming to save current cart)
  const handleConfirmNewCart = useCallback(() => {
    setNewCartModalVisible(false);
    // Show create cart modal to enter name
    setCreateCartModalVisible(true);
  }, []);

  // Handle creating cart with name from CreateCartModal
  const handleCreateCart = useCallback((name: string) => {
    dispatch(createCart({ name }));
    setCreateCartModalVisible(false);
  }, [dispatch]);

  // Get existing cart names for duplicate validation
  const existingCartNames = useMemo(() => {
    return allCarts.map((cart) => cart.name);
  }, [allCarts]);

  const renderCategoryTab = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategory === item.id && !searchQuery;
      return (
        <TouchableOpacity
          style={[
            styles.categoryTab,
            isTablet && { width: 90, marginHorizontal: theme.spacing.smd },
            isSelected && styles.categoryTabSelected,
          ]}
          onPress={() => handleCategorySelect(item.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.categoryIconContainer,
              { backgroundColor: theme.colors.background },
              !isTablet && { width: 50, height: 50, marginBottom: theme.spacing.xs + 2 },
              isTablet && { width: 70, height: 70, borderRadius: theme.borderRadius.lg + 4 },
              isSelected && {
                backgroundColor: selectedCategoryBgColor,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text style={[styles.categoryIcon, !isTablet && { fontSize: theme.typography.fontSize.xxl }, isTablet && { fontSize: theme.typography.fontSize.xxxl + 2 }]}>{item.icon}</Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              { color: theme.colors.textSecondary },
              isTablet && { fontSize: theme.typography.fontSize.lg },
              isSelected && { color: theme.colors.primary, fontWeight: theme.typography.fontWeight.bold },
            ]}
            numberOfLines={1}
          >
            {getTranslatedCategoryName(item).split(' ')[0].split(',')[0]}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory, searchQuery, handleCategorySelect, theme, responsiveStyles, styles, selectedCategoryBgColor, isTablet]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const quantityInCart = getItemQuantityInCart(item.id);
      const isInCart = quantityInCart > 0;

      return (
        <View testID={`item-row-${item.id}`}>
          <View
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.surface },
              isTablet && { padding: theme.spacing.md, marginBottom: theme.spacing.md },
              isInCart && {
                backgroundColor: inCartBgColor,
                borderWidth: 1.5,
                borderColor: theme.colors.inCartBorder,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.itemPressable}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
              testID={`item-pressable-${item.id}`}
            >
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.itemIconBg,
                    { backgroundColor: theme.colors.background },
                    isTablet && { width: 64, height: 64, borderRadius: theme.borderRadius.lg },
                    isInCart && { backgroundColor: inCartIconBgColor },
                  ]}
                >
                  <Text style={[styles.itemIcon, isTablet && { fontSize: theme.typography.fontSize.xxxl }]}>
                    {categories.find((c) => c.id === item.categoryId)?.icon || '📦'}
                  </Text>
                </View>
              </View>

              <View style={styles.itemCenter}>
                <Text
                  style={[styles.itemName, { color: theme.colors.text }, isTablet && { fontSize: theme.typography.fontSize['2xl'], marginBottom: theme.spacing.xs + 2 }]}
                  numberOfLines={1}
                >
                  {getTranslatedItemName(item)}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemUnit, { color: theme.colors.textLight }, isTablet && { fontSize: theme.typography.fontSize.lg }]}>
                    {item.defaultQuantity} {item.unit}
                  </Text>
                  {isInCart && (
                    <View style={[styles.inCartBadge, { backgroundColor: theme.colors.inCartBadge }, isTablet && { paddingHorizontal: theme.spacing.sm, paddingVertical: 3 }]}>
                      <Text style={[styles.inCartText, { color: theme.colors.buttonPrimaryText }, isTablet && { fontSize: theme.typography.fontSize.sm }]}>{t('picking.inCart')}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.itemRight}>
              {isInCart ? (
                <View style={[styles.quantityControls, { backgroundColor: theme.colors.background }, isTablet && { padding: theme.spacing.xs + 2 }]}>
                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: theme.colors.surface }, isTablet && { width: responsiveStyles.touchTargetMinSize, height: responsiveStyles.touchTargetMinSize, borderRadius: theme.borderRadius.sm }]}
                    onPress={() => handleDecrement(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quantityBtnText, { color: theme.colors.text }, isTablet && { fontSize: theme.typography.fontSize.xxl }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.quantityValue, { color: theme.colors.text }, isTablet && { fontSize: theme.typography.fontSize['2xl'], minWidth: responsiveStyles.touchTargetMinSize }]}>
                    {quantityInCart}
                  </Text>
                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: theme.colors.buttonPrimary }, isTablet && { width: responsiveStyles.touchTargetMinSize, height: responsiveStyles.touchTargetMinSize, borderRadius: theme.borderRadius.sm }]}
                    onPress={() => handleIncrement(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quantityBtnText, { color: theme.colors.buttonPrimaryText }, isTablet && { fontSize: theme.typography.fontSize.xxl }]}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.colors.buttonPrimary }, isTablet && { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.md }]}
                  onPress={() => handleAddItem(item)}
                  activeOpacity={0.7}
                  testID={`add-button-${item.id}`}
                >
                  <Text style={[styles.addButtonText, { color: theme.colors.buttonPrimaryText }, isTablet && { fontSize: theme.typography.fontSize.xl }]}>{t('picking.add')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [getItemQuantityInCart, handleAddItem, handleIncrement, handleDecrement, handleItemPress, theme, responsiveStyles, styles, inCartBgColor, inCartIconBgColor, t, categories, isTablet]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBackground} />

      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }, !isTablet && { paddingBottom: theme.spacing.smd }, isTablet && { paddingBottom: theme.spacing.smd }]}>
        <SafeAreaView edges={['top']}>
          <View style={[styles.headerContent, { paddingHorizontal: responsiveStyles.contentPadding }]}>
            <View style={[styles.headerTop, !isTablet && { marginBottom: theme.spacing.smd }, isTablet && { marginBottom: theme.spacing.sm }]}>
              <View style={styles.headerLeft}>
                <Text style={[styles.headerGreeting, { color: theme.colors.headerTextMuted }]}>{t('picking.greeting')}</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={[styles.scanIconBtn, { backgroundColor: theme.colors.buttonSecondary }]}
                  onPress={handleGoToScan}
                  activeOpacity={0.7}
                  testID="scan-button"
                >
                  <View style={styles.scanIconInner}>
                    <Icon name="camera" size="md" color="primary" />
                  </View>
                  <View style={[styles.scanCorner, styles.scanCornerTL]} />
                  <View style={[styles.scanCorner, styles.scanCornerTR]} />
                  <View style={[styles.scanCorner, styles.scanCornerBL]} />
                  <View style={[styles.scanCorner, styles.scanCornerBR]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cart Navigation Buttons */}
            <View style={[styles.cartNavButtons, !isTablet && { marginBottom: theme.spacing.smd }, isTablet && { marginBottom: theme.spacing.sm }]} testID="cart-nav-buttons">
              {/* Active Cart Button - Primary */}
              <TouchableOpacity
                style={[styles.activeCartBtn, { backgroundColor: theme.colors.buttonSecondary }, !isTablet && { paddingVertical: theme.spacing.smd }]}
                onPress={handleGoToCart}
                activeOpacity={0.8}
                testID="active-cart-btn"
              >
                <Text style={styles.activeCartIcon}>🛒</Text>
                <Text
                  style={[styles.activeCartText, { color: theme.colors.buttonSecondaryText }]}
                  numberOfLines={1}
                  testID="active-cart-name"
                >
                  {activeCartName}
                </Text>
                <View
                  style={[styles.activeCartBadge, { backgroundColor: theme.colors.buttonPrimary }]}
                  testID="active-cart-badge"
                >
                  <Text style={[styles.activeCartBadgeText, { color: theme.colors.buttonPrimaryText }]} testID="active-cart-badge-text">
                    {itemCount}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Cart List Button - Secondary */}
              <TouchableOpacity
                style={[styles.cartListBtn, { borderColor: theme.colors.borderMuted }, !isTablet && { paddingVertical: theme.spacing.smd }]}
                onPress={handleGoToManageCarts}
                activeOpacity={0.8}
                testID="cart-list-btn"
              >
                <Text style={styles.cartListIcon}>📋</Text>
                <Text style={[styles.cartListText, { color: theme.colors.headerText }]}>{t('picking.cartList')}</Text>
                {todaysCartCount > 0 && (
                  <View
                    style={[styles.cartListBadge, { backgroundColor: theme.colors.warning }]}
                    testID="cart-list-badge"
                  >
                    <Text style={[styles.cartListBadgeText, { color: theme.colors.textInverse }]} testID="cart-list-badge-text">
                      {todaysCartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* New Cart Button */}
              <TouchableOpacity
                style={[styles.newCartBtn, { backgroundColor: theme.colors.buttonPrimary }, !isTablet && { paddingVertical: theme.spacing.smd }]}
                onPress={handleNewCart}
                activeOpacity={0.8}
                testID="new-cart-btn"
              >
                <Text style={[styles.newCartBtnText, { color: theme.colors.buttonPrimaryText }]}>+ {t('picking.newCart')}</Text>
              </TouchableOpacity>
            </View>

            <Pressable
              style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceOverlay }, !isTablet && { paddingVertical: theme.spacing.smd, minHeight: responsiveStyles.touchTargetMinSize }]}
              onPress={() => searchInputRef.current?.focus()}
            >
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: theme.colors.headerText }]}
                placeholder={t('picking.searchItems')}
                placeholderTextColor={theme.colors.headerTextMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={[styles.searchClear, { color: theme.colors.headerTextMuted }]}>✕</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {!searchQuery && (
        <View style={[styles.categoriesWrapper, { backgroundColor: theme.colors.surface }, !isTablet && { paddingVertical: theme.spacing.smd }, isTablet && { paddingVertical: theme.spacing.smd }]}>
          <FlatList
            horizontal
            data={categories}
            renderItem={renderCategoryTab}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {searchQuery && (
        <View style={[styles.searchResultsHeader, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.searchResultsText, { color: theme.colors.textSecondary }]}>
            {t('picking.resultsFor', { count: items.length, query: searchQuery })}
          </Text>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.itemsList,
          { paddingHorizontal: responsiveStyles.contentPadding },
          itemCount > 0 && styles.itemsListWithCart,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isCatalogEmpty ? (
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
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('picking.noItemsFound')}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                {t('picking.trySearching')}
              </Text>
            </View>
          )
        }
      />

      {itemCount > 0 && (
        <View style={[styles.cartButtonContainer, !isTablet && { padding: theme.spacing.smd, paddingBottom: theme.spacing.md }, isTablet && { paddingBottom: theme.spacing.xl }]}>
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: theme.colors.buttonPrimary }, !isTablet && { padding: theme.spacing.smd, borderRadius: theme.borderRadius.md }]}
            onPress={handleGoToCart}
            activeOpacity={0.9}
          >
            <View style={styles.cartButtonLeft}>
              <View style={[styles.cartButtonBadge, { backgroundColor: theme.colors.buttonSecondary }, !isTablet && { paddingHorizontal: theme.spacing.sm, paddingVertical: 3 }]}>
                <Text style={[styles.cartButtonBadgeText, { color: theme.colors.buttonSecondaryText }, !isTablet && { fontSize: theme.typography.fontSize.md }]}>
                  {itemCount}
                </Text>
              </View>
              <Text style={[styles.cartButtonLabel, { color: theme.colors.headerTextMuted }, !isTablet && { fontSize: theme.typography.fontSize.sm * 1.1 }]}>{t('picking.items')}</Text>
            </View>
            <Text style={[styles.cartButtonText, { color: theme.colors.buttonPrimaryText }, !isTablet && { fontSize: theme.typography.fontSize.lg }]}>{t('picking.viewCart')}</Text>
            <Text style={[styles.cartButtonArrow, { color: theme.colors.buttonPrimaryText }, !isTablet && { fontSize: theme.typography.fontSize.xl }]}>→</Text>
          </TouchableOpacity>
        </View>
      )}

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

const createStyles = (theme: any, responsiveStyles: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingBottom: theme.spacing.md,
      borderBottomLeftRadius: theme.borderRadius.xl,
      borderBottomRightRadius: theme.borderRadius.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: theme.spacing.sm,
      elevation: 8,
      zIndex: 10,
    },
    headerContent: {
      // paddingHorizontal applied dynamically via responsiveStyles
      paddingTop: theme.spacing.sm,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    headerLeft: {
      flex: 1,
      marginRight: theme.spacing.smd,
    },
    headerGreeting: {
      fontSize: theme.typography.fontSize.md,
      marginBottom: theme.spacing.xs,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: theme.letterSpacing.tight,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smd,
    },
    scanIconBtn: {
      width: responsiveStyles.touchTargetMinSize,
      height: responsiveStyles.touchTargetMinSize,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    scanIconInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanCorner: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderColor: theme.colors.surfaceOverlay,
    },
    scanCornerTL: {
      top: theme.spacing.xs,
      left: theme.spacing.xs,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderTopLeftRadius: theme.borderRadius.xs,
    },
    scanCornerTR: {
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderTopRightRadius: theme.borderRadius.xs,
    },
    scanCornerBL: {
      bottom: theme.spacing.xs,
      left: theme.spacing.xs,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      borderBottomLeftRadius: theme.borderRadius.xs,
    },
    scanCornerBR: {
      bottom: theme.spacing.xs,
      right: theme.spacing.xs,
      borderBottomWidth: 2,
      borderRightWidth: 2,
      borderBottomRightRadius: theme.borderRadius.xs,
    },
    cartNavButtons: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.smd,
    },
    activeCartBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.smd,
      paddingHorizontal: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: theme.spacing.xs,
      elevation: 3,
    },
    activeCartIcon: {
      fontSize: theme.typography.fontSize.lg,
      marginRight: 6,
    },
    activeCartText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
    },
    activeCartBadge: {
      marginLeft: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      minWidth: theme.spacing.lg,
      alignItems: 'center',
    },
    activeCartBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
    },
    cartListBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.smd,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    cartListIcon: {
      fontSize: theme.typography.fontSize.lg,
      marginRight: 6,
    },
    cartListText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    cartListBadge: {
      marginLeft: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      minWidth: theme.spacing.lg,
      alignItems: 'center',
    },
    cartListBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      // color is set dynamically via theme.colors.textInverse
    },
    newCartBtn: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.smd,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: theme.spacing.xs,
      elevation: 3,
    },
    newCartBtnText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.smd,
      minHeight: theme.buttonHeights.md,
    },
    searchIcon: {
      fontSize: theme.typography.fontSize.lg,
      marginRight: theme.spacing.smd,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.lg,
      // color is set dynamically via theme.colors.headerText
      paddingVertical: 0,
      paddingHorizontal: 0,
      minHeight: 28,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    searchClear: {
      fontSize: theme.typography.fontSize.lg,
      // color is set dynamically via theme.colors.headerTextMuted
      padding: theme.spacing.xs,
    },
    categoriesWrapper: {
      paddingVertical: theme.spacing.md,
      marginTop: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    categoriesList: {
      paddingHorizontal: theme.spacing.md,
    },
    categoryTab: {
      alignItems: 'center',
      marginHorizontal: 6,
      width: 72,
    },
    categoryTabSelected: {},
    categoryIconContainer: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryIcon: {
      fontSize: theme.typography.fontSize.xxl,
    },
    categoryName: {
      fontSize: theme.typography.fontSize.sm,
      textAlign: 'center',
      fontWeight: theme.typography.fontWeight.medium,
    },
    searchResultsHeader: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.smd,
    },
    searchResultsText: {
      fontSize: theme.typography.fontSize.md,
    },
    itemsList: {
      // paddingHorizontal applied dynamically via responsiveStyles
      paddingTop: theme.spacing.smd,
      paddingBottom: theme.spacing.xl,
    },
    itemsListWithCart: {
      paddingBottom: 80,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.smd,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: theme.spacing.sm,
      elevation: 3,
    },
    itemPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    itemLeft: {
      marginRight: theme.spacing.md,
    },
    itemIconBg: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIcon: {
      fontSize: theme.typography.fontSize.xxl,
    },
    itemCenter: {
      flex: 1,
      marginRight: theme.spacing.smd,
    },
    itemName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.xs,
    },
    itemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemUnit: {
      fontSize: theme.typography.fontSize.sm,
    },
    inCartBadge: {
      borderRadius: theme.borderRadius.xs,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: theme.spacing.sm,
    },
    inCartText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      // Color applied dynamically via style prop (already using theme.colors.buttonPrimaryText)
    },
    itemRight: {
      alignItems: 'flex-end',
    },
    addButton: {
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.smd,
    },
    addButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      // Color applied dynamically via style prop (already using theme.colors.buttonPrimaryText)
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.xs,
    },
    quantityBtn: {
      width: theme.buttonHeights.sm,
      height: theme.buttonHeights.sm,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    quantityBtnText: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: 22,
    },
    quantityValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      minWidth: theme.buttonHeights.sm,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSize.md,
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
    cartButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      backgroundColor: 'transparent',
    },
    cartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: theme.spacing.smd,
      elevation: 8,
    },
    cartButtonLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cartButtonBadge: {
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.smd,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.sm,
      // backgroundColor applied dynamically via style prop (theme.colors.buttonSecondary)
    },
    cartButtonBadgeText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
    },
    cartButtonLabel: {
      fontSize: theme.typography.fontSize.md * 1.1,
      // color is set dynamically via theme.colors.headerTextMuted
    },
    cartButtonText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      // color is set dynamically via theme.colors.buttonPrimaryText
    },
    cartButtonArrow: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.semibold,
      // color is set dynamically via theme.colors.buttonPrimaryText
    },
  });

export default PickingScreen;
