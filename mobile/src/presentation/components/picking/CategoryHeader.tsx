/**
 * CategoryHeader Component
 * Displays category title with item count for the picking screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

interface CategoryHeaderProps {
  categoryName: string;
  itemCount: number;
  testID?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  itemCount,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: responsiveStyles.contentPadding,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
        },
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.categoryName,
          {
            color: theme.colors.text,
            fontSize: isTablet
              ? theme.typography.fontSize['2xl']
              : theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
          },
        ]}
      >
        {categoryName}
      </Text>
      <Text
        style={[
          styles.itemCount,
          {
            color: theme.colors.textSecondary,
            fontSize: isTablet
              ? theme.typography.fontSize.lg
              : theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.medium,
          },
        ]}
      >
        {t('picking.itemCount', { count: itemCount })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
  },
  itemCount: {},
});

export default CategoryHeader;
