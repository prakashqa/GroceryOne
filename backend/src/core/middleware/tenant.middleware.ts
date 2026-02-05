/**
 * Tenant Middleware
 * Extracts tenant information from request and validates it
 */

import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../tenant/tenant.service';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
      tenantSchema?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant check for certain routes
    const skipRoutes = [
      '/health',
      '/docs',
      '/admin',
      '/seed',
      '/auth/resolve-tenant',
    ];
    if (skipRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    // Extract tenant identifier from various sources
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant identifier is required',
            statusCode: HttpStatus.BAD_REQUEST,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Validate tenant exists and is active
      const tenant = await this.tenantService.findBySlug(tenantId);

      if (!tenant) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'TENANT_NOT_FOUND',
              message: 'Tenant not found',
              statusCode: HttpStatus.NOT_FOUND,
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (tenant.status === 'inactive') {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'TENANT_INACTIVE',
              message: 'Tenant is currently inactive',
              statusCode: HttpStatus.FORBIDDEN,
            },
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (tenant.status === 'suspended') {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'TENANT_SUSPENDED',
              message: 'Tenant has been suspended',
              statusCode: HttpStatus.FORBIDDEN,
            },
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // Attach tenant info to request
      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;
      req.tenantSchema = `tenant_${tenant.slug.replace(/-/g, '_')}`;

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to resolve tenant',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractTenantId(req: Request): string | undefined {
    // Priority 1: X-Tenant-ID header
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) {
      return headerTenant;
    }

    // Priority 2: Subdomain (e.g., grocery-mart.groceryone.com)
    const host = req.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        return subdomain;
      }
    }

    // Priority 3: Query parameter (for testing)
    if (req.query.tenant) {
      return req.query.tenant as string;
    }

    return undefined;
  }
}
