/**
 * Product/Item API (shared)
 */

import { baseApi } from './baseApi';
import type { Category } from './categoryApi';

export type ItemUnit = 'kg' | 'gm' | 'pcs' | 'L' | 'ml';

export interface Item {
  id: string; slug: string; name: string; nameTe?: string; barcode?: string;
  categoryId: string; category?: Category; unit: ItemUnit;
  defaultQuantity: number; price?: number; compareAtPrice?: number;
  mrp?: number; costPrice?: number; stockQuantity?: number;
  lowStockThreshold?: number; trackInventory?: boolean;
  sortOrder: number; isActive: boolean; createdAt: string; updatedAt: string;
}

function mapItemWithMrp(item: Item): Item {
  const raw = item.compareAtPrice;
  if (raw != null) {
    const parsed = typeof raw === 'string' ? parseFloat(raw as unknown as string) : raw;
    return { ...item, mrp: isNaN(parsed) ? undefined : parsed };
  }
  return item;
}

export interface CreateItemDto {
  slug: string; name: string; nameTe?: string; barcode?: string; categoryId: string;
  unit?: ItemUnit; defaultQuantity?: number; price?: number;
  compareAtPrice?: number; costPrice?: number; sortOrder?: number;
  trackInventory?: boolean; stockQuantity?: number; lowStockThreshold?: number;
}

export interface UpdateItemDto {
  slug?: string; name?: string; nameTe?: string; barcode?: string; categoryId?: string;
  unit?: ItemUnit; defaultQuantity?: number; price?: number;
  compareAtPrice?: number; costPrice?: number; sortOrder?: number; isActive?: boolean;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<Item[], { includeInactive?: boolean; categoryId?: string; tenantSlug?: string }>({
      query: ({ includeInactive = false, categoryId }) => ({ url: '/items', params: { includeInactive, categoryId } }),
      serializeQueryArgs: ({ queryArgs }) => `items-${queryArgs.tenantSlug ?? 'none'}-${queryArgs.includeInactive ?? false}-${queryArgs.categoryId ?? 'all'}`,
      transformResponse: (response: Item[]) => response.map(mapItemWithMrp),
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }] : [{ type: 'Product', id: 'LIST' }],
    }),
    getItemsByCategory: builder.query<Item[], { categoryId: string; includeInactive?: boolean }>({
      query: ({ categoryId, includeInactive = false }) => ({ url: `/items/category/${categoryId}`, params: { includeInactive } }),
      transformResponse: (response: Item[]) => response.map(mapItemWithMrp),
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }] : [{ type: 'Product', id: 'LIST' }],
    }),
    getItemById: builder.query<Item, string>({
      query: (id) => `/items/${id}`,
      transformResponse: (response: Item) => mapItemWithMrp(response),
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    getItemBySlug: builder.query<Item, string>({
      query: (slug) => `/items/slug/${slug}`,
      transformResponse: (response: Item) => mapItemWithMrp(response),
      providesTags: (result) => (result ? [{ type: 'Product', id: result.id }] : []),
    }),
    getItemByBarcode: builder.query<Item, string>({
      query: (barcode) => `/items/barcode/${barcode}`,
      transformResponse: (response: Item) => mapItemWithMrp(response),
      providesTags: (result) => (result ? [{ type: 'Product', id: result.id }] : []),
    }),
    getItemCount: builder.query<{ count: number }, { includeInactive?: boolean; categoryId?: string }>({
      query: ({ includeInactive = false, categoryId }) => ({ url: '/items/count', params: { includeInactive, categoryId } }),
    }),
    createItem: builder.mutation<Item, CreateItemDto>({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateItem: builder.mutation<Item, { id: string; data: UpdateItemDto }>({
      query: ({ id, data }) => ({ url: `/items/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
    deleteItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/items/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetItemsQuery, useGetItemsByCategoryQuery, useGetItemByIdQuery,
  useGetItemBySlugQuery, useGetItemByBarcodeQuery, useLazyGetItemByBarcodeQuery,
  useGetItemCountQuery,
  useCreateItemMutation, useUpdateItemMutation, useDeleteItemMutation,
} = productApi;
