/**
 * ProductCard Component
 * Individual product card for the 2-column grid picking screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';
import { Item } from '../../../domain/types/picking';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';

interface ProductCardProps {
  item: Item;
  categoryIcon: string;
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress: () => void;
  testID?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  categoryIcon,
  quantityInCart,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  const isInCart = quantityInCart > 0;

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
        testID={testID ? `${testID}-pressable` : undefined}
      >
        {/* Image Placeholder */}
        <View
          style={[
            styles.imagePlaceholder,
            {
              backgroundColor: isDarkMode
                ? theme.colors.background
                : '#F5F5F5',
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              height: isTablet ? 120 : 100,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryIconLarge,
              {
                fontSize: isTablet
                  ? theme.typography.fontSize.lg * 2.5
                  : theme.typography.fontSize.lg * 2,
              },
            ]}
          >
            {categoryIcon}
          </Text>
        </View>

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
                top: theme.spacing.sm,
                right: theme.spacing.sm,
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

        {/* Product Info */}
        <View
          style={[
            styles.infoContainer,
            {
              padding: theme.spacing.smd,
            },
          ]}
        >
          <Text
            style={[
              styles.productName,
              {
                color: theme.colors.text,
                fontSize: isTablet
                  ? theme.typography.fontSize.lg
                  : theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
            numberOfLines={2}
          >
            {getTranslatedItemName(item)}
          </Text>
          <Text
            style={[
              styles.quantityUnit,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet
                  ? theme.typography.fontSize.md
                  : theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.regular,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {item.defaultQuantity} {item.unit}
          </Text>
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
                  width: isTablet ? 36 : 32,
                  height: isTablet ? 36 : 32,
                  borderRadius: (isTablet ? 36 : 32) / 2,
                },
              ]}
              onPress={onDecrement}
              activeOpacity={0.7}
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
              testID={testID ? `${testID}-quantity` : undefined}
            >
              {quantityInCart}
            </Text>

            <TouchableOpacity
              style={[
                styles.quantityBtn,
                {
                  backgroundColor: theme.colors.buttonPrimary,
                  width: isTablet ? 36 : 32,
                  height: isTablet ? 36 : 32,
                  borderRadius: (isTablet ? 36 : 32) / 2,
                },
              ]}
              onPress={onIncrement}
              activeOpacity={0.7}
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
              },
            ]}
            onPress={onAdd}
            activeOpacity={0.8}
            testID={testID ? `${testID}-add-button` : undefined}
          >
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
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconLarge: {},
  inCartBadge: {
    position: 'absolute',
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
});

export default ProductCard;
