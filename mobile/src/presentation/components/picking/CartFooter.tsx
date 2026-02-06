/**
 * CartFooter Component
 * Bottom sticky bar showing cart item count and View Cart button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

interface CartFooterProps {
  itemCount: number;
  onViewCart: () => void;
  testID?: string;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  itemCount,
  onViewCart,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: responsiveStyles.contentPadding,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(theme.spacing.md, insets.bottom),
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        theme.shadows.md,
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.itemCountText,
            {
              color: theme.colors.text,
              fontSize: isTablet
                ? theme.typography.fontSize.lg
                : theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
            },
          ]}
        >
          {t('picking.itemsAdded', { count: itemCount })}
        </Text>

        <TouchableOpacity
          style={[
            styles.viewCartButton,
            {
              backgroundColor: theme.colors.buttonPrimary,
              paddingVertical: theme.spacing.sm + 2,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.borderRadius.xl,
            },
          ]}
          onPress={onViewCart}
          activeOpacity={0.8}
          testID={testID ? `${testID}-button` : undefined}
        >
          <Text
            style={[
              styles.viewCartText,
              {
                color: theme.colors.buttonPrimaryText,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
          >
            {t('picking.viewCart')}
          </Text>
          <Text
            style={[
              styles.chevron,
              {
                color: theme.colors.buttonPrimaryText,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
              },
            ]}
            testID={testID ? `${testID}-chevron` : undefined}
          >
            {' >'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {},
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {},
  chevron: {},
});

export default CartFooter;
