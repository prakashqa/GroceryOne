/**
 * InventoryDashboardScreen
 * Full inventory management dashboard with summary, search, add item,
 * low stock alerts, and tap-to-detail navigation
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';
import { selectCategories } from '../../../store/slices/catalogSlice';
import {
  useGetLowStockItemsQuery,
  useGetStockReportQuery,
} from '../../../data/api/inventoryApi';
import { useCreateItemMutation } from '../../../data/api/productApi';
import ItemFormModal from '../../components/management/ItemFormModal';

type MoreStackParamList = {
  InventoryDashboard: undefined;
  InventoryItemDetail: { itemId: string };
};

function formatStock(value: number | null | undefined): string {
  return (value ?? 0).toFixed(2);
}

const InventoryDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  const tenant = useSelector(selectTenant);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const categories = useSelector(selectCategories) || [];
  const skipQuery = !tenant?.slug || !isAuthenticated;

  const {
    data: lowStockItems,
    isLoading: lowStockLoading,
    isError: lowStockError,
    refetch: refetchLowStock,
  } = useGetLowStockItemsQuery(undefined, { skip: skipQuery });

  const {
    data: stockReportItems,
    isLoading: stockReportLoading,
    isError: stockReportError,
    refetch: refetchStockReport,
  } = useGetStockReportQuery({}, { skip: skipQuery });

  const [createItem] = useCreateItemMutation();

  const isLoading = skipQuery || lowStockLoading || stockReportLoading;
  const isError = !skipQuery && (lowStockError || stockReportError);

  const [searchQuery, setSearchQuery] = useState('');
  const [showItemFormModal, setShowItemFormModal] = useState(false);

  // Filter stock report to only tracked items
  const trackedStockItems = useMemo(() => {
    if (!stockReportItems) return [];
    return stockReportItems.filter((item) => item.trackInventory === true);
  }, [stockReportItems]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return trackedStockItems;
    const query = searchQuery.toLowerCase();
    return trackedStockItems.filter((item) =>
      getTranslatedItemName(item).toLowerCase().includes(query)
    );
  }, [trackedStockItems, searchQuery]);

  // Low stock ID set for badge display
  const lowStockIdSet = useMemo(
    () => new Set(lowStockItems?.map((i) => i.id) ?? []),
    [lowStockItems]
  );

  const handleRetry = () => {
    refetchLowStock();
    refetchStockReport();
  };

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('InventoryItemDetail', { itemId });
    },
    [navigation]
  );

  const handleAddItemSubmit = useCallback(
    async (data: { name: string; categoryId: string; unit: string; defaultQuantity: number; mrp: number; salePrice?: number }) => {
      try {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await createItem({
          slug,
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          defaultQuantity: data.defaultQuantity,
          compareAtPrice: data.mrp,
          price: data.salePrice,
          trackInventory: true,
          stockQuantity: 0,
        }).unwrap();
        setShowItemFormModal(false);
        refetchStockReport();
        refetchLowStock();
      } catch {
        // Error handled by RTK Query
      }
    },
    [createItem, refetchStockReport, refetchLowStock]
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.centerContainer} testID="inventory-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            {t('inventory.loading', 'Loading inventory...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.fontSize.lg }]}>
            {t('inventory.error', 'Failed to load inventory')}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={[styles.retryButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }]}
          >
            <Text style={[styles.retryText, { color: '#FFFFFF' }]}>
              {t('inventory.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderStockItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.xs }]}
      onPress={() => handleItemPress(item.id)}
      testID={`inventory-item-card-${item.id}`}
    >
      <View style={styles.itemRow}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.itemName, { color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium }]} numberOfLines={1}>
            {getTranslatedItemName(item)}
          </Text>
          {lowStockIdSet.has(item.id) && (
            <View
              style={[styles.lowBadge, { backgroundColor: theme.colors.warning, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 8 }]}
              testID={`low-stock-badge-${item.id}`}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                {t('inventory.lowBadge', 'LOW')}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            color: (item.stockQuantity ?? 0) <= (item.lowStockThreshold ?? 0) ? theme.colors.warning : theme.colors.success,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.bold,
          }}
        >
          {formatStock(item.stockQuantity)} {item.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Summary Cards */}
      <View style={[styles.summaryRow, { marginBottom: theme.spacing.md }]}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, flex: 1, marginRight: 6 }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            {t('inventory.totalItems', 'Total Items')}
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: 28, fontWeight: '700' }} testID="summary-total-count">
            {trackedStockItems.length}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, flex: 1, marginLeft: 6 }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            {t('inventory.lowStockCount', 'Low Stock')}
          </Text>
          <Text style={{ color: theme.colors.warning, fontSize: 28, fontWeight: '700' }} testID="summary-lowstock-count">
            {lowStockItems?.length ?? 0}
          </Text>
        </View>
      </View>

      {/* Low Stock Items Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.sm }]}>
          {t('inventory.lowStock', 'Low Stock Items')}
        </Text>

        {(!lowStockItems || lowStockItems.length === 0) ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg }]}>
            <Text style={[styles.emptyText, { color: theme.colors.success, fontSize: theme.typography.fontSize.md }]}>
              {t('inventory.allStocked', 'All items are well stocked!')}
            </Text>
          </View>
        ) : (
          lowStockItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.xs, borderLeftWidth: 3, borderLeftColor: theme.colors.warning }]}
              onPress={() => handleItemPress(item.id)}
            >
              <View style={styles.itemRow}>
                <Text style={[styles.itemName, { color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium, flex: 1 }]}>
                  {getTranslatedItemName(item)}
                </Text>
                <View style={styles.stockInfo}>
                  <Text style={{ color: theme.colors.warning, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold }}>
                    {formatStock(item.stockQuantity)} {item.unit}
                  </Text>
                </View>
              </View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm, marginTop: 2 }}>
                {t('inventory.threshold', 'Threshold')}: {formatStock(item.lowStockThreshold)} {item.unit}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Stock Report Title */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.sm }]}>
        {t('inventory.stockReport', 'Stock Report')}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg }]}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.md }]}>
        {t('inventory.noResults', 'No items match your search')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }]}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF', fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold }]}>
          {t('inventory.title', 'Inventory')}
        </Text>

        {/* Search bar */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.borderRadius.md, marginTop: theme.spacing.sm }]}>
          <TextInput
            style={[styles.searchInput, { color: '#FFFFFF', fontSize: theme.typography.fontSize.md }]}
            placeholder={t('inventory.searchPlaceholder', 'Search inventory...')}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="inventory-search-input"
          />
        </View>
      </View>

      {/* Stock list */}
      <FlatList
        data={filteredItems}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={searchQuery.trim() ? ListEmpty : null}
        contentContainerStyle={{ padding: responsiveStyles.contentPadding || 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        testID="inventory-list"
      />

      {/* FAB - Add Item */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, borderRadius: 28 }]}
        onPress={() => setShowItemFormModal(true)}
        testID="inventory-add-item-btn"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Item Form Modal */}
      <ItemFormModal
        visible={showItemFormModal}
        onClose={() => setShowItemFormModal(false)}
        onSubmit={handleAddItemSubmit}
        categories={categories}
        testID="inventory-item-form"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerTitle: {},
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { textAlign: 'center' },
  errorText: { textAlign: 'center' },
  retryButton: {},
  retryText: { textAlign: 'center', fontWeight: '600' },
  summaryRow: { flexDirection: 'row' },
  summaryCard: { alignItems: 'center' },
  section: {},
  sectionTitle: {},
  emptyCard: { alignItems: 'center' },
  emptyText: { textAlign: 'center' },
  itemCard: {},
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: {},
  stockInfo: {},
  lowBadge: {},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '400', marginTop: -2 },
});

export default InventoryDashboardScreen;
