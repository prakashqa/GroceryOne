/**
 * Tenant User Seed Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TenantUserSeedService } from './tenant-user-seed.service';
import { SeedService } from './seed.service';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TenantConfig } from '../../tenant/entities/tenant-config.entity';
import { User } from '../../modules/users/entities/user.entity';
import { PasswordService } from '../../modules/auth/services/password.service';
import { SubscriptionService } from '../../modules/subscription/subscription.service';
import { SEED_TENANTS, SEED_USERS } from './tenant-user-seed-data';

describe('TenantUserSeedService', () => {
  let service: TenantUserSeedService;

  const mockTenantRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockConfigRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockUserRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockPasswordService = {
    hash: jest.fn().mockImplementation((password) =>
      Promise.resolve(`$2b$12$hashed_${password}`),
    ),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockSeedService = {
    seedIfEmpty: jest.fn().mockResolvedValue(null),
  };

  const mockSubscriptionService = {
    createTrialSubscription: jest.fn().mockResolvedValue({
      id: 'sub-trial-mock',
      status: 'trial',
      amount: 0,
      currency: 'INR',
    }),
    createSeedSubscription: jest.fn().mockResolvedValue({
      id: 'sub-seed-mock',
      status: 'active',
      amount: 0,
      currency: 'INR',
    }),
    isSubscriptionActive: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantUserSeedService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(TenantConfig),
          useValue: mockConfigRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    service = module.get<TenantUserSeedService>(TenantUserSeedService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('seed', () => {
    beforeEach(() => {
      // Default mock implementations
      mockTenantRepository.count.mockResolvedValue(0);
      mockUserRepository.count.mockResolvedValue(0);
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockImplementation((data) => ({
        id: `tenant-${data.slug}`,
        ...data,
      }));
      mockTenantRepository.save.mockImplementation((tenant) =>
        Promise.resolve(tenant),
      );
      mockConfigRepository.create.mockImplementation((data) => ({
        id: `config-${data.tenantId}`,
        ...data,
      }));
      mockConfigRepository.save.mockImplementation((config) =>
        Promise.resolve(config),
      );
      mockUserRepository.create.mockImplementation((data) => ({
        id: `user-${data.email}`,
        ...data,
      }));
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );
    });

    it('should create two tenants with configs', async () => {
      const report = await service.seed();

      expect(report.tenantsCreated).toBe(SEED_TENANTS.length);
      expect(mockTenantRepository.save).toHaveBeenCalledTimes(
        SEED_TENANTS.length,
      );
      expect(mockConfigRepository.save).toHaveBeenCalledTimes(
        SEED_TENANTS.length,
      );
    });

    it('should create users for each tenant', async () => {
      const report = await service.seed();

      expect(report.usersCreated).toBe(SEED_USERS.length);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(SEED_USERS.length);
    });

    it('should hash passwords and PINs correctly', async () => {
      await service.seed();

      // Each user gets both password and PIN hashed
      expect(mockPasswordService.hash).toHaveBeenCalledTimes(
        SEED_USERS.length * 2,
      );
      SEED_USERS.forEach((user) => {
        expect(mockPasswordService.hash).toHaveBeenCalledWith(user.password);
        expect(mockPasswordService.hash).toHaveBeenCalledWith(user.pin);
      });
    });

    it('should skip existing tenants', async () => {
      mockTenantRepository.findOne.mockResolvedValueOnce({
        id: 'existing-tenant',
        slug: 'freshmart',
      });

      const report = await service.seed();

      // One less tenant created (freshmart skipped)
      expect(report.tenantsCreated).toBe(SEED_TENANTS.length - 1);
    });

    it('should skip existing users', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'admin@freshmart.com',
      });

      const report = await service.seed();

      // One less user created
      expect(report.usersCreated).toBe(SEED_USERS.length - 1);
    });

    it('should create tenant schemas', async () => {
      await service.seed();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        'CREATE SCHEMA IF NOT EXISTS "tenant_freshmart"',
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'CREATE SCHEMA IF NOT EXISTS "tenant_quickbasket"',
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'CREATE SCHEMA IF NOT EXISTS "tenant_vijayparcelpos"',
      );
    });

    it('should return proper report', async () => {
      mockTenantRepository.count
        .mockResolvedValueOnce(0) // before
        .mockResolvedValueOnce(SEED_TENANTS.length); // after
      mockUserRepository.count
        .mockResolvedValueOnce(0) // before
        .mockResolvedValueOnce(SEED_USERS.length); // after

      const report = await service.seed();

      expect(report.tenantsBefore).toBe(0);
      expect(report.tenantsAfter).toBe(SEED_TENANTS.length);
      expect(report.usersBefore).toBe(0);
      expect(report.usersAfter).toBe(SEED_USERS.length);
      expect(report.errors).toEqual([]);
      expect(report.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getLoginCredentials', () => {
    it('should return login credentials', () => {
      const credentials = service.getLoginCredentials();

      expect(credentials.freshmart).toBeDefined();
      expect(credentials.freshmart.admin.email).toBe('admin@freshmart.com');
      expect(credentials.freshmart.admin.password).toBe('Admin@FM123');
      expect(credentials.quickbasket).toBeDefined();
      expect(credentials.quickbasket.admin.email).toBe('admin@quickbasket.com');
      expect(credentials.vijayparcelpos).toBeDefined();
      expect(credentials.vijayparcelpos.admin.email).toBe('admin@vijayparcelpos.com');
    });
  });

  describe('getDataCounts', () => {
    it('should return current counts', async () => {
      mockTenantRepository.count.mockResolvedValue(2);
      mockUserRepository.count.mockResolvedValue(4);

      const counts = await service.getDataCounts();

      expect(counts.tenants).toBe(2);
      expect(counts.users).toBe(4);
    });
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      // Setup default seed mocks
      mockTenantRepository.count.mockResolvedValue(0);
      mockUserRepository.count.mockResolvedValue(0);
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockImplementation((data) => ({
        id: `tenant-${data.slug}`,
        ...data,
      }));
      mockTenantRepository.save.mockImplementation((tenant) =>
        Promise.resolve(tenant),
      );
      mockConfigRepository.create.mockImplementation((data) => ({
        id: `config-${data.tenantId}`,
        ...data,
      }));
      mockConfigRepository.save.mockImplementation((config) =>
        Promise.resolve(config),
      );
      mockUserRepository.create.mockImplementation((data) => ({
        id: `user-${data.email}`,
        ...data,
      }));
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );
    });

    it('should auto-seed tenants/users and then categories/items when AUTO_SEED=true and NODE_ENV=development', async () => {
      mockConfigService.get
        .mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'AUTO_SEED') return 'true';
          if (key === 'NODE_ENV') return 'development';
          return defaultValue;
        });

      await service.onModuleInit();

      // Should have seeded tenants
      expect(mockTenantRepository.save).toHaveBeenCalled();
      // Should have called SeedService.seedIfEmpty() for categories/items
      expect(mockSeedService.seedIfEmpty).toHaveBeenCalled();
    });

    it('should not auto-seed when AUTO_SEED=false', async () => {
      mockConfigService.get
        .mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'AUTO_SEED') return 'false';
          if (key === 'NODE_ENV') return 'development';
          return defaultValue;
        });

      await service.onModuleInit();

      expect(mockTenantRepository.save).not.toHaveBeenCalled();
      expect(mockSeedService.seedIfEmpty).not.toHaveBeenCalled();
    });

    it('should not auto-seed when NODE_ENV=production', async () => {
      mockConfigService.get
        .mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'AUTO_SEED') return 'true';
          if (key === 'NODE_ENV') return 'production';
          return defaultValue;
        });

      await service.onModuleInit();

      expect(mockTenantRepository.save).not.toHaveBeenCalled();
      expect(mockSeedService.seedIfEmpty).not.toHaveBeenCalled();
    });

    it('should seed categories/items AFTER tenants/users', async () => {
      const callOrder: string[] = [];

      mockConfigService.get
        .mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'AUTO_SEED') return 'true';
          if (key === 'NODE_ENV') return 'development';
          return defaultValue;
        });

      mockTenantRepository.save.mockImplementation((tenant) => {
        callOrder.push('tenant-saved');
        return Promise.resolve(tenant);
      });

      mockSeedService.seedIfEmpty.mockImplementation(() => {
        callOrder.push('categories-seeded');
        return Promise.resolve(null);
      });

      await service.onModuleInit();

      // Tenants should be saved before categories are seeded
      expect(callOrder.indexOf('tenant-saved')).toBeLessThan(
        callOrder.indexOf('categories-seeded'),
      );
    });
  });

  describe('seedIfEmpty', () => {
    it('should seed when tenants table is empty', async () => {
      mockTenantRepository.count.mockResolvedValue(0);
      mockUserRepository.count.mockResolvedValue(0);
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockImplementation((data) => ({
        id: `tenant-${data.slug}`,
        ...data,
      }));
      mockTenantRepository.save.mockImplementation((tenant) =>
        Promise.resolve(tenant),
      );
      mockConfigRepository.create.mockImplementation((data) => ({
        id: `config-${data.tenantId}`,
        ...data,
      }));
      mockConfigRepository.save.mockImplementation((config) =>
        Promise.resolve(config),
      );
      mockUserRepository.create.mockImplementation((data) => ({
        id: `user-${data.email}`,
        ...data,
      }));
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );

      const report = await service.seedIfEmpty();

      expect(report).not.toBeNull();
      expect(report!.tenantsCreated).toBe(SEED_TENANTS.length);
    });

    it('should skip seed when tenants already exist', async () => {
      mockTenantRepository.count.mockResolvedValue(2);

      const report = await service.seedIfEmpty();

      expect(report).toBeNull();
      expect(mockTenantRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('subscription creation during seed', () => {
    beforeEach(() => {
      mockTenantRepository.count.mockResolvedValue(0);
      mockUserRepository.count.mockResolvedValue(0);
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockImplementation((data) => ({
        id: `tenant-${data.slug}`,
        ...data,
      }));
      mockTenantRepository.save.mockImplementation((tenant) =>
        Promise.resolve(tenant),
      );
      mockConfigRepository.create.mockImplementation((data) => ({
        id: `config-${data.tenantId}`,
        ...data,
      }));
      mockConfigRepository.save.mockImplementation((config) =>
        Promise.resolve(config),
      );
      mockUserRepository.create.mockImplementation((data) => ({
        id: `user-${data.email}`,
        ...data,
      }));
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );
    });

    it('should create long-lived seed subscription (not short trial) for each new tenant', async () => {
      await service.seed();

      // Seed tenants must NEVER get the 14-day trial — they'd silently expire in demos/prod
      expect(mockSubscriptionService.createTrialSubscription).not.toHaveBeenCalled();
      expect(mockSubscriptionService.createSeedSubscription).toHaveBeenCalledTimes(
        SEED_TENANTS.length,
      );
      // Verify each tenant gets its own subscription (tenant isolation)
      for (const seedTenant of SEED_TENANTS) {
        expect(mockSubscriptionService.createSeedSubscription).toHaveBeenCalledWith(
          `tenant-${seedTenant.slug}`,
        );
      }
    });

    it('should create seed subscription for existing tenant whose previous sub expired', async () => {
      // First tenant already exists but has no active subscription (expired)
      mockTenantRepository.findOne
        .mockResolvedValueOnce({ id: 'existing-tenant-id', slug: SEED_TENANTS[0].slug })
        .mockResolvedValue(null); // rest are new
      mockSubscriptionService.isSubscriptionActive.mockResolvedValue(false);

      await service.seed();

      // Should renew with a long-lived seed subscription, not another 14-day trial
      expect(mockSubscriptionService.isSubscriptionActive).toHaveBeenCalledWith('existing-tenant-id');
      expect(mockSubscriptionService.createSeedSubscription).toHaveBeenCalledWith('existing-tenant-id');
      expect(mockSubscriptionService.createTrialSubscription).not.toHaveBeenCalledWith('existing-tenant-id');
    });

    it('should NOT duplicate subscription for existing tenant with active subscription', async () => {
      // First tenant exists and already has active subscription
      mockTenantRepository.findOne
        .mockResolvedValueOnce({ id: 'existing-tenant-id', slug: SEED_TENANTS[0].slug })
        .mockResolvedValue(null);
      mockSubscriptionService.isSubscriptionActive.mockResolvedValueOnce(true);

      await service.seed();

      // Should check but NOT create for the existing tenant with active sub
      expect(mockSubscriptionService.isSubscriptionActive).toHaveBeenCalledWith('existing-tenant-id');
      const createCalls = mockSubscriptionService.createSeedSubscription.mock.calls;
      const existingTenantCalls = createCalls.filter(
        (call: any[]) => call[0] === 'existing-tenant-id',
      );
      expect(existingTenantCalls.length).toBe(0);
    });

    it('should not block tenant creation if subscription creation fails (graceful degradation)', async () => {
      mockSubscriptionService.createSeedSubscription.mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      const report = await service.seed();

      // Tenant should still be created despite subscription failure
      expect(report.tenantsCreated).toBe(SEED_TENANTS.length);
    });

    it('each tenant gets independent seed subscription (tenant isolation)', async () => {
      const subscriptionCalls: string[] = [];
      mockSubscriptionService.createSeedSubscription.mockImplementation(
        async (tenantId: string) => {
          subscriptionCalls.push(tenantId);
          return { id: `sub-${tenantId}`, tenantId, status: 'active' };
        },
      );

      await service.seed();

      // Each tenant ID should appear exactly once
      const uniqueTenantIds = new Set(subscriptionCalls);
      expect(uniqueTenantIds.size).toBe(SEED_TENANTS.length);
      expect(subscriptionCalls.length).toBe(SEED_TENANTS.length);
    });
  });
});
