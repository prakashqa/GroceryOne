/**
 * TopProductsList Component
 * Displays top selling products ranked by revenue
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../../presentation/theme';
import { TopProductsListProps, TopProduct } from '../types/reports.types';

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface ProductItemProps {
  product: TopProduct;
  rank: number;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, rank }) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();

  const getRankBadgeColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.productItem,
        {
          backgroundColor: isDarkMode
            ? theme.colors.card
            : theme.colors.surface,
          borderBottomColor: theme.colors.border,
          padding: theme.spacing.smd,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.rankBadge,
          {
            backgroundColor: getRankBadgeColor(rank) + '20',
            borderRadius: theme.borderRadius.lg,
            marginRight: theme.spacing.smd,
          },
        ]}
      >
        <Text
          style={[
            styles.rankText,
            {
              color: rank <= 3 ? getRankBadgeColor(rank) : theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.bold,
            },
          ]}
        >
          {rank}
        </Text>
      </View>

      <View style={[styles.productInfo, { marginRight: theme.spacing.smd }]}>
        <Text
          style={[styles.productName, {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.medium,
          }]}
          numberOfLines={1}
        >
          {product.itemName}
        </Text>
        {product.categoryName && (
          <Text
            style={[
              styles.categoryName,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
            numberOfLines={1}
          >
            {product.categoryName}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.revenue, {
          color: theme.colors.primary,
          fontSize: theme.typography.fontSize.md,
          fontWeight: theme.typography.fontWeight.semibold,
        }]}>
          {formatCurrency(product.revenue)}
        </Text>
        <Text
          style={[styles.quantity, {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }]}
        >
          {parseFloat(product.quantity.toFixed(2))} sold
        </Text>
      </View>
    </View>
  );
};

export const TopProductsList: React.FC<TopProductsListProps> = ({
  products,
  limit = 10,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error TS6133: kept for future use
  _isLoading = false,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');

  const displayProducts = products.slice(0, limit);

  if (displayProducts.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.emptyContainer,
          {
            backgroundColor: isDarkMode
              ? theme.colors.card
              : theme.colors.surface,
            marginHorizontal: theme.spacing.md,
            marginVertical: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
          },
        ]}
        testID={testID}
      >
        <Text style={[styles.emptyText, {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.md,
        }]}>
          {t('reports.noProductsData', 'No product data for this period')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? theme.colors.card
            : theme.colors.surface,
          marginHorizontal: theme.spacing.md,
          marginVertical: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      testID={testID}
    >
      <Text style={[styles.title, {
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
      }]}>
        {t('reports.topProducts', 'Top Products')}
      </Text>

      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.itemId}
        renderItem={({ item, index }) => (
          <ProductItem product={item} rank={index + 1} />
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginHorizontal, marginVertical, borderRadius applied inline via theme tokens
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // padding applied inline via theme tokens
  },
  emptyText: {
    // fontSize applied inline via theme tokens
    textAlign: 'center',
  },
  title: {
    // fontSize, fontWeight, padding, paddingBottom applied inline via theme tokens
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding, paddingHorizontal applied inline via theme tokens
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankBadge: {
    width: 28,
    height: 28,
    // borderRadius, marginRight applied inline via theme tokens
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  productInfo: {
    flex: 1,
    // marginRight applied inline via theme tokens
  },
  productName: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  categoryName: {
    // fontSize applied inline via theme tokens
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  revenue: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  quantity: {
    // fontSize applied inline via theme tokens
    marginTop: 2,
  },
});

export default TopProductsList;
