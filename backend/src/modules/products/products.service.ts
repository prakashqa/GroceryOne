/**
 * Products Service
 * Business logic for item management
 * All operations are tenant-scoped for data isolation
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto, UpdateItemDto } from './dto';
import { CategoriesService } from '../categories/categories.service';

function validateTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Create a new item
   */
  async create(createItemDto: CreateItemDto, tenantId?: string): Promise<Item> {
    validateTenantId(tenantId);

    // Validate categoryId belongs to the same tenant
    await this.categoriesService.findOne(createItemDto.categoryId, tenantId);

    // Check for duplicate slug within this tenant
    const existingItem = await this.itemRepository.findOne({
      where: { slug: createItemDto.slug, tenantId },
    });

    if (existingItem) {
      throw new ConflictException(`Item with slug '${createItemDto.slug}' already exists`);
    }

    const item = this.itemRepository.create({
      ...createItemDto,
      tenantId,
    });
    const saved = await this.itemRepository.save(item);
    this.logger.log(`Created item: ${saved.name} (${saved.slug}) for tenant ${tenantId}`);
    return saved;
  }

  /**
   * Find all items
   */
  async findAll(includeInactive = false, tenantId?: string): Promise<Item[]> {
    validateTenantId(tenantId);

    const query = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category', 'category.tenantId = :categoryTenantId', { categoryTenantId: tenantId })
      .select([
        'item.id',
        'item.slug',
        'item.name',
        'item.nameTe',
        'item.barcode',
        'item.categoryId',
        'item.unit',
        'item.defaultQuantity',
        'item.price',
        'item.compareAtPrice',
        'item.costPrice',
        'item.sortOrder',
        'item.isActive',
        'item.trackInventory',
        'item.stockQuantity',
        'item.lowStockThreshold',
        'item.tenantId',
        'item.createdAt',
        'item.updatedAt',
        'item.deletedAt',
        'category.id',
        'category.slug',
        'category.name',
        'category.nameTe',
        'category.icon',
        'category.sortOrder',
        'category.isActive',
        'category.trackInventory',
        'category.createdAt',
        'category.updatedAt',
        'category.deletedAt',
      ])
      .orderBy('item.sortOrder', 'ASC')
      .addOrderBy('item.name', 'ASC');

    // Always filter by tenant for data isolation
    query.andWhere('item.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('item.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  /**
   * Find items by category
   */
  async findByCategory(categoryId: string, includeInactive = false, tenantId?: string): Promise<Item[]> {
    validateTenantId(tenantId);

    const query = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category', 'category.tenantId = :categoryTenantId', { categoryTenantId: tenantId })
      .select([
        'item.id',
        'item.slug',
        'item.name',
        'item.nameTe',
        'item.barcode',
        'item.categoryId',
        'item.unit',
        'item.defaultQuantity',
        'item.price',
        'item.compareAtPrice',
        'item.costPrice',
        'item.sortOrder',
        'item.isActive',
        'item.trackInventory',
        'item.stockQuantity',
        'item.lowStockThreshold',
        'item.tenantId',
        'item.createdAt',
        'item.updatedAt',
        'item.deletedAt',
        'category.id',
        'category.slug',
        'category.name',
        'category.nameTe',
        'category.icon',
        'category.sortOrder',
        'category.isActive',
        'category.trackInventory',
        'category.createdAt',
        'category.updatedAt',
        'category.deletedAt',
      ])
      .where('item.categoryId = :categoryId', { categoryId })
      .orderBy('item.sortOrder', 'ASC')
      .addOrderBy('item.name', 'ASC');

    // Always filter by tenant for data isolation
    query.andWhere('item.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('item.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  /**
   * Find an item by ID
   */
  async findOne(id: string, tenantId?: string): Promise<Item> {
    validateTenantId(tenantId);

    const item = await this.itemRepository.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID '${id}' not found`);
    }

    return item;
  }

  /**
   * Find an item by slug
   */
  async findBySlug(slug: string, tenantId?: string): Promise<Item> {
    validateTenantId(tenantId);

    const item = await this.itemRepository.findOne({
      where: { slug, tenantId },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException(`Item with slug '${slug}' not found`);
    }

    return item;
  }

  /**
   * Find an item by barcode (tenant-scoped)
   */
  async findByBarcode(barcode: string, tenantId?: string): Promise<Item> {
    validateTenantId(tenantId);

    const item = await this.itemRepository.findOne({
      where: { barcode, tenantId },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException(`Item with barcode '${barcode}' not found`);
    }

    return item;
  }

  /**
   * Update an item
   */
  async update(id: string, updateItemDto: UpdateItemDto, tenantId?: string): Promise<Item> {
    validateTenantId(tenantId);

    const item = await this.findOne(id, tenantId);

    // Validate categoryId belongs to the same tenant when changing category
    if (updateItemDto.categoryId && updateItemDto.categoryId !== item.categoryId) {
      await this.categoriesService.findOne(updateItemDto.categoryId, tenantId);
    }

    // Check for duplicate slug if slug is being updated (scoped by tenant)
    if (updateItemDto.slug && updateItemDto.slug !== item.slug) {
      const existingItem = await this.itemRepository.findOne({
        where: { slug: updateItemDto.slug, tenantId },
      });

      if (existingItem) {
        throw new ConflictException(`Item with slug '${updateItemDto.slug}' already exists`);
      }
    }

    Object.assign(item, updateItemDto);
    const updated = await this.itemRepository.save(item);
    this.logger.log(`Updated item: ${updated.name} (${updated.slug})`);
    return updated;
  }

  /**
   * Delete an item (soft delete)
   */
  async remove(id: string, tenantId?: string): Promise<void> {
    validateTenantId(tenantId);

    const item = await this.findOne(id, tenantId);
    await this.itemRepository.softDelete(id);
    this.logger.log(`Deleted item: ${item.name} (${item.slug})`);
  }

  /**
   * Get item count
   */
  async count(includeInactive = false, categoryId?: string, tenantId?: string): Promise<number> {
    validateTenantId(tenantId);

    const query = this.itemRepository.createQueryBuilder('item');

    // Always filter by tenant for data isolation
    query.andWhere('item.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('item.isActive = :isActive', { isActive: true });
    }

    if (categoryId) {
      query.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    return query.getCount();
  }

  /**
   * Bulk create items (for seeding)
   */
  async bulkCreate(items: CreateItemDto[], tenantId?: string): Promise<Item[]> {
    validateTenantId(tenantId);

    const entities = items.map(dto => this.itemRepository.create({
      ...dto,
      tenantId,
    }));
    const saved = await this.itemRepository.save(entities);
    this.logger.log(`Bulk created ${saved.length} items for tenant ${tenantId}`);
    return saved;
  }
}
