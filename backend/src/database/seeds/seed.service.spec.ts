/**
 * SeedService Tests
 * TDD tests to ensure seed data is associated with tenants
 */

import { SeedService } from './seed.service';
import { Repository, ObjectLiteral } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Category } from '../../modules/categories/entities/category.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
  return {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockImplementation((data) =>
      Promise.resolve({ id: 'mock-id', ...data }),
    ),
    createQueryBuilder: jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    }),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('SeedService', () => {
  let service: SeedService;
  let categoryRepo: jest.Mocked<Repository<Category>>;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    categoryRepo = createMockRepository<Category>();
    itemRepo = createMockRepository<Item>();
    tenantRepo = createMockRepository<Tenant>();
    configService = {
      get: jest.fn().mockReturnValue('false'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new SeedService(
      categoryRepo,
      itemRepo,
      tenantRepo,
      configService,
    );
  });

  describe('seed', () => {
    it('should assign tenantId to created categories when tenants exist', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(mockTenants);

      const categoryCreateCalls: any[] = [];
      categoryRepo.create.mockImplementation((data: any) => {
        categoryCreateCalls.push(data);
        return data as Category;
      });
      categoryRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `cat-${categoryCreateCalls.length}`, ...data }),
      );

      await service.seed();

      // Every category create call should include a tenantId
      expect(categoryCreateCalls.length).toBeGreaterThan(0);
      for (const call of categoryCreateCalls) {
        expect(call.tenantId).toBeDefined();
        expect(
          mockTenants.some((t) => t.id === call.tenantId),
        ).toBe(true);
      }
    });

    it('should assign tenantId to created items when tenants exist', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(mockTenants);

      categoryRepo.create.mockImplementation((data: any) => data as Category);
      categoryRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `cat-${data.slug}`, ...data }),
      );

      const itemCreateCalls: any[] = [];
      itemRepo.create.mockImplementation((data: any) => {
        itemCreateCalls.push(data);
        return data as Item;
      });
      itemRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `item-${itemCreateCalls.length}`, ...data }),
      );

      await service.seed();

      // Every item create call should include tenantId
      expect(itemCreateCalls.length).toBeGreaterThan(0);
      for (const call of itemCreateCalls) {
        expect(call.tenantId).toBe('tenant-aaa');
      }
    });

    it('should seed categories for each tenant separately', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(mockTenants);

      const categoryCreateCalls: any[] = [];
      categoryRepo.create.mockImplementation((data: any) => {
        categoryCreateCalls.push(data);
        return data as Category;
      });
      categoryRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `cat-${categoryCreateCalls.length}`, ...data }),
      );

      itemRepo.create.mockImplementation((data: any) => data as Item);
      itemRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `item-${data.slug}`, ...data }),
      );

      const report = await service.seed();

      // Should have categories for both tenants
      const tenantACategories = categoryCreateCalls.filter(
        (c) => c.tenantId === 'tenant-aaa',
      );
      const tenantBCategories = categoryCreateCalls.filter(
        (c) => c.tenantId === 'tenant-bbb',
      );

      expect(tenantACategories.length).toBeGreaterThan(0);
      expect(tenantBCategories.length).toBeGreaterThan(0);
      expect(tenantACategories.length).toBe(tenantBCategories.length);
    });
  });
});
