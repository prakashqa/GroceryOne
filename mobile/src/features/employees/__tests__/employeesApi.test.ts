/**
 * Employees API — query builder tests.
 *
 * Verifies that each builder constructs the correct backend URL + method.
 * Real tenant isolation is enforced server-side via the caller's JWT;
 * these tests assert the client-side contract matches the backend routes
 * we built (POST/GET /auth/employees, PATCH /auth/employees/:id/deactivate).
 */

import { employeesQueries } from '../api/employeesApi';

describe('employeesQueries', () => {
  it('list builds GET /auth/employees', () => {
    expect(employeesQueries.list()).toEqual({ url: '/auth/employees' });
  });

  it('create builds POST /auth/employees with the form body', () => {
    expect(
      employeesQueries.create({
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919999000001',
        pin: '1234',
      }),
    ).toEqual({
      url: '/auth/employees',
      method: 'POST',
      body: {
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919999000001',
        pin: '1234',
      },
    });
  });

  it('create never includes a tenantId in the URL — server resolves tenant from JWT', () => {
    // Multi-tenant guarantee: the client must NEVER specify a tenantId for
    // any of the employees endpoints. The backend takes tenantId from the
    // caller's JWT (auth.controller.ts createEmployee) — an attacker can't
    // operate cross-tenant by manipulating the request.
    const out = employeesQueries.create({
      firstName: 'X',
      phone: '+919999000002',
      pin: '0000',
    });
    expect(out.url).not.toMatch(/tenant/i);
  });

  it('deactivate builds PATCH /auth/employees/:id/deactivate', () => {
    expect(employeesQueries.deactivate('emp-123')).toEqual({
      url: '/auth/employees/emp-123/deactivate',
      method: 'PATCH',
    });
  });

  it('deactivate URL is scoped only by id, never tenant id (tenant comes from JWT)', () => {
    const out = employeesQueries.deactivate('emp-abc');
    expect(out.url).toBe('/auth/employees/emp-abc/deactivate');
    expect(out.url).not.toMatch(/tenant/i);
  });
});
