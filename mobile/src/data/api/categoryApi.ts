/**
 * Category API
 * RTK Query endpoints for category management
 */

import { baseApi } from './baseApi';

// Types
export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  slug: string;
  name: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  slug?: string;
  name?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Inject endpoints into the base API
export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<Category[], { includeInactive?: boolean }>({
      query: ({ includeInactive = false }) => ({
        url: '/categories',
        params: { includeInactive },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    // Get category by ID
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),

    // Get category by slug
    getCategoryBySlug: builder.query<Category, string>({
      query: (slug) => `/categories/slug/${slug}`,
      providesTags: (result) => (result ? [{ type: 'Category', id: result.id }] : []),
    }),

    // Get category count
    getCategoryCount: builder.query<{ count: number }, { includeInactive?: boolean }>({
      query: ({ includeInactive = false }) => ({
        url: '/categories/count',
        params: { includeInactive },
      }),
    }),

    // Create category
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // Update category
    updateCategory: builder.mutation<Category, { id: string; data: UpdateCategoryDto }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // Delete category
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetCategoryBySlugQuery,
  useGetCategoryCountQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
