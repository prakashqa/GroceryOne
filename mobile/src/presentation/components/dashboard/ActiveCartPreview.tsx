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
import { useDeviceType, useResponsiveStyles } from '../../../hooks';

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
  const responsiveStyles = useResponsiveStyles();

  // Responsive font sizes derived from theme scale + device fontScale multiplier
  const labelFontSize = Math.round(theme.typography.fontSize.xs * responsiveStyles.fontScale);
  const cartNameFontSize = Math.round(theme.typography.fontSize.lg * responsiveStyles.fontScale);
  const btnFontSize = Math.round(theme.typography.fontSize.md * responsiveStyles.fontScale);
  const statValueFontSize = Math.round(theme.typography.fontSize.xxl * responsiveStyles.fontScale);
  const totalValueFontSize = Math.round(theme.typography.fontSize.xl * responsiveStyles.fontScale);
  const iconSize = responsiveStyles.iconContainerSize;

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
            borderRadius: responsiveStyles.cardBorderRadius + 2,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
          theme.shadows.md,
          style,
        ]}
      >
        {/* Highlight strip at top */}
        <View style={[styles.highlightStrip, { backgroundColor: highlightColor }, !isTablet && { height: 3 }, isTablet && { height: 5 }]} />

        <View style={[styles.content, { padding: responsiveStyles.componentPadding * 0.75 }]}>
          <View style={[styles.header, { marginBottom: responsiveStyles.componentPadding * 0.75 }]}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.cartIconContainer,
                {
                  backgroundColor: `${theme.colors.primary}20`,
                  width: iconSize,
                  height: iconSize,
                  borderRadius: responsiveStyles.cardBorderRadius,
                  marginRight: theme.spacing.smd,
                },
              ]}>
                <Text style={[styles.cartIcon, { fontSize: responsiveStyles.iconSize }]}>🛒</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[
                  styles.label,
                  { color: theme.colors.textSecondary, fontSize: labelFontSize },
                ]}>
                  {t('dashboard.activeCart')}
                </Text>
                <Text
                  style={[
                    styles.cartName,
                    { color: theme.colors.text, fontSize: cartNameFontSize },
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
                {
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
              testID={testID ? `${testID}-continue-btn` : undefined}
            >
              <Text style={[
                styles.continueBtnText,
                { color: theme.colors.buttonPrimaryText, fontSize: btnFontSize },
              ]}>
                {t('dashboard.continue')}
              </Text>
              <Text style={[
                styles.continueBtnArrow,
                { color: theme.colors.buttonPrimaryText, fontSize: btnFontSize + 2 },
              ]}>
                →
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[
            styles.statsContainer,
            {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
              borderRadius: responsiveStyles.cardBorderRadius,
              padding: responsiveStyles.componentPadding * 0.65,
            },
          ]}>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text, fontSize: statValueFontSize },
                ]}>
                  {categoryCount}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary, fontSize: labelFontSize },
                ]}>
                  {t('dashboard.categories')}
                </Text>
              </View>
              <View style={[
                styles.statDivider,
                { backgroundColor: borderColor, height: Math.round(iconSize * 0.65) },
              ]} />
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text, fontSize: statValueFontSize },
                ]}>
                  {itemCount}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary, fontSize: labelFontSize },
                ]}>
                  {t('dashboard.uniqueItems')}
                </Text>
              </View>
              <View style={[
                styles.statDivider,
                { backgroundColor: borderColor, height: Math.round(iconSize * 0.65) },
              ]} />
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  { color: theme.colors.text, fontSize: statValueFontSize },
                ]}>
                  {totalQuantity}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary, fontSize: labelFontSize },
                ]}>
                  {t('dashboard.qty')}
                </Text>
              </View>
              {totalAmount !== undefined && totalAmount > 0 && (
                <>
                  <View style={[
                    styles.statDivider,
                    { backgroundColor: borderColor, height: Math.round(iconSize * 0.65) },
                  ]} />
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statValue,
                      styles.totalValue,
                      { color: theme.colors.primary, fontSize: totalValueFontSize },
                    ]}>
                      {formatCurrency(totalAmount)}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary, fontSize: labelFontSize },
                    ]}>
                      {t('dashboard.total', 'total')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {lastUpdated && (
            <View style={[styles.footer, { marginTop: theme.spacing.smd }]}>
              <View style={[
                styles.dot,
                { backgroundColor: theme.colors.success },
              ]} />
              <Text style={[
                styles.lastUpdated,
                { color: theme.colors.textLight, fontSize: labelFontSize },
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
