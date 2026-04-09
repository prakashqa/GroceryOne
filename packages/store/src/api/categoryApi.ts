/**
 * Category API (shared)
 */

import { baseApi } from './baseApi';

export interface Category {
  id: string; slug: string; name: string; icon: string;
  sortOrder: number; isActive: boolean; trackInventory?: boolean;
  createdAt: string; updatedAt: string;
}

export interface CreateCategoryDto { slug: string; name: string; icon?: string; sortOrder?: number; }
export interface UpdateCategoryDto { slug?: string; name?: string; icon?: string; sortOrder?: number; isActive?: boolean; }

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], { includeInactive?: boolean; tenantSlug?: string; trackInventory?: boolean }>({
      query: ({ includeInactive = false, trackInventory }) => ({
        url: '/categories',
        params: { includeInactive, ...(trackInventory !== undefined && { trackInventory }) },
      }),
      serializeQueryArgs: ({ queryArgs }) =>
        `categories-${queryArgs.tenantSlug ?? 'none'}-${queryArgs.includeInactive ?? false}-trackInv-${queryArgs.trackInventory ?? 'all'}`,
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Category' as const, id })), { type: 'Category', id: 'LIST' }]
        : [{ type: 'Category', id: 'LIST' }],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Category', id }],
    }),
    getCategoryBySlug: builder.query<Category, string>({
      query: (slug) => `/categories/slug/${slug}`,
      providesTags: (result) => (result ? [{ type: 'Category', id: result.id }] : []),
    }),
    getCategoryCount: builder.query<{ count: number }, { includeInactive?: boolean }>({
      query: ({ includeInactive = false }) => ({ url: '/categories/count', params: { includeInactive } }),
    }),
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<Category, { id: string; data: UpdateCategoryDto }>({
      query: ({ id, data }) => ({ url: `/categories/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Category', id }, { type: 'Category', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery, useGetCategoryByIdQuery, useGetCategoryBySlugQuery,
  useGetCategoryCountQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
} = categoryApi;
