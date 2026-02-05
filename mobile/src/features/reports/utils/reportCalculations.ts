/**
 * Report Calculations
 * Functions to calculate report metrics from cart data
 */

import {
  ReportMetrics,
  SalesTrendPoint,
  TopProduct,
  CategorySalesData,
  DateRange,
} from '../types/reports.types';
import { ManagedCart, Category } from '../../../domain/types/picking';
import { isDateInRange, groupDatesByDay, formatDateForDisplay, getStartOfDay } from './dateRangeUtils';

/**
 * Filter carts by date range
 */
export const filterCartsByDateRange = (
  carts: ManagedCart[],
  dateRange: DateRange
): ManagedCart[] => {
  return carts.filter((cart) => isDateInRange(cart.createdAt, dateRange));
};

/**
 * Calculate aggregate report metrics from carts
 */
export const calculateReportMetrics = (carts: ManagedCart[]): ReportMetrics => {
  if (carts.length === 0) {
    return {
      totalSales: 0,
      totalCarts: 0,
      totalItemsSold: 0,
      totalQuantitySold: 0,
      averageCartValue: 0,
      paidCartsCount: 0,
      unpaidCartsCount: 0,
    };
  }

  const paidCarts = carts.filter((cart) => cart.status === 'paid');
  const unpaidCarts = carts.filter((cart) => cart.status !== 'paid');

  // Calculate total sales from paid amounts
  const totalSales = paidCarts.reduce(
    (sum, cart) => sum + (cart.paidAmount || 0),
    0
  );

  // Count unique items across all carts
  const uniqueItems = new Set<string>();
  let totalQuantity = 0;

  carts.forEach((cart) => {
    cart.items.forEach((item) => {
      uniqueItems.add(item.item.id);
      totalQuantity += item.quantity;
    });
  });

  // Calculate average cart value (only from paid carts)
  const averageCartValue =
    paidCarts.length > 0 ? totalSales / paidCarts.length : 0;

  return {
    totalSales,
    totalCarts: carts.length,
    totalItemsSold: uniqueItems.size,
    totalQuantitySold: totalQuantity,
    averageCartValue,
    paidCartsCount: paidCarts.length,
    unpaidCartsCount: unpaidCarts.length,
  };
};

/**
 * Calculate sales trend data grouped by day
 */
export const calculateSalesTrend = (
  carts: ManagedCart[],
  dateRange: DateRange
): SalesTrendPoint[] => {
  // Generate all dates in range
  const dates = groupDatesByDay(dateRange);

  // Create map for each date
  const trendMap = new Map<
    string,
    { sales: number; cartCount: number }
  >();

  // Initialize with zeros for all dates
  dates.forEach((date) => {
    const dateKey = getStartOfDay(new Date(date)).toISOString().split('T')[0];
    trendMap.set(dateKey, { sales: 0, cartCount: 0 });
  });

  // Aggregate cart data
  carts.forEach((cart) => {
    const dateKey = getStartOfDay(new Date(cart.createdAt))
      .toISOString()
      .split('T')[0];

    const existing = trendMap.get(dateKey);
    if (existing) {
      existing.cartCount += 1;

      // Only count sales from paid carts
      if (cart.status === 'paid' && cart.paidAmount) {
        existing.sales += cart.paidAmount;
      }
    }
  });

  // Convert to array
  return dates.map((date) => {
    const dateKey = getStartOfDay(new Date(date)).toISOString().split('T')[0];
    const data = trendMap.get(dateKey) || { sales: 0, cartCount: 0 };

    return {
      date,
      label: formatDateForDisplay(date, 'short'),
      sales: data.sales,
      cartCount: data.cartCount,
    };
  });
};

/**
 * Calculate top products by revenue
 */
