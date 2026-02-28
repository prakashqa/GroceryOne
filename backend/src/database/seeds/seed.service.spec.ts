/**
 * SeedService Tests
 * TDD tests to ensure seed data is tenant-isolated with zero overlap
 */

import { SeedService } from './seed.service';
import { Repository, ObjectLiteral } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Category } from '../../modules/categories/entities/category.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import {
  FRESHMART_CATEGORIES,
  FRESHMART_ITEMS,
  QUICKBASKET_CATEGORIES,
  QUICKBASKET_ITEMS,
  getTenantSeedData,
} from './seed-data';

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
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
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

    it('should seed tenant-specific category counts (FreshMart: 9, QuickBasket: 8)', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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

      await service.seed();

      const tenantACategories = categoryCreateCalls.filter(
        (c) => c.tenantId === 'tenant-aaa',
      );
      const tenantBCategories = categoryCreateCalls.filter(
        (c) => c.tenantId === 'tenant-bbb',
      );

      expect(tenantACategories.length).toBe(FRESHMART_CATEGORIES.length);
      expect(tenantBCategories.length).toBe(QUICKBASKET_CATEGORIES.length);
    });

    it('should seed FreshMart-specific category slugs', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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

      await service.seed();

      const freshmartSlugs = categoryCreateCalls
        .filter((c) => c.tenantId === 'tenant-aaa')
        .map((c) => c.slug);

      expect(freshmartSlugs).toContain('grains-flour');
      expect(freshmartSlugs).toContain('rice');
      expect(freshmartSlugs).toContain('spices');
      expect(freshmartSlugs).not.toContain('dairy-eggs');
      expect(freshmartSlugs).not.toContain('fruits');
    });

    it('should seed QuickBasket-specific category slugs', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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

      await service.seed();

      const quickbasketSlugs = categoryCreateCalls
        .filter((c) => c.tenantId === 'tenant-bbb')
        .map((c) => c.slug);

      expect(quickbasketSlugs).toContain('dairy-eggs');
      expect(quickbasketSlugs).toContain('fruits');
      expect(quickbasketSlugs).toContain('snacks-namkeen');
      expect(quickbasketSlugs).not.toContain('grains-flour');
      expect(quickbasketSlugs).not.toContain('rice');
    });

    it('should have zero category slug overlap between tenants', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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

      await service.seed();

      const freshmartCatSlugs = new Set(
        categoryCreateCalls.filter((c) => c.tenantId === 'tenant-aaa').map((c) => c.slug),
      );
      const quickbasketCatSlugs = new Set(
        categoryCreateCalls.filter((c) => c.tenantId === 'tenant-bbb').map((c) => c.slug),
      );

      for (const slug of freshmartCatSlugs) {
        expect(quickbasketCatSlugs.has(slug)).toBe(false);
      }
      for (const slug of quickbasketCatSlugs) {
        expect(freshmartCatSlugs.has(slug)).toBe(false);
      }
    });

    it('should have zero item slug overlap between tenants', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
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

      const freshmartItemSlugs = new Set(
        itemCreateCalls.filter((i) => i.tenantId === 'tenant-aaa').map((i) => i.slug),
      );
      const quickbasketItemSlugs = new Set(
        itemCreateCalls.filter((i) => i.tenantId === 'tenant-bbb').map((i) => i.slug),
      );

      // FreshMart items should use standard prefixes, not qb-
      expect(freshmartItemSlugs.has('gf-001')).toBe(true);
      expect(freshmartItemSlugs.has('qb-dy-001')).toBe(false);

      // QuickBasket items should use qb- prefix
      expect(quickbasketItemSlugs.has('qb-dy-001')).toBe(true);
      expect(quickbasketItemSlugs.has('gf-001')).toBe(false);

      // Zero overlap
      for (const slug of freshmartItemSlugs) {
        expect(quickbasketItemSlugs.has(slug)).toBe(false);
      }
    });

    it('should report error for unrecognized tenant slug', async () => {
      const mockTenants = [
        { id: 'tenant-xxx', slug: 'unknown-store', name: 'Unknown Store' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(mockTenants);

      const report = await service.seed();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('unknown-store');
    });

    it('should return early with empty report when no tenants exist', async () => {
      tenantRepo.find.mockResolvedValue([]);

      const report = await service.seed();

      expect(report.categoriesCreated).toBe(0);
      expect(report.itemsCreated).toBe(0);
      expect(categoryRepo.create).not.toHaveBeenCalled();
      expect(itemRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('clearSeedData', () => {
    it('should scope delete queries by tenantId when provided', async () => {
      const tenantId = 'tenant-aaa';
      const qbMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      itemRepo.count.mockResolvedValue(5);
      categoryRepo.count.mockResolvedValue(3);
      itemRepo.createQueryBuilder.mockReturnValue(qbMock as any);
      categoryRepo.createQueryBuilder.mockReturnValue(qbMock as any);

      await service.clearSeedData(tenantId);

      // Both item and category deletes should include tenant WHERE clause
      expect(qbMock.where).toHaveBeenCalledWith(
        'tenant_id = :tenantId',
        { tenantId },
      );
    });

    it('should delete all data when no tenantId provided', async () => {
      const qbMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      itemRepo.count.mockResolvedValue(5);
      categoryRepo.count.mockResolvedValue(3);
      itemRepo.createQueryBuilder.mockReturnValue(qbMock as any);
      categoryRepo.createQueryBuilder.mockReturnValue(qbMock as any);

      await service.clearSeedData();

      // Should NOT have tenant-scoped WHERE clause
      expect(qbMock.where).not.toHaveBeenCalled();
    });
  });
});

describe('Seed Data Isolation', () => {
  it('should have zero category slug overlap between tenants', () => {
    const fmSlugs = new Set(FRESHMART_CATEGORIES.map((c) => c.slug));
    const qbSlugs = new Set(QUICKBASKET_CATEGORIES.map((c) => c.slug));
    for (const slug of fmSlugs) {
      expect(qbSlugs.has(slug)).toBe(false);
    }
  });

  it('should have zero item slug overlap between tenants', () => {
    const fmSlugs = new Set(FRESHMART_ITEMS.map((i) => i.slug));
    const qbSlugs = new Set(QUICKBASKET_ITEMS.map((i) => i.slug));
    for (const slug of fmSlugs) {
      expect(qbSlugs.has(slug)).toBe(false);
    }
  });

  it('should have all FreshMart item categorySlug references match FreshMart categories', () => {
    const fmCatSlugs = new Set(FRESHMART_CATEGORIES.map((c) => c.slug));
    for (const item of FRESHMART_ITEMS) {
      expect(fmCatSlugs.has(item.categorySlug)).toBe(true);
    }
  });

  it('should have all QuickBasket item categorySlug references match QuickBasket categories', () => {
    const qbCatSlugs = new Set(QUICKBASKET_CATEGORIES.map((c) => c.slug));
    for (const item of QUICKBASKET_ITEMS) {
      expect(qbCatSlugs.has(item.categorySlug)).toBe(true);
    }
  });

  it('getTenantSeedData should return correct data for freshmart', () => {
    const data = getTenantSeedData('freshmart');
    expect(data.categories).toBe(FRESHMART_CATEGORIES);
    expect(data.items).toBe(FRESHMART_ITEMS);
  });

  it('getTenantSeedData should return correct data for quickbasket', () => {
    const data = getTenantSeedData('quickbasket');
    expect(data.categories).toBe(QUICKBASKET_CATEGORIES);
    expect(data.items).toBe(QUICKBASKET_ITEMS);
  });

  it('getTenantSeedData should throw for unknown tenant', () => {
    expect(() => getTenantSeedData('nonexistent')).toThrow('No seed data defined');
  });

  it('all QuickBasket categories should have Telugu translations', () => {
    for (const cat of QUICKBASKET_CATEGORIES) {
      expect(cat.nameTe).toBeDefined();
      expect(cat.nameTe!.length).toBeGreaterThan(0);
    }
  });

  it('all QuickBasket items should have Telugu translations', () => {
    for (const item of QUICKBASKET_ITEMS) {
      expect(item.nameTe).toBeDefined();
      expect(item.nameTe!.length).toBeGreaterThan(0);
    }
  });
});
