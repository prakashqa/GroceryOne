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

  // Inventory status
  const isStockTracked = item.trackInventory ?? false;
  const isOutOfStock = isStockTracked && (item.stockQuantity ?? 0) <= 0;
  const isLowStock = isStockTracked && !isOutOfStock
    && (item.stockQuantity ?? 0) <= (item.lowStockThreshold ?? 10);

  // Quantity button size: meets WCAG 48px minimum
  const btnSize = isTablet ? 48 : 44;
  const btnHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isInCart ? theme.colors.inCartBackground : theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          margin: theme.spacing.xs,
          borderWidth: isInCart ? 0 : 0,
          borderColor: 'transparent',
        },
        theme.shadows.md,
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
              padding: theme.spacing.md,
              paddingBottom: theme.spacing.xs,
            },
          ]}
        >
          {/* Out of Stock Badge */}
          {isOutOfStock && !isInCart && (
            <View
              style={[
                styles.inCartBadge,
                {
                  backgroundColor: theme.colors.error || '#ff6b6b',
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  marginBottom: theme.spacing.xs,
                },
              ]}
              testID={testID ? `${testID}-out-of-stock` : undefined}
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
                {t('picking.outOfStock', { defaultValue: 'OUT OF STOCK' })}
              </Text>
            </View>
          )}
          {/* Low Stock Badge */}
          {isLowStock && !isInCart && (
            <View
              style={[
                styles.inCartBadge,
                {
                  backgroundColor: theme.colors.warning || '#f5a623',
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  marginBottom: theme.spacing.xs,
                },
              ]}
              testID={testID ? `${testID}-low-stock` : undefined}
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
                {t('picking.lowStock', { defaultValue: 'LOW STOCK' })}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.productName,
              {
                color: theme.colors.text,
                fontSize: isTablet
                  ? Math.round(theme.typography.fontSize['2xl'] * 0.9)
                  : Math.round(theme.typography.fontSize.xl * 0.9),
                fontWeight: theme.typography.fontWeight.semibold,
                lineHeight: isTablet ? 25 : 22,
              },
            ]}
            numberOfLines={1}
          >
            {productName}
          </Text>
          <Text
            style={[
              styles.quantityUnit,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
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
              style={[styles.priceRow, { marginTop: theme.spacing.sm }]}
              testID={testID ? `${testID}-price` : undefined}
            >
              <Text
                style={[
                  styles.priceText,
                  {
                    color: theme.colors.text,
                    fontSize: isTablet
                      ? theme.typography.fontSize.xxl
                      : theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
              >
                {formatItemPrice(item.price)}
              </Text>
              {item.mrp !== undefined && item.mrp > item.price && (
                <>
                  <Text
                    style={[
                      styles.mrpText,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: isTablet
                          ? theme.typography.fontSize.md
                          : theme.typography.fontSize.sm,
                        opacity: 0.5,
                      },
                    ]}
                    testID={testID ? `${testID}-mrp` : undefined}
                  >
                    {formatItemPrice(item.mrp)}
                  </Text>
                  <View
                    style={[
                      styles.discountBadge,
                      {
                        backgroundColor: theme.colors.successBackground,
                        borderRadius: theme.borderRadius.xs,
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        marginLeft: 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.success,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.bold,
                      }}
                    >
                      {`-${Math.round(((item.mrp - item.price) / item.mrp) * 100)}%`}
                    </Text>
                  </View>
                </>
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
            paddingHorizontal: theme.spacing.md,
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
                borderWidth: 1,
                borderColor: theme.colors.border,
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
                backgroundColor: isOutOfStock ? theme.colors.textLight : theme.colors.buttonPrimary,
                borderRadius: theme.borderRadius.full,
                height: 40,
                opacity: isPending || isOutOfStock ? 0.5 : 1,
              },
            ]}
            onPress={onAdd}
            activeOpacity={0.8}
            disabled={isPending || isOutOfStock}
            accessibilityLabel={isOutOfStock ? `${productName} out of stock` : `Add ${productName} to cart`}
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
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                + {t('picking.add')}
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
    justifyContent: 'center',
    width: '100%',
  },
  discountBadge: {},
  addButtonText: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {},
  mrpText: {
    textDecorationLine: 'line-through',
  },
});

export default ProductCard;
