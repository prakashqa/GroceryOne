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

import {
  selectCategories,
  selectItems,
  addItem,
  updateItem,
  deleteItem,
} from '../../../store/slices/catalogSlice';
import { removeItemFromCart } from '../../../store/slices/multiCartSlice';
import { Category, Item } from '../../../domain/types/picking';
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

  const categories = useSelector(selectCategories);
  const items = useSelector(selectItems);
  const carts = useSelector((state: RootState) => state.multiCart.carts);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    route.params?.categoryId || null
  );
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filter out inventory categories — only show order/POS categories
  const orderCategories = useMemo(() => {
    return categories.filter((cat) => cat.trackInventory !== true);
  }, [categories]);

  // Create a category lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  // Filter items based on search query and selected category (search both English and Telugu names)
  // Excludes inventory items (trackInventory === true) — only show order/POS items
  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => item.trackInventory !== true);

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
    (data: {
      name: string;
      categoryId: string;
      unit: Item['unit'];
      defaultQuantity: number;
      mrp: number;
      salePrice?: number;
    }) => {
      if (selectedItem) {
        // Edit mode
        dispatch(
          updateItem({
            id: selectedItem.id,
            name: data.name,
            categoryId: data.categoryId,
            unit: data.unit,
            defaultQuantity: data.defaultQuantity,
            mrp: data.mrp,
            ...(data.salePrice !== undefined && { price: data.salePrice }),
          })
        );
      } else {
        // Add mode
        dispatch(
          addItem({
            name: data.name,
            categoryId: data.categoryId,
            unit: data.unit,
            defaultQuantity: data.defaultQuantity,
            mrp: data.mrp,
            ...(data.salePrice !== undefined && { price: data.salePrice }),
          })
        );
      }
    },
    [dispatch, selectedItem]
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

  const handleConfirmDelete = useCallback(() => {
    if (!selectedItem) return;

    // Remove item from all carts
    carts.forEach((cart) => {
      const itemInCart = cart.items.some((ci) => ci.item.id === selectedItem.id);
      if (itemInCart) {
        dispatch(removeItemFromCart({ cartId: cart.id, itemId: selectedItem.id }));
      }
    });

    // Delete the item from catalog
    dispatch(deleteItem(selectedItem.id));
  }, [dispatch, selectedItem, carts]);

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
