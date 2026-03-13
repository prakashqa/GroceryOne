/**
 * Inventory API
 * RTK Query endpoints for inventory management
 */

import { baseApi } from './baseApi';
import type { Item } from './productApi';

// Types
export interface StockLevel {
  itemId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  trackInventory: boolean;
}

export interface AdjustStockDto {
  itemId: string;
  quantity: number;
  type: 'restock' | 'damage' | 'correction' | 'return' | 'initial';
  reason?: string;
}

export interface SetStockDto {
  itemId: string;
  quantity: number;
  reason?: string;
}

export interface UpdateInventorySettingsDto {
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  itemId: string;
  type: string;
  quantity: number;
  stockAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  performedBy: string | null;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  transactions: InventoryTransaction[];
  total: number;
}

// Inject endpoints into the base API
export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get stock level for a single item
    getStockLevel: builder.query<StockLevel, string>({
      query: (itemId) => `/inventory/items/${itemId}`,
      providesTags: (_result, _error, itemId) => [{ type: 'Inventory' as const, id: itemId }],
    }),

    // Get all low-stock items
    getLowStockItems: builder.query<Item[], void>({
      query: () => '/inventory/low-stock',
      providesTags: [{ type: 'Inventory' as const, id: 'LOW_STOCK' }],
    }),

    // Get stock report
    getStockReport: builder.query<Item[], { categoryId?: string }>({
      query: ({ categoryId } = {}) => ({
        url: '/inventory/report',
        params: categoryId ? { categoryId } : undefined,
      }),
      providesTags: [{ type: 'Inventory' as const, id: 'REPORT' }],
    }),

    // Adjust stock (add or remove)
    adjustStock: builder.mutation<InventoryTransaction, AdjustStockDto>({
      query: (body) => ({
        url: '/inventory/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        { type: 'Inventory', id: 'LOW_STOCK' },
        { type: 'Inventory', id: 'REPORT' },
        { type: 'Product', id: itemId },
      ],
    }),

    // Set absolute stock level
    setStock: builder.mutation<InventoryTransaction, SetStockDto>({
      query: (body) => ({
        url: '/inventory/set',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        { type: 'Inventory', id: 'LOW_STOCK' },
        { type: 'Inventory', id: 'REPORT' },
        { type: 'Product', id: itemId },
      ],
    }),

    // Update inventory settings for an item
    updateInventorySettings: builder.mutation<Item, { itemId: string; data: UpdateInventorySettingsDto }>({
      query: ({ itemId, data }) => ({
        url: `/inventory/items/${itemId}/settings`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        { type: 'Product', id: itemId },
      ],
    }),

    // Get transaction history for an item
    getTransactionHistory: builder.query<TransactionHistoryResponse, { itemId: string; limit?: number; offset?: number }>({
      query: ({ itemId, limit = 20, offset = 0 }) => ({
        url: `/inventory/items/${itemId}/transactions`,
        params: { limit, offset },
      }),
      providesTags: (_result, _error, { itemId }) => [{ type: 'Inventory' as const, id: `txn-${itemId}` }],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetStockLevelQuery,
  useGetLowStockItemsQuery,
  useGetStockReportQuery,
  useAdjustStockMutation,
  useSetStockMutation,
  useUpdateInventorySettingsMutation,
  useGetTransactionHistoryQuery,
} = inventoryApi;
