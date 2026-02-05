/**
 * ItemListItem Component
 * List item for displaying an item with edit/delete actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Item, Category } from '../../../domain/types/picking';
import {
  getTranslatedItemName,
  getTranslatedCategoryName,
} from '../../../domain/utils/itemTranslations';

interface ItemListItemProps {
  item: Item;
  category?: Category;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  testID?: string;
}

const ItemListItem: React.FC<ItemListItemProps> = ({
  item,
  category,
  onEdit,
  onDelete,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Get translated names based on current language
  const displayItemName = getTranslatedItemName(item);
  const displayCategoryName = category ? getTranslatedCategoryName(category) : '';

  const formatQuantity = (qty: number, unit: string): string => {
    if (qty === 1 && unit === 'pcs') return `1 ${t('manageItems.piece')}`;
    if (unit === 'pcs') return `${qty} ${t('manageItems.pieces')}`;
    return `${qty} ${unit}`;
  };

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
      {/* Item Info */}
      <View style={styles.leftSection}>
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {displayItemName}
          </Text>
          <View style={styles.detailsRow}>
            {category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[styles.categoryName, { color: theme.colors.primary }]}
                >
                  {displayCategoryName}
                </Text>
              </View>
            )}
            <Text style={[styles.quantity, { color: theme.colors.textSecondary }]}>
              {t('manageItems.default')}: {formatQuantity(item.defaultQuantity, item.unit)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.editButton,
            { backgroundColor: `${theme.colors.primary}15` },
          ]}
          onPress={() => onEdit(item)}
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
          onPress={() => onDelete(item)}
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
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  quantity: {
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

export default ItemListItem;
