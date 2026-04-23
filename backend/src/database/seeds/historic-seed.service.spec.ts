/**
 * HistoricSeedService Tests
 * TDD tests for the historic cart data seeding service
 */

import { HistoricSeedService } from './historic-seed.service';
import { Repository, DataSource, ObjectLiteral } from 'typeorm';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { FRESHMART_ITEMS } from './seed-data';

// Helper to create mock repository
function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
  return {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'mock-id', ...data })),
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    }),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('HistoricSeedService', () => {
  let service: HistoricSeedService;
  let cartRepo: jest.Mocked<Repository<Cart>>;
  let cartItemRepo: jest.Mocked<Repository<CartItem>>;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    cartRepo = createMockRepository<Cart>();
    cartItemRepo = createMockRepository<CartItem>();
    itemRepo = createMockRepository<Item>();
    tenantRepo = createMockRepository<Tenant>();

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<DataSource>;

    service = new HistoricSeedService(
      cartRepo,
      cartItemRepo,
      itemRepo,
      tenantRepo,
      dataSource,
    );
  });

  describe('seedHistoricData', () => {
    it('should fail with error when no tenant exists in database', async () => {
      itemRepo.count.mockResolvedValue(10);
      tenantRepo.find.mockResolvedValue([]);

      const report = await service.seedHistoricData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('No tenant');
      expect(report.cartsCreated).toBe(0);
    });

    it('should assign tenantId to created carts when tenant exists', async () => {
      const mockTenant = { id: 'tenant-123', slug: 'quickbasket', name: 'QuickBasket' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(10);
      itemRepo.find.mockResolvedValue(
        FRESHMART_ITEMS.map((it, idx) => ({ id: `item-${idx}`, slug: it.slug } as Item)),
      );

      // Track what gets passed to cartRepo.create
      const createCalls: any[] = [];
      cartRepo.create.mockImplementation((data: any) => {
        createCalls.push(data);
        return data as Cart;
      });
      cartRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: 'saved-cart-id', ...data }),
      );

      const report = await service.seedHistoricData();

      // Every cart create call should include tenantId
      expect(createCalls.length).toBeGreaterThan(0);
      for (const call of createCalls) {
        expect(call.tenantId).toBe('tenant-123');
      }
    });

    it('should be idempotent: skip seeding when historic carts already exist for the tenant', async () => {
      // Regression: running the seed twice duplicated every "Cart N" because
      // daysAgo() uses random hours/minutes for most days, so the second
      // run's rows never collided with the first. Users saw two "Cart 5"s
      // in Manage Orders — one with items, one with a stale total.
      const mockTenant = { id: 'tenant-exists', slug: 'freshmart', name: 'FreshMart' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(10);
      // Simulate prior seed run: 150 historic carts already present.
      cartRepo.count.mockResolvedValue(150);

      const report = await service.seedHistoricData();

      expect(cartRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-exists' } });
      expect(cartRepo.create).not.toHaveBeenCalled();
      expect(cartRepo.save).not.toHaveBeenCalled();
      expect(report.cartsCreated).toBe(0);
      expect(report.errors.some((e) => e.includes('already present'))).toBe(true);
    });

    it('should scope the idempotency check to the chosen tenant (no cross-tenant leakage)', async () => {
      // Tenant B should still receive historic data even if tenant A has some.
      // The count filter must carry tenantId — otherwise a multi-tenant DB
      // would never re-seed a fresh tenant.
      const mockTenant = { id: 'tenant-fresh', slug: 'quickbasket', name: 'QuickBasket' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(FRESHMART_ITEMS.length);
      itemRepo.find.mockResolvedValue(
        FRESHMART_ITEMS.map((it, idx) => ({ id: `item-${idx}`, slug: it.slug } as Item)),
      );
      cartRepo.count.mockResolvedValue(0); // Fresh tenant — no existing historic carts.
      cartRepo.create.mockImplementation((d: any) => d as Cart);
      cartRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: 'cart-id', ...d }),
      );

      const report = await service.seedHistoricData();

      expect(cartRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-fresh' } });
      expect(report.cartsCreated).toBeGreaterThan(0);
    });

    it('should iterate every tenant and seed each independently', async () => {
      // Regression for Gap 1: `findOne({ where: {} })` picked one arbitrary
      // tenant, leaving every other tenant with zero historic carts.
      const tenants = [
        { id: 'tenant-A', slug: 'freshmart', name: 'FreshMart' } as Tenant,
        { id: 'tenant-B', slug: 'quickbasket', name: 'QuickBasket' } as Tenant,
        { id: 'tenant-C', slug: 'abtrade', name: 'ABTrade' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(tenants);
      itemRepo.count.mockResolvedValue(FRESHMART_ITEMS.length);
      // Per-tenant item pools — use the same slug set so lookups resolve,
      // but tag the item id with the tenant to prove isolation.
      itemRepo.find.mockImplementation((opts: any) => {
        const tid = opts?.where?.tenantId ?? 'unknown';
        return Promise.resolve(
          FRESHMART_ITEMS.map(
            (it, idx) => ({ id: `${tid}-item-${idx}`, slug: it.slug, tenantId: tid } as Item),
          ),
        );
      });
      cartRepo.count.mockResolvedValue(0);

      const createdCarts: any[] = [];
      cartRepo.create.mockImplementation((d: any) => {
        createdCarts.push(d);
        return d as Cart;
      });
      cartRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: `cart-${createdCarts.length}`, ...d }),
      );

      const report = await service.seedHistoricData();

      // Every tenant must have received cart create calls.
      const seededTenantIds = new Set(createdCarts.map((c) => c.tenantId));
      expect(seededTenantIds.has('tenant-A')).toBe(true);
      expect(seededTenantIds.has('tenant-B')).toBe(true);
      expect(seededTenantIds.has('tenant-C')).toBe(true);
      expect(report.cartsCreated).toBeGreaterThan(0);
      // Per-tenant count check was issued for each tenant (tenant-scoped).
      expect(cartRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-A' } });
      expect(cartRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-B' } });
      expect(cartRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-C' } });
    });

    it('should resolve cart_item slugs against the tenant\'s own item catalog (per-tenant isolation)', async () => {
      // Regression for Gap 1 part B: historic-seed-data used FRESHMART_ITEMS
      // globally. If a non-FreshMart tenant was picked, every slug missed
      // the local catalog and carts ended up with 0 cart_items.
      const tenants = [
        { id: 'tenant-A', slug: 'freshmart', name: 'FreshMart' } as Tenant,
        { id: 'tenant-B', slug: 'quickbasket', name: 'QuickBasket' } as Tenant,
      ];
      tenantRepo.find.mockResolvedValue(tenants);
      itemRepo.count.mockResolvedValue(10);

      itemRepo.find.mockImplementation((opts: any) => {
        const tid = opts?.where?.tenantId;
        // Each tenant owns a distinct 10-slug catalog. No overlap.
        return Promise.resolve(
          Array.from({ length: 10 }, (_v, idx) => ({
            id: `${tid}-item-${idx}`,
            slug: `${tid}-slug-${idx}`,
            tenantId: tid,
          } as Item)),
        );
      });
      cartRepo.count.mockResolvedValue(0);
      cartRepo.create.mockImplementation((d: any) => d as Cart);
      cartRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: `cart-${Math.random()}`, ...d }),
      );

      const cartItemCreateCalls: any[] = [];
      cartItemRepo.create.mockImplementation((d: any) => {
        cartItemCreateCalls.push(d);
        return d as CartItem;
      });
      cartItemRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: 'ci', ...d }),
      );

      await service.seedHistoricData();

      expect(cartItemCreateCalls.length).toBeGreaterThan(0);
      // Every cart_item's resolved itemId must have the SAME tenant prefix
      // as its cart — proving the slug was resolved against that tenant's
      // own catalog, never a sibling tenant's.
      for (const ci of cartItemCreateCalls) {
        // itemId shape: `${tenantId}-item-${idx}` (from mock above).
        const itemIdTenant = String(ci.itemId).split('-item-')[0];
        expect(ci.tenantId).toBe(itemIdTenant);
      }
    });

    it('should stamp tenantId on every cart_item row (defence in depth for reports)', async () => {
      // cart_items.tenantId is nullable at the column level but every row
      // must still carry it so tenant-scoped report queries that filter
      // cart_items directly cannot accidentally read another tenant's data.
      const mockTenant = { id: 'tenant-ti', slug: 'freshmart', name: 'FreshMart' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(FRESHMART_ITEMS.length);
      itemRepo.find.mockResolvedValue(
        FRESHMART_ITEMS.map((it, idx) => ({ id: `item-${idx}`, slug: it.slug, tenantId: 'tenant-ti' } as Item)),
      );
      cartRepo.count.mockResolvedValue(0);
      cartRepo.create.mockImplementation((d: any) => d as Cart);
      cartRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: 'cart-x', ...d }),
      );

      const cartItemCreateCalls: any[] = [];
      cartItemRepo.create.mockImplementation((d: any) => {
        cartItemCreateCalls.push(d);
        return d as CartItem;
      });
      cartItemRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: 'ci', ...d }),
      );

      await service.seedHistoricData();

      expect(cartItemCreateCalls.length).toBeGreaterThan(0);
      for (const ci of cartItemCreateCalls) {
        expect(ci.tenantId).toBe('tenant-ti');
      }
    });

    it('should fail with error when no items exist in database', async () => {
      itemRepo.count.mockResolvedValue(0);

      const report = await service.seedHistoricData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('No items');
      expect(report.cartsCreated).toBe(0);
    });

    it('should set paidItemCount = number of resolved items for paid/completed carts', async () => {
      // Regression guard for a gap in seed data: the new paid_item_count
      // column stayed NULL for every historic paid cart because the seeder
      // did not calculate it. Dashboard/reports depend on this field.
      const mockTenant = { id: 'tenant-t1', slug: 'quickbasket' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(FRESHMART_ITEMS.length);
      // Mock EVERY FRESHMART_ITEM so slug lookup never misses — otherwise
      // cart items drop out and paidItemCount is an unreliable signal.
      itemRepo.find.mockResolvedValue(
        FRESHMART_ITEMS.map((it, idx) => ({ id: `item-${idx}`, slug: it.slug } as Item)),
      );

      const createCalls: any[] = [];
      cartRepo.create.mockImplementation((data: any) => {
        createCalls.push(data);
        return data as Cart;
      });
      cartRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `saved-${createCalls.length}`, ...data }),
      );

      await service.seedHistoricData();

      // Every paid or completed cart must have paidItemCount set (>= 1).
      // Draft carts must not have it set (NULL / undefined).
      const paidCalls = createCalls.filter(
        (c) => c.status === 'paid' || c.status === 'completed',
      );
      expect(paidCalls.length).toBeGreaterThan(0);
      for (const call of paidCalls) {
        expect(call.paidItemCount).toBeGreaterThan(0);
        expect(Number.isInteger(call.paidItemCount)).toBe(true);
      }

      const draftCalls = createCalls.filter((c) => c.status === 'draft');
      for (const call of draftCalls) {
        // Draft carts should not have a paid-side snapshot.
        expect(call.paidItemCount).toBeUndefined();
      }
    });

    it('scopes paidItemCount per cart — tenant isolation is preserved', async () => {
      // Negative tenant-mismatch check: all created carts must belong to the
      // single tenant returned by findOne, and paidItemCount must reflect that
      // cart's own items only, never spill across carts.
      const mockTenant = { id: 'tenant-isolated', slug: 'freshmart' } as Tenant;
      tenantRepo.find.mockResolvedValue([mockTenant]);
      itemRepo.count.mockResolvedValue(FRESHMART_ITEMS.length);
      itemRepo.find.mockResolvedValue(
        FRESHMART_ITEMS.map((it, idx) => ({ id: `item-${idx}`, slug: it.slug } as Item)),
      );

      const createCalls: any[] = [];
      cartRepo.create.mockImplementation((data: any) => {
        createCalls.push(data);
        return data as Cart;
      });
      cartRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: `saved-${createCalls.length}`, ...data }),
      );

      await service.seedHistoricData();

      for (const call of createCalls) {
        expect(call.tenantId).toBe('tenant-isolated');
        if (call.status === 'paid' || call.status === 'completed') {
          // paidItemCount must be a non-negative integer, not leaked from another cart
          expect(call.paidItemCount).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
