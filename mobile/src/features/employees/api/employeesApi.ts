/**
 * Employees API
 *
 * RTK Query slice for owner-driven employee management.
 * Backed by:
 *   - POST   /auth/employees                — create cashier
 *   - GET    /auth/employees                — list employees in caller tenant
 *   - PATCH  /auth/employees/:id/deactivate — soft-disable login
 *
 * All endpoints are tenant-scoped server-side via the caller's JWT;
 * clients only need to pass the standard auth/tenant headers (handled by
 * baseApi).
 */

import { baseApi } from '../../../data/api/baseApi';

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

export interface CreateEmployeeRequest {
  firstName: string;
  lastName?: string;
  phone: string;
  pin: string;
}

// Exported as named query builders so tests can verify URL + method without
// reaching into RTK Query internals. Each returns the FetchArgs object that
// would be sent to fetchBaseQuery.
export const employeesQueries = {
  list: () => ({ url: '/auth/employees' }),
  create: (body: CreateEmployeeRequest) => ({
    url: '/auth/employees',
    method: 'POST' as const,
    body,
  }),
  deactivate: (id: string) => ({
    url: `/auth/employees/${id}/deactivate`,
    method: 'PATCH' as const,
  }),
};

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEmployees: builder.query<Employee[], void>({
      query: employeesQueries.list,
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'User' as const, id: e.id })),
              { type: 'User' as const, id: 'EMPLOYEES_LIST' },
            ]
          : [{ type: 'User' as const, id: 'EMPLOYEES_LIST' }],
    }),

    createEmployee: builder.mutation<Employee, CreateEmployeeRequest>({
      query: employeesQueries.create,
      invalidatesTags: [{ type: 'User', id: 'EMPLOYEES_LIST' }],
    }),

    deactivateEmployee: builder.mutation<Employee, string>({
      query: employeesQueries.deactivate,
      invalidatesTags: (_r, _e, id) => [
        { type: 'User', id },
        { type: 'User', id: 'EMPLOYEES_LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
} = employeesApi;
