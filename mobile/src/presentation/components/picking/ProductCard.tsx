/**
 * ProductCard Component
 * Individual product card for the responsive grid picking screen
 * Touch targets meet WCAG 48px minimum; accessibility labels for screen readers
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';

/**
 * Format item price as compact INR string (₹120, not ₹120.00)
 */
const formatItemPrice = (price: number): string => `₹${price}`;
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item } from '../../../domain/types/picking';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';

interface ProductCardProps {
  item: Item;
  categoryIcon: string;
  quantityInCart: number;
  /** Pre-formatted quantity with unit (e.g. "250 gm") for display in stepper */
  formattedQuantity?: string;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress: () => void;
  testID?: string;
  /** When true, buttons are disabled and a loading indicator is shown (backend sync in progress) */
  isPending?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  categoryIcon,
  quantityInCart,
  formattedQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
  testID,
  isPending = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const isInCart = quantityInCart > 0;
  const productName = getTranslatedItemName(item);

  // Quantity button size: meets WCAG 48px minimum
  const btnSize = isTablet ? 48 : 44;
  const btnHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isInCart ? theme.colors.inCartBackground : theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          margin: theme.spacing.xs,
          borderWidth: isInCart ? 1.5 : 0,
          borderColor: isInCart ? theme.colors.inCartBorder : 'transparent',
        },
        theme.shadows.sm,
      ]}
      testID={testID}
    >
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        accessibilityLabel={productName}
        accessibilityRole="button"
        accessibilityHint={isInCart ? `${quantityInCart} in cart` : t('picking.add')}
        testID={testID ? `${testID}-pressable` : undefined}
      >
        {/* Product Info */}
        <View
          style={[
            styles.infoContainer,
            {
              padding: theme.spacing.smd,
              paddingTop: isInCart ? theme.spacing.smd : theme.spacing.md,
            },
          ]}
        >
          {/* In Cart Badge */}
          {isInCart && (
            <View
              style={[
                styles.inCartBadge,
                {
                  backgroundColor: theme.colors.inCartBadge,
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.inCartText,
                  {
                    color: theme.colors.textInverse,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                {t('picking.inCart')}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.productName,
              {
                color: theme.colors.text,
                fontSize: isTablet
                  ? theme.typography.fontSize['2xl']
                  : theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                lineHeight: isTablet ? 28 : 24,
              },
            ]}
            numberOfLines={2}
          >
            {productName}
          </Text>
          <Text
            style={[
              styles.quantityUnit,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet
                  ? theme.typography.fontSize.xl
                  : theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.regular,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {item.defaultQuantity} {item.unit}
          </Text>

          {/* Price display */}
          {item.price !== undefined && (
            <View
              style={[styles.priceRow, { marginTop: theme.spacing.xs }]}
              testID={testID ? `${testID}-price` : undefined}
            >
              <Text
                style={[
                  styles.priceText,
                  {
                    color: theme.colors.primary,
                    fontSize: isTablet
                      ? theme.typography.fontSize.xl
                      : theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                {formatItemPrice(item.price)}
              </Text>
              {item.mrp !== undefined && item.mrp > item.price && (
                <Text
                  style={[
                    styles.mrpText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: isTablet
                        ? theme.typography.fontSize.md
                        : theme.typography.fontSize.sm,
                    },
                  ]}
                  testID={testID ? `${testID}-mrp` : undefined}
                >
                  {formatItemPrice(item.mrp)}
                </Text>
              )}
            </View>
          )}
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionContainer,
          {
            paddingHorizontal: theme.spacing.smd,
            paddingBottom: theme.spacing.smd,
          },
        ]}
      >
        {isInCart ? (
          <View
            style={[
              styles.quantityControls,
              {
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xs,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.quantityBtn,
                {
                  backgroundColor: theme.colors.surface,
                  width: btnSize,
                  height: btnSize,
                  borderRadius: btnSize / 2,
                  opacity: isPending ? 0.5 : 1,
                },
              ]}
              onPress={onDecrement}
              activeOpacity={0.7}
              hitSlop={btnHitSlop}
              disabled={isPending}
              accessibilityLabel={`Decrease quantity of ${productName}`}
              accessibilityRole="button"
              testID={testID ? `${testID}-decrement` : undefined}
            >
              <Text
                style={[
                  styles.quantityBtnText,
                  {
                    color: theme.colors.text,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                -
              </Text>
            </TouchableOpacity>

            {isPending ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.text}
                testID={testID ? `${testID}-loading` : undefined}
                style={{ minWidth: isTablet ? 40 : 32 }}
              />
            ) : (
              <Text
                style={[
                  styles.quantityValue,
                  {
                    color: theme.colors.text,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.bold,
                    minWidth: isTablet ? 40 : 32,
                  },
                ]}
                accessibilityLabel={`${formattedQuantity || quantityInCart} in cart`}
                accessibilityRole="text"
                testID={testID ? `${testID}-quantity` : undefined}
              >
                {formattedQuantity || quantityInCart}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.quantityBtn,
                {
                  backgroundColor: theme.colors.buttonPrimary,
                  width: btnSize,
                  height: btnSize,
                  borderRadius: btnSize / 2,
                  opacity: isPending ? 0.5 : 1,
                },
              ]}
              onPress={onIncrement}
              activeOpacity={0.7}
              hitSlop={btnHitSlop}
              disabled={isPending}
              accessibilityLabel={`Increase quantity of ${productName}`}
              accessibilityRole="button"
              testID={testID ? `${testID}-increment` : undefined}
            >
              <Text
                style={[
                  styles.quantityBtnText,
                  {
                    color: theme.colors.textInverse,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: theme.colors.buttonPrimary,
                borderRadius: theme.borderRadius.xl,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.lg,
                opacity: isPending ? 0.5 : 1,
              },
            ]}
            onPress={onAdd}
            activeOpacity={0.8}
            disabled={isPending}
            accessibilityLabel={`Add ${productName} to cart`}
            accessibilityRole="button"
            testID={testID ? `${testID}-add-button` : undefined}
          >
            {isPending ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.buttonPrimaryText}
                testID={testID ? `${testID}-loading` : undefined}
              />
            ) : (
              <Text
                style={[
                  styles.addButtonText,
                  {
                    color: theme.colors.buttonPrimaryText,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                {t('picking.add')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
  },
  inCartBadge: {
    alignSelf: 'flex-end',
  },
  inCartText: {
    textTransform: 'uppercase',
  },
  infoContainer: {},
  productName: {},
  quantityUnit: {},
  actionContainer: {},
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {},
  quantityValue: {
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
  },
  addButtonText: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {},
  mrpText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
});

export default ProductCard;
