/**
 * Subscription Controller
 * Manages subscription plans for tenants.
 * All endpoints are tenant-scoped via TenantMiddleware.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Request } from 'express';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active subscription for tenant' })
  async getCurrentSubscription(@Req() req: Request) {
    const tenantId = req.tenantId!;
    const subscription = await this.subscriptionService.getActiveSubscription(tenantId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or renew subscription (admin only)' })
  async createSubscription(
    @Req() req: Request,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Only admins can manage subscriptions');
    }

    const tenantId = req.tenantId!;
    const subscription = await this.subscriptionService.createSubscription(
      tenantId,
      dto.plan,
      dto.paymentReference,
    );
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history for tenant' })
  async getSubscriptionHistory(@Req() req: Request) {
    const tenantId = req.tenantId!;
    const subscriptions = await this.subscriptionService.getSubscriptionsByTenant(tenantId);
    return {
      success: true,
      data: subscriptions,
    };
  }
}
