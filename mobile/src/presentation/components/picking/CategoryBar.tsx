/**
 * CategoryBar Component
 * Horizontal scrollable category icon selector for the picking screen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../theme';
import { useDeviceType } from '../../../hooks';
import { Category } from '../../../domain/types/picking';
import { getTranslatedCategoryName } from '../../../domain/utils/itemTranslations';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
  testID?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  testID,
}) => {
  const theme = useTheme();
  const { isTablet } = useDeviceType();

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategoryId === item.id;
      const categoryName = getTranslatedCategoryName(item);

      return (
        <TouchableOpacity
          style={[
            styles.categoryPill,
            {
              backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
              borderRadius: theme.borderRadius.full,
              borderWidth: isSelected ? 0 : 1,
              borderColor: theme.colors.border,
              paddingHorizontal: isTablet ? theme.spacing.md : theme.spacing.smd,
              paddingVertical: isTablet ? theme.spacing.sm : theme.spacing.xs + 2,
              marginRight: theme.spacing.sm,
            },
          ]}
          onPress={() => onCategorySelect(item.id)}
          activeOpacity={0.7}
          accessibilityLabel={categoryName}
          accessibilityRole="tab"
          accessibilityState={{ selected: isSelected }}
          testID={testID ? `${testID}-item-${item.id}` : undefined}
        >
          <Text
            style={[
              styles.categoryIcon,
              {
                fontSize: isTablet
                  ? theme.typography.fontSize.xl
                  : theme.typography.fontSize.lg,
                marginRight: theme.spacing.xs,
              },
            ]}
          >
            {item.icon}
          </Text>
          <Text
            style={[
              styles.categoryName,
              {
                color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                fontSize: isTablet
                  ? theme.typography.fontSize.md
                  : theme.typography.fontSize.sm,
                fontWeight: isSelected
                  ? theme.typography.fontWeight.bold
                  : theme.typography.fontWeight.medium,
              },
            ]}
            numberOfLines={1}
            testID={
              isSelected && testID
                ? `${testID}-item-${item.id}-selected`
                : undefined
            }
          >
            {categoryName}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategoryId, onCategorySelect, theme, isTablet, testID]
  );

  const keyExtractor = useCallback((item: Category) => item.id, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: theme.spacing.smd,
        },
      ]}
      testID={testID}
    >
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  listContent: {},
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {},
  categoryName: {},
});

export default CategoryBar;
