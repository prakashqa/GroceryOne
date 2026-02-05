/**
 * Reports & Analysis Type Definitions
 */

import { ManagedCart, CartItemState } from '../../../domain/types/picking';

/**
 * Date range preset options
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

/**
 * Date range for filtering reports
 */
export interface DateRange {
  /** Start date in ISO format */
  startDate: string;
  /** End date in ISO format */
  endDate: string;
  /** Selected preset */
  preset: DateRangePreset;
}

/**
 * Key metrics for reports dashboard
 */
export interface ReportMetrics {
  /** Total sales amount (from paid carts) */
  totalSales: number;
  /** Total number of carts in date range */
  totalCarts: number;
  /** Total unique items sold */
  totalItemsSold: number;
  /** Total quantity of all items sold */
  totalQuantitySold: number;
  /** Average value per cart */
  averageCartValue: number;
  /** Number of paid carts */
  paidCartsCount: number;
  /** Number of unpaid carts with items */
  unpaidCartsCount: number;
}

/**
 * Sales trend data point for charts
 */
export interface SalesTrendPoint {
  /** Date in ISO format */
  date: string;
  /** Formatted date for display (e.g., "Jan 1", "Mon") */
  label: string;
  /** Total sales amount for this date */
  sales: number;
  /** Number of carts for this date */
  cartCount: number;
}

/**
 * Top product data for rankings
 */
export interface TopProduct {
  /** Item ID */
  itemId: string;
  /** Item name */
  itemName: string;
  /** Item name in Telugu (optional) */
  itemNameTe?: string;
  /** Category ID */
  categoryId?: string;
  /** Category name */
  categoryName?: string;
  /** Total quantity sold */
  quantity: number;
  /** Total revenue generated */
  revenue: number;
  /** Number of carts this item appeared in */
  cartAppearances: number;
}

/**
 * Category breakdown for pie chart
 */
export interface CategorySalesData {
  /** Category ID */
  categoryId: string;
  /** Category name */
  categoryName: string;
  /** Category name in Telugu (optional) */
  categoryNameTe?: string;
  /** Category icon (emoji) */
  categoryIcon?: string;
  /** Total revenue for this category */
  totalRevenue: number;
  /** Total quantity sold in this category */
  totalQuantity: number;
  /** Percentage of total sales */
  percentage: number;
  /** Color for chart display */
  color?: string;
}

/**
 * Complete report data
 */
export interface ReportData {
  /** Date range for this report */
  dateRange: DateRange;
  /** Key metrics */
  metrics: ReportMetrics;
  /** Daily sales trend data */
  salesTrend: SalesTrendPoint[];
  /** Top selling products */
  topProducts: TopProduct[];
  /** Sales breakdown by category */
  categoryBreakdown: CategorySalesData[];
  /** Timestamp when report was generated */
  generatedAt: string;
}

/**
 * Redux state for reports feature
 */
export interface ReportsState {
  /** Currently selected date range */
  selectedDateRange: DateRange;
  /** Is report data being computed */
  isLoading: boolean;
  /** Error message if computation failed */
  error: string | null;
}

/**
 * Props for DateRangeSelector component
 */
export interface DateRangeSelectorProps {
  /** Currently selected date range */
  selectedRange: DateRange;
  /** Callback when date range changes */
  onRangeChange: (range: DateRange) => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for MetricsGrid component
 */
export interface MetricsGridProps {
  /** Report metrics to display */
  metrics: ReportMetrics;
  /** Loading state */
  isLoading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for SalesChart component
 */
export interface SalesChartProps {
  /** Sales trend data */
  data: SalesTrendPoint[];
  /** Loading state */
  isLoading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for TopProductsList component
 */
export interface TopProductsListProps {
  /** Top products data */
  products: TopProduct[];
  /** Maximum number of products to show */
  limit?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for CategoryBreakdown component
 */
export interface CategoryBreakdownProps {
  /** Category breakdown data */
  data: CategorySalesData[];
  /** Loading state */
  isLoading?: boolean;
  /** Test ID for testing */
  testID?: string;
}
