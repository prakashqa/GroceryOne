/**
 * Cart API
 * RTK Query endpoints for cart management
 */

import { baseApi } from './baseApi';
import type { Item } from './productApi';

// Types
export type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

export interface CartItem {
  id: string;
  cartId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  priceSnapshot?: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  name: string;
  userId?: string;
  deviceId?: string;
  status: CartStatus;
  isActive: boolean;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  paidAmount?: number;
}

export interface CreateCartDto {
  name: string;
  userId?: string;
  deviceId?: string;
  status?: CartStatus;
}

export interface UpdateCartDto {
  name?: string;
  status?: CartStatus;
  isActive?: boolean;
  paidAt?: string;
  paidAmount?: number;
}

export interface AddCartItemDto {
  itemId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

// Inject endpoints into the base API
export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all carts
    getCarts: builder.query<Cart[], { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({
        url: '/carts',
        params: { userId, deviceId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Cart' as const, id })),
              { type: 'Cart', id: 'LIST' },
            ]
          : [{ type: 'Cart', id: 'LIST' }],
    }),

    // Get active cart
    getActiveCart: builder.query<Cart | null, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({
        url: '/carts/active',
        params: { userId, deviceId },
      }),
      providesTags: (result) => (result ? [{ type: 'Cart', id: result.id }] : []),
    }),

    // Get cart by ID
    getCartById: builder.query<Cart, string>({
      query: (id) => `/carts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Cart', id }],
    }),

    // Get cart count
    getCartCount: builder.query<{ count: number }, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({
        url: '/carts/count',
        params: { userId, deviceId },
      }),
    }),

    // Create cart
    createCart: builder.mutation<Cart, CreateCartDto>({
      query: (body) => ({
        url: '/carts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Cart', id: 'LIST' }],
    }),

    // Update cart
    updateCart: builder.mutation<Cart, { id: string; data: UpdateCartDto }>({
      query: ({ id, data }) => ({
        url: `/carts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Cart', id },
        { type: 'Cart', id: 'LIST' },
      ],
    }),

    // Delete cart
    deleteCart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/carts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Cart', id },
        { type: 'Cart', id: 'LIST' },
      ],
    }),

    // Add item to cart
    addCartItem: builder.mutation<CartItem, { cartId: string; data: AddCartItemDto }>({
      query: ({ cartId, data }) => ({
        url: `/carts/${cartId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),

    // Update cart item
    updateCartItem: builder.mutation<CartItem, { cartId: string; itemId: string; data: UpdateCartItemDto }>({
      query: ({ cartId, itemId, data }) => ({
        url: `/carts/${cartId}/items/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),

    // Remove item from cart
    removeCartItem: builder.mutation<void, { cartId: string; itemId: string }>({
      query: ({ cartId, itemId }) => ({
        url: `/carts/${cartId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),

    // Clear cart
    clearCart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/carts/${id}/items`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Cart', id }],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetCartsQuery,
  useGetActiveCartQuery,
  useGetCartByIdQuery,
  useGetCartCountQuery,
  useCreateCartMutation,
  useUpdateCartMutation,
  useDeleteCartMutation,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
