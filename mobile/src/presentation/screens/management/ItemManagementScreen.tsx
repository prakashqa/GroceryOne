/**
 * ItemManagementScreen
 * Screen for managing items (CRUD operations)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { removeItemFromCart } from '../../../store/slices/multiCartSlice';
import { useCatalog } from '../../../hooks/useCatalog';
import {
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} from '../../../data/api/productApi';
import { Category, Item } from '../../../domain/types/picking';

/** Minimal slug from a name (mirrors the backend's tenant-scoped slug). */
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
}
import {
  ItemListItem,
  ItemFormModal,
  DeleteConfirmModal,
} from '../../components/management';
import { useTheme } from '../../theme';
import { HeaderBar, FAB } from '../../components/common';
import { RootState } from '../../../store/rootReducer';
import {
  getTranslatedItemName,
  getTranslatedCategoryName,
} from '../../../domain/utils/itemTranslations';

type ItemManagementRouteParams = {
  ItemManagement: {
    categoryId?: string;
  };
};

const ItemManagementScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<ItemManagementRouteParams, 'ItemManagement'>>();

  // Read catalog from the backend (RTK Query). After a create/update/delete
  // mutation invalidates the Product LIST, useGetItemsQuery refetches and the
  // list updates — including inventory-tracked items.
  const { categories, items, refetch } = useCatalog();
  const carts = useSelector((state: RootState) => state.multiCart.carts);
  const [createItemMut] = useCreateItemMutation();
  const [updateItemMut] = useUpdateItemMutation();
  const [deleteItemMut] = useDeleteItemMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    route.params?.categoryId || null
  );
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Show ALL categories (including inventory-tracked ones).
  const orderCategories = useMemo(() => categories as Category[], [categories]);

  // Create a category lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    (categories as Category[]).forEach((cat) => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  // Filter items by search query and selected category (search both English and
  // Telugu names). Inventory-tracked items ARE shown now.
  const filteredItems = useMemo(() => {
    let filtered = items as Item[];

    // Filter by category if selected
    if (selectedCategoryId) {
      filtered = filtered.filter((item) => item.categoryId === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        (item.nameTe && item.nameTe.toLowerCase().includes(query)) ||
        getTranslatedItemName(item).toLowerCase().includes(query)
      );
    }

    // Sort by sortOrder for consistent display across screens
    return [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [items, selectedCategoryId, searchQuery]);

  // Add/Edit handlers
  const handleOpenAddModal = useCallback(() => {
    setSelectedItem(null);
    setIsFormModalVisible(true);
  }, []);

  const handleOpenEditModal = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsFormModalVisible(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleSubmitItem = useCallback(
    async (data: {
      name: string;
      categoryId: string;
      unit: Item['unit'];
      defaultQuantity: number;
      mrp: number;
      salePrice?: number;
      costPrice?: number;
      stockQuantity?: number;
      lowStockThreshold?: number;
      trackInventory?: boolean;
    }) => {
      // Common fields sent to the backend. Opening stock + trackInventory are
      // wired into the Inventory system server-side (initial/correction txns).
      const common = {
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        defaultQuantity: data.defaultQuantity,
        compareAtPrice: data.mrp,
        ...(data.salePrice !== undefined && { price: data.salePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.trackInventory ? { trackInventory: true } : {}),
      };
      try {
        if (selectedItem) {
          await updateItemMut({ id: (selectedItem as any).id, data: common }).unwrap();
        } else {
          await createItemMut({ slug: slugify(data.name), ...common }).unwrap();
        }
        refetch();
      } catch {
        // Surface via the catalog error state on next render; keep the modal flow simple.
      }
    },
    [selectedItem, createItemMut, updateItemMut, refetch]
  );

  // Delete handlers
  const handleOpenDeleteModal = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsDeleteModalVisible(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    // Remove item from all carts (local)
    carts.forEach((cart) => {
      const itemInCart = cart.items.some((ci) => ci.item.id === selectedItem.id);
      if (itemInCart) {
        dispatch(removeItemFromCart({ cartId: cart.id, itemId: selectedItem.id }));
      }
    });

    // Delete on the backend (soft delete) then refresh.
    try {
      await deleteItemMut((selectedItem as any).id).unwrap();
      refetch();
    } catch {
      // ignore — catalog error surfaces on next render
    }
  }, [dispatch, selectedItem, carts, deleteItemMut, refetch]);

  const renderItemRow = useCallback(
    ({ item }: { item: Item }) => (
      <ItemListItem
        item={item}
        category={categoryMap[item.categoryId]}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        testID={`item-${item.id}`}
      />
    ),
    [categoryMap, handleOpenEditModal, handleOpenDeleteModal]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={[styles.emptyContainer, { paddingHorizontal: theme.spacing.xl }]}>
        <Text style={{ fontSize: 64, marginBottom: theme.spacing.md }}>📦</Text>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          {t('manageItems.noItemsYet')}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.lg,
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          {selectedCategoryId
            ? t('manageItems.addItemsToCategory')
            : t('manageItems.createFirstItem')}
        </Text>
        <TouchableOpacity
          style={[
            styles.emptyButton,
            {
              backgroundColor: theme.colors.primary,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          onPress={handleOpenAddModal}
        >
          <Text style={{ fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.textInverse }}>
            {t('manageItems.addItem')}
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [theme, selectedCategoryId, handleOpenAddModal, t]
  );

  const renderHeader = useCallback(
    () => (
      <HeaderBar
        title={t('manageItems.title')}
        onBack={() => navigation.goBack()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('manageItems.searchItems')}
        testID="item-management-header"
      />
    ),
    [searchQuery, navigation, t]
  );

  const renderCategoryTabs = useCallback(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryTabsContainer, { marginTop: theme.spacing.smd }]}
        contentContainerStyle={[styles.categoryTabsContent, { paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm }]}
      >
        {/* All categories tab */}
        <TouchableOpacity
          testID="category-chip-all"
          style={[
            styles.categoryTab,
            {
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.smd,
              borderRadius: theme.borderRadius.full,
              backgroundColor:
                selectedCategoryId === null
                  ? theme.colors.primary
                  : theme.colors.surface,
              borderColor:
                selectedCategoryId === null
                  ? theme.colors.primary
                  : theme.colors.border,
            },
          ]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color:
                selectedCategoryId === null
                  ? theme.colors.textInverse
                  : theme.colors.text,
            }}
          >
            {t('manageItems.all')}
          </Text>
        </TouchableOpacity>

        {/* Category tabs — only order categories */}
        {orderCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            testID={`category-chip-${cat.id}`}
            style={[
              styles.categoryTab,
              {
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.smd,
                borderRadius: theme.borderRadius.full,
                backgroundColor:
                  selectedCategoryId === cat.id
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  selectedCategoryId === cat.id
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCategoryId(cat.id)}
          >
            <Text style={{ fontSize: theme.typography.fontSize.md, marginRight: theme.spacing.xs + 2 }}>{cat.icon}</Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color:
                  selectedCategoryId === cat.id
                    ? theme.colors.textInverse
                    : theme.colors.text,
              }}
              numberOfLines={1}
            >
              {getTranslatedCategoryName(cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    [orderCategories, selectedCategoryId, theme, t]
  );

  const renderFooter = useCallback(
    () => {
      const categoryName = selectedCategoryId && categoryMap[selectedCategoryId]
        ? getTranslatedCategoryName(categoryMap[selectedCategoryId])
        : '';
      return (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.divider,
              paddingVertical: theme.spacing.smd,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.md,
              },
            ]}
          >
            {selectedCategoryId
              ? t('manageItems.itemsInCategory', {
                  count: filteredItems.length,
                  category: categoryName,
                })
              : t('manageItems.itemsCount', { count: filteredItems.length })}
          </Text>
        </View>
      );
    },
    [filteredItems.length, selectedCategoryId, categoryMap, theme, t]
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
      {renderCategoryTabs()}

      <View style={[styles.listContainer, { paddingTop: theme.spacing.md }]}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginHorizontal: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('manageItems.items')}
        </Text>

        <FlatList
          data={filteredItems}
          renderItem={renderItemRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredItems.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {items.length > 0 && renderFooter()}

      {/* FAB */}
      <FAB
        onPress={handleOpenAddModal}
        accessibilityLabel="Add new item"
        testID="add-item-fab"
      />

      {/* Item Form Modal (Add/Edit) */}
      <ItemFormModal
        visible={isFormModalVisible}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmitItem as any}
        categories={orderCategories}
        editItem={selectedItem}
        initialCategoryId={selectedCategoryId || undefined}
        testID="item-form-modal"
      />

      {/* Delete Confirm Modal */}
      {selectedItem && (
        <DeleteConfirmModal
          visible={isDeleteModalVisible}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          type="item"
          itemName={getTranslatedItemName(selectedItem)}
          testID="delete-confirm-modal"
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
  // FAB is now handled by the FAB component
  categoryTabsContainer: {
    maxHeight: 56,
  },
  categoryTabsContent: {
    flexDirection: 'row',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
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
  emptyButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    textAlign: 'center',
  },
});

export default ItemManagementScreen;
