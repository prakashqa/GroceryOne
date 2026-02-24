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
import {
  TENANT_A_ID,
  TENANT_B_ID,
  buildMockItem,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));

    jest.clearAllMocks();
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
