/**
 * @Roles() decorator
 *
 * Attaches a list of allowed UserRole values as metadata on a route handler.
 * Read by RolesGuard (../guards/roles.guard.ts) to authorize requests.
 *
 * Usage:
 *   @UseGuards(AuthGuard('jwt'), RolesGuard)
 *   @Roles('admin')
 *   @Post('employees')
 *   createEmployee() { ... }
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
