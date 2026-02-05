/**
 * CategoryListItem Component
 * List item for displaying a category with edit/delete actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme';
import { Category } from '../../../domain/types/picking';
import { getTranslatedCategoryName } from '../../../domain/utils/itemTranslations';

interface CategoryListItemProps {
  category: Category;
  itemCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onPress?: (category: Category) => void;
  testID?: string;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
  category,
  itemCount,
  onEdit,
  onDelete,
  onPress,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Get translated category name based on current language
  const displayName = getTranslatedCategoryName(category);

  const leftContent = (
    <>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={styles.icon}>{category.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {displayName}
        </Text>
        <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
          {t('manageItems.itemsCount', { count: itemCount })}
        </Text>
      </View>
      {onPress && (
        <Icon
          name="chevron-right"
          size={24}
          color={theme.colors.textSecondary}
          testID={testID ? `${testID}-chevron` : undefined}
        />
      )}
    </>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      testID={testID}
    >
      {/* Icon and Name - Pressable when onPress is provided */}
      {onPress ? (
        <TouchableOpacity
          style={styles.leftSection}
          onPress={() => onPress(category)}
          testID={testID ? `${testID}-pressable` : undefined}
          activeOpacity={0.7}
        >
          {leftContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.leftSection}>
          {leftContent}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.editButton,
            { backgroundColor: `${theme.colors.primary}15` },
          ]}
          onPress={() => onEdit(category)}
          testID={testID ? `${testID}-edit-button` : undefined}
        >
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            {t('edit')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: `${theme.colors.error}15` },
          ]}
          onPress={() => onDelete(category)}
          testID={testID ? `${testID}-delete-button` : undefined}
        >
          <Text style={[styles.actionText, { color: theme.colors.error }]}>
            {t('delete')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {},
  deleteButton: {},
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoryListItem;
