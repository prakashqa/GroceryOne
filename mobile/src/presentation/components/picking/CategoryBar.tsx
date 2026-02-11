/**
 * CategoryBar Component
 * Horizontal scrollable category icon selector for the picking screen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
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
  const isDarkMode = useIsDarkMode();
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategoryId === item.id;
      const categoryName = getTranslatedCategoryName(item);
      // Take only first word for compact display
      const displayName = categoryName.split(' ')[0].split(',')[0];

      return (
        <TouchableOpacity
          style={[
            styles.categoryItem,
            {
              marginHorizontal: theme.spacing.xs,
            },
          ]}
          onPress={() => onCategorySelect(item.id)}
          activeOpacity={0.7}
          testID={testID ? `${testID}-item-${item.id}` : undefined}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: theme.colors.background,
                width: isTablet ? 70 : 56,
                height: isTablet ? 70 : 56,
                borderRadius: isTablet ? 35 : 28,
                borderWidth: isSelected ? 2 : 0,
                borderColor: isSelected ? theme.colors.primary : 'transparent',
              },
              isSelected && {
                backgroundColor: theme.colors.inCartBackground,
              },
            ]}
            testID={
              isSelected && testID
                ? `${testID}-item-${item.id}-selected`
                : undefined
            }
          >
            <Text
              style={[
                styles.categoryIcon,
                {
                  fontSize: isTablet
                    ? theme.typography.fontSize.xxxl
                    : theme.typography.fontSize.xxl,
                },
              ]}
            >
              {item.icon}
            </Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              {
                color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                fontSize: isTablet
                  ? theme.typography.fontSize.md
                  : theme.typography.fontSize.sm,
                fontWeight: isSelected
                  ? theme.typography.fontWeight.bold
                  : theme.typography.fontWeight.medium,
                marginTop: theme.spacing.xs,
              },
            ]}
            numberOfLines={1}
          >
            {displayName}
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
          paddingVertical: theme.spacing.sm,
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
            paddingHorizontal: responsiveStyles.contentPadding - theme.spacing.xs,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  listContent: {},
  categoryItem: {
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {},
  categoryName: {
    textAlign: 'center',
    maxWidth: 70,
  },
});

export default CategoryBar;
