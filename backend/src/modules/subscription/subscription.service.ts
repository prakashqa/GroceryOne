/**
 * Subscription Service
 * Manages subscription lifecycle: trial creation, plan activation, expiry checks.
 * All operations are tenant-scoped via tenantId parameter.
 */

import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Redis from 'ioredis';
import { Subscription, SubscriptionPlanType } from './entities/subscription.entity';

const SUBSCRIPTION_PLANS = {
  monthly: { amount: 1000, currency: 'INR', durationDays: 30 },
  yearly: { amount: 9000, currency: 'INR', durationDays: 365 },
  // Windows desktop app yearly license — separate SKU at ₹2,000.
  // Drive by an explicit `expiresAt` passed in (so a license's expiry,
  // not the plan-default duration, controls the subscription window).
  desktop_yearly: { amount: 2000, currency: 'INR', durationDays: 365 },
} as const;

const TRIAL_DURATION_DAYS = 14;
// Seed tenants get a long-lived active subscription so demo/seeded data does not
// silently expire and block the app behind SUBSCRIPTION_EXPIRED errors.
const SEED_DURATION_DAYS = 3650; // ~10 years
const CACHE_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  /**
   * Create a 14-day trial subscription for a newly registered tenant.
   */
  async createTrialSubscription(tenantId: string): Promise<Subscription> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS);

    const subscription = this.subscriptionRepository.create({
      tenantId,
      plan: 'monthly',
      status: 'trial',
      amount: 0,
      currency: 'INR',
      startsAt: now,
      expiresAt,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    await this.invalidateCache(tenantId);
    this.logger.log(`Created trial subscription for tenant ${tenantId}, expires ${expiresAt.toISOString()}`);
    return saved;
  }

  /**
   * Create a long-lived active subscription for a seeded tenant.
   * Expires any existing active/trial subscription first so re-seeding safely
   * replaces an expired trial. Amount is 0 (non-billed demo).
   */
  async createSeedSubscription(tenantId: string): Promise<Subscription> {
    await this.expireExistingSubscriptions(tenantId);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + SEED_DURATION_DAYS);

    const subscription = this.subscriptionRepository.create({
      tenantId,
      plan: 'yearly',
      status: 'active',
      amount: 0,
      currency: 'INR',
      startsAt: now,
      expiresAt,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    await this.invalidateCache(tenantId);
    this.logger.log(
      `Created seed subscription for tenant ${tenantId}, expires ${expiresAt.toISOString()}`,
    );
    return saved;
  }

  /**
   * Create a paid subscription (monthly or yearly).
   * Expires any existing active/trial subscription first.
   */
  async createSubscription(
    tenantId: string,
    plan: SubscriptionPlanType,
    paymentReference?: string,
  ): Promise<Subscription> {
    const planInfo = SUBSCRIPTION_PLANS[plan];
    if (!planInfo) {
      throw new BadRequestException(`Invalid plan: ${plan}. Must be 'monthly' or 'yearly'.`);
    }

    // Expire any existing active/trial subscriptions for this tenant
    await this.expireExistingSubscriptions(tenantId);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + planInfo.durationDays);

    const subscription = this.subscriptionRepository.create({
      tenantId,
      plan,
      status: 'active',
      amount: planInfo.amount,
      currency: planInfo.currency,
      startsAt: now,
      expiresAt,
      paymentReference,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    await this.invalidateCache(tenantId);
    this.logger.log(`Created ${plan} subscription for tenant ${tenantId}, amount: ${planInfo.amount} ${planInfo.currency}`);
    return saved;
  }

  /**
   * Create a desktop-app subscription, driven by an explicit `expiresAt`.
   *
   * Called by LicensesService when a customer activates their desktop
   * license. The subscription mirrors the license's expiry so the rest of
   * the backend's subscription guards (orders, items, etc.) work uniformly
   * without needing to know that a license is in play.
   *
   * Unlike `createSubscription()`, this does NOT expire prior subscriptions
   * — a tenant may legitimately hold both a mobile yearly AND a desktop
   * yearly simultaneously.
   */
  async createDesktopSubscription(
    tenantId: string,
    expiresAt: Date,
    paymentReference: string,
  ): Promise<Subscription> {
    const planInfo = SUBSCRIPTION_PLANS.desktop_yearly;
    const now = new Date();
    const subscription = this.subscriptionRepository.create({
      tenantId,
      plan: 'desktop_yearly',
      status: 'active',
      amount: planInfo.amount,
      currency: planInfo.currency,
      startsAt: now,
      expiresAt,
      paymentReference,
    });
    const saved = await this.subscriptionRepository.save(subscription);
    await this.invalidateCache(tenantId);
    this.logger.log(
      `Created desktop_yearly subscription for tenant ${tenantId}, expires ${expiresAt.toISOString()}`,
    );
    return saved;
  }

  /**
   * Get the currently active subscription for a tenant.
   * Returns null if no active/trial subscription exists.
   */
  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .andWhere('sub.status IN (:...statuses)', { statuses: ['trial', 'active'] })
      .andWhere('sub.expires_at > :now', { now: new Date() })
      .andWhere('sub.deleted_at IS NULL')
      .orderBy('sub.created_at', 'DESC')
      .getOne();
  }

  /**
   * Check if a tenant has an active subscription.
   * Uses Redis cache to avoid DB hits on every request.
   */
  async isSubscriptionActive(tenantId: string): Promise<boolean> {
    // Check Redis cache first
    try {
      const cached = await this.redis.get(this.getCacheKey(tenantId));
      if (cached !== null) {
        return cached === '1';
      }
    } catch (err) {
      this.logger.warn('Redis cache check failed, falling back to DB', err);
    }

    // Query DB
    const activeSub = await this.getActiveSubscription(tenantId);
    const isActive = activeSub !== null;

    // Cache result
    try {
      await this.redis.set(this.getCacheKey(tenantId), isActive ? '1' : '0', 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn('Failed to cache subscription status', err);
    }

    return isActive;
  }

  /**
   * Get all subscriptions for a tenant (history).
   */
  async getSubscriptionsByTenant(tenantId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Expire all active/trial subscriptions for a tenant.
   */
  private async expireExistingSubscriptions(tenantId: string): Promise<void> {
    await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: 'expired' })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('status IN (:...statuses)', { statuses: ['trial', 'active'] })
      .execute();
  }

  private getCacheKey(tenantId: string): string {
    return `sub:active:${tenantId}`;
  }

  private async invalidateCache(tenantId: string): Promise<void> {
    try {
      await this.redis.del(this.getCacheKey(tenantId));
    } catch (err) {
      this.logger.warn('Failed to invalidate subscription cache', err);
    }
  }
}
