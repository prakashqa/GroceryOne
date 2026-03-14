/**
 * DashboardScreen
 * Main merchant dashboard with business overview and quick actions
 */

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import {
  SummaryCard,
  QuickActionsGrid,
  ActiveOrderPreview,
  RecentOrdersList,
  QuickAction,
  RecentCart,
} from '../../components/dashboard';
import { FadeInView } from '../../components/common';
import CreateOrderModal from '../../components/picking/CreateOrderModal';
import {
  selectTodaysMetrics,
  selectCartsByStatus,
  selectActiveCart,
  selectActiveCartItemCount,
  selectActiveCartCategoryCount,
  selectActiveCartTotalQuantity,
  selectActiveCartGrandTotal,
  selectCartsSortedByDate,
  selectAllCarts,
  createCart,
  setActiveCart,
} from '../../../store/slices/multiCartSlice';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { formatUserRole } from '../../../utils/formatters/userFormatters';
import { calculateItemTotal } from '../../../domain/utils/priceUtils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Navigation types
type DashboardStackParamList = {
  Dashboard: undefined;
  Picking: undefined;
  Order: undefined;
  CategoryManagement: undefined;
  ItemManagement: { categoryId: string };
  CameraCapture: undefined;
  ScanReview: undefined;
  Reports: undefined;
};

type TabParamList = {
  DashboardTab: undefined;
  OrdersTab: undefined;
  SettingsTab: undefined;
};

type DashboardNavigationProp = NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'> & {
  navigate: (screen: keyof TabParamList | keyof DashboardStackParamList) => void;
};

interface DashboardScreenProps {
  testID?: string;
}

