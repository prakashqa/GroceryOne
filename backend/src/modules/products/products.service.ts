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
import { InventoryService } from '../inventory/inventory.service';

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
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Create a new item.
   *
   * Opening stock is wired into the Inventory system: when a positive
   * `stockQuantity` is supplied, the item is persisted with stock 0 and
   * `trackInventory=true`, then the quantity is recorded via
   * `InventoryService.addStock(..., 'initial')` — a single source of truth that
   * also writes an audit transaction. We never set `stockQuantity` directly AND
   * call addStock (that would double-count).
   */
  async create(createItemDto: CreateItemDto, tenantId?: string, userId?: string): Promise<Item> {
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

    const { stockQuantity, ...rest } = createItemDto;
    const opening = stockQuantity != null && Number(stockQuantity) > 0 ? Number(stockQuantity) : 0;

    const item = this.itemRepository.create({
      ...rest,
      stockQuantity: 0, // opening recorded via inventory (addStock) — avoid double-count
      trackInventory: opening > 0 ? true : (rest.trackInventory ?? false),
      tenantId,
    });
    const saved = await this.itemRepository.save(item);
    this.logger.log(`Created item: ${saved.name} (${saved.slug}) for tenant ${tenantId}`);

    if (opening > 0) {
      await this.inventoryService.addStock(saved.id, opening, 'initial', tenantId, 'Opening stock', userId);
      return this.findOne(saved.id, tenantId); // re-read so stockQuantity reflects the txn
    }
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
  async update(id: string, updateItemDto: UpdateItemDto, tenantId?: string, userId?: string): Promise<Item> {
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

    // A stock-quantity change must go through the Inventory system so it's
    // audited — never let a plain item save overwrite stockQuantity. Strip it
    // from the settings assign; costPrice/lowStockThreshold/trackInventory are
    // plain settings and flow through normally.
    const { stockQuantity, ...settings } = updateItemDto;
    Object.assign(item, settings);
    const updated = await this.itemRepository.save(item);
    this.logger.log(`Updated item: ${updated.name} (${updated.slug})`);

    if (stockQuantity != null && Number(stockQuantity) !== Number(item.stockQuantity)) {
      await this.inventoryService.setStock(id, Number(stockQuantity), tenantId, 'Manual correction', userId);
      return this.findOne(id, tenantId);
    }
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
