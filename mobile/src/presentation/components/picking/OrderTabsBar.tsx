/**
 * CartTabsBar Component
 * Horizontal scrollable cart tabs section for the picking screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

interface CartTabsBarProps {
  activeCartName: string;
  activeCartItemCount: number;
  todaysCartCount: number;
  onCartPress: () => void;
  onCartListPress: () => void;
  onNewCartPress: () => void;
  testID?: string;
}

export const OrderTabsBar: React.FC<CartTabsBarProps> = ({
  activeCartName,
  activeCartItemCount,
  todaysCartCount,
  onCartPress,
  onCartListPress,
  onNewCartPress,
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
          paddingVertical: theme.spacing.xs,
        },
      ]}
      testID={testID}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsiveStyles.contentPadding,
            gap: theme.spacing.sm,
          },
        ]}
      >
        {/* Active Cart Tab */}
        <TouchableOpacity
          style={[
            styles.activeCartTab,
            {
              backgroundColor: theme.colors.buttonSecondary,
              paddingVertical: theme.spacing.smd,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          onPress={onCartPress}
          activeOpacity={0.8}
          testID={testID ? `${testID}-active-cart` : undefined}
        >
          <Text
            style={[
              styles.activeCartName,
              {
                color: theme.colors.buttonSecondaryText,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {activeCartName}
          </Text>
        </TouchableOpacity>

        {/* Cart List Button */}
        <TouchableOpacity
          style={[
            styles.cartListBtn,
            {
              borderColor: theme.colors.borderMuted,
              borderWidth: 1,
              paddingVertical: theme.spacing.smd,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          onPress={onCartListPress}
          activeOpacity={0.8}
          testID={testID ? `${testID}-cart-list` : undefined}
        >
          <Text style={styles.cartListIcon}>📋</Text>
          <Text
            style={[
              styles.cartListText,
              {
                color: theme.colors.headerText,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                marginLeft: theme.spacing.xs,
              },
            ]}
          >
            {t('picking.cartList')}
          </Text>
          {todaysCartCount > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.warning,
                  marginLeft: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 2,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
                testID={testID ? `${testID}-list-badge` : undefined}
              >
                {todaysCartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* New Cart Button */}
        <TouchableOpacity
          style={[
            styles.newCartBtn,
            {
              backgroundColor: theme.colors.buttonPrimary,
              paddingVertical: theme.spacing.smd,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          onPress={onNewCartPress}
          activeOpacity={0.8}
          testID={testID ? `${testID}-new-cart` : undefined}
        >
          <Text
            style={[
              styles.newCartText,
              {
                color: theme.colors.buttonPrimaryText,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
          >
            {t('picking.newCart')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  scrollContent: {
    alignItems: 'center',
  },
  activeCartTab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCartName: {},
  cartListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartListIcon: {
    fontSize: 16,
  },
  cartListText: {},
  badge: {},
  badgeText: {},
  newCartBtn: {},
  newCartText: {},
});

export default OrderTabsBar;
