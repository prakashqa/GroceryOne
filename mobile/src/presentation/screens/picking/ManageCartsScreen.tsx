/**
 * ManageCartsScreen
 * Screen for managing multiple carts with polished UI
 * Default view shows all carts with quick filters for Today, Yesterday, and date picker
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

import {
  selectAllCarts,
  selectActiveCartId,
  selectTodaysCarts,
  selectYesterdaysCarts,
  selectCartsByDateRange,
  selectCartsSortedByDate,
  createCart,
  setActiveCart,
  deleteCart,
  renameCart,
} from '../../../store/slices/multiCartSlice';
import { ManagedCart } from '../../../domain/types/picking';
import CartListItem from '../../components/picking/CartListItem';
import CreateCartModal from '../../components/picking/CreateCartModal';
import RenameCartModal from '../../components/picking/RenameCartModal';
import { DateFilterBar, DateFilter } from '../../components/picking/DateFilterBar';
import { useTheme } from '../../theme';
import { Button, HeaderBar, FAB } from '../../components/common';

type RootStackParamList = {
  Picking: undefined;
  ManageCarts: undefined;
  Cart: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ManageCartsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const allCarts = useSelector(selectAllCarts);
  const activeCartId = useSelector(selectActiveCartId);
  // Use shallowEqual to prevent unnecessary rerenders — selectTodaysCarts and
  // selectYesterdaysCarts return new array references on every render
  const todaysCarts = useSelector(selectTodaysCarts, shallowEqual);
  const yesterdaysCarts = useSelector(selectYesterdaysCarts, shallowEqual);
  const sortedCarts = useSelector(selectCartsSortedByDate);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [selectedCartForRename, setSelectedCartForRename] = useState<ManagedCart | null>(null);

  // Date filter state - default to 'all' to show complete cart history
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get carts based on date filter
  const dateFilteredCarts = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return todaysCarts;
      case 'yesterday':
        return yesterdaysCarts;
      case 'custom': {
        // Get start and end of selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        return allCarts.filter((cart) => {
          const cartTime = new Date(cart.createdAt).getTime();
          return cartTime >= startOfDay.getTime() && cartTime <= endOfDay.getTime();
        });
      }
      case 'all':
      default:
        return sortedCarts;
    }
  }, [dateFilter, todaysCarts, yesterdaysCarts, allCarts, sortedCarts, selectedDate]);

  // Filter carts based on search query (applied on top of date filter)
  const filteredCarts = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateFilteredCarts;
    }
    const query = searchQuery.toLowerCase().trim();
    return dateFilteredCarts.filter((cart) =>
      cart.name.toLowerCase().includes(query)
    );
  }, [dateFilteredCarts, searchQuery]);

  // Get existing cart names for duplicate validation
  const existingCartNames = useMemo(
    () => allCarts.map((cart) => cart.name),
    [allCarts]
  );

  // Known default cart names in all supported languages
  const DEFAULT_CART_NAMES = ['Default Cart', 'డిఫాల్ట్ కార్ట్'];

  // Translate default cart name if it matches any known default cart name
  const getTranslatedCartName = useCallback((name: string): string => {
    if (DEFAULT_CART_NAMES.includes(name)) {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const handleCartPress = useCallback(
    (cartId: string) => {
      dispatch(setActiveCart(cartId));
      navigation.navigate('Picking');
    },
    [dispatch, navigation]
  );

  const handleCartLongPress = useCallback(
    (cartId: string) => {
      dispatch(setActiveCart(cartId));
    },
    [dispatch]
  );

  const handleCreateCart = useCallback(
    (name: string) => {
      dispatch(createCart({ name }));
      setIsCreateModalVisible(false);
      navigation.navigate('Picking');
    },
    [dispatch, navigation]
  );

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalVisible(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalVisible(false);
  }, []);

  const handleEditCart = useCallback(
    (cartId: string) => {
      const cart = allCarts.find((c) => c.id === cartId);
      if (cart) {
        setSelectedCartForRename(cart);
        setIsRenameModalVisible(true);
      }
    },
    [allCarts]
  );

  const handleCloseRenameModal = useCallback(() => {
    setIsRenameModalVisible(false);
    setSelectedCartForRename(null);
  }, []);

  const handleRenameCart = useCallback(
    (cartId: string, newName: string) => {
      dispatch(renameCart({ cartId, name: newName }));
    },
    [dispatch]
  );

  const handleDeleteCart = useCallback(
    (cartId: string) => {
      const cart = allCarts.find((c) => c.id === cartId);
      if (!cart) return;

      Alert.alert(
        t('manageCarts.deleteCart'),
        t('manageCarts.deleteConfirm', { name: getTranslatedCartName(cart.name) }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: () => {
              dispatch(deleteCart(cartId));
            },
          },
        ]
      );
    },
    [allCarts, dispatch, t, getTranslatedCartName]
  );

  // Date filter handlers
  const handleDateFilterChange = useCallback((filter: DateFilter) => {
    setDateFilter(filter);
  }, []);

  const handleDatePick = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const handleDateChange = useCallback(
    (_event: unknown, date?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (date) {
        setSelectedDate(date);
        setDateFilter('custom');
      }
    },
    []
  );

  const renderCartItem = useCallback(
    ({ item }: { item: ManagedCart }) => (
      <CartListItem
        cart={item}
        isActive={item.id === activeCartId}
        onPress={handleCartPress}
        onLongPress={handleCartLongPress}
        onEdit={handleEditCart}
        onDelete={handleDeleteCart}
        testID={`cart-${item.id}`}
        numColumns={responsiveStyles.listColumns}
      />
    ),
    [activeCartId, handleCartPress, handleCartLongPress, handleEditCart, handleDeleteCart, responsiveStyles.listColumns]
  );

  // Get empty state message based on date filter
  const getEmptyMessage = useCallback(() => {
    // If there are no carts at all, show the generic message
    if (allCarts.length === 0) {
      return {
        title: t('manageCarts.noCartsYet'),
        subtitle: t('manageCarts.createFirstCart'),
        showButton: true,
      };
    }

    // If filtered by date and no carts found for that date
    switch (dateFilter) {
      case 'today':
        return {
          title: t('manageCarts.noCartsToday'),
          subtitle: t('manageCarts.createFirstCart'),
          showButton: true,
        };
      case 'yesterday':
        return {
          title: t('manageCarts.noCartsYesterday'),
          subtitle: '',
          showButton: false,
        };
      case 'custom':
        return {
          title: t('manageCarts.noCartsForDate'),
          subtitle: '',
          showButton: false,
        };
      default:
        return {
          title: t('manageCarts.noCartsYet'),
          subtitle: t('manageCarts.createFirstCart'),
          showButton: true,
        };
    }
  }, [allCarts.length, dateFilter, t]);

  const renderEmptyState = useCallback(
    () => {
      const emptyMessage = getEmptyMessage();
      return (
        <View style={[styles.emptyContainer, { paddingHorizontal: theme.spacing.xl + theme.spacing.sm }]}>
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: theme.colors.iconMuted,
                borderRadius: theme.borderRadius.full,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>🛒</Text>
          </View>
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.smd,
                letterSpacing: theme.letterSpacing.snug,
              },
            ]}
          >
            {emptyMessage.title}
          </Text>
          {emptyMessage.subtitle ? (
            <Text
              style={[
                styles.emptySubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.lg,
                  marginBottom: theme.spacing.xl,
                  lineHeight: theme.spacing.lg,
                },
              ]}
            >
              {emptyMessage.subtitle}
            </Text>
          ) : null}
          {emptyMessage.showButton && (
            <Button
              title={t('manageCarts.createCart')}
              variant="primary"
              size="lg"
              icon="+"
              onPress={handleOpenCreateModal}
            />
          )}
        </View>
      );
    },
    [theme, handleOpenCreateModal, t, getEmptyMessage]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderHeader = useCallback(
    () => (
      <HeaderBar
        title={t('manageCarts.title')}
        onBack={handleGoBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('manageCarts.searchCarts')}
        testID="manage-carts-header"
      />
    ),
    [searchQuery, handleGoBack, t]
  );

  const renderFooter = useCallback(
    () => (
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: responsiveStyles.contentPadding,
          },
        ]}
      >
        <Text
          style={[
            styles.footerText,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
            },
          ]}
        >
          {t('manageCarts.cartsTotal', { count: filteredCarts.length })}
        </Text>
      </View>
    ),
    [filteredCarts.length, theme, responsiveStyles, t]
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      edges={['top']}
    >
      {renderHeader()}

      <View style={[styles.listContainer, { paddingTop: theme.spacing.md }]}>
        {/* Date Filter Bar */}
        <DateFilterBar
          selectedFilter={dateFilter}
          selectedDate={selectedDate}
          onFilterChange={handleDateFilterChange}
          onDatePick={handleDatePick}
          showAll={true}
          contentPadding={Math.max(responsiveStyles.contentPadding, 16)}
          testID="date-filter-bar"
        />

        <FlatList
          data={filteredCarts}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          numColumns={responsiveStyles.listColumns}
          key={responsiveStyles.listColumns} // Force re-render when columns change
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: Math.max(responsiveStyles.contentPadding, 16) },
            filteredCarts.length === 0 && styles.listContentEmpty,
          ]}
          columnWrapperStyle={responsiveStyles.listColumns > 1 ? { gap: responsiveStyles.gridGap } : undefined}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {filteredCarts.length > 0 && renderFooter()}

      {/* FAB */}
      <FAB
        onPress={handleOpenCreateModal}
        accessibilityLabel="Create new cart"
        testID="create-cart-fab"
      />

      {/* Create Cart Modal */}
      <CreateCartModal
        visible={isCreateModalVisible}
        onClose={handleCloseCreateModal}
        onCreateCart={handleCreateCart}
        existingNames={existingCartNames}
        testID="create-cart-modal"
      />

      {/* Rename Cart Modal */}
      {selectedCartForRename && (
        <RenameCartModal
          visible={isRenameModalVisible}
          currentName={selectedCartForRename.name}
          cartId={selectedCartForRename.id}
          onClose={handleCloseRenameModal}
          onRename={handleRenameCart}
          existingNames={existingCartNames}
          testID="rename-cart-modal"
        />
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          testID="date-picker"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header is now handled by the HeaderBar component
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
  },
  footerText: {
    textAlign: 'center',
  },
});

export default ManageCartsScreen;
