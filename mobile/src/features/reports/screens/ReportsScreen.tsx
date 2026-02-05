/**
 * ReportsScreen
 * Main reports and analytics dashboard
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme, useIsDarkMode } from '../../../presentation/theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { MetricsGrid } from '../components/MetricsGrid';
import { SalesChart } from '../components/SalesChart';
import { TopProductsList } from '../components/TopProductsList';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { DateRange } from '../types/reports.types';
import {
  setDateRange,
  selectSelectedDateRange,
  selectIsReportLoading,
} from '../store/reportsSlice';
import {
  filterCartsByDateRange,
  calculateReportMetrics,
  calculateSalesTrend,
  calculateTopProducts,
  calculateCategoryBreakdown,
} from '../utils/reportCalculations';
import { selectAllCarts, syncCartsFromBackend } from '../../../store/slices/multiCartSlice';
import { selectCategories } from '../../../store/slices/catalogSlice';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { getDateRangeLabel } from '../utils/dateRangeUtils';
import { useGetCartsQuery } from '../../../data/api/cartApi';

// Define RootState for selectors
interface RootState {
  multiCart: {
    carts: import('../../../domain/types/picking').ManagedCart[];
  };
  reports: import('../types/reports.types').ReportsState;
  catalog: {
    categories: import('../../../domain/types/picking').Category[];
    items: import('../../../domain/types/picking').Item[];
    isInitialized: boolean;
  };
}

export const ReportsScreen: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const dispatch = useDispatch();
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();
  const tenant = useSelector(selectTenant);

  // Fetch carts from backend API (skip when tenant context is unavailable)
  const skipQuery = !tenant?.slug;
  const {
    data: backendCarts,
    isLoading: isApiLoading,
    isFetching,
    refetch,
  } = useGetCartsQuery({}, { skip: skipQuery });

  // Redux state
  const selectedDateRange = useSelector((state: RootState) =>
    selectSelectedDateRange(state as { reports: import('../types/reports.types').ReportsState })
  );
  const isLoading = useSelector((state: RootState) =>
    selectIsReportLoading(state as { reports: import('../types/reports.types').ReportsState })
  );
  const allCarts = useSelector((state: RootState) => selectAllCarts(state));
  const categories = useSelector((state: RootState) => selectCategories(state));

  // Sync backend carts to Redux store when data arrives
  useEffect(() => {
    console.log('[ReportsScreen] Backend carts received:', backendCarts?.length || 0);
    if (backendCarts && backendCarts.length > 0) {
      console.log('[ReportsScreen] Syncing', backendCarts.length, 'carts to Redux');
      dispatch(
        syncCartsFromBackend({
          carts: backendCarts.map((cart) => ({
            id: cart.id,
            name: cart.name,
            status: cart.status,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            paidAt: cart.paidAt,
            paidAmount: cart.paidAmount,
            items: cart.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              priceSnapshot: item.priceSnapshot,
              addedAt: item.addedAt,
              item: item.item
                ? {
                    id: item.item.id,
                    categoryId: item.item.category?.id || item.item.categoryId,
                    name: item.item.name,
                    nameTe: item.item.nameTe,
                    unit: item.item.unit,
                    defaultQuantity: item.item.defaultQuantity,
                    price: item.item.price,
                  }
                : undefined,
            })),
          })),
          replaceAll: false, // Merge with local data to preserve unsynced payment state
        })
      );
    }
  }, [backendCarts, dispatch]);

  // Filter carts by date range
  const filteredCarts = useMemo(() => {
    console.log('[ReportsScreen] All carts from Redux:', allCarts.length);
    console.log('[ReportsScreen] Date range:', selectedDateRange);
    const filtered = filterCartsByDateRange(allCarts, selectedDateRange);
    console.log('[ReportsScreen] Filtered carts:', filtered.length);
    return filtered;
  }, [allCarts, selectedDateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const result = calculateReportMetrics(filteredCarts);
    console.log('[ReportsScreen] Metrics:', result);
    return result;
  }, [filteredCarts]);

  // Calculate sales trend
  const salesTrend = useMemo(
    () => calculateSalesTrend(filteredCarts, selectedDateRange),
    [filteredCarts, selectedDateRange]
  );

  // Calculate top products
  const topProducts = useMemo(
    () => calculateTopProducts(filteredCarts, categories, 10),
    [filteredCarts, categories]
  );

  // Calculate category breakdown
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(filteredCarts, categories),
    [filteredCarts, categories]
  );

  // Handle date range change
  const handleDateRangeChange = useCallback(
    (newRange: DateRange) => {
      dispatch(setDateRange(newRange));
    },
    [dispatch]
  );

  // Pull to refresh - fetches latest data from backend
  const onRefresh = useCallback(() => {
    if (!skipQuery) {
      refetch();
    }
  }, [refetch, skipQuery]);

  const dateRangeLabel = getDateRangeLabel(selectedDateRange);
  const showLoading = isApiLoading || isFetching;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: responsiveStyles.contentPadding,
          paddingVertical: theme.spacing.md,
        },
      ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xxl,
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {t('reports.title', 'Reports & Analytics')}
            </Text>
            <Text style={[styles.headerSubtitle, {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginTop: theme.spacing.xs,
            }]}>
              {dateRangeLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, {
              backgroundColor: theme.colors.primary,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.sm,
            }]}
            onPress={onRefresh}
            disabled={showLoading}
            testID="reports-sync-button"
          >
            {showLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Text style={[styles.syncButtonText, {
                color: theme.colors.textInverse,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.md,
              }]}>
                {t('reports.sync', 'Sync')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsiveStyles.contentPadding,
            paddingTop: theme.spacing.sm,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Date Range Selector */}
        <DateRangeSelector
          selectedRange={selectedDateRange}
          onRangeChange={handleDateRangeChange}
          testID="reports-date-range"
        />

        {/* Key Metrics */}
        <View style={[styles.section, { marginTop: theme.spacing.sm }]}>
          <MetricsGrid
            metrics={metrics}
            isLoading={isLoading}
            testID="reports-metrics"
          />
        </View>

        {/* Sales Chart */}
        <View style={[styles.section, { marginTop: theme.spacing.sm }]}>
          <SalesChart
            data={salesTrend}
            isLoading={isLoading}
            testID="reports-sales-chart"
          />
        </View>

        {/* Category Breakdown */}
        <View style={[styles.section, { marginTop: theme.spacing.sm }]}>
          <CategoryBreakdown
            data={categoryBreakdown}
            isLoading={isLoading}
            testID="reports-category-breakdown"
          />
        </View>

        {/* Top Products */}
        <View style={[styles.section, { marginTop: theme.spacing.sm }]}>
          <TopProductsList
            products={topProducts}
            limit={10}
            isLoading={isLoading}
            testID="reports-top-products"
          />
        </View>

        {/* Bottom padding */}
        <View style={[styles.bottomPadding, { height: theme.spacing.xl }]} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    // paddingHorizontal applied dynamically via responsiveStyles
    // paddingVertical applied inline via theme.spacing.md
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  headerSubtitle: {
    // fontSize, marginTop applied inline via theme tokens
  },
  syncButton: {
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    // color, fontWeight, fontSize applied inline via theme tokens
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingTop applied inline via theme.spacing.sm
  },
  section: {
    // marginTop applied inline via theme.spacing.sm
  },
  bottomPadding: {
    // height applied inline via theme.spacing.xl
  },
});

export default ReportsScreen;
