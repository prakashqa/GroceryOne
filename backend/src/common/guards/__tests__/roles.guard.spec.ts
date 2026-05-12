/**
 * RolesGuard unit tests
 *
 * Verifies the guard behaviour in isolation: it correctly reads the @Roles()
 * metadata, allows authorized users, throws 403 for wrong role, and throws
 * 401 when no authenticated user is on the request (fail-closed when the
 * preceding auth guard is missing).
 */

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { UserRole } from '../../../modules/users/entities/user.entity';

const makeContext = (user: { role?: UserRole } | undefined): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}) as unknown as Function,
    getClass: () => ({}) as unknown as Function,
  } as unknown as ExecutionContext;
};

const makeReflector = (roles: UserRole[] | undefined): Reflector => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
    if (key === ROLES_KEY) return roles as unknown;
    return undefined;
  });
  return reflector;
};

describe('RolesGuard', () => {
  it('allows request when no @Roles() metadata is set (no-op)', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    const ctx = makeContext({ role: 'cashier' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows request when @Roles() is an empty list (no-op)', () => {
    const guard = new RolesGuard(makeReflector([]));
    const ctx = makeContext({ role: 'cashier' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows request when user.role is in the required list', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    const ctx = makeContext({ role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows request when user.role is one of several required roles', () => {
    const guard = new RolesGuard(makeReflector(['admin', 'super_admin']));
    const ctx = makeContext({ role: 'super_admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException (403) when user.role is not in required list', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    const ctx = makeContext({ role: 'cashier' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException (401) when req.user is missing — fail-closed', () => {
    // This protects against a misconfiguration where @Roles() is applied
    // without an upstream auth guard. We refuse rather than silently allow.
    const guard = new RolesGuard(makeReflector(['admin']));
    const ctx = makeContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException (401) when req.user.role is missing', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    const ctx = makeContext({}); // user object present but no role
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
