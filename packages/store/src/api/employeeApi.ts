/**
 * Employee API (shared, owner-only).
 *
 * Rides `baseApi` so it shares the same in-memory access token and automatic
 * 401→/auth/refresh retry as every other mutation. The previous web client
 * (`web/src/lib/api/employees.ts`) was a manual `fetch` that read the token
 * from localStorage — which the offline desktop never populates (tokens live
 * only in Redux), so every employees request went out with NO Authorization
 * header and 401'd. Routing through baseApi fixes that.
 *
 * The backend derives tenantId from the JWT (never the body); `prepareHeaders`
 * still sends X-Tenant-ID for the tenant middleware.
 */

import { baseApi } from './baseApi';

export interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName?: string;
  phone: string;
  pin: string;
}

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<Employee[], void>({
      query: () => '/auth/employees',
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Employee' as const, id })), { type: 'Employee', id: 'LIST' }]
        : [{ type: 'Employee', id: 'LIST' }],
    }),
    createEmployee: builder.mutation<Employee, CreateEmployeeDto>({
      query: (body) => ({ url: '/auth/employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
    deactivateEmployee: builder.mutation<Employee, string>({
      query: (id) => ({ url: `/auth/employees/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Employee', id }, { type: 'Employee', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
} = employeeApi;
