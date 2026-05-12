/**
 * Reports Feature
 * Exports all public components, types, and utilities
 */

// Screen — wrapped in RoleGate so non-admins (cashiers) who reach this route
// via state-restore or programmatic navigation see "Access restricted" instead
// of the actual reports. Tab visibility is also gated in BottomTabNavigator,
// but RoleGate is the defence-in-depth layer.
export { ReportsScreen } from './screens/ReportsScreenGated';

// Components
export { DateRangeSelector } from './components/DateRangeSelector';
export { MetricsGrid } from './components/MetricsGrid';
export { SalesChart } from './components/SalesChart';
export { TopProductsList } from './components/TopProductsList';
export { CategoryBreakdown } from './components/CategoryBreakdown';

// Redux
export {
  default as reportsReducer,
  setDateRange,
  setLoading,
  setError,
  clearError,
  selectSelectedDateRange,
  selectIsReportLoading,
  selectReportError,
} from './store/reportsSlice';

// Types
export type {
  DateRange,
  DateRangePreset,
  ReportMetrics,
  SalesTrendPoint,
  TopProduct,
  CategorySalesData,
  ReportData,
  ReportsState,
} from './types/reports.types';

// Utils
export {
  getDateRangeForPreset,
  isDateInRange,
  formatDateForDisplay,
  getDaysBetween,
  groupDatesByDay,
  createCustomDateRange,
  getDateRangeLabel,
} from './utils/dateRangeUtils';

export {
  filterCartsByDateRange,
  calculateReportMetrics,
  calculateSalesTrend,
  calculateTopProducts,
  calculateCategoryBreakdown,
  assignCategoryColors,
} from './utils/reportCalculations';
