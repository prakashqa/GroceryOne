/**
 * Seed / test-tooling API (shared, admin-only).
 *
 * Endpoints live on `baseApi` so they ride the same in-memory token and
 * automatic 401→/auth/refresh retry as every other mutation. The previous
 * web client (`web/src/lib/api/seed.ts`) was a manual `fetch` that read a
 * token from localStorage with NO refresh — so once the ~1h access token
 * expired, "Generate test barcodes" 401'd while RTK-Query item edits kept
 * working. Routing through baseApi removes that asymmetry.
 *
 * tenantId is taken from the JWT on the backend; `prepareHeaders` still sends
 * X-Tenant-ID for middleware. `/admin/*` is in baseApi's tenant-skip list, so
 * these never block on missing tenant context.
 */

import { baseApi } from './baseApi';

export interface TestBarcodeResult {
  updated: number;
  skipped: number;
  assignments: { name: string; barcode: string }[];
}

export const seedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    assignTestBarcodes: builder.mutation<TestBarcodeResult, void>({
      query: () => ({ url: '/admin/seeds/test-barcodes', method: 'POST' }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useAssignTestBarcodesMutation } = seedApi;
