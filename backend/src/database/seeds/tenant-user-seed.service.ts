/**
 * Tenant User Seed Service
 * Service for seeding tenants and users for multi-tenant testing
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TenantConfig } from '../../tenant/entities/tenant-config.entity';
import { User } from '../../modules/users/entities/user.entity';
import { PasswordService } from '../../modules/auth/services/password.service';
import { SubscriptionService } from '../../modules/subscription/subscription.service';
import { SeedService } from './seed.service';
import {
  SEED_TENANTS,
  SEED_USERS,
  LOGIN_CREDENTIALS,
} from './tenant-user-seed-data';

export interface TenantUserSeedReport {
  tenantsBefore: number;
  tenantsAfter: number;
  tenantsCreated: number;
  usersBefore: number;
  usersAfter: number;
  usersCreated: number;
  errors: string[];
  timestamp: Date;
}

@Injectable()
export class TenantUserSeedService implements OnModuleInit {
  private readonly logger = new Logger(TenantUserSeedService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantConfig)
    private readonly configRepository: Repository<TenantConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly subscriptionService: SubscriptionService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly seedService: SeedService,
  ) {}

  /**
   * Auto-seed on module init in development mode
   * Seeds tenants/users first, then delegates to SeedService for categories/items
   */
  async onModuleInit() {
    const autoSeed =
      this.configService.get<string>('AUTO_SEED', 'false') === 'true';
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (autoSeed && nodeEnv === 'development') {
      this.logger.log(
        'Auto-seeding enabled, checking for tenants and users...',
      );
      await this.seedIfEmpty();
      // Seed categories/items after tenants exist
      await this.seedService.seedIfEmpty();
    }
  }

  /**
   * Seed tenants and users if none exist
   */
  async seedIfEmpty(): Promise<TenantUserSeedReport | null> {
    const tenantCount = await this.tenantRepository.count();

    if (tenantCount > 0) {
      this.logger.log(
        `Database already has ${tenantCount} tenants. Skipping tenant/user seed.`,
      );
      return null;
    }

    return this.seed();
  }

  /**
   * Seed tenants and users
   */
  async seed(): Promise<TenantUserSeedReport> {
    const report: TenantUserSeedReport = {
      tenantsBefore: 0,
      tenantsAfter: 0,
      tenantsCreated: 0,
      usersBefore: 0,
      usersAfter: 0,
      usersCreated: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      report.tenantsBefore = await this.tenantRepository.count();
      report.usersBefore = await this.userRepository.count();

      this.logger.log('Starting tenant and user seed...');
      this.logger.log(
        `Before: ${report.tenantsBefore} tenants, ${report.usersBefore} users`,
      );

      // Seed tenants first
      const tenantMap = await this.seedTenants(report);

      // Seed users
      await this.seedUsers(tenantMap, report);

      report.tenantsAfter = await this.tenantRepository.count();
      report.usersAfter = await this.userRepository.count();

      this.logger.log('Tenant and user seed completed!');
      this.logger.log(
        `After: ${report.tenantsAfter} tenants, ${report.usersAfter} users`,
      );
      this.logger.log(
        `Created: ${report.tenantsCreated} tenants, ${report.usersCreated} users`,
      );

      if (report.errors.length > 0) {
        this.logger.warn(`Seed completed with ${report.errors.length} errors`);
        report.errors.forEach((err) => this.logger.warn(err));
      }
    } catch (error) {
      const errMsg = `Tenant/User seed failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errMsg);
      report.errors.push(errMsg);
    }

    return report;
  }

  /**
   * Seed tenants
   */
  private async seedTenants(
    report: TenantUserSeedReport,
  ): Promise<Map<string, string>> {
    const tenantMap = new Map<string, string>(); // slug -> id

    for (const seedTenant of SEED_TENANTS) {
      try {
        // Check if tenant exists
        const existing = await this.tenantRepository.findOne({
          where: { slug: seedTenant.slug },
        });

        if (existing) {
          tenantMap.set(seedTenant.slug, existing.id);
          // Ensure existing tenant has a subscription
          try {
            const hasActiveSub = await this.subscriptionService.isSubscriptionActive(existing.id);
            if (!hasActiveSub) {
              await this.subscriptionService.createTrialSubscription(existing.id);
              this.logger.log(`Created trial subscription for existing tenant: ${seedTenant.slug}`);
            }
          } catch (subError) {
            this.logger.warn(`Could not check/create subscription for tenant '${seedTenant.slug}': ${subError}`);
          }
          this.logger.debug(
            `Tenant '${seedTenant.slug}' already exists, skipping`,
          );
          continue;
        }

        // Create tenant
        const tenant = this.tenantRepository.create({
          name: seedTenant.name,
          slug: seedTenant.slug,
          domain: seedTenant.domain,
          status: seedTenant.status,
          subscriptionPlan: seedTenant.subscriptionPlan,
          contactEmail: seedTenant.contactEmail,
          contactPhone: seedTenant.contactPhone,
          businessAddress: seedTenant.businessAddress || undefined,
          primaryColor: seedTenant.primaryColor,
          secondaryColor: seedTenant.secondaryColor,
          defaultLanguage: seedTenant.defaultLanguage,
          supportedLanguages: seedTenant.supportedLanguages,
          currency: seedTenant.currency,
          timezone: seedTenant.timezone,
        });

        const saved = await this.tenantRepository.save(tenant);
        tenantMap.set(seedTenant.slug, saved.id);

        // Create default config
        const config = this.configRepository.create({
          tenantId: saved.id,
        });
        await this.configRepository.save(config);

        // Create trial subscription for new tenant
        try {
          await this.subscriptionService.createTrialSubscription(saved.id);
          this.logger.log(`Created trial subscription for tenant: ${seedTenant.slug}`);
        } catch (subError) {
          this.logger.warn(`Could not create subscription for tenant '${seedTenant.slug}': ${subError}`);
        }

        // Create tenant schema
        const schemaName = `tenant_${seedTenant.slug.replace(/-/g, '_')}`;
        try {
          await this.dataSource.query(
            `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
          );
          this.logger.debug(`Created schema: ${schemaName}`);
        } catch (schemaError) {
          this.logger.warn(
            `Could not create schema ${schemaName}: ${schemaError}`,
          );
        }

        report.tenantsCreated++;
        this.logger.log(`Created tenant: ${saved.name} (${saved.slug})`);
      } catch (error) {
        const errMsg = `Failed to create tenant '${seedTenant.slug}': ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errMsg);
        this.logger.error(errMsg);
      }
    }

    return tenantMap;
  }

  /**
   * Seed users
   */
  private async seedUsers(
    tenantMap: Map<string, string>,
    report: TenantUserSeedReport,
  ): Promise<void> {
    for (const seedUser of SEED_USERS) {
      try {
        const tenantId = tenantMap.get(seedUser.tenantSlug);
        if (!tenantId) {
          const errMsg = `Tenant '${seedUser.tenantSlug}' not found for user '${seedUser.email}'`;
          report.errors.push(errMsg);
          continue;
        }

        // Check if user exists
        const existing = await this.userRepository.findOne({
          where: { tenantId, email: seedUser.email },
        });

        if (existing) {
          // Update role if it changed (e.g., customer → cashier rename)
          if (existing.role !== seedUser.role) {
            const oldRole = existing.role;
            existing.role = seedUser.role;
            await this.userRepository.save(existing);
            this.logger.log(
              `Updated role for '${seedUser.email}' from '${oldRole}' to '${seedUser.role}'`,
            );
          } else {
            this.logger.debug(
              `User '${seedUser.email}' already exists in tenant '${seedUser.tenantSlug}', skipping`,
            );
          }
          continue;
        }

        // Hash password and PIN
        const passwordHash = await this.passwordService.hash(seedUser.password);
        const pinHash = await this.passwordService.hash(seedUser.pin);

        // Create user
        const user = this.userRepository.create({
          tenantId,
          email: seedUser.email,
          phone: seedUser.phone,
          passwordHash,
          pinHash,
          firstName: seedUser.firstName,
          lastName: seedUser.lastName,
          role: seedUser.role,
          status: seedUser.status,
          preferredLanguage: seedUser.preferredLanguage,
          emailVerifiedAt: new Date(), // Pre-verified for testing
        });

        await this.userRepository.save(user);
        report.usersCreated++;
        this.logger.log(
          `Created user: ${seedUser.email} (${seedUser.role}) in ${seedUser.tenantSlug}`,
        );
      } catch (error) {
        const errMsg = `Failed to create user '${seedUser.email}': ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errMsg);
        this.logger.error(errMsg);
      }
    }
  }

  /**
   * Clear tenant and user data
   */
  async clearTenantUserData(): Promise<{
    tenantsDeleted: number;
    usersDeleted: number;
  }> {
    this.logger.warn('Clearing tenant and user data...');

    const usersDeleted = await this.userRepository.count();
    const tenantsDeleted = await this.tenantRepository.count();

    // Delete users first (foreign key constraint)
    if (usersDeleted > 0) {
      await this.userRepository.createQueryBuilder().delete().execute();
    }

    // Delete tenant configs
    await this.configRepository.createQueryBuilder().delete().execute();

    // Delete tenants
    if (tenantsDeleted > 0) {
      await this.tenantRepository.createQueryBuilder().delete().execute();
    }

    this.logger.log(
      `Cleared ${tenantsDeleted} tenants and ${usersDeleted} users`,
    );

    return { tenantsDeleted, usersDeleted };
  }

  /**
   * Get current data counts
   */
  async getDataCounts(): Promise<{ tenants: number; users: number }> {
    return {
      tenants: await this.tenantRepository.count(),
      users: await this.userRepository.count(),
    };
  }

  /**
   * Get login credentials for testing
   */
  getLoginCredentials() {
    return LOGIN_CREDENTIALS;
  }
}
