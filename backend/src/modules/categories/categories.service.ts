/**
 * Categories Service
 * Business logic for category management
 * All operations are tenant-scoped for data isolation
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

function validateTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto, tenantId: string): Promise<Category> {
    validateTenantId(tenantId);

    // Check for duplicate slug within this tenant
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug: createCategoryDto.slug, tenantId },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug '${createCategoryDto.slug}' already exists`);
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
    });
    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Created category: ${saved.name} (${saved.slug}) for tenant ${tenantId}`);
    return saved;
  }

  /**
   * Find all categories
   */
  async findAll(includeInactive = false, tenantId?: string, trackInventory?: boolean): Promise<Category[]> {
    validateTenantId(tenantId);

    const query = this.categoryRepository.createQueryBuilder('category')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    // Always filter by tenant for data isolation
    query.andWhere('category.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('category.isActive = :isActive', { isActive: true });
    }

    if (trackInventory !== undefined) {
      query.andWhere('category.trackInventory = :trackInventory', { trackInventory });
    }

    return query.getMany();
  }

  /**
   * Find all categories with their items
   */
  async findAllWithItems(includeInactive = false, tenantId?: string, trackInventory?: boolean): Promise<Category[]> {
    validateTenantId(tenantId);

    const query = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.items', 'item', 'item.tenantId = :itemTenantId', { itemTenantId: tenantId })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .addOrderBy('item.sortOrder', 'ASC')
      .addOrderBy('item.name', 'ASC');

    // Always filter by tenant for data isolation
    query.andWhere('category.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('category.isActive = :isActive', { isActive: true });
      query.andWhere('(item.isActive = :itemActive OR item.id IS NULL)', { itemActive: true });
    }

    if (trackInventory !== undefined) {
      query.andWhere('category.trackInventory = :trackInventory', { trackInventory });
    }

    return query.getMany();
  }

  /**
   * Find a category by ID
   */
  async findOne(id: string, tenantId?: string): Promise<Category> {
    validateTenantId(tenantId);

    const category = await this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.items', 'item', 'item.tenantId = :itemTenantId', { itemTenantId: tenantId })
      .where('category.id = :id', { id })
      .andWhere('category.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  /**
   * Find a category by slug
   */
  async findBySlug(slug: string, tenantId?: string): Promise<Category> {
    validateTenantId(tenantId);

    const category = await this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.items', 'item', 'item.tenantId = :itemTenantId', { itemTenantId: tenantId })
      .where('category.slug = :slug', { slug })
      .andWhere('category.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Update a category
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto, tenantId?: string): Promise<Category> {
    validateTenantId(tenantId);

    const category = await this.findOne(id, tenantId);

    // Check for duplicate slug if slug is being updated (scoped by tenant)
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug, tenantId },
      });

      if (existingCategory) {
        throw new ConflictException(`Category with slug '${updateCategoryDto.slug}' already exists`);
      }
    }

    Object.assign(category, updateCategoryDto);
    const updated = await this.categoryRepository.save(category);
    this.logger.log(`Updated category: ${updated.name} (${updated.slug})`);
    return updated;
  }

  /**
   * Delete a category (soft delete)
   */
  async remove(id: string, tenantId?: string): Promise<void> {
    validateTenantId(tenantId);

    const category = await this.findOne(id, tenantId);
    await this.categoryRepository.softDelete(id);
    this.logger.log(`Deleted category: ${category.name} (${category.slug})`);
  }

  /**
   * Get category count
   */
  async count(includeInactive = false, tenantId?: string): Promise<number> {
    validateTenantId(tenantId);

    const query = this.categoryRepository.createQueryBuilder('category');

    // Always filter by tenant for data isolation
    query.andWhere('category.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('category.isActive = :isActive', { isActive: true });
    }

    return query.getCount();
  }

  /**
   * Bulk create categories (for seeding)
   */
  async bulkCreate(categories: CreateCategoryDto[], tenantId?: string): Promise<Category[]> {
    validateTenantId(tenantId);

    const entities = categories.map(dto => this.categoryRepository.create({
      ...dto,
      tenantId,
    }));
    const saved = await this.categoryRepository.save(entities);
    this.logger.log(`Bulk created ${saved.length} categories for tenant ${tenantId}`);
    return saved;
  }
}
