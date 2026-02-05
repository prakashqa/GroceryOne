/**
 * Tenant User Seed Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantUserSeedService } from './tenant-user-seed.service';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TenantConfig } from '../../tenant/entities/tenant-config.entity';
import { User } from '../../modules/users/entities/user.entity';
import { PasswordService } from '../../modules/auth/services/password.service';
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
      ],
    }).compile();

    service = module.get<TenantUserSeedService>(TenantUserSeedService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    it('should hash passwords correctly', async () => {
      await service.seed();

      expect(mockPasswordService.hash).toHaveBeenCalledTimes(SEED_USERS.length);
      SEED_USERS.forEach((user) => {
        expect(mockPasswordService.hash).toHaveBeenCalledWith(user.password);
      });
    });

    it('should skip existing tenants', async () => {
      mockTenantRepository.findOne.mockResolvedValueOnce({
        id: 'existing-tenant',
        slug: 'freshmart',
      });

      const report = await service.seed();

      // Only one new tenant should be created (quickbasket)
      expect(report.tenantsCreated).toBe(1);
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
    });

    it('should return proper report', async () => {
      mockTenantRepository.count
        .mockResolvedValueOnce(0) // before
        .mockResolvedValueOnce(2); // after
      mockUserRepository.count
        .mockResolvedValueOnce(0) // before
        .mockResolvedValueOnce(4); // after

      const report = await service.seed();

      expect(report.tenantsBefore).toBe(0);
      expect(report.tenantsAfter).toBe(2);
      expect(report.usersBefore).toBe(0);
      expect(report.usersAfter).toBe(4);
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
});
