/**
 * CartListItem Component
 * Displays a cart card in the manage carts list with polished UI
 */

import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { ManagedCart, CartStatus } from '../../../domain/types/picking';

interface CartListItemProps {
  cart: ManagedCart;
  isActive: boolean;
  onPress: (cartId: string) => void;
  onLongPress?: (cartId: string) => void;
  onEdit?: (cartId: string) => void;
  onDelete?: (cartId: string) => void;
  testID?: string;
  /** Number of columns in the list - used for tablet responsive layouts */
  numColumns?: number;
}

/**
 * Format a number as currency (INR) for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get unit multiplier for price calculation
 * For 'gm' and 'ml' units, prices are stored per-KG/per-L, so multiply by 0.001
 * For 'kg', 'L', 'pcs' units, no conversion needed (multiplier = 1)
 */
const getUnitMultiplier = (unit: string): number => {
  if (unit === 'gm' || unit === 'ml') return 0.001;
  return 1;
};

/**
 * Calculate cart total from items with price snapshots
 * Applies unit multiplier for gm/ml items (prices stored per-KG/per-L)
 */
const calculateCartTotal = (items: ManagedCart['items']): number => {
  return items.reduce((sum, item) => {
    if (item.priceSnapshot !== undefined && item.priceSnapshot > 0) {
      const multiplier = getUnitMultiplier(item.item.unit);
      return sum + item.priceSnapshot * item.quantity * multiplier;
    }
    return sum;
  }, 0);
};