export const calculateTopProducts = (
  carts: ManagedCart[],
  categories: Category[],
  limit: number = 10
): TopProduct[] => {
  // Filter to paid carts only
  const paidCarts = carts.filter((cart) => cart.status === 'paid');

  // Aggregate product data
  const productMap = new Map<
    string,
    {
      itemId: string;
      itemName: string;
      itemNameTe?: string;
      categoryId?: string;
      quantity: number;
      revenue: number;
      cartAppearances: Set<string>;
    }
  >();

  paidCarts.forEach((cart) => {
    cart.items.forEach((cartItem) => {
      const itemId = cartItem.item.id;
      const existing = productMap.get(itemId);

      const itemRevenue = (cartItem.priceSnapshot || 0) * cartItem.quantity;

      if (existing) {
        existing.quantity += cartItem.quantity;
        existing.revenue += itemRevenue;
        existing.cartAppearances.add(cart.id);
      } else {
        productMap.set(itemId, {
          itemId,
          itemName: cartItem.item.name,
          itemNameTe: cartItem.item.nameTe,
          categoryId: cartItem.item.categoryId,
          quantity: cartItem.quantity,
          revenue: itemRevenue,
          cartAppearances: new Set([cart.id]),
        });
      }
    });
  });

  // Convert to array and add category info
  const products: TopProduct[] = Array.from(productMap.values()).map(
    (product) => {
      const category = categories.find((c) => c.id === product.categoryId);

      return {
        itemId: product.itemId,
        itemName: product.itemName,
        itemNameTe: product.itemNameTe,
        categoryId: product.categoryId,
        categoryName: category?.name,
        quantity: product.quantity,
        revenue: product.revenue,
        cartAppearances: product.cartAppearances.size,
      };
    }
  );

  // Sort by revenue descending and limit
  return products
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

/**
 * Calculate sales breakdown by category
 */
export const calculateCategoryBreakdown = (
  carts: ManagedCart[],
  categories: Category[]
): CategorySalesData[] => {
  // Filter to paid carts only
  const paidCarts = carts.filter((cart) => cart.status === 'paid');

  // Aggregate by category
  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      totalRevenue: number;
      totalQuantity: number;
    }
  >();

  paidCarts.forEach((cart) => {
    cart.items.forEach((cartItem) => {
      const categoryId = cartItem.item.categoryId;
      const itemRevenue = (cartItem.priceSnapshot || 0) * cartItem.quantity;

      const existing = categoryMap.get(categoryId);

      if (existing) {
        existing.totalRevenue += itemRevenue;
        existing.totalQuantity += cartItem.quantity;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          totalRevenue: itemRevenue,
          totalQuantity: cartItem.quantity,
        });
      }
    });
  });

  // Calculate total revenue for percentage
  const totalRevenue = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.totalRevenue,
    0
  );

  // Convert to array with category info
  const breakdown: CategorySalesData[] = Array.from(categoryMap.values()).map(
    (catData) => {
      const category = categories.find((c) => c.id === catData.categoryId);

      return {
        categoryId: catData.categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryNameTe: category?.nameTe,
        categoryIcon: category?.icon,
        totalRevenue: catData.totalRevenue,
        totalQuantity: catData.totalQuantity,
        percentage: totalRevenue > 0 ? (catData.totalRevenue / totalRevenue) * 100 : 0,
      };
    }
  );

  // Sort by revenue descending
  return breakdown.sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Assign colors to category breakdown for charts
 */
export const assignCategoryColors = (
  breakdown: CategorySalesData[]
): CategorySalesData[] => {
  const chartColors = [
    '#2E7D32', // Primary green
    '#1976D2', // Blue
    '#F57C00', // Orange
    '#9C27B0', // Purple
    '#00897B', // Teal
    '#C2185B', // Pink
    '#5D4037', // Brown
    '#455A64', // Blue Grey
    '#7B1FA2', // Deep Purple
    '#00ACC1', // Cyan
  ];

  return breakdown.map((item, index) => ({
    ...item,
    color: chartColors[index % chartColors.length],
  }));
};
