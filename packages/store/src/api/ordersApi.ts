/**
 * Orders API (shared).
 *
 * `checkout` is the surgical POS-sale endpoint: it posts the cart's items +
 * payment to `POST /orders/checkout`, where the backend re-derives prices from
 * the catalog, deducts stock atomically, and persists a paid Order. The web/
 * desktop POS is otherwise 100% local (carts live in Redux only), so this is
 * the single path that actually moves inventory on a sale.
 *
 * Rides `baseApi`, so it shares the in-memory access token, the 401→refresh
 * retry, and the `X-Tenant-ID` header. tenantId is derived from the JWT on the
 * backend — never sent in the body.
 *
 * On success the mutation invalidates `Product:LIST` (which `useCatalogHydration`
 * subscribes to via `useGetItemsQuery`) plus the Inventory low-stock/report
 * tags, so the Inventory UI refetches and shows the reduced stock immediately.
 */

import { baseApi } from './baseApi';

export interface CheckoutItem {
  itemId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  paymentMethod?: string;
  paidAmount?: number;
  clientRef?: string;
  notes?: string;
}

export interface CheckoutOrderItem {
  id: string;
  itemId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CheckoutOrder {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  totalAmount: number;
  clientRef?: string;
  items?: CheckoutOrderItem[];
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkout: builder.mutation<CheckoutOrder, CheckoutRequest>({
      query: (body) => ({ url: '/orders/checkout', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Product', id: 'LIST' },
        { type: 'Inventory', id: 'LOW_STOCK' },
        { type: 'Inventory', id: 'REPORT' },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useCheckoutMutation } = ordersApi;