const CartListItem: React.FC<CartListItemProps> = ({
  cart,
  isActive,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  testID,
  numColumns = 1,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();
  const { t } = useTranslation('common');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Size factor: 10% larger than previous compact (0.8) layout
  const compactFactor = 0.88;

  // Text scale boost: 15% increase for all text within the card
  const textBoost = 1.15;

  // Responsive dynamic styles - reduced by 20% for more compact cards
  const dynamicStyles = useMemo(() => ({
    container: {
      paddingVertical: Math.round((responsiveStyles.componentPadding - 6) * compactFactor),
      paddingHorizontal: Math.round((responsiveStyles.componentPadding - 2) * compactFactor),
      borderRadius: Math.round(responsiveStyles.cardBorderRadius * 0.85),
    },
    iconContainer: {
      width: Math.round((responsiveStyles.iconContainerSize - 8) * compactFactor),
      height: Math.round((responsiveStyles.iconContainerSize - 8) * compactFactor),
      borderRadius: Math.round((responsiveStyles.cardBorderRadius - 4) * 0.85),
      marginRight: Math.round((responsiveStyles.componentPadding - 6) * compactFactor),
    },
    cartIcon: {
      fontSize: Math.round(18 * responsiveStyles.fontScale * compactFactor * textBoost),
    },
    cartName: {
      fontSize: Math.round(14 * responsiveStyles.fontScale * textBoost),
    },
    metaText: {
      fontSize: Math.round(theme.textStyles.bodySmall.fontSize * responsiveStyles.fontScale * 0.85 * textBoost),
    },
    badge: {
      paddingHorizontal: Math.round(6 * responsiveStyles.fontScale * textBoost),
      paddingVertical: Math.round(1.5 * responsiveStyles.fontScale * textBoost),
      borderRadius: theme.borderRadius.sm,
      minWidth: Math.round(20 * responsiveStyles.fontScale * textBoost),
    },
    badgeText: {
      fontSize: Math.round(10 * responsiveStyles.fontScale * textBoost),
    },
    actionButton: {
      width: Math.round((responsiveStyles.touchTargetMinSize - 16) * compactFactor),
      height: Math.round((responsiveStyles.touchTargetMinSize - 16) * compactFactor),
      borderRadius: theme.borderRadius.sm,
    },
    actionIcon: {
      fontSize: Math.round(12 * responsiveStyles.fontScale * textBoost),
    },
    chevron: {
      fontSize: Math.round(22 * responsiveStyles.fontScale * textBoost),
    },
  }), [theme, responsiveStyles]);

  // Known default cart names in all supported languages
  // These are the translations of 'picking.defaultCart' key
  const DEFAULT_CART_NAMES = ['Default Cart', 'డిఫాల్ట్ కార్ట్'];

  // Translate default cart name if it matches any known default cart name
  const getTranslatedCartName = useCallback((name: string): string => {
    if (DEFAULT_CART_NAMES.includes(name)) {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const displayName = getTranslatedCartName(cart.name);
  const isPaid = cart.status === 'paid';

  // Calculate cart total
  const cartTotal = useMemo(() => calculateCartTotal(cart.items), [cart.items]);
  const hasTotal = cartTotal > 0;

  // Compute container style based on number of columns (tablet support)
  // Reduced margins for more compact layout
  const isMultiColumn = numColumns > 1;
  const containerStyle = useMemo(() => {
    if (isMultiColumn) {
      return {
        flex: 1,
        marginHorizontal: 0,
        marginVertical: Math.round((theme.spacing.sm - 4) * compactFactor),
      };
    }
    return {
      marginHorizontal: 0,
      marginVertical: Math.round((theme.spacing.sm - 4) * compactFactor),
    };
  }, [isMultiColumn, theme.spacing]);

  // Get status badge configuration
  const getStatusBadgeConfig = useCallback((status: CartStatus) => {
    switch (status) {
      case 'draft':
        return { icon: '🟡', label: t('dashboard.draft', 'Draft'), color: theme.colors.warning };
      case 'printed':
        return { icon: '🖨', label: t('dashboard.printed', 'Printed'), color: theme.colors.info };
      case 'paid':
        return { icon: '🟢', label: t('dashboard.paid', 'Paid'), color: theme.colors.success };
      case 'completed':
        return { icon: '✓', label: t('dashboard.completed', 'Completed'), color: theme.colors.success };
      default:
        return { icon: '🟡', label: t('dashboard.draft', 'Draft'), color: theme.colors.warning };
    }
  }, [t, theme.colors]);

  const statusBadge = getStatusBadgeConfig(cart.status);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(cart.id);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(cart.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(cart.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(cart.id);
    }
  };

  const itemCount = isPaid && cart.paidItemCount ? cart.paidItemCount : cart.items.length;
  const itemsText = t('manageCarts.item', { count: itemCount });

  return (
    <Animated.View
      style={[
        containerStyle,
        { transform: [{ scale: scaleAnim }] },
      ]}
      testID={testID ? `${testID}-animated-container` : undefined}
    >
      <TouchableOpacity
        style={[
          styles.container,
          dynamicStyles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
            borderWidth: isActive ? 2 : 1,
          },
          theme.shadows.md,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}, ${itemsText}`}
        testID={testID}
      >
        {/* Active Indicator */}
        {isActive && (
          <View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: theme.colors.primary,
                borderTopLeftRadius: dynamicStyles.container.borderRadius,
                borderBottomLeftRadius: dynamicStyles.container.borderRadius,
              },
            ]}
            testID={testID ? `${testID}-active-indicator` : undefined}
          />
        )}

        {/* Cart Icon Container */}
        <View
          style={[
            styles.iconContainer,
            dynamicStyles.iconContainer,
            {
              backgroundColor: isActive
                ? 'rgba(46, 125, 50, 0.15)'
                : 'rgba(46, 125, 50, 0.08)',
            },
          ]}
          testID={testID ? `${testID}-icon` : undefined}
        >
          <Text style={dynamicStyles.cartIcon}>🛒</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Cart Name Row */}
          <View style={[styles.nameRow, { marginBottom: Math.round((theme.spacing.sm - 3) * compactFactor) }]}>
            <Text
              style={[
                styles.cartName,
                dynamicStyles.cartName,
                {
                  color: theme.colors.text,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </View>

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.itemsText,
                dynamicStyles.metaText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {itemsText}
            </Text>
            {(hasTotal || (isPaid && !!cart.paidAmount)) && (
              <>
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: theme.colors.textLight, marginHorizontal: Math.round(theme.spacing.sm * compactFactor) },
                  ]}
                />
                <Text
                  style={[
                    styles.cartTotalText,
                    dynamicStyles.metaText,
                    { color: isPaid ? theme.colors.success : theme.colors.primary },
                  ]}
                  testID={testID ? `${testID}-total` : undefined}
                >
                  {isPaid && cart.paidAmount
                    ? formatCurrency(cart.paidAmount)
                    : formatCurrency(cartTotal)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Status & Count Badges - centered vertically in card */}
        <View style={[styles.badgeContainer, { marginHorizontal: Math.round(theme.spacing.sm * compactFactor) }]}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBadge.color + '20',
                paddingHorizontal: Math.round(theme.spacing.sm * compactFactor),
                paddingVertical: Math.round((theme.spacing.xs - 1) * compactFactor),
                borderRadius: theme.borderRadius.sm,
                marginRight: Math.round(theme.spacing.xs * compactFactor),
              },
            ]}
            testID={testID ? `${testID}-status-badge` : undefined}
          >
            <Text style={[styles.statusIcon, { fontSize: Math.round(8 * responsiveStyles.fontScale * textBoost), marginRight: Math.round(theme.spacing.xs * compactFactor) }]}>{statusBadge.icon}</Text>
            <Text
              style={[
                styles.statusLabel,
                { color: statusBadge.color, fontSize: Math.round(9 * responsiveStyles.fontScale * textBoost) },
              ]}
            >
              {statusBadge.label}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              dynamicStyles.badge,
              {
                backgroundColor: itemCount > 0
                  ? theme.colors.warning
                  : theme.colors.disabled,
              },
            ]}
            testID={testID ? `${testID}-badge` : undefined}
          >
            <Text
              style={[
                styles.badgeText,
                dynamicStyles.badgeText,
                {
                  color: itemCount > 0 ? '#212121' : '#ffffff',
                },
              ]}
            >
              {itemCount}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { marginLeft: Math.round(theme.spacing.sm * compactFactor) }]}>
          {/* Edit Button - hidden for paid carts */}
          {!isPaid && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                dynamicStyles.actionButton,
                { backgroundColor: 'rgba(46, 125, 50, 0.1)', marginRight: Math.round((theme.spacing.sm - 2) * compactFactor) },
              ]}
              onPress={handleEdit}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={testID ? `${testID}-edit-btn` : undefined}
            >
              <Text style={dynamicStyles.actionIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          {/* Delete Button - disabled for paid carts */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              dynamicStyles.actionButton,
              {
                backgroundColor: isPaid
                  ? 'rgba(158, 158, 158, 0.1)'
                  : 'rgba(211, 47, 47, 0.08)',
                marginRight: Math.round((theme.spacing.sm - 2) * compactFactor),
              },
              isPaid && styles.disabledAction,
            ]}
            onPress={isPaid ? undefined : handleDelete}
            activeOpacity={isPaid ? 1 : 0.6}
            disabled={isPaid}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID={testID ? `${testID}-delete-btn` : undefined}
          >
            <Text style={[dynamicStyles.actionIcon, isPaid && styles.disabledActionIcon]}>
              🗑️
            </Text>
          </TouchableOpacity>

          {/* Chevron */}
          <Text
            style={[
              dynamicStyles.chevron,
              { color: theme.colors.primary, fontWeight: '300', marginLeft: Math.round(theme.spacing.xs * compactFactor) },
            ]}
            testID={testID ? `${testID}-chevron` : undefined}
          >
            ›
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    // padding and borderRadius set dynamically
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    // borderRadius set dynamically
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius, marginRight set dynamically
  },
  content: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom set dynamically
  },
  cartName: {
    flexShrink: 1,
    minWidth: 80,
    letterSpacing: -0.2,
    // fontSize, marginRight set dynamically
  },
  badge: {
    alignItems: 'center',
    // padding, borderRadius, minWidth set dynamically
  },
  badgeText: {
    fontWeight: '700',
    // fontSize set dynamically
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsText: {
    // fontSize set dynamically
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.5,
    // marginHorizontal set dynamically
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginLeft set dynamically
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius, marginRight set dynamically
  },
  // Status badge styles
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding, borderRadius, marginRight set dynamically
  },
  statusIcon: {
    // fontSize, marginRight set dynamically
  },
  statusLabel: {
    fontWeight: '600',
    // fontSize set dynamically
  },
  // Cart total style
  cartTotalText: {
    fontWeight: '600',
    // fontSize set dynamically
  },
  // Disabled action styles
  disabledAction: {
    opacity: 0.5,
  },
  disabledActionIcon: {
    opacity: 0.5,
  },
});

export default CartListItem;
