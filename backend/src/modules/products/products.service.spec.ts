/**
 * Products Service Tests
 * Tests for tenant isolation in item operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Item } from './entities/item.entity';
import { CategoriesService } from '../categories/categories.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  TENANT_A_ID,
  TENANT_B_ID,
  buildMockItem,
  buildMockCategory,
  createMockQueryBuilder,
} from '../../test-utils';

describe('ProductsService', () => {
  let service: ProductsService;
  let itemRepository: Repository<Item>;

  const mockItemTenantA = buildMockItem();

  const mockItemTenantB = buildMockItem({
    id: 'item-b-uuid',
    name: 'Atta 1kg',
    categoryId: 'cat-b-uuid',
    price: 240,
    compareAtPrice: 270,
    tenantId: TENANT_B_ID,
  });

  const queryBuilderMock = createMockQueryBuilder();

  const mockItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock),
  };

  const mockCategoriesService = {
    findOne: jest.fn(),
  };

  const mockInventoryService = {
    addStock: jest.fn(),
    setStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));

    jest.clearAllMocks();

    // Default: categoryId validation passes (category belongs to tenant)
    mockCategoriesService.findOne.mockResolvedValue(buildMockCategory());
  });

  describe('create', () => {
    it('should create item with server-injected tenantId', async () => {
      const createDto = {
        slug: 'test-item',
        name: 'Test Item',
        categoryId: 'cat-uuid',
        compareAtPrice: 100,
      };
      const expectedItem = { ...createDto, tenantId: TENANT_A_ID, id: 'new-item-uuid' };

      mockItemRepository.findOne.mockResolvedValue(null);
      mockItemRepository.create.mockReturnValue(expectedItem);
      mockItemRepository.save.mockResolvedValue(expectedItem);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.tenantId).toBe(TENANT_A_ID);
      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });

    it('should allow same slug for different tenants', async () => {
      const createDto = {
        slug: 'atta-1kg',
        name: 'Atta 1kg',
        categoryId: 'cat-uuid',
        compareAtPrice: 280,
      };
      const expectedItem = { ...createDto, tenantId: TENANT_B_ID, id: 'new-item-uuid' };

      mockItemRepository.findOne.mockResolvedValue(null);
      mockItemRepository.create.mockReturnValue(expectedItem);
      mockItemRepository.save.mockResolvedValue(expectedItem);

      const result = await service.create(createDto, TENANT_B_ID);

      expect(result.tenantId).toBe(TENANT_B_ID);
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'atta-1kg', tenantId: TENANT_B_ID },
      });
    });

    it('should validate categoryId belongs to same tenant', async () => {
      const categoryA = buildMockCategory();
      const createDto = {
        slug: 'test-item',
        name: 'Test Item',
        categoryId: categoryA.id,
        compareAtPrice: 100,
      };

      mockCategoriesService.findOne.mockResolvedValue(categoryA);
      mockItemRepository.findOne.mockResolvedValue(null);
      mockItemRepository.create.mockReturnValue({ ...createDto, tenantId: TENANT_A_ID });
      mockItemRepository.save.mockResolvedValue({ ...createDto, tenantId: TENANT_A_ID });

      await service.create(createDto, TENANT_A_ID);

      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(
        categoryA.id,
        TENANT_A_ID,
      );
    });

    it('should reject item creation with cross-tenant categoryId', async () => {
      const crossTenantCategoryId = 'cat-b-uuid';
      const createDto = {
        slug: 'cross-tenant-item',
        name: 'Cross Tenant Item',
        categoryId: crossTenantCategoryId,
        compareAtPrice: 100,
      };

      mockCategoriesService.findOne.mockRejectedValue(
        new NotFoundException(`Category with ID '${crossTenantCategoryId}' not found`),
      );

      await expect(service.create(createDto, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
      expect(mockItemRepository.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate slug within same tenant', async () => {
      const createDto = {
        slug: 'atta-1kg',
        name: 'Duplicate Atta',
        categoryId: 'cat-uuid',
        compareAtPrice: 280,
      };

      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);

      await expect(service.create(createDto, TENANT_A_ID))
        .rejects.toThrow(ConflictException);
    });

    it('should require tenantId parameter', async () => {
      const createDto = {
        slug: 'test',
        name: 'Test',
        categoryId: 'cat-uuid',
        compareAtPrice: 100,
      };

      await expect(service.create(createDto, undefined as any))
        .rejects.toThrow('Tenant ID is required');
    });
  });

  describe('findAll', () => {
    it('should only return items for the specified tenant', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      const result = await service.findAll(false, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'item.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(TENANT_A_ID);
    });

    it('should apply tenant filter on category join', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findAll(false, TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.category',
        'category',
        'category.tenantId = :categoryTenantId',
        { categoryTenantId: TENANT_A_ID },
      );
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findAll(false, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findByCategory', () => {
    it('should only return items for the specified tenant and category', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      const result = await service.findByCategory('cat-a-uuid', false, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'item.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
    });

    it('should apply tenant filter on category join', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findByCategory('cat-a-uuid', false, TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.category',
        'category',
        'category.tenantId = :categoryTenantId',
        { categoryTenantId: TENANT_A_ID },
      );
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findByCategory('cat-uuid', false, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return item when found and belongs to tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);

      const result = await service.findOne('item-a-uuid', TENANT_A_ID);

      expect(result).toEqual(mockItemTenantA);
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-a-uuid', tenantId: TENANT_A_ID },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException when item belongs to different tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('item-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findOne('item-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return item when slug matches within tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);

      const result = await service.findBySlug('atta-1kg', TENANT_A_ID);

      expect(result).toEqual(mockItemTenantA);
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'atta-1kg', tenantId: TENANT_A_ID },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException when slug exists in different tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('atta-1kg', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findBySlug('atta-1kg', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('create/update → inventory wiring', () => {
    it('records opening stock via inventory (initial) without double-counting, and auto-tracks', async () => {
      const dto = { slug: 's', name: 'Rice', categoryId: 'cat-uuid', compareAtPrice: 100, stockQuantity: 8 };
      mockItemRepository.findOne.mockResolvedValueOnce(null); // dup-slug check
      mockItemRepository.create.mockImplementation((d: any) => d);
      mockItemRepository.save.mockResolvedValue({ ...dto, id: 'item-1', stockQuantity: 0, tenantId: TENANT_A_ID });
      // re-read after addStock
      mockItemRepository.findOne.mockResolvedValueOnce({ ...dto, id: 'item-1', stockQuantity: 8, tenantId: TENANT_A_ID });

      await service.create(dto as any, TENANT_A_ID, 'user-1');

      // Item persisted with stockQuantity 0 (not 8) + trackInventory true.
      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 0, trackInventory: true, tenantId: TENANT_A_ID }),
      );
      // Opening qty recorded once via inventory, tenant-scoped.
      expect(mockInventoryService.addStock).toHaveBeenCalledWith(
        'item-1', 8, 'initial', TENANT_A_ID, 'Opening stock', 'user-1',
      );
    });

    it('does NOT touch inventory or auto-track when no opening stock', async () => {
      const dto = { slug: 's2', name: 'Salt', categoryId: 'cat-uuid', compareAtPrice: 20 };
      mockItemRepository.findOne.mockResolvedValue(null);
      mockItemRepository.create.mockImplementation((d: any) => d);
      mockItemRepository.save.mockResolvedValue({ ...dto, id: 'item-2', tenantId: TENANT_A_ID });

      await service.create(dto as any, TENANT_A_ID, 'user-1');

      expect(mockInventoryService.addStock).not.toHaveBeenCalled();
      expect(mockItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ trackInventory: false }),
      );
    });

    it('routes a quantity change on update through setStock (correction), not a plain save', async () => {
      const current = buildMockItem({ id: 'item-3', stockQuantity: 5, tenantId: TENANT_A_ID });
      mockItemRepository.findOne.mockResolvedValue(current);
      mockItemRepository.save.mockResolvedValue(current);

      await service.update('item-3', { stockQuantity: 12, costPrice: 90 } as any, TENANT_A_ID, 'user-1');

      // setStock owns the quantity write (audit), tenant-scoped.
      expect(mockInventoryService.setStock).toHaveBeenCalledWith(
        'item-3', 12, TENANT_A_ID, 'Manual correction', 'user-1',
      );
      // The plain save must NOT have written stockQuantity (no double-write).
      const savedArg = mockItemRepository.save.mock.calls[0][0];
      expect(savedArg.stockQuantity).toBe(5); // unchanged by Object.assign
      expect(savedArg.costPrice).toBe(90); // settings flowed through
    });

    it('does NOT call setStock when the quantity is unchanged or absent', async () => {
      const current = buildMockItem({ id: 'item-4', stockQuantity: 5, tenantId: TENANT_A_ID });
      mockItemRepository.findOne.mockResolvedValue(current);
      mockItemRepository.save.mockResolvedValue(current);

      await service.update('item-4', { stockQuantity: 5, lowStockThreshold: 3 } as any, TENANT_A_ID, 'user-1');
      expect(mockInventoryService.setStock).not.toHaveBeenCalled();
    });

    it('create opening stock is tenant-scoped (B never referenced for an A create)', async () => {
      const dto = { slug: 's5', name: 'Dal', categoryId: 'cat-uuid', compareAtPrice: 100, stockQuantity: 3 };
      mockItemRepository.findOne.mockResolvedValueOnce(null);
      mockItemRepository.create.mockImplementation((d: any) => d);
      mockItemRepository.save.mockResolvedValue({ ...dto, id: 'item-5', tenantId: TENANT_A_ID });
      mockItemRepository.findOne.mockResolvedValueOnce({ ...dto, id: 'item-5', stockQuantity: 3, tenantId: TENANT_A_ID });

      await service.create(dto as any, TENANT_A_ID, 'user-1');
      const tenantArg = mockInventoryService.addStock.mock.calls[0][3];
      expect(tenantArg).toBe(TENANT_A_ID);
      expect(tenantArg).not.toBe(TENANT_B_ID);
    });
  });

  describe('findByBarcode (tenant-scoped)', () => {
    it('should return the item when the barcode matches within the tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);

      const result = await service.findByBarcode('8901234567890', TENANT_A_ID);

      expect(result).toEqual(mockItemTenantA);
      // Query MUST carry the tenantId so a barcode can never resolve a row
      // owned by another tenant.
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { barcode: '8901234567890', tenantId: TENANT_A_ID },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException when the same barcode is looked up under a different tenant', async () => {
      // Tenant B scanning a code that only exists for Tenant A: the
      // tenant-scoped query returns null → not found. No cross-tenant leak.
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findByBarcode('8901234567890', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { barcode: '8901234567890', tenantId: TENANT_B_ID },
        relations: ['category'],
      });
    });

    it('should require a tenantId parameter (no global barcode lookup)', async () => {
      await expect(service.findByBarcode('8901234567890', undefined as any))
        .rejects.toThrow();
      expect(mockItemRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update item when it belongs to the tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);
      mockItemRepository.save.mockResolvedValue({ ...mockItemTenantA, name: 'Updated' });

      const result = await service.update('item-a-uuid', { name: 'Updated' }, TENANT_A_ID);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when item belongs to different tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.update('item-a-uuid', { name: 'Hack' }, TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should validate categoryId belongs to same tenant when updating category', async () => {
      const crossTenantCategoryId = 'cat-b-uuid';

      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);
      mockCategoriesService.findOne.mockRejectedValue(
        new NotFoundException(`Category with ID '${crossTenantCategoryId}' not found`),
      );

      await expect(
        service.update('item-a-uuid', { categoryId: crossTenantCategoryId }, TENANT_A_ID),
      ).rejects.toThrow(NotFoundException);

      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(
        crossTenantCategoryId,
        TENANT_A_ID,
      );
      expect(mockItemRepository.save).not.toHaveBeenCalled();
    });

    it('should scope slug duplicate check by tenant when updating slug', async () => {
      mockItemRepository.findOne
        .mockResolvedValueOnce(mockItemTenantA) // findOne for ownership
        .mockResolvedValueOnce(null); // slug duplicate check
      mockItemRepository.save.mockResolvedValue({ ...mockItemTenantA, slug: 'new-slug' });

      await service.update('item-a-uuid', { slug: 'new-slug' }, TENANT_A_ID);

      // Verify slug duplicate check is tenant-scoped
      expect(mockItemRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'new-slug', tenantId: TENANT_A_ID },
      });
    });

    it('should require tenantId parameter', async () => {
      await expect(service.update('item-a-uuid', { name: 'Test' }, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete item when it belongs to the tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(mockItemTenantA);
      mockItemRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('item-a-uuid', TENANT_A_ID);

      expect(mockItemRepository.softDelete).toHaveBeenCalledWith('item-a-uuid');
    });

    it('should throw NotFoundException when item belongs to different tenant', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('item-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.remove('item-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should count items only for the specified tenant', async () => {
      queryBuilderMock.getCount.mockResolvedValue(10);

      const result = await service.count(false, undefined, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'item.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toBe(10);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.count(false, undefined, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('bulkCreate', () => {
    it('should inject tenantId into all created items', async () => {
      const items = [
        { slug: 'item-1', name: 'Item 1', categoryId: 'cat-uuid', compareAtPrice: 100 },
        { slug: 'item-2', name: 'Item 2', categoryId: 'cat-uuid', compareAtPrice: 200 },
      ];

      mockItemRepository.create.mockImplementation((dto: any) => dto);
      mockItemRepository.save.mockResolvedValue(items.map(i => ({ ...i, tenantId: TENANT_A_ID })));

      await service.bulkCreate(items, TENANT_A_ID);

      expect(mockItemRepository.create).toHaveBeenCalledTimes(2);
      expect(mockItemRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        slug: 'item-1',
        tenantId: TENANT_A_ID,
      }));
      expect(mockItemRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        slug: 'item-2',
        tenantId: TENANT_A_ID,
      }));
    });

    it('should require tenantId parameter', async () => {
      await expect(service.bulkCreate([{ slug: 'test', name: 'Test', categoryId: 'cat', compareAtPrice: 100 }], undefined as any))
        .rejects.toThrow('Tenant ID is required');
    });
  });

  describe('SELECT clause includes inventory fields', () => {
    it('should include trackInventory field in findAll select', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findAll(false, TENANT_A_ID);

      expect(queryBuilderMock.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'item.trackInventory',
          'item.stockQuantity',
          'item.lowStockThreshold',
        ]),
      );
    });

    it('should include category.trackInventory field in findAll select', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findAll(false, TENANT_A_ID);

      expect(queryBuilderMock.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'category.trackInventory',
        ]),
      );
    });

    it('should include trackInventory field in findByCategory select', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findByCategory('cat-a-uuid', false, TENANT_A_ID);

      expect(queryBuilderMock.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'item.trackInventory',
          'item.stockQuantity',
          'item.lowStockThreshold',
        ]),
      );
    });

    it('should include category.trackInventory field in findByCategory select', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockItemTenantA]);

      await service.findByCategory('cat-a-uuid', false, TENANT_A_ID);

      expect(queryBuilderMock.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'category.trackInventory',
        ]),
      );
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should prevent Tenant A from accessing Tenant B item by ID', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockItemTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from updating Tenant B item', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockItemTenantB.id, { name: 'Malicious' }, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from deleting Tenant B item', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockItemTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });
  });
});
