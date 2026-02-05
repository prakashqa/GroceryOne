/**
 * RecentCartsList Component
 * Displays a list of recently updated carts with staggered animations
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useDeviceType } from '../../../hooks';

type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

export interface RecentCart {
  /**
   * Unique cart identifier
   */
  id: string;
  /**
   * Cart name
   */
  name: string;
  /**
   * Current cart status
   */
  status: CartStatus;
  /**
   * Total amount of cart
   */
  totalAmount?: number;
  /**
   * Human-readable time since last update
   */
  timeAgo: string;
  /**
   * Number of items in cart
   */
  itemCount: number;
}

interface RecentCartsListProps {
  /**
   * Array of recent carts to display
   */
  carts: RecentCart[];
  /**
   * Callback when a cart is pressed
   */
  onCartPress: (cartId: string) => void;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;
}

/**
 * Format a number as INR currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get status badge config
 * Draft carts are styled with warning (orange) color, consistent with Manage Carts screen
 */
const getStatusConfig = (status: CartStatus, theme: ReturnType<typeof useTheme>) => {
  switch (status) {
    case 'completed':
      return {
        icon: '✓',
        color: theme.colors.success,
        bgColor: `${theme.colors.success}15`,
      };
    case 'paid':
      return {
        icon: '✅',
        color: theme.colors.success,
        bgColor: `${theme.colors.success}20`,
      };
    case 'printed':
      return {
        icon: '🖨',
        color: theme.colors.info,
        bgColor: `${theme.colors.info}15`,
      };
    default:
      // Draft carts use warning (orange) color consistent with Manage Carts screen
      return {
        icon: '✎',
        color: theme.colors.warning,
        bgColor: `${theme.colors.warning}20`,
      };
  }
};

interface CartItemProps {
  cart: RecentCart;
  index: number;
  isLast: boolean;
  onPress: (cartId: string) => void;
  theme: ReturnType<typeof useTheme>;
  cardBgColor: string;
  t: (key: string) => string;
  isTablet: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  cart,
  index,
  isLast,
  onPress,
  theme,
  cardBgColor,
  t,
  isTablet,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const statusConfig = getStatusConfig(cart.status, theme);

  useEffect(() => {
    const delay = 300 + index * 50; // Base delay + stagger
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index, theme.animation.normal]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getStatusLabel = (status: CartStatus): string => {
    switch (status) {
      case 'completed':
        return t('dashboard.completed');
      case 'paid':
        return t('dashboard.paid');
      case 'printed':
        return t('dashboard.printed');
      default:
        return t('dashboard.draft');
    }
  };

  return (
    <TouchableOpacity
      key={cart.id}
      onPress={() => onPress(cart.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={`recent-cart-${cart.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${cart.name}, ${getStatusLabel(cart.status)}, ${cart.totalAmount ? formatCurrency(cart.totalAmount) : ''}, ${cart.timeAgo}`}
    >
      <Animated.View
        style={[
          styles.cartItem,
          {
            backgroundColor: cardBgColor,
            borderBottomColor: theme.colors.divider,
            borderBottomWidth: isLast ? 0 : 1,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim },
            ],
          },
          isTablet && { paddingHorizontal: 20, paddingVertical: 18 },
        ]}
      >
        <View style={styles.cartItemLeft}>
          <View style={[styles.cartIconContainer, { backgroundColor: `${theme.colors.primary}10` }, isTablet && { width: 52, height: 52, borderRadius: 14, marginRight: 16 }]}>
            <Text style={[styles.cartIcon, isTablet && { fontSize: 24 }]}>📋</Text>
          </View>
          <View style={styles.cartInfo}>
            <Text
              style={[styles.cartName, { color: theme.colors.text }, isTablet && { fontSize: 19, marginBottom: 6 }]}
              numberOfLines={1}
            >
              {cart.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }, isTablet && { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }]}>
                <Text style={[styles.statusIcon, { color: statusConfig.color }, isTablet && { fontSize: 13 }]}>
                  {statusConfig.icon}
                </Text>
                <Text style={[styles.statusLabel, { color: statusConfig.color }, isTablet && { fontSize: 14 }]}>
                  {getStatusLabel(cart.status)}
                </Text>
              </View>
              <Text style={[styles.itemCount, { color: theme.colors.textSecondary }, isTablet && { fontSize: 15 }]}>
                {cart.itemCount} {t('dashboard.items')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cartItemRight}>
          {cart.totalAmount !== undefined && cart.totalAmount > 0 && (
            <Text style={[styles.cartAmount, { color: theme.colors.text }, isTablet && { fontSize: 19 }]}>
              {formatCurrency(cart.totalAmount)}
            </Text>
          )}
          <Text style={[styles.cartTime, { color: theme.colors.textLight }, isTablet && { fontSize: 14 }]}>
            {cart.timeAgo}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: theme.colors.textLight }, isTablet && { fontSize: 26 }]}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const RecentCartsList: React.FC<RecentCartsListProps> = ({
  carts,
  onCartPress,
  testID,
  style,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const { isTablet } = useDeviceType();

  // Header animation
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: theme.animation.normal,
      delay: 250,
      useNativeDriver: true,
    }).start();
  }, [headerFadeAnim, theme.animation.normal]);

  const cardBgColor = isDarkMode ? theme.colors.card : theme.colors.surface;
  const isEmpty = carts.length === 0;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
        <Text style={[styles.title, { color: theme.colors.text }, isTablet && { fontSize: 20 }]}>
          {t('dashboard.recentCarts')}
        </Text>
      </Animated.View>

      <View
        style={[
          styles.listContainer,
          { backgroundColor: cardBgColor },
          theme.shadows.sm,
        ]}
      >
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.colors.primary}10` }, isTablet && { width: 70, height: 70, borderRadius: 18 }]}>
              <Text style={[styles.emptyIcon, isTablet && { fontSize: 32 }]}>📋</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }, isTablet && { fontSize: 19 }]}>
              {t('dashboard.noRecentCarts')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }, isTablet && { fontSize: 16 }]}>
              {t('dashboard.startByCreating', 'Create a cart to get started')}
            </Text>
          </View>
        ) : (
          carts.map((cart, index) => (
            <CartItem
              key={cart.id}
              cart={cart}
              index={index}
              isLast={index === carts.length - 1}
              onPress={onCartPress}
              theme={theme}
              cardBgColor={cardBgColor}
              t={t}
              isTablet={isTablet}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartIcon: {
    fontSize: 18,
  },
  cartInfo: {
    flex: 1,
  },
  cartName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  statusIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 12,
  },
  cartItemRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  cartAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  cartTime: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
  },
});

export default RecentCartsList;
