/**
 * CategoryBreakdown Component
 * Displays sales breakdown by category as a pie chart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../../presentation/theme';
import { CategoryBreakdownProps, CategorySalesData } from '../types/reports.types';
import { assignCategoryColors } from '../utils/reportCalculations';

const { width: screenWidth } = Dimensions.get('window');

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

interface LegendItemProps {
  category: CategorySalesData;
}

const LegendItem: React.FC<LegendItemProps> = ({ category }) => {
  const theme = useTheme();

  return (
    <View style={[styles.legendItem, { marginBottom: theme.spacing.sm }]}>
      <View style={[styles.legendDot, {
        backgroundColor: category.color,
        borderRadius: theme.borderRadius.xs,
        marginRight: theme.spacing.sm,
      }]} />
      <View style={styles.legendInfo}>
        <Text
          style={[styles.legendName, {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }]}
          numberOfLines={1}
        >
          {category.categoryIcon} {category.categoryName}
        </Text>
        <Text
          style={[styles.legendValue, {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }]}
        >
          {formatCurrency(category.totalRevenue)} ({category.percentage.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  isLoading = false,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');

  // Assign colors to categories
  const coloredData = assignCategoryColors(data);

  // Transform data for pie chart
  const pieData = coloredData.map((category) => ({
    value: category.totalRevenue,
    color: category.color,
    text: `${category.percentage.toFixed(0)}%`,
    textColor: '#FFFFFF',
    textSize: 10,
  }));

  // Calculate total revenue
  const totalRevenue = data.reduce((sum, cat) => sum + cat.totalRevenue, 0);

  if (data.length === 0 || totalRevenue === 0) {
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
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        testID={testID}
      >
        <Text style={[styles.emptyText, {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.md,
        }]}>
          {t('reports.noCategoryData', 'No category data for this period')}
        </Text>
      </View>
    );
  }

  const chartRadius = Math.min(screenWidth * 0.3, 100);

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
        {t('reports.categoryBreakdown', 'Sales by Category')}
      </Text>

      <View style={styles.content}>
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            radius={chartRadius}
            innerRadius={chartRadius * 0.5}
            showText
            textSize={theme.typography.fontSize.xs}
            textColor="#FFFFFF"
            showValuesAsLabels
            focusOnPress
            isAnimated
          />
          <View style={styles.centerLabel}>
            <Text
              style={[styles.centerTotal, {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.bold,
              }]}
            >
              {formatCurrency(totalRevenue)}
            </Text>
            <Text
              style={[
                styles.centerSubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
            >
              {t('reports.total', 'Total')}
            </Text>
          </View>
        </View>

        <View style={[styles.legendContainer, { marginLeft: theme.spacing.md }]}>
          {coloredData.slice(0, 5).map((category) => (
            <LegendItem key={category.categoryId} category={category} />
          ))}
          {coloredData.length > 5 && (
            <Text
              style={[
                styles.moreText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              +{coloredData.length - 5} {t('reports.more', 'more')}
            </Text>
          )}
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotal: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  centerSubtitle: {
    // fontSize applied inline via theme tokens
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    // marginLeft applied inline via theme tokens
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom applied inline via theme tokens
  },
  legendDot: {
    width: 10,
    height: 10,
    // borderRadius, marginRight applied inline via theme tokens
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  legendValue: {
    // fontSize applied inline via theme tokens
    marginTop: 1,
  },
  moreText: {
    // fontSize, marginTop applied inline via theme tokens
  },
});

export default CategoryBreakdown;
