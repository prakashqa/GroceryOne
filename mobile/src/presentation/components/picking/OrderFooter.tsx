/**
 * CartFooter Component
 * Bottom sticky bar showing cart item count and View Cart button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

interface CartFooterProps {
  itemCount: number;
  /** Total price of items in cart — shown instead of "added" when > 0 */
  totalPrice?: number;
  onViewCart: () => void;
  testID?: string;
  /** When true, shows a syncing indicator (backend sync in progress) */
  isSyncing?: boolean;
}

export const OrderFooter: React.FC<CartFooterProps> = ({
  itemCount,
  totalPrice,
  onViewCart,
  testID,
  isSyncing = false,
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
          paddingTop: theme.spacing.smd,
          paddingBottom: Math.max(theme.spacing.smd, insets.bottom),
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        theme.shadows.md,
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.itemCountContainer}>
          <View style={styles.itemCountRow}>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  {
                    color: theme.colors.buttonPrimaryText,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                {itemCount}
              </Text>
            </View>
            <Text
              style={[
                styles.itemCountText,
                {
                  color: theme.colors.text,
                  fontSize: isTablet
                    ? theme.typography.fontSize.xl
                    : theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              {totalPrice !== undefined && totalPrice > 0
                ? t('picking.itemsWithPrice', { count: itemCount, price: `₹${totalPrice}` })
                : t('picking.itemsAdded', { count: itemCount })}
            </Text>
          </View>
          {isSyncing && (
            <View
              style={styles.syncContainer}
              testID={testID ? `${testID}-sync-indicator` : undefined}
            >
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.syncText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                    marginLeft: theme.spacing.xs,
                  },
                ]}
              >
                {t('picking.syncing', 'Syncing...')}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.viewCartButton,
            {
              backgroundColor: theme.colors.buttonPrimary,
              paddingVertical: theme.spacing.smd,
              paddingHorizontal: theme.spacing.xl,
              borderRadius: theme.borderRadius.xl,
            },
          ]}
          onPress={onViewCart}
          activeOpacity={0.8}
          accessibilityLabel={t('picking.viewCartAccessibility', { count: itemCount, defaultValue: `View cart with ${itemCount} items` })}
          accessibilityRole="button"
          testID={testID ? `${testID}-button` : undefined}
        >
          <Text
            style={[
              styles.viewCartText,
              {
                color: theme.colors.buttonPrimaryText,
                fontSize: isTablet
                  ? theme.typography.fontSize.xl
                  : theme.typography.fontSize.lg,
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
                  ? theme.typography.fontSize.xl
                  : theme.typography.fontSize.lg,
              },
            ]}
            testID={testID ? `${testID}-chevron` : undefined}
          >
            {' →'}
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
  itemCountContainer: {
    flexDirection: 'column',
  },
  itemCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {},
  itemCountText: {},
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  syncText: {},
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {},
  chevron: {},
});

export default OrderFooter;
