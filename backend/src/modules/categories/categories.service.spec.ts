/**
 * Categories Service Tests
 * Tests for tenant isolation in category operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import {
  TENANT_A_ID,
  TENANT_B_ID,
  buildMockCategory,
  createMockQueryBuilder,
} from '../../test-utils';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: Repository<Category>;

  const mockCategoryTenantA = buildMockCategory();

  const mockCategoryTenantB = buildMockCategory({
    id: 'cat-b-uuid',
    tenantId: TENANT_B_ID,
  });

  const queryBuilderMock = createMockQueryBuilder();

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create category with server-injected tenantId', async () => {
      const createDto = { slug: 'test-cat', name: 'Test Category', icon: '📁', sortOrder: 0, isActive: true };
      const expectedCategory = { ...createDto, tenantId: TENANT_A_ID, id: 'new-cat-uuid' };

      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(expectedCategory);
      mockCategoryRepository.save.mockResolvedValue(expectedCategory);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.tenantId).toBe(TENANT_A_ID);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });

    it('should allow same slug for different tenants', async () => {
      const createDto = { slug: 'fruits', name: 'Fruits', icon: '🍎', sortOrder: 0, isActive: true };
      const expectedCategory = { ...createDto, tenantId: TENANT_B_ID, id: 'new-cat-uuid' };

      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(expectedCategory);
      mockCategoryRepository.save.mockResolvedValue(expectedCategory);

      const result = await service.create(createDto, TENANT_B_ID);

      expect(result.tenantId).toBe(TENANT_B_ID);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'fruits', tenantId: TENANT_B_ID },
      });
    });

    it('should reject duplicate slug within same tenant', async () => {
      const createDto = { slug: 'fruits', name: 'Fruits Again', icon: '🍎', sortOrder: 0, isActive: true };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategoryTenantA);

      await expect(service.create(createDto, TENANT_A_ID))
        .rejects.toThrow(ConflictException);
    });

    it('should require tenantId parameter', async () => {
      const createDto = { slug: 'test', name: 'Test', icon: '📁', sortOrder: 0, isActive: true };

      await expect(service.create(createDto, undefined as any))
        .rejects.toThrow('Tenant ID is required');
    });
  });

  describe('findAll', () => {
    it('should only return categories for the specified tenant', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockCategoryTenantA]);

      const result = await service.findAll(false, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'category.tenantId = :tenantId',
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

  describe('findAllWithItems', () => {
    it('should only return categories with items for the specified tenant', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockCategoryTenantA]);

      const result = await service.findAllWithItems(false, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'category.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
    });

    it('should filter joined items by tenantId in the join condition', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.findAllWithItems(false, TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'category.items',
        'item',
        'item.tenantId = :itemTenantId',
        { itemTenantId: TENANT_A_ID },
      );
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findAllWithItems(false, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return category when found and belongs to tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);

      const result = await service.findOne('cat-a-uuid', TENANT_A_ID);

      expect(result).toEqual(mockCategoryTenantA);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'category.id = :id',
        { id: 'cat-a-uuid' },
      );
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'category.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
    });

    it('should filter items by tenantId in the join condition', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);

      await service.findOne('cat-a-uuid', TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'category.items',
        'item',
        'item.tenantId = :itemTenantId',
        { itemTenantId: TENANT_A_ID },
      );
    });

    it('should throw NotFoundException when category belongs to different tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.findOne('cat-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findOne('cat-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return category when slug matches within tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);

      const result = await service.findBySlug('fruits', TENANT_A_ID);

      expect(result).toEqual(mockCategoryTenantA);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'category.slug = :slug',
        { slug: 'fruits' },
      );
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'category.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
    });

    it('should filter items by tenantId in the join condition', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);

      await service.findBySlug('fruits', TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'category.items',
        'item',
        'item.tenantId = :itemTenantId',
        { itemTenantId: TENANT_A_ID },
      );
    });

    it('should throw NotFoundException when slug exists in different tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.findBySlug('fruits', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findBySlug('fruits', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update category when it belongs to the tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategoryTenantA, name: 'Updated' });

      const result = await service.update('cat-a-uuid', { name: 'Updated' }, TENANT_A_ID);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when category belongs to different tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.update('cat-a-uuid', { name: 'Hack' }, TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should scope slug duplicate check by tenant when updating slug', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategoryTenantA, slug: 'new-slug' });

      await service.update('cat-a-uuid', { slug: 'new-slug' }, TENANT_A_ID);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'new-slug', tenantId: TENANT_A_ID },
      });
    });

    it('should require tenantId parameter', async () => {
      await expect(service.update('cat-a-uuid', { name: 'Test' }, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete category when it belongs to the tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCategoryTenantA);
      mockCategoryRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('cat-a-uuid', TENANT_A_ID);

      expect(mockCategoryRepository.softDelete).toHaveBeenCalledWith('cat-a-uuid');
    });

    it('should throw NotFoundException when category belongs to different tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.remove('cat-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.remove('cat-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should count categories only for the specified tenant', async () => {
      queryBuilderMock.getCount.mockResolvedValue(3);

      const result = await service.count(false, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'category.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toBe(3);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.count(false, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('bulkCreate', () => {
    it('should inject tenantId into all created categories', async () => {
      const categories = [
        { slug: 'cat-1', name: 'Cat 1', icon: '📁', sortOrder: 0, isActive: true },
        { slug: 'cat-2', name: 'Cat 2', icon: '📁', sortOrder: 1, isActive: true },
      ];

      mockCategoryRepository.create.mockImplementation((dto: any) => dto);
      mockCategoryRepository.save.mockResolvedValue(categories.map(c => ({ ...c, tenantId: TENANT_A_ID })));

      await service.bulkCreate(categories, TENANT_A_ID);

      expect(mockCategoryRepository.create).toHaveBeenCalledTimes(2);
      expect(mockCategoryRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        slug: 'cat-1',
        tenantId: TENANT_A_ID,
      }));
      expect(mockCategoryRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        slug: 'cat-2',
        tenantId: TENANT_A_ID,
      }));
    });

    it('should require tenantId parameter', async () => {
      await expect(service.bulkCreate([{ slug: 'test', name: 'Test', icon: '📁', sortOrder: 0, isActive: true }], undefined as any))
        .rejects.toThrow('Tenant ID is required');
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should prevent Tenant A from accessing Tenant B category by ID', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.findOne(mockCategoryTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from updating Tenant B category', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.update(mockCategoryTenantB.id, { name: 'Malicious' }, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from deleting Tenant B category', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.remove(mockCategoryTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });
  });
});
