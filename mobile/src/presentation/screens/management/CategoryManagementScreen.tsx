/**
 * CategoryManagementScreen
 * Screen for managing categories (CRUD operations)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import {
  selectCategories,
  selectItems,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../../../store/slices/catalogSlice';
import { Category } from '../../../domain/types/picking';
import {
  CategoryListItem,
  CategoryFormModal,
  DeleteConfirmModal,
} from '../../components/management';
import { useTheme } from '../../theme';
import { HeaderBar, FAB } from '../../components/common';
import { getTranslatedCategoryName } from '../../../domain/utils/itemTranslations';

// Navigation types
type DashboardStackParamList = {
  Dashboard: undefined;
  CategoryManagement: undefined;
  ItemManagement: { categoryId?: string };
};

type CategoryManagementNavigationProp = NativeStackNavigationProp<
  DashboardStackParamList,
  'CategoryManagement'
>;

const CategoryManagementScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<CategoryManagementNavigationProp>();
  const theme = useTheme();
  const { t } = useTranslation();

  const categories = useSelector(selectCategories);
  const items = useSelector(selectItems);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Count items per category
  const itemCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.id] = items.filter((item) => item.categoryId === cat.id).length;
    });
    return counts;
  }, [categories, items]);

  // Filter categories based on search query (search both English and Telugu names)
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase().trim();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(query) ||
      (cat.nameTe && cat.nameTe.toLowerCase().includes(query)) ||
      getTranslatedCategoryName(cat).toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Get existing category names for duplicate validation
  const existingCategoryNames = useMemo(
    () => categories.map((cat) => cat.name),
    [categories]
  );

  // Add/Edit handlers
  const handleOpenAddModal = useCallback(() => {
    setSelectedCategory(null);
    setIsFormModalVisible(true);
  }, []);

  const handleOpenEditModal = useCallback((category: Category) => {
    setSelectedCategory(category);
    setIsFormModalVisible(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalVisible(false);
    setSelectedCategory(null);
  }, []);

  const handleSubmitCategory = useCallback(
    (data: { name: string; icon: string }) => {
      if (selectedCategory) {
        // Edit mode
        dispatch(
          updateCategory({
            id: selectedCategory.id,
            name: data.name,
            icon: data.icon,
          })
        );
      } else {
        // Add mode
        dispatch(addCategory({ name: data.name, icon: data.icon }));
      }
    },
    [dispatch, selectedCategory]
  );

  // Delete handlers
  const handleOpenDeleteModal = useCallback((category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalVisible(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalVisible(false);
    setSelectedCategory(null);
  }, []);

  const handleConfirmDelete = useCallback(
    (options?: { moveItemsTo?: string; deleteItems?: boolean }) => {
      if (!selectedCategory) return;

      dispatch(
        deleteCategory({
          id: selectedCategory.id,
          deleteItems: options?.deleteItems ?? true,
          moveItemsTo: options?.moveItemsTo,
        })
      );
    },
    [dispatch, selectedCategory]
  );

  // Available categories for moving items (exclude the category being deleted)
  const availableCategoriesForMove = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.filter((cat) => cat.id !== selectedCategory.id);
  }, [categories, selectedCategory]);

  // Navigate to ItemManagement when a category is pressed
  const handleCategoryPress = useCallback(
    (category: Category) => {
      navigation.navigate('ItemManagement', { categoryId: category.id });
    },
    [navigation]
  );

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryListItem
        category={item}
        itemCount={itemCountByCategory[item.id] || 0}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onPress={handleCategoryPress}
        testID={`category-${item.id}`}
      />
    ),
    [itemCountByCategory, handleOpenEditModal, handleOpenDeleteModal, handleCategoryPress]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={[styles.emptyContainer, { paddingHorizontal: theme.spacing.xl }]}>
        <Text style={{ fontSize: 64, marginBottom: theme.spacing.md }}>📁</Text>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          {t('manageCategories.noCategoriesYet')}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.lg,
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          {t('manageCategories.createFirstCategory')}
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
            {t('manageCategories.addCategory')}
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [theme, handleOpenAddModal, t]
  );

  const renderHeader = useCallback(
    () => (
      <HeaderBar
        title={t('manageCategories.title')}
        onBack={() => navigation.goBack()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('manageCategories.searchCategories')}
        testID="category-management-header"
      />
    ),
    [searchQuery, navigation, t]
  );

  const renderFooter = useCallback(
    () => (
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
          {t('manageCategories.categoriesCount', { count: categories.length })}
        </Text>
      </View>
    ),
    [categories.length, theme, t]
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
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginHorizontal: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('manageCategories.categories')}
        </Text>

        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredCategories.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {categories.length > 0 && renderFooter()}

      {/* FAB */}
      <FAB
        onPress={handleOpenAddModal}
        accessibilityLabel="Add new category"
        testID="add-category-fab"
      />

      {/* Category Form Modal (Add/Edit) */}
      <CategoryFormModal
        visible={isFormModalVisible}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmitCategory}
        existingNames={existingCategoryNames}
        editCategory={selectedCategory}
        testID="category-form-modal"
      />

      {/* Delete Confirm Modal */}
      {selectedCategory && (
        <DeleteConfirmModal
          visible={isDeleteModalVisible}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          type="category"
          itemName={getTranslatedCategoryName(selectedCategory)}
          itemCount={itemCountByCategory[selectedCategory.id] || 0}
          availableCategories={availableCategoriesForMove}
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

export default CategoryManagementScreen;
