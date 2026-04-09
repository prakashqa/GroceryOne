/**
 * Inventory API (shared)
 */

import { baseApi } from './baseApi';
import type { Item } from './productApi';

export interface StockLevel {
  itemId: string; stockQuantity: number; lowStockThreshold: number;
  isLowStock: boolean; trackInventory: boolean;
}

export interface AdjustStockDto {
  itemId: string; quantity: number;
  type: 'restock' | 'damage' | 'correction' | 'return' | 'initial';
  reason?: string;
}

export interface SetStockDto { itemId: string; quantity: number; reason?: string; }
export interface UpdateInventorySettingsDto { lowStockThreshold?: number; trackInventory?: boolean; }

export interface InventoryTransaction {
  id: string; tenantId: string; itemId: string; type: string;
  quantity: number; stockAfter: number; reason: string | null;
  referenceType: string | null; referenceId: string | null;
  performedBy: string | null; createdAt: string;
}

export interface TransactionHistoryResponse { transactions: InventoryTransaction[]; total: number; }

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStockLevel: builder.query<StockLevel, string>({
      query: (itemId) => `/inventory/items/${itemId}`,
      providesTags: (_r, _e, itemId) => [{ type: 'Inventory' as const, id: itemId }],
    }),
    getLowStockItems: builder.query<Item[], void>({
      query: () => '/inventory/low-stock',
      providesTags: [{ type: 'Inventory' as const, id: 'LOW_STOCK' }],
    }),
    getStockReport: builder.query<Item[], { categoryId?: string }>({
      query: ({ categoryId } = {}) => ({ url: '/inventory/report', params: categoryId ? { categoryId } : undefined }),
      providesTags: [{ type: 'Inventory' as const, id: 'REPORT' }],
    }),
    adjustStock: builder.mutation<InventoryTransaction, AdjustStockDto>({
      query: (body) => ({ url: '/inventory/adjust', method: 'POST', body }),
      invalidatesTags: (_r, _e, { itemId }) => [
        { type: 'Inventory', id: itemId }, { type: 'Inventory', id: 'LOW_STOCK' },
        { type: 'Inventory', id: 'REPORT' }, { type: 'Product', id: itemId },
      ],
    }),
    setStock: builder.mutation<InventoryTransaction, SetStockDto>({
      query: (body) => ({ url: '/inventory/set', method: 'POST', body }),
      invalidatesTags: (_r, _e, { itemId }) => [
        { type: 'Inventory', id: itemId }, { type: 'Inventory', id: 'LOW_STOCK' },
        { type: 'Inventory', id: 'REPORT' }, { type: 'Product', id: itemId },
      ],
    }),
    updateInventorySettings: builder.mutation<Item, { itemId: string; data: UpdateInventorySettingsDto }>({
      query: ({ itemId, data }) => ({ url: `/inventory/items/${itemId}/settings`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { itemId }) => [{ type: 'Inventory', id: itemId }, { type: 'Product', id: itemId }],
    }),
    getTransactionHistory: builder.query<TransactionHistoryResponse, { itemId: string; limit?: number; offset?: number }>({
      query: ({ itemId, limit = 20, offset = 0 }) => ({ url: `/inventory/items/${itemId}/transactions`, params: { limit, offset } }),
      providesTags: (_r, _e, { itemId }) => [{ type: 'Inventory' as const, id: `txn-${itemId}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStockLevelQuery, useGetLowStockItemsQuery, useGetStockReportQuery,
  useAdjustStockMutation, useSetStockMutation, useUpdateInventorySettingsMutation,
  useGetTransactionHistoryQuery,
} = inventoryApi;
