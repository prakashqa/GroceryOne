/**
 * SalesChart Component
 * Displays sales trend as a bar chart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../../presentation/theme';
import { SalesChartProps } from '../types/reports.types';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLoading = false,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');

  // Transform data for chart
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const chartData = data.map((point, index) => ({
    value: point.sales,
    label: point.label,
    frontColor: theme.colors.primary,
    topLabelComponent: () =>
      point.sales > 0 ? (
        <Text
          style={[styles.topLabel, {
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xs,
          }]}
        >
          {formatCurrency(point.sales)}
        </Text>
      ) : null,
  }));

  // Calculate chart dimensions
  const chartWidth = screenWidth - 64; // Account for padding
  const barWidth = Math.min(
    30,
    Math.max(20, (chartWidth - data.length * 8) / data.length)
  );
  const spacing = Math.min(15, Math.max(5, (chartWidth - data.length * barWidth) / (data.length + 1)));

  // Find max value for y-axis
  const maxValue = Math.max(...data.map((d) => d.sales), 100);
  const roundedMax = Math.ceil(maxValue / 100) * 100;

  // No data state
  if (data.length === 0 || data.every((d) => d.sales === 0)) {
    return (
      <View style={[styles.container, styles.emptyContainer, {
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
      }]} testID={testID}>
        <Text style={[styles.emptyText, {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.md,
        }]}>
          {t('reports.noSalesData', 'No sales data for this period')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? theme.colors.card : theme.colors.surface,
          marginHorizontal: theme.spacing.md,
          marginVertical: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      testID={testID}
    >
      <Text style={[styles.title, {
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.md,
      }]}>
        {t('reports.salesTrend', 'Sales Trend')}
      </Text>

      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          barWidth={barWidth}
          spacing={spacing}
          noOfSections={4}
          maxValue={roundedMax}
          yAxisTextStyle={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.xs,
          }}
          xAxisLabelTextStyle={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.xs,
            textAlign: 'center',
          }}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={theme.colors.border}
          rulesType="solid"
          rulesColor={theme.colors.border}
          barBorderRadius={theme.borderRadius.xs}
          isAnimated
          animationDuration={500}
          formatYLabel={(label) => formatCurrency(Number(label))}
        />
      </View>

      <View style={[styles.legendContainer, { marginTop: theme.spacing.smd }]}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.xs,
              },
            ]}
          />
          <Text
            style={[styles.legendText, {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
            }]}
          >
            {t('reports.dailySales', 'Daily Sales')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginHorizontal, marginVertical, padding, borderRadius applied inline via theme tokens
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    // fontSize applied inline via theme tokens
    textAlign: 'center',
  },
  title: {
    // fontSize, fontWeight, marginBottom applied inline via theme tokens
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  topLabel: {
    fontSize: 8,
    // marginBottom applied inline via theme tokens
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginTop applied inline via theme tokens
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    // borderRadius applied inline via theme tokens
    marginRight: 6,
  },
  legendText: {
    // fontSize applied inline via theme tokens
  },
});

export default SalesChart;
