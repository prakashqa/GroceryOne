/**
 * ActiveCartPreview Component
 * Shows a preview of the current active cart on the dashboard with polish
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

interface ActiveCartPreviewProps {
  /**
   * Name of the active cart
   */
  cartName: string;
  /**
   * Number of unique categories in cart
   */
  categoryCount: number;
  /**
   * Number of unique items in cart
   */
  itemCount: number;
  /**
   * Total quantity of all items
   */
  totalQuantity: number;
  /**
   * Total amount (optional, shown if available)
   */
  totalAmount?: number;
  /**
   * Human-readable time since last update
   */
  lastUpdated?: string;
  /**
   * Callback when user wants to continue with cart
   */
  onContinue: () => void;
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

export const ActiveCartPreview: React.FC<ActiveCartPreviewProps> = ({
  cartName,
  categoryCount,
  itemCount,
  totalQuantity,
  totalAmount,
  lastUpdated,
  onContinue,
  testID,
  style,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const { isTablet } = useDeviceType();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        delay: 200, // Slight delay after other dashboard elements
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, theme.animation.normal]);

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

  const cardBgColor = theme.colors.inCartBackground;
  const borderColor = theme.colors.inCartBorder;
  const highlightColor = isDarkMode ? theme.colors.primary : theme.colors.primaryLight;

  const accessibilityLabel = `${t('dashboard.activeCart')}: ${cartName}, ${categoryCount} ${t('dashboard.categories')}, ${itemCount} ${t('dashboard.uniqueItems')}, ${totalQuantity} ${t('dashboard.qty')}${totalAmount ? `, ${formatCurrency(totalAmount)}` : ''}`;

  return (
    <TouchableOpacity
      onPress={onContinue}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
          // Mobile: reduce border radius by 20%
          !isTablet && { borderRadius: 13 },
          // Tablet: increase border radius
          isTablet && { borderRadius: 20 },
          theme.shadows.md,
          style,
        ]}
      >
        {/* Highlight strip at top */}
        <View style={[styles.highlightStrip, { backgroundColor: highlightColor }, !isTablet && { height: 3 }, isTablet && { height: 5 }]} />

        <View style={[styles.content, !isTablet && { padding: 12 }, isTablet && { padding: 20 }]}>
          <View style={[styles.header, !isTablet && { marginBottom: 12 }, isTablet && { marginBottom: 20 }]}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.cartIconContainer,
                { backgroundColor: `${theme.colors.primary}20` },
                !isTablet && { width: 36, height: 36, borderRadius: 10, marginRight: 10 },
                isTablet && { width: 56, height: 56, borderRadius: 16, marginRight: 16 },
              ]}>
                <Text style={[styles.cartIcon, !isTablet && { fontSize: 18 }, isTablet && { fontSize: 28 }]}>🛒</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[
                  styles.label,
                  { color: theme.colors.textSecondary },
                  !isTablet && { fontSize: 9 },
                  isTablet && { fontSize: 14 },
                ]}>
                  {t('dashboard.activeCart')}
                </Text>
                <Text
                  style={[
                    styles.cartName,
                    { color: theme.colors.text },
                    !isTablet && { fontSize: 14 },
                    isTablet && { fontSize: 21 },
                  ]}
                  numberOfLines={1}
                >
                  {cartName}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.continueBtn,
                { backgroundColor: theme.colors.primary },
                !isTablet && { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22 },
                isTablet && { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 30 },
              ]}
              testID={testID ? `${testID}-continue-btn` : undefined}
            >
              <Text style={[
                styles.continueBtnText,
                { color: theme.colors.buttonPrimaryText },
                !isTablet && { fontSize: 13 },
                isTablet && { fontSize: 19 },
              ]}>
                {t('dashboard.continue')}
              </Text>
              <Text style={[
                styles.continueBtnArrow,
                { color: theme.colors.buttonPrimaryText },
                !isTablet && { fontSize: 15 },
                isTablet && { fontSize: 22 },
              ]}>
                →
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[
            styles.statsContainer,
            { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' },
            !isTablet && { borderRadius: 10, padding: 10 },
            isTablet && { borderRadius: 16, padding: 16 },
          ]}>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text },
                  !isTablet && { fontSize: 18 },
                  isTablet && { fontSize: 28 },
                ]}>
                  {categoryCount}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                  !isTablet && { fontSize: 9 },
                  isTablet && { fontSize: 14 },
                ]}>
                  {t('dashboard.categories')}
                </Text>
              </View>
              <View style={[
                styles.statDivider,
                { backgroundColor: borderColor },
                !isTablet && { height: 28 },
                isTablet && { height: 44 },
              ]} />
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text },
                  !isTablet && { fontSize: 18 },
                  isTablet && { fontSize: 28 },
                ]}>
                  {itemCount}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                  !isTablet && { fontSize: 9 },
                  isTablet && { fontSize: 14 },
                ]}>
                  {t('dashboard.uniqueItems')}
                </Text>
              </View>
              <View style={[
                styles.statDivider,
                { backgroundColor: borderColor },
                !isTablet && { height: 28 },
                isTablet && { height: 44 },
              ]} />
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text },
                  !isTablet && { fontSize: 18 },
                  isTablet && { fontSize: 28 },
                ]}>
                  {totalQuantity}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                  !isTablet && { fontSize: 9 },
                  isTablet && { fontSize: 14 },
                ]}>
                  {t('dashboard.qty')}
                </Text>
              </View>
              {totalAmount !== undefined && totalAmount > 0 && (
                <>
                  <View style={[
                    styles.statDivider,
                    { backgroundColor: borderColor },
                    !isTablet && { height: 28 },
                    isTablet && { height: 44 },
                  ]} />
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statValue,
                      styles.totalValue,
                      { color: theme.colors.primary },
                      !isTablet && { fontSize: 14 },
                      isTablet && { fontSize: 24 },
                    ]}>
                      {formatCurrency(totalAmount)}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                      !isTablet && { fontSize: 9 },
                      isTablet && { fontSize: 14 },
                    ]}>
                      {t('dashboard.total', 'total')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {lastUpdated && (
            <View style={[styles.footer, !isTablet && { marginTop: 10 }, isTablet && { marginTop: 16 }]}>
              <View style={[
                styles.dot,
                { backgroundColor: theme.colors.success },
                !isTablet && { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
                isTablet && { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
              ]} />
              <Text style={[
                styles.lastUpdated,
                { color: theme.colors.textLight },
                !isTablet && { fontSize: 9 },
                isTablet && { fontSize: 14 },
              ]}>
                {lastUpdated}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  highlightStrip: {
    height: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartIcon: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cartName: {
    fontSize: 17,
    fontWeight: '700',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  continueBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    borderRadius: 12,
    padding: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 36,
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  lastUpdated: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default ActiveCartPreview;
