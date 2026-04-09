/**
 * Cart API (shared)
 */

import { baseApi } from './baseApi';
import type { Item } from './productApi';

export type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

export interface CartItem {
  id: string; cartId: string; itemId: string; item?: Item;
  quantity: number; priceSnapshot?: number; addedAt: string;
}

export interface Cart {
  id: string; name: string; userId?: string; deviceId?: string;
  status: CartStatus; isActive: boolean; items: CartItem[];
  createdAt: string; updatedAt: string; paidAt?: string; paidAmount?: number;
}

export interface CreateCartDto { name: string; userId?: string; deviceId?: string; status?: CartStatus; }
export interface UpdateCartDto { name?: string; status?: CartStatus; isActive?: boolean; paidAt?: string; paidAmount?: number; }
export interface AddCartItemDto { itemId: string; quantity: number; }
export interface UpdateCartItemDto { quantity: number; }

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCarts: builder.query<Cart[], { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({ url: '/carts', params: { userId, deviceId } }),
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: 'Cart' as const, id })), { type: 'Cart', id: 'LIST' }] : [{ type: 'Cart', id: 'LIST' }],
    }),
    getActiveCart: builder.query<Cart | null, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({ url: '/carts/active', params: { userId, deviceId } }),
      providesTags: (result) => (result ? [{ type: 'Cart', id: result.id }] : []),
    }),
    getCartById: builder.query<Cart, string>({
      query: (id) => `/carts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Cart', id }],
    }),
    getCartCount: builder.query<{ count: number }, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({ url: '/carts/count', params: { userId, deviceId } }),
    }),
    createCart: builder.mutation<Cart, CreateCartDto>({
      query: (body) => ({ url: '/carts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cart', id: 'LIST' }],
    }),
    updateCart: builder.mutation<Cart, { id: string; data: UpdateCartDto }>({
      query: ({ id, data }) => ({ url: `/carts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Cart', id }, { type: 'Cart', id: 'LIST' }],
    }),
    deleteCart: builder.mutation<void, string>({
      query: (id) => ({ url: `/carts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Cart', id }, { type: 'Cart', id: 'LIST' }],
    }),
    addCartItem: builder.mutation<CartItem, { cartId: string; data: AddCartItemDto }>({
      query: ({ cartId, data }) => ({ url: `/carts/${cartId}/items`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),
    updateCartItem: builder.mutation<CartItem, { cartId: string; itemId: string; data: UpdateCartItemDto }>({
      query: ({ cartId, itemId, data }) => ({ url: `/carts/${cartId}/items/${itemId}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),
    removeCartItem: builder.mutation<void, { cartId: string; itemId: string }>({
      query: ({ cartId, itemId }) => ({ url: `/carts/${cartId}/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { cartId }) => [{ type: 'Cart', id: cartId }],
    }),
    clearCart: builder.mutation<void, string>({
      query: (id) => ({ url: `/carts/${id}/items`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Cart', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartsQuery, useGetActiveCartQuery, useGetCartByIdQuery, useGetCartCountQuery,
  useCreateCartMutation, useUpdateCartMutation, useDeleteCartMutation,
  useAddCartItemMutation, useUpdateCartItemMutation, useRemoveCartItemMutation, useClearCartMutation,
} = cartApi;