/**
 * Format currency as INR
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ testID }) => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t, i18n } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const [refreshing, setRefreshing] = useState(false);
  const [isCreateCartModalVisible, setIsCreateCartModalVisible] = useState(false);

  // Safe area insets for proper spacing
  const insets = useSafeAreaInsets();

  /**
   * Format relative time from timestamp (localized)
   */
  const getRelativeTime = useCallback((timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays === 1) return t('time.yesterday');
    return t('time.daysAgo', { count: diffDays });
  }, [t]);

  /**
   * Get time-based greeting (localized)
   */
  const getGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  }, [t]);

  // Header animation
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFadeAnim, headerSlideAnim, theme.animation.normal]);

  // Redux selectors
  const tenant = useSelector(selectTenant);
  const currentUser = useSelector(selectCurrentUser);
  const todaysMetrics = useSelector(selectTodaysMetrics);
  const statusCounts = useSelector(selectCartsByStatus);
  const activeCart = useSelector(selectActiveCart);
  const activeCartItemCount = useSelector(selectActiveCartItemCount);
  const activeCartCategoryCount = useSelector(selectActiveCartCategoryCount);
  const activeCartQuantity = useSelector(selectActiveCartTotalQuantity);
  const activeCartTotal = useSelector(selectActiveCartGrandTotal);
  const allSortedCarts = useSelector(selectCartsSortedByDate);
  const recentCarts = useMemo(() => allSortedCarts.slice(0, 10), [allSortedCarts]);
  const allCarts = useSelector(selectAllCarts);

  // Derive user role display string for header
  const userRoleDisplay = currentUser?.role
    ? ` \u00B7 ${formatUserRole(currentUser.role)}`
    : '';

  // Get existing cart names for validation in CreateCartModal
  const existingCartNames = useMemo(() => {
    return allCarts.map((cart: any) => cart.name);
  }, [allCarts]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Metrics are derived from Redux state, so they auto-update
    // Small timeout for visual feedback
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Create Cart Modal handlers
  const handleOpenCreateCartModal = useCallback(() => {
    setIsCreateCartModalVisible(true);
  }, []);

  const handleCloseCreateCartModal = useCallback(() => {
    setIsCreateCartModalVisible(false);
  }, []);

  const handleCreateCart = useCallback(
    (name: string) => {
      dispatch(createCart({ name }));
      setIsCreateCartModalVisible(false);
      navigation.navigate('Picking');
    },
    [dispatch, navigation]
  );

  // Quick actions configuration - task-based actions for command center approach
  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    // Scan List (OCR)
    actions.push({
      id: 'scan-list',
      title: t('dashboard.scanList'),
      subtitle: t('dashboard.ocrFromPaper'),
      icon: 'camera',
      onPress: () => navigation.navigate('CameraCapture'),
    });

    // Reports & Analytics
    actions.push({
      id: 'reports',
      title: t('dashboard.reports', 'Reports'),
      subtitle: t('dashboard.viewAnalytics', 'Sales & analytics'),
      icon: 'report',
      onPress: () => navigation.navigate('Reports'),
    });

    // Manage Categories
    actions.push({
      id: 'manage-categories',
      title: t('manageCategories.title'),
      subtitle: t('manageCategories.categories'),
      icon: 'list',
      onPress: () => navigation.navigate('CategoryManagement'),
    });

    // Manage Items
    actions.push({
      id: 'manage-items',
      title: t('dashboard.manageItems'),
      subtitle: t('dashboard.items'),
      icon: 'box',
      onPress: () => navigation.navigate('ItemManagement'),
    });

    // New Cart (PRIMARY - full width at bottom for thumb accessibility)
    actions.push({
      id: 'new-cart',
      title: t('dashboard.newCart'),
      subtitle: t('dashboard.startPicking'),
      icon: 'cart',
      isPrimary: true,
      onPress: handleOpenCreateCartModal,
    });

    return actions;
  }, [t, navigation, handleOpenCreateCartModal]);

  // Transform recent carts to RecentCart format
  const recentCartsData: RecentCart[] = useMemo(() => {
    return recentCarts.map((cart: any) => {
      const isPaid = cart.status === 'paid';
      const calculatedTotal = cart.items.reduce(
        (sum: number, item: any) =>
          sum + calculateItemTotal(item.priceSnapshot, item.quantity),
        0
      );
      // For paid carts, use the recorded paidAmount instead of recalculating from items
      const totalAmount = isPaid && cart.paidAmount ? cart.paidAmount : calculatedTotal;

      return {
        id: cart.id,
        name: cart.name,
        status: cart.status,
        totalAmount,
        timeAgo: getRelativeTime(cart.updatedAt),
        itemCount: isPaid && cart.paidItemCount ? cart.paidItemCount : cart.items.length,
      };
    });
  }, [recentCarts, getRelativeTime]);

  // Navigation handlers
  const handleContinueCart = useCallback(() => {
    navigation.navigate('Picking');
  }, [navigation]);

  const handleCartPress = useCallback((cartId: string) => {
    // Set the selected cart as active and navigate to Cart screen
    dispatch(setActiveCart(cartId));
    navigation.navigate('Order');
  }, [dispatch, navigation]);

  // Background color
  const backgroundColor = theme.colors.background;

  // Get current date string (locale-aware)
  const dateLocale = i18n.language === 'te' ? 'te-IN' : 'en-US';
  const todayString = new Date().toLocaleDateString(dateLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]} testID={testID}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* Header */}
      <Animated.View
        style={[
          {
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
            paddingHorizontal: responsiveStyles.contentPadding,
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium }]}>
              {getGreeting()}
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.xxl, fontWeight: theme.typography.fontWeight.bold, letterSpacing: theme.letterSpacing.tight }}>
              {t('dashboard.title')}
            </Text>
            {tenant && (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginTop: 2,
                }}
                testID="dashboard-store-name"
              >
                {tenant.name}{userRoleDisplay}
              </Text>
            )}
          </View>
          <View style={{ paddingHorizontal: theme.spacing.smd, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.borderRadius.sm, backgroundColor: isDarkMode ? theme.colors.card : theme.colors.surface }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>
              {todayString}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: responsiveStyles.contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
        testID={`${testID || 'dashboard'}-scroll`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Today's Overview */}
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.smd }}>
            {t('dashboard.todaysOverview')}
          </Text>
          {/* On tablets, show all 4 cards in a single row; on phones, 2 rows of 2 */}
          {isTablet ? (
            <View style={[styles.summaryCardsRow, { gap: responsiveStyles.gridGap, marginBottom: theme.spacing.smd }]}>
              <SummaryCard
                title={t('dashboard.cartsCreated')}
                value={todaysMetrics.cartsCreated}
                icon="🛒"
                colorVariant="primary"
                animationDelay={0}
              />
              <SummaryCard
                title={t('dashboard.itemsPicked')}
                value={todaysMetrics.itemsPicked}
                icon="📦"
                colorVariant="info"
                animationDelay={50}
              />
              <SummaryCard
                title={t('dashboard.totalQuantity')}
                value={todaysMetrics.totalQuantity.toFixed(1)}
                icon="📊"
                colorVariant="warning"
                animationDelay={100}
              />
              <SummaryCard
                title={t('dashboard.salesAmount')}
                value={formatCurrency(todaysMetrics.totalSales).replace('₹', '')}
                subtitle="₹"
                icon="💰"
                colorVariant="success"
                animationDelay={150}
              />
            </View>
          ) : (
            <>
              <View style={[styles.summaryCardsRow, { gap: theme.spacing.smd, marginBottom: theme.spacing.smd }]}>
                <SummaryCard
                  title={t('dashboard.cartsCreated')}
                  value={todaysMetrics.cartsCreated}
                  icon="🛒"
                  colorVariant="primary"
                  animationDelay={0}
                />
                <SummaryCard
                  title={t('dashboard.itemsPicked')}
                  value={todaysMetrics.itemsPicked}
                  icon="📦"
                  colorVariant="info"
                  animationDelay={50}
                />
              </View>
              <View style={[styles.summaryCardsRow, { gap: theme.spacing.smd, marginBottom: theme.spacing.smd }]}>
                <SummaryCard
                  title={t('dashboard.totalQuantity')}
                  value={todaysMetrics.totalQuantity.toFixed(1)}
                  icon="📊"
                  colorVariant="warning"
                  animationDelay={100}
                />
                <SummaryCard
                  title={t('dashboard.salesAmount')}
                  value={formatCurrency(todaysMetrics.totalSales).replace('₹', '')}
                  subtitle="₹"
                  icon="💰"
                  colorVariant="success"
                  animationDelay={150}
                />
              </View>
            </>
          )}
        </View>

        {/* Active Cart Preview */}
        {activeCart && (
          <View style={{ marginTop: theme.spacing.md }}>
            <ActiveOrderPreview
              cartName={activeCart.name}
              categoryCount={activeCartCategoryCount}
              itemCount={activeCartItemCount}
              totalQuantity={activeCartQuantity}
              totalAmount={activeCartTotal}
              lastUpdated={getRelativeTime(activeCart.updatedAt)}
              onContinue={handleContinueCart}
              testID="active-cart"
            />
          </View>
        )}

        {/* Quick Actions */}
        <FadeInView delay={200} direction="up">
          <View style={{ marginTop: theme.spacing.md }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('dashboard.quickActions')}
            </Text>
            <QuickActionsGrid actions={quickActions} />
          </View>
        </FadeInView>

        {/* Recent Carts */}
        <FadeInView delay={300} direction="up">
          <View style={{ marginTop: theme.spacing.md }}>
            <RecentOrdersList
              carts={recentCartsData}
              onCartPress={handleCartPress}
              testID="recent-carts"
            />
          </View>
        </FadeInView>

        {/* Bottom padding */}
        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>

      {/* Create Cart Modal */}
      <CreateOrderModal
        visible={isCreateCartModalVisible}
        onClose={handleCloseCreateCartModal}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    marginBottom: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingHorizontal applied dynamically via responsiveStyles
  },
  summaryCardsRow: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
});

export default DashboardScreen;
