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
      tenantRepo.findOne.mockResolvedValue(null);

      const report = await service.seedHistoricData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('No tenant');
      expect(report.cartsCreated).toBe(0);
    });

    it('should assign tenantId to created carts when tenant exists', async () => {
      const mockTenant = { id: 'tenant-123', slug: 'quickbasket' } as Tenant;
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      itemRepo.count.mockResolvedValue(10);
      itemRepo.find.mockResolvedValue([
        { id: 'item-1', slug: 'wheat-flour-1kg' } as Item,
      ]);

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

    it('should fail with error when no items exist in database', async () => {
      itemRepo.count.mockResolvedValue(0);

      const report = await service.seedHistoricData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('No items');
      expect(report.cartsCreated).toBe(0);
    });
  });
});
