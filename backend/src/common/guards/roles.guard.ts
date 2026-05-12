/**
 * RolesGuard
 *
 * Authorizes requests based on the @Roles() decorator metadata.
 * Must be composed AFTER an authentication guard (e.g. AuthGuard('jwt'))
 * that populates `req.user` with at least `{ role }`.
 *
 *   @UseGuards(AuthGuard('jwt'), RolesGuard)
 *   @Roles('admin')
 *   @Get(...)
 *
 * Behaviour:
 * - No @Roles() metadata → guard is a no-op (allows the request).
 * - @Roles() set but req.user missing → 401 Unauthorized
 *   (indicates the auth guard was forgotten — fail closed).
 * - req.user.role not in @Roles() list → 403 Forbidden.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser {
  user?: { role?: UserRole };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() applied → nothing to enforce
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.role) {
      // @Roles() was set but no authenticated user is on the request.
      // This means an auth guard (JwtAuthGuard) was not applied before this
      // one — refuse rather than silently allow.
      throw new UnauthorizedException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
