/**
 * Inventory Service Tests
 * Tests for stock management, audit trail, and multi-tenant isolation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Item } from '../products/entities/item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import {
  TENANT_A_ID,
  TENANT_B_ID,
  USER_A_ID,
  buildMockItem,
  buildMockInventoryTransaction,
  createMockQueryBuilder,
} from '../../test-utils';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockItemA = buildMockItem({ stockQuantity: 100, trackInventory: true });
  const mockItemB = buildMockItem({
    id: 'item-b-uuid',
    tenantId: TENANT_B_ID,
    stockQuantity: 50,
    trackInventory: true,
  });
  const mockItemNoTracking = buildMockItem({
    id: 'item-no-track-uuid',
    trackInventory: false,
    stockQuantity: 0,
  });

  const txnQueryBuilder = createMockQueryBuilder();

  // Shared so tests can configure .execute() (the atomic stock UPDATE) and
  // assert against the update/set/where calls.
  const itemQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => itemQueryBuilder),
  };

  const mockTxnRepository = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'inv-txn-uuid', ...data })),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => txnQueryBuilder),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: mockTxnRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  // ── addStock ──────────────────────────────────────────────────────────

  describe('addStock', () => {
    it('should increase stock quantity and record transaction', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA });
      mockItemRepository.save.mockResolvedValue({ ...mockItemA, stockQuantity: 150 });

      const result = await service.addStock(
        mockItemA.id, 50, 'restock', TENANT_A_ID, 'Weekly restock', USER_A_ID,
      );

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockItemA.id, tenantId: TENANT_A_ID },
      });
      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 150 }),
      );
      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_A_ID,
          itemId: mockItemA.id,
          type: 'restock',
          quantity: 50,
          stockAfter: 150,
          reason: 'Weekly restock',
          performedBy: USER_A_ID,
        }),
      );
      expect(mockTxnRepository.save).toHaveBeenCalled();
    });

    it('should reject when item not found for tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addStock('nonexistent-id', 50, 'restock', TENANT_A_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when tenantId is missing', async () => {
      await expect(
        service.addStock(mockItemA.id, 50, 'restock', undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record correct stockAfter value', async () => {
      const currentStock = 75;
      const addQuantity = 25;
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: currentStock });
      mockItemRepository.save.mockResolvedValue({ ...mockItemA, stockQuantity: currentStock + addQuantity });

      await service.addStock(mockItemA.id, addQuantity, 'restock', TENANT_A_ID);

      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ stockAfter: 100 }),
      );
    });
  });

  // ── removeStock ───────────────────────────────────────────────────────

  describe('removeStock', () => {
    it('should decrease stock atomically and record transaction', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 1 }); // decrement succeeded
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 80 }); // re-read

      await service.removeStock(
        mockItemA.id, 20, 'damage', TENANT_A_ID, 'Damaged goods',
      );

      // No read-modify-write: the row is changed by a conditional UPDATE, not save().
      expect(mockItemRepository.save).not.toHaveBeenCalled();
      expect(itemQueryBuilder.update).toHaveBeenCalled();
      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'damage', quantity: -20, stockAfter: 80 }),
      );
    });

    it('uses an atomic conditional UPDATE guarded by stock_quantity >= qty (lost-update safe)', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 80 });

      await service.removeStock(mockItemA.id, 20, 'sale', TENANT_A_ID);

      const whereArg = itemQueryBuilder.where.mock.calls[0]?.[0];
      expect(whereArg).toContain('stock_quantity >= :decQty');
      expect(whereArg).toContain('tenant_id = :tenantId');
      expect(itemQueryBuilder.where.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({ itemId: mockItemA.id, tenantId: TENANT_A_ID, decQty: 20 }),
      );
    });

    it('should reject when insufficient stock (UPDATE affected 0, item exists)', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 0 });
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 5 });

      await expect(
        service.removeStock(mockItemA.id, 20, 'damage', TENANT_A_ID),
      ).rejects.toThrow(BadRequestException);
      expect(mockTxnRepository.save).not.toHaveBeenCalled();
    });

    it('should allow removing exact remaining stock (stock goes to 0)', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 0 });

      await service.removeStock(mockItemA.id, 20, 'sale', TENANT_A_ID);

      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ stockAfter: 0 }),
      );
    });

    it('should reject cross-tenant access (UPDATE affected 0, item not found)', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 0 });
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeStock(mockItemA.id, 10, 'damage', TENANT_B_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── setStock ──────────────────────────────────────────────────────────

  describe('setStock', () => {
    it('should set absolute stock and record correction transaction', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 100 });
      mockItemRepository.save.mockResolvedValue({ ...mockItemA, stockQuantity: 75 });

      await service.setStock(mockItemA.id, 75, TENANT_A_ID, 'Stock count correction');

      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 75 }),
      );
      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'correction',
          quantity: -25,
          stockAfter: 75,
          reason: 'Stock count correction',
        }),
      );
    });

    it('should calculate positive delta when increasing stock', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 50 });
      mockItemRepository.save.mockResolvedValue({ ...mockItemA, stockQuantity: 120 });

      await service.setStock(mockItemA.id, 120, TENANT_A_ID);

      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'correction',
          quantity: 70,
          stockAfter: 120,
        }),
      );
    });
  });

  // ── validateStock ─────────────────────────────────────────────────────

  describe('validateStock', () => {
    it('should pass when stock is sufficient', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 100 });

      await expect(
        service.validateStock(mockItemA.id, 50, TENANT_A_ID),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException when stock insufficient', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 5 });

      await expect(
        service.validateStock(mockItemA.id, 50, TENANT_A_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip validation when trackInventory is false', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemNoTracking });

      await expect(
        service.validateStock(mockItemNoTracking.id, 9999, TENANT_A_ID),
      ).resolves.not.toThrow();
    });

    it('should reject cross-tenant item access', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateStock(mockItemA.id, 1, TENANT_B_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deductStockForOrder ───────────────────────────────────────────────

  describe('deductStockForOrder', () => {
    it('should deduct stock for all items in order', async () => {
      const item1 = { ...mockItemA, id: 'item-1', stockQuantity: 100 };
      const item2 = { ...mockItemA, id: 'item-2', stockQuantity: 200 };

      // The atomic decrement succeeds for each item.
      itemQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      // findOne is hit twice per item: once for the trackInventory check, once
      // as the post-decrement re-read inside removeStock.
      mockItemRepository.findOne
        .mockResolvedValueOnce(item1)
        .mockResolvedValueOnce({ ...item1, stockQuantity: 90 })
        .mockResolvedValueOnce(item2)
        .mockResolvedValueOnce({ ...item2, stockQuantity: 195 });

      await service.deductStockForOrder(
        [
          { itemId: 'item-1', quantity: 10 },
          { itemId: 'item-2', quantity: 5 },
        ],
        'order-uuid',
        TENANT_A_ID,
      );

      expect(mockTxnRepository.create).toHaveBeenCalledTimes(2);
      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sale',
          referenceType: 'order',
          referenceId: 'order-uuid',
        }),
      );
    });

    it('should throw if any item has insufficient stock', async () => {
      itemQueryBuilder.execute.mockResolvedValue({ affected: 0 }); // decrement blocked by guard
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 2 });

      await expect(
        service.deductStockForOrder(
          [{ itemId: mockItemA.id, quantity: 50 }],
          'order-uuid',
          TENANT_A_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── restoreStockForOrder ──────────────────────────────────────────────

  describe('restoreStockForOrder', () => {
    it('should add stock back for all items', async () => {
      mockItemRepository.findOne.mockResolvedValue({ ...mockItemA, stockQuantity: 50 });
      mockItemRepository.save.mockResolvedValue({ ...mockItemA, stockQuantity: 60 });

      await service.restoreStockForOrder(
        [{ itemId: mockItemA.id, quantity: 10 }],
        'order-uuid',
        TENANT_A_ID,
      );

      expect(mockTxnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'return',
          referenceType: 'order',
          referenceId: 'order-uuid',
        }),
      );
    });
  });

  // ── getLowStockItems ──────────────────────────────────────────────────

  describe('getLowStockItems', () => {
    it('should return items where stockQuantity <= lowStockThreshold', async () => {
      const lowStockItem = buildMockItem({
        id: 'low-stock-item',
        stockQuantity: 5,
        lowStockThreshold: 10,
        trackInventory: true,
      });

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([lowStockItem]),
      };
      mockItemRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getLowStockItems(TENANT_A_ID);

      expect(result).toEqual([lowStockItem]);
      expect(qb.where).toHaveBeenCalled();
    });

    it('should filter by tenant', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockItemRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getLowStockItems(TENANT_A_ID);

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('tenantId'),
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });
  });

  // ── getTransactionHistory ─────────────────────────────────────────────

  describe('getTransactionHistory', () => {
    it('should return transactions for item within tenant', async () => {
      const txn = buildMockInventoryTransaction();
      mockTxnRepository.findAndCount.mockResolvedValue([[txn], 1]);

      const result = await service.getTransactionHistory(
        mockItemA.id, TENANT_A_ID, 20, 0,
      );

      expect(result.transactions).toEqual([txn]);
      expect(result.total).toBe(1);
      expect(mockTxnRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { itemId: mockItemA.id, tenantId: TENANT_A_ID },
        }),
      );
    });

    it('should paginate results', async () => {
      mockTxnRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getTransactionHistory(mockItemA.id, TENANT_A_ID, 10, 20);

      expect(mockTxnRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });
  });

  // ── getStockLevel ─────────────────────────────────────────────────────

  describe('getStockLevel', () => {
    it('should return stock info for a single item', async () => {
      mockItemRepository.findOne.mockResolvedValue({
        ...mockItemA,
        stockQuantity: 5,
        lowStockThreshold: 10,
      });

      const result = await service.getStockLevel(mockItemA.id, TENANT_A_ID);

      expect(result).toEqual({
        itemId: mockItemA.id,
        stockQuantity: 5,
        lowStockThreshold: 10,
        isLowStock: true,
        trackInventory: true,
      });
    });
  });

  // ── updateItemInventorySettings ───────────────────────────────────────

  describe('updateItemInventorySettings', () => {
    it('should update lowStockThreshold and trackInventory', async () => {
      const item = { ...mockItemA };
      mockItemRepository.findOne.mockResolvedValue(item);
      mockItemRepository.save.mockResolvedValue({
        ...item,
        lowStockThreshold: 20,
        trackInventory: false,
      });

      const result = await service.updateItemInventorySettings(
        mockItemA.id,
        { lowStockThreshold: 20, trackInventory: false },
        TENANT_A_ID,
      );

      expect(mockItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lowStockThreshold: 20,
          trackInventory: false,
        }),
      );
    });
  });

  // ── Cross-tenant isolation ────────────────────────────────────────────

  describe('cross-tenant isolation', () => {
    it('tenant A cannot adjust stock on tenant B item', async () => {
      // findOne returns null because item belongs to tenant B, not A
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addStock(mockItemB.id, 50, 'restock', TENANT_A_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('tenant A cannot view tenant B transaction history', async () => {
      mockTxnRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getTransactionHistory(
        mockItemB.id, TENANT_A_ID, 20, 0,
      );

      expect(result.transactions).toEqual([]);
      expect(mockTxnRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { itemId: mockItemB.id, tenantId: TENANT_A_ID },
        }),
      );
    });

    it('getLowStockItems only returns own tenant items', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockItemRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getLowStockItems(TENANT_B_ID);

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('tenantId'),
        expect.objectContaining({ tenantId: TENANT_B_ID }),
      );
    });
  });
});
