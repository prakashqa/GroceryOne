/**
 * Product/Item API
 * RTK Query endpoints for item management
 */

import { baseApi } from './baseApi';
import type { Category } from './categoryApi';

// Types
export type ItemUnit = 'kg' | 'gm' | 'pcs' | 'L' | 'ml';

export interface Item {
  id: string;
  slug: string;
  name: string;
  nameTe?: string; // Telugu name
  categoryId: string;
  category?: Category;
  unit: ItemUnit;
  defaultQuantity: number;
  price?: number; // Unit price (selling price per unit)
  compareAtPrice?: number; // Original/MRP price
  mrp?: number; // MRP mapped from compareAtPrice for UI compatibility
  costPrice?: number; // Cost price for merchant
  stockQuantity?: number; // Current stock level
  lowStockThreshold?: number; // Low stock alert threshold
  trackInventory?: boolean; // Whether inventory tracking is enabled
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map API item to include mrp field derived from compareAtPrice.
 * Handles string values from decimal DB columns.
 */
function mapItemWithMrp(item: Item): Item {
  const raw = item.compareAtPrice;
  if (raw != null) {
    const parsed = typeof raw === 'string' ? parseFloat(raw as unknown as string) : raw;
    return { ...item, mrp: isNaN(parsed) ? undefined : parsed };
  }
  return item;
}

export interface CreateItemDto {
  slug: string;
  name: string;
  nameTe?: string;
  categoryId: string;
  unit?: ItemUnit;
  defaultQuantity?: number;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  sortOrder?: number;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateItemDto {
  slug?: string;
  name?: string;
  nameTe?: string;
  categoryId?: string;
  unit?: ItemUnit;
  defaultQuantity?: number;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// Inject endpoints into the base API
export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all items
    getItems: builder.query<Item[], { includeInactive?: boolean; categoryId?: string; tenantSlug?: string }>({
      query: ({ includeInactive = false, categoryId }) => ({
        url: '/items',
        params: { includeInactive, categoryId },
      }),
      // Ensure tenantSlug is part of the cache key so different tenants never share cached data
      serializeQueryArgs: ({ queryArgs }) => {
        return `items-${queryArgs.tenantSlug ?? 'none'}-${queryArgs.includeInactive ?? false}-${queryArgs.categoryId ?? 'all'}`;
      },
      transformResponse: (response: Item[]) => response.map(mapItemWithMrp),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // Get items by category
    getItemsByCategory: builder.query<Item[], { categoryId: string; includeInactive?: boolean }>({
      query: ({ categoryId, includeInactive = false }) => ({
        url: `/items/category/${categoryId}`,
        params: { includeInactive },
      }),
      transformResponse: (response: Item[]) => response.map(mapItemWithMrp),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // Get item by ID
    getItemById: builder.query<Item, string>({
      query: (id) => `/items/${id}`,
      transformResponse: (response: Item) => mapItemWithMrp(response),
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    // Get item by slug
    getItemBySlug: builder.query<Item, string>({
      query: (slug) => `/items/slug/${slug}`,
      transformResponse: (response: Item) => mapItemWithMrp(response),
      providesTags: (result) => (result ? [{ type: 'Product', id: result.id }] : []),
    }),

    // Get item count
    getItemCount: builder.query<{ count: number }, { includeInactive?: boolean; categoryId?: string }>({
      query: ({ includeInactive = false, categoryId }) => ({
        url: '/items/count',
        params: { includeInactive, categoryId },
      }),
    }),

    // Create item
    createItem: builder.mutation<Item, CreateItemDto>({
      query: (body) => ({
        url: '/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // Update item
    updateItem: builder.mutation<Item, { id: string; data: UpdateItemDto }>({
      query: ({ id, data }) => ({
        url: `/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // Delete item
    deleteItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetItemsQuery,
  useGetItemsByCategoryQuery,
  useGetItemByIdQuery,
  useGetItemBySlugQuery,
  useGetItemCountQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = productApi;
