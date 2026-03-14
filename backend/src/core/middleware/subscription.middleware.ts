/**
 * Subscription Middleware
 * Checks if the tenant has an active subscription.
 * Runs AFTER TenantMiddleware. Returns HTTP 402 for expired subscriptions.
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../../modules/subscription/subscription.service';

@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {
  private readonly skipRoutes = [
    '/auth/',
    '/subscriptions/',
    '/health',
    '/docs',
    '/seed',
    '/admin',
  ];

  constructor(private readonly subscriptionService: SubscriptionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip excluded routes
    if (this.skipRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    // If no tenantId (excluded by TenantMiddleware), skip
    if (!req.tenantId) {
      return next();
    }

    const isActive = await this.subscriptionService.isSubscriptionActive(req.tenantId);

    if (!isActive) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'SUBSCRIPTION_EXPIRED',
            message: 'Your subscription has expired. Please renew to continue.',
            statusCode: HttpStatus.PAYMENT_REQUIRED,
          },
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    next();
  }
}
