/**
 * MetricsGrid Component
 * Displays key metrics in a grid of summary cards
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { SummaryCard } from '../../../presentation/components/dashboard/SummaryCard';
import { MetricsGridProps } from '../types/reports.types';

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
};

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error TS6133: kept for future use
  _isLoading = false,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');

  const metricCards = [
    {
      id: 'totalSales',
      title: t('reports.totalSales', 'Total Sales'),
      value: `₹${formatCurrency(metrics.totalSales)}`,
      icon: '💰',
      colorVariant: 'primary' as const,
    },
    {
      id: 'totalCarts',
      title: t('reports.totalCarts', 'Total Carts'),
      value: metrics.totalCarts.toString(),
      icon: '🛒',
      colorVariant: 'info' as const,
    },
    {
      id: 'itemsSold',
      title: t('reports.itemsSold', 'Items Sold'),
      value: metrics.totalItemsSold.toString(),
      icon: '📦',
      colorVariant: 'success' as const,
    },
    {
      id: 'avgCartValue',
      title: t('reports.avgCartValue', 'Avg Cart Value'),
      value: `₹${formatCurrency(metrics.averageCartValue)}`,
      icon: '📊',
      colorVariant: 'warning' as const,
    },
  ];

  return (
    <View style={[styles.container, {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.smd,
    }]} testID={testID}>
      <View style={[styles.row, { gap: theme.spacing.smd }]}>
        {metricCards.slice(0, 2).map((card, index) => (
          <View key={card.id} style={styles.cardWrapper}>
            <SummaryCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorVariant={card.colorVariant}
              testID={`metric-${card.id}`}
              animationDelay={index * 50}
            />
          </View>
        ))}
      </View>
      <View style={[styles.row, { gap: theme.spacing.smd }]}>
        {metricCards.slice(2, 4).map((card, index) => (
          <View key={card.id} style={styles.cardWrapper}>
            <SummaryCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorVariant={card.colorVariant}
              testID={`metric-${card.id}`}
              animationDelay={(index + 2) * 50}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingHorizontal, gap applied inline via theme tokens
  },
  row: {
    flexDirection: 'row',
    // gap applied inline via theme tokens
  },
  cardWrapper: {
    flex: 1,
  },
});

export default MetricsGrid;
