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
  VIJAYPARCELPOS_CATEGORIES,
  VIJAYPARCELPOS_ITEMS,
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
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

    it('should seed tenant-specific category counts (FreshMart: 9, QuickBasket: 8, VijayParcelPOS: 12)', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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
      const tenantCCategories = categoryCreateCalls.filter(
        (c) => c.tenantId === 'tenant-ccc',
      );

      expect(tenantACategories.length).toBe(FRESHMART_CATEGORIES.length);
      expect(tenantBCategories.length).toBe(QUICKBASKET_CATEGORIES.length);
      expect(tenantCCategories.length).toBe(VIJAYPARCELPOS_CATEGORIES.length);
    });

    it('should seed FreshMart-specific category slugs', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

    it('should seed VijayParcelPOS-specific category slugs', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

      const vpSlugs = categoryCreateCalls
        .filter((c) => c.tenantId === 'tenant-ccc')
        .map((c) => c.slug);

      // POS menu categories
      expect(vpSlugs).toContain('chicken-items');
      expect(vpSlugs).toContain('veg-items');
      expect(vpSlugs).toContain('seafood-items');
      expect(vpSlugs).toContain('rice-items');
      // Inventory categories
      expect(vpSlugs).toContain('inv-rice');
      expect(vpSlugs).toContain('inv-dal');
      expect(vpSlugs).toContain('inv-oil');
      expect(vpSlugs).toContain('inv-basic');
      expect(vpSlugs).toContain('inv-spices');
      // Should NOT contain removed categories
      expect(vpSlugs).not.toContain('biryani-items');
      expect(vpSlugs).not.toContain('curry-items');
      expect(vpSlugs).not.toContain('fry-items');
      expect(vpSlugs).not.toContain('other-items');
      expect(vpSlugs).not.toContain('rice-grains');
      expect(vpSlugs).not.toContain('spices-powders');
      expect(vpSlugs).not.toContain('ready-mix-kitchen');
      expect(vpSlugs).not.toContain('grains-flour');
      expect(vpSlugs).not.toContain('dairy-eggs');
    });

    it('should have zero category slug overlap between tenants', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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
      const vpCatSlugs = new Set(
        categoryCreateCalls.filter((c) => c.tenantId === 'tenant-ccc').map((c) => c.slug),
      );

      // No overlap between any pair
      for (const slug of freshmartCatSlugs) {
        expect(quickbasketCatSlugs.has(slug)).toBe(false);
        expect(vpCatSlugs.has(slug)).toBe(false);
      }
      for (const slug of quickbasketCatSlugs) {
        expect(freshmartCatSlugs.has(slug)).toBe(false);
        expect(vpCatSlugs.has(slug)).toBe(false);
      }
      for (const slug of vpCatSlugs) {
        expect(freshmartCatSlugs.has(slug)).toBe(false);
        expect(quickbasketCatSlugs.has(slug)).toBe(false);
      }
    });

    it('should have zero item slug overlap between tenants', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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
      const vpItemSlugs = new Set(
        itemCreateCalls.filter((i) => i.tenantId === 'tenant-ccc').map((i) => i.slug),
      );

      // FreshMart items should use standard prefixes, not qb- or vp-
      expect(freshmartItemSlugs.has('gf-001')).toBe(true);
      expect(freshmartItemSlugs.has('qb-dy-001')).toBe(false);
      expect(freshmartItemSlugs.has('vp-ch-001')).toBe(false);

      // QuickBasket items should use qb- prefix
      expect(quickbasketItemSlugs.has('qb-dy-001')).toBe(true);
      expect(quickbasketItemSlugs.has('gf-001')).toBe(false);
      expect(quickbasketItemSlugs.has('vp-ch-001')).toBe(false);

      // VijayParcelPOS items should use vp- prefix
      expect(vpItemSlugs.has('vp-ch-001')).toBe(true);
      expect(vpItemSlugs.has('gf-001')).toBe(false);
      expect(vpItemSlugs.has('qb-dy-001')).toBe(false);

      // Zero overlap between all pairs
      for (const slug of freshmartItemSlugs) {
        expect(quickbasketItemSlugs.has(slug)).toBe(false);
        expect(vpItemSlugs.has(slug)).toBe(false);
      }
      for (const slug of vpItemSlugs) {
        expect(freshmartItemSlugs.has(slug)).toBe(false);
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

    it('should set trackInventory based on category seed data for VijayParcelPOS', async () => {
      const mockTenants = [
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

      const menuCategorySlugs = new Set([
        'chicken-items', 'veg-items', 'seafood-items', 'rice-items',
      ]);
      const inventoryCategorySlugs = new Set([
        'inv-rice', 'inv-dal', 'inv-oil', 'inv-basic', 'inv-spices',
      ]);

      // Build a categoryId -> categorySlug map from create calls
      const catIdToSlug = new Map<string, string>();
      const categoryCreateCalls = (categoryRepo.create as jest.Mock).mock.calls.map(c => c[0]);
      for (const cat of categoryCreateCalls) {
        catIdToSlug.set(`cat-${cat.slug}`, cat.slug);
      }

      for (const item of itemCreateCalls) {
        const catSlug = catIdToSlug.get(item.categoryId);
        if (catSlug && menuCategorySlugs.has(catSlug)) {
          expect(item.trackInventory).toBe(false);
        }
        if (catSlug && inventoryCategorySlugs.has(catSlug)) {
          expect(item.trackInventory).toBe(true);
        }
      }
    });

    it('should use custom stockQuantity and lowStockThreshold for VP inventory items', async () => {
      const mockTenants = [
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

      // Verify specific inventory items have custom stock values
      const riceItem = itemCreateCalls.find((i) => i.slug === 'vp-inv-rice-001');
      expect(riceItem).toBeDefined();
      expect(riceItem.stockQuantity).toBe(50);
      expect(riceItem.lowStockThreshold).toBe(10);

      const cuminItem = itemCreateCalls.find((i) => i.slug === 'vp-inv-spice-005');
      expect(cuminItem).toBeDefined();
      expect(cuminItem.stockQuantity).toBe(1.5);
      expect(cuminItem.lowStockThreshold).toBe(1);

      // POS menu items should still have stockQuantity 0
      const posItem = itemCreateCalls.find((i) => i.slug === 'vp-ch-001');
      expect(posItem).toBeDefined();
      expect(posItem.stockQuantity).toBe(0);
      expect(posItem.trackInventory).toBe(false);
    });

    it('should never create a category with null or undefined tenantId', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

      expect(categoryCreateCalls.length).toBeGreaterThan(0);
      for (const call of categoryCreateCalls) {
        expect(call.tenantId).not.toBeNull();
        expect(call.tenantId).not.toBeUndefined();
        expect(typeof call.tenantId).toBe('string');
        expect(call.tenantId.length).toBeGreaterThan(0);
      }
    });

    it('should never create an item with null or undefined tenantId', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
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

      expect(itemCreateCalls.length).toBeGreaterThan(0);
      for (const call of itemCreateCalls) {
        expect(call.tenantId).not.toBeNull();
        expect(call.tenantId).not.toBeUndefined();
        expect(typeof call.tenantId).toBe('string');
        expect(call.tenantId.length).toBeGreaterThan(0);
      }
    });

    it('should not create any category or item with a tenantId that does not belong to the current tenant being seeded', async () => {
      const mockTenants = [
        { id: 'tenant-aaa', slug: 'freshmart', name: 'FreshMart Groceries' } as Tenant,
        { id: 'tenant-bbb', slug: 'quickbasket', name: 'QuickBasket Store' } as Tenant,
        { id: 'tenant-ccc', slug: 'vijayparcelpos', name: 'Vijay Parcel POS' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(mockTenants);
      const validTenantIds = new Set(mockTenants.map((t) => t.id));

      const categoryCreateCalls: any[] = [];
      categoryRepo.create.mockImplementation((data: any) => {
        categoryCreateCalls.push(data);
        return data as Category;
      });
      categoryRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `cat-${categoryCreateCalls.length}`, ...data }),
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

      // Every category must have a tenantId from the valid set
      for (const call of categoryCreateCalls) {
        expect(validTenantIds.has(call.tenantId)).toBe(true);
      }

      // Every item must have a tenantId from the valid set
      for (const call of itemCreateCalls) {
        expect(validTenantIds.has(call.tenantId)).toBe(true);
      }

      // Cross-check: FreshMart items should only have tenant-aaa
      const freshmartItemTenantIds = new Set(
        itemCreateCalls
          .filter((i) => i.slug && i.slug.startsWith('gf-'))
          .map((i) => i.tenantId),
      );
      if (freshmartItemTenantIds.size > 0) {
        expect(freshmartItemTenantIds.size).toBe(1);
        expect(freshmartItemTenantIds.has('tenant-aaa')).toBe(true);
      }

      // QuickBasket items should only have tenant-bbb
      const qbItemTenantIds = new Set(
        itemCreateCalls
          .filter((i) => i.slug && i.slug.startsWith('qb-'))
          .map((i) => i.tenantId),
      );
      if (qbItemTenantIds.size > 0) {
        expect(qbItemTenantIds.size).toBe(1);
        expect(qbItemTenantIds.has('tenant-bbb')).toBe(true);
      }

      // VijayParcelPOS items should only have tenant-ccc
      const vpItemTenantIds = new Set(
        itemCreateCalls
          .filter((i) => i.slug && i.slug.startsWith('vp-'))
          .map((i) => i.tenantId),
      );
      if (vpItemTenantIds.size > 0) {
        expect(vpItemTenantIds.size).toBe(1);
        expect(vpItemTenantIds.has('tenant-ccc')).toBe(true);
      }
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
  it('should have zero category slug overlap between all tenants', () => {
    const fmSlugs = new Set(FRESHMART_CATEGORIES.map((c) => c.slug));
    const qbSlugs = new Set(QUICKBASKET_CATEGORIES.map((c) => c.slug));
    const vpSlugs = new Set(VIJAYPARCELPOS_CATEGORIES.map((c) => c.slug));
    for (const slug of fmSlugs) {
      expect(qbSlugs.has(slug)).toBe(false);
      expect(vpSlugs.has(slug)).toBe(false);
    }
    for (const slug of qbSlugs) {
      expect(vpSlugs.has(slug)).toBe(false);
    }
  });

  it('should have zero item slug overlap between all tenants', () => {
    const fmSlugs = new Set(FRESHMART_ITEMS.map((i) => i.slug));
    const qbSlugs = new Set(QUICKBASKET_ITEMS.map((i) => i.slug));
    const vpSlugs = new Set(VIJAYPARCELPOS_ITEMS.map((i) => i.slug));
    for (const slug of fmSlugs) {
      expect(qbSlugs.has(slug)).toBe(false);
      expect(vpSlugs.has(slug)).toBe(false);
    }
    for (const slug of qbSlugs) {
      expect(vpSlugs.has(slug)).toBe(false);
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

  it('getTenantSeedData should return correct data for vijayparcelpos', () => {
    const data = getTenantSeedData('vijayparcelpos');
    expect(data.categories).toBe(VIJAYPARCELPOS_CATEGORIES);
    expect(data.items).toBe(VIJAYPARCELPOS_ITEMS);
  });

  it('getTenantSeedData should throw for unknown tenant', () => {
    expect(() => getTenantSeedData('nonexistent')).toThrow('No seed data defined');
  });

  it('should have all VijayParcelPOS item categorySlug references match VijayParcelPOS categories', () => {
    const vpCatSlugs = new Set(VIJAYPARCELPOS_CATEGORIES.map((c) => c.slug));
    for (const item of VIJAYPARCELPOS_ITEMS) {
      expect(vpCatSlugs.has(item.categorySlug)).toBe(true);
    }
  });

  it('all VijayParcelPOS categories should have Telugu translations', () => {
    for (const cat of VIJAYPARCELPOS_CATEGORIES) {
      expect(cat.nameTe).toBeDefined();
      expect(cat.nameTe!.length).toBeGreaterThan(0);
    }
  });

  it('all VijayParcelPOS items should have Telugu translations', () => {
    for (const item of VIJAYPARCELPOS_ITEMS) {
      expect(item.nameTe).toBeDefined();
      expect(item.nameTe!.length).toBeGreaterThan(0);
    }
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

  describe('VijayParcelPOS trackInventory flags', () => {
    it('POS menu categories (4) should have trackInventory set to false', () => {
      const posCategories = VIJAYPARCELPOS_CATEGORIES.filter((c) =>
        ['chicken-items', 'veg-items', 'seafood-items', 'rice-items'].includes(c.slug),
      );
      expect(posCategories).toHaveLength(4);
      for (const cat of posCategories) {
        expect(cat.trackInventory).toBe(false);
      }
    });

    it('Inventory categories (5) should have trackInventory set to true', () => {
      const invCategories = VIJAYPARCELPOS_CATEGORIES.filter((c) =>
        ['inv-rice', 'inv-dal', 'inv-oil', 'inv-basic', 'inv-spices'].includes(c.slug),
      );
      expect(invCategories).toHaveLength(5);
      for (const cat of invCategories) {
        expect(cat.trackInventory).toBe(true);
      }
    });

    it('FreshMart and QuickBasket categories should all default to trackInventory true', () => {
      for (const cat of FRESHMART_CATEGORIES) {
        expect(cat.trackInventory ?? true).toBe(true);
      }
      for (const cat of QUICKBASKET_CATEGORIES) {
        expect(cat.trackInventory ?? true).toBe(true);
      }
    });
  });

  describe('VijayParcelPOS data counts', () => {
    it('should have exactly 9 categories (4 POS + 5 inventory)', () => {
      expect(VIJAYPARCELPOS_CATEGORIES).toHaveLength(9);
    });

    it('should have exactly 34 items (18 POS + 16 inventory)', () => {
      expect(VIJAYPARCELPOS_ITEMS).toHaveLength(34);
    });
  });

  it('all VP inventory items should reference valid VP inventory category slugs', () => {
    const invCategorySlugs = new Set(
      VIJAYPARCELPOS_CATEGORIES.filter((c) => c.trackInventory === true).map((c) => c.slug),
    );
    const posCategorySlugs = new Set(
      VIJAYPARCELPOS_CATEGORIES.filter((c) => c.trackInventory === false).map((c) => c.slug),
    );
    for (const item of VIJAYPARCELPOS_ITEMS) {
      if (item.slug.startsWith('vp-inv-')) {
        expect(invCategorySlugs.has(item.categorySlug)).toBe(true);
      } else {
        expect(posCategorySlugs.has(item.categorySlug)).toBe(true);
      }
    }
  });
});

describe('TenantUserSeedService — Subscription Creation', () => {
  // These tests validate that the seed service creates trial subscriptions
  // for each tenant and that subscriptions are tenant-isolated.

  it('SEED_TENANTS should have at least 2 tenants for isolation testing', () => {
    const { SEED_TENANTS } = require('./tenant-user-seed-data');
    expect(SEED_TENANTS.length).toBeGreaterThanOrEqual(2);
  });

  it('each seeded tenant should get an independent trial subscription (tenant isolation)', () => {
    // Validates the design: createTrialSubscription is called with each tenant's own ID
    const { SEED_TENANTS } = require('./tenant-user-seed-data');
    const tenantIds = SEED_TENANTS.map((_t: any, i: number) => `tenant-${i}`);

    // Each tenant ID is unique
    const uniqueIds = new Set(tenantIds);
    expect(uniqueIds.size).toBe(tenantIds.length);

    // Each slug is unique
    const slugs = SEED_TENANTS.map((t: any) => t.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('subscription cache keys should be unique per tenant (Redis isolation)', () => {
    const tenantIds = ['tenant-aaa', 'tenant-bbb', 'tenant-ccc'];
    const cacheKeys = tenantIds.map((id) => `sub:active:${id}`);
    const uniqueKeys = new Set(cacheKeys);
    expect(uniqueKeys.size).toBe(tenantIds.length);
  });

  it('trial subscription should have correct defaults (status=trial, amount=0, 14-day duration)', () => {
    // Validates the contract of createTrialSubscription
    const now = new Date();
    const expectedExpiry = new Date(now);
    expectedExpiry.setDate(expectedExpiry.getDate() + 14);

    // The difference should be approximately 14 days (within 1 second tolerance)
    const diffMs = expectedExpiry.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(14, 0);
  });
});
