// Mock for @groceryone/store
export const selectTenant = () => ({ name: 'Test Store', slug: 'test-store' });
export const selectCurrentLanguage = () => 'en';
export const selectTodaysMetrics = () => ({ totalSales: 0, cartsCreated: 0, itemsPicked: 0, totalQuantity: 0 });
export const selectRecentCarts = () => [];
export const selectCategories = () => [];
export const selectItems = () => [];
export const selectActiveCart = () => null;
export const selectActiveCartItems = () => [];
export const selectActiveCartItemCount = () => 0;
export const selectActiveCartGrandTotal = () => 0;
export const selectCartCount = () => 0;
export const selectAllCarts = () => [];
export const selectTodaysCarts = () => [];
export const selectYesterdaysCarts = () => [];
export const selectActiveCartId = () => null;
export const selectCartsByStatus = () => ({ draft: 0, paid: 0, printed: 0 });
export const selectCartsByDateRange = () => [];
export const selectActiveCartHasPrices = () => false;
export const selectActiveCartIsPaid = () => false;
export const selectCanMarkPayment = () => false;
export const selectMerchantUpiId = () => '';
export const selectMerchantName = () => '';

export const addItemToActiveCart = (payload: any) => ({ type: 'cart/addItem', payload });
export const incrementItemInActiveCart = (id: string) => ({ type: 'cart/increment', payload: id });
export const decrementItemInActiveCart = (id: string) => ({ type: 'cart/decrement', payload: id });
export const removeItemFromActiveCart = (id: string) => ({ type: 'cart/remove', payload: id });
export const createCart = (payload: any) => ({ type: 'cart/create', payload });
export const setActiveCart = (id: string) => ({ type: 'cart/setActive', payload: id });
export const deleteCart = (id: string) => ({ type: 'cart/delete', payload: id });
export const renameCart = (payload: any) => ({ type: 'cart/rename', payload });
export const clearActiveCart = () => ({ type: 'cart/clear' });
export const markActiveCartAsPaid = (payload: any) => ({ type: 'cart/markPaid', payload });
export const logout = () => ({ type: 'auth/logout' });
export const clearTenant = () => ({ type: 'tenant/clear' });
export const setCredentials = (payload: any) => ({ type: 'auth/setCredentials', payload });
export const setTenant = (payload: any) => ({ type: 'tenant/set', payload });

export const DomainTypes = {
  createCashPaymentInfo: (received?: number, change?: number) => ({ method: 'cash', received, change }),
  createUpiPaymentInfo: (upiId?: string, ref?: string) => ({ method: 'upi', upiId, ref }),
  createCardPaymentInfo: (last4?: string) => ({ method: 'card', last4 }),
  generateUpiDeepLink: (upiId: string, name: string, amount: number, note?: string) => {
    let url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
    if (note) url += `&tn=${encodeURIComponent(note)}`;
    return url;
  },
};

// RTK Query mutation hooks (used by management pages)
export const useCreateCategoryMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];
export const useUpdateCategoryMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];
export const useDeleteCategoryMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];
export const useRestoreCategoryMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];

// Employees RTK hooks (owner-only). Default: empty list, no error. Tests that
// exercise the Employees page override these.
export type Employee = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  lastLoginAt?: string;
};
export const useGetEmployeesQuery = () => ({ data: [] as Employee[], isLoading: false, error: undefined });
export const useCreateEmployeeMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }];
export const useDeactivateEmployeeMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }];
// Default: no recoverable categories, so the recovery card stays hidden. Tests
// that exercise restore override this to return deleted categories.
export const useGetDeletedCategoriesQuery = () => ({ data: [] as any[] });
export const useCreateItemMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];
export const useUpdateItemMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];
export const useDeleteItemMutation = () => [jest.fn(() => ({ unwrap: () => Promise.resolve({}) })), {}];

// RTK Query lazy barcode lookup — default resolves to "no item". Tests that
// exercise the backend-fallback path override this export.
export const useLazyGetItemByBarcodeQuery = () => [
  jest.fn(() => ({ unwrap: () => Promise.resolve(null) })),
  {},
];
export const selectItemByBarcode = () => null;

// Test-tool mutation (routes through baseApi). Tests that drive the
// "Generate test barcodes" button override this.
export type TestBarcodeResult = {
  updated: number;
  skipped: number;
  assignments: { name: string; barcode: string }[];
};
export const useAssignTestBarcodesMutation = () => [
  jest.fn(() => ({ unwrap: () => Promise.resolve({ updated: 0, skipped: 0, assignments: [] }) })),
  { isLoading: false },
];

// Utils namespace (mirrors packages/store/src/utils)
export const StoreUtils = {
  generateSlug: (name: string) => name.toLowerCase().replace(/\s+/g, '-') + '-test',
  getLocalizedName: (entity: { name: string; nameTe?: string | null } | null | undefined, lang?: string | null) => {
    if (!entity) return '';
    const language = (lang ?? 'en').toLowerCase();
    if (language.startsWith('te') && typeof entity.nameTe === 'string' && entity.nameTe.trim().length > 0) {
      return entity.nameTe;
    }
    return entity.name;
  },
};

// RBAC selectors / slice — added for Sidebar + RoleGate + Employees page tests.
// We expose a real reducer (createSlice) so component tests can drive role
// changes via Redux state preloadedState in configureStore.
import { createSlice as _createSlice } from '@reduxjs/toolkit';
export const authSlice = _createSlice({
  name: 'auth',
  initialState: {
    user: null as { role?: 'admin' | 'cashier' | 'manager' | 'super_admin' } | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
    requiresPinSetup: false,
  },
  reducers: {},
});
// Null-safe selectors so tests that invoke the selector with no state
// (mocked `useAppSelector: (sel) => sel()`) don't crash.
export const selectUserRole = (state: any) => state?.auth?.user?.role ?? null;
export const selectIsAdmin = (state: any) => state?.auth?.user?.role === 'admin';
// selectTenant is exported above (line 2); don't redeclare here.
