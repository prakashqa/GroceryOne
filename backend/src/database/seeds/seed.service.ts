/**
 * Seed Service
 * Service for seeding the database with initial data
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Category } from '../../modules/categories/entities/category.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { SEED_CATEGORIES, SEED_ITEMS } from './seed-data';

export interface SeedReport {
  categoriesBefore: number;
  categoriesAfter: number;
  categoriesCreated: number;
  itemsBefore: number;
  itemsAfter: number;
  itemsCreated: number;
  errors: string[];
  timestamp: Date;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Seed database if empty
   */
  async seedIfEmpty(): Promise<SeedReport | null> {
    const categoryCount = await this.categoryRepository.count();
    const itemCount = await this.itemRepository.count();

    if (categoryCount > 0 || itemCount > 0) {
      this.logger.log(`Database already has data (${categoryCount} categories, ${itemCount} items). Skipping seed.`);
      return null;
    }

    return this.seed();
  }

  /**
   * Full seed (use with caution - will add duplicates if run multiple times)
   */
  async seed(): Promise<SeedReport> {
    const report: SeedReport = {
      categoriesBefore: 0,
      categoriesAfter: 0,
      categoriesCreated: 0,
      itemsBefore: 0,
      itemsAfter: 0,
      itemsCreated: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      // Get counts before
      report.categoriesBefore = await this.categoryRepository.count();
      report.itemsBefore = await this.itemRepository.count();

      this.logger.log('Starting database seed...');
      this.logger.log(`Before: ${report.categoriesBefore} categories, ${report.itemsBefore} items`);

      // Get all tenants to seed data for each one
      const tenants = await this.tenantRepository.find();
      if (tenants.length === 0) {
        this.logger.warn('No tenants found. Seeding without tenant association.');
      }

      // Seed for each tenant (or once without tenant if none exist)
      const tenantIds = tenants.length > 0 ? tenants.map(t => t.id) : [undefined];
      for (const tenantId of tenantIds) {
        if (tenantId) {
          const tenant = tenants.find(t => t.id === tenantId);
          this.logger.log(`Seeding data for tenant: ${tenant?.name} (${tenant?.slug})`);
        }

        // Seed categories
        const categoryMap = await this.seedCategories(report, tenantId);

        // Seed items
        await this.seedItems(categoryMap, report, tenantId);
      }

      // Get counts after
      report.categoriesAfter = await this.categoryRepository.count();
      report.itemsAfter = await this.itemRepository.count();

      this.logger.log('Database seed completed!');
      this.logger.log(`After: ${report.categoriesAfter} categories, ${report.itemsAfter} items`);
      this.logger.log(`Created: ${report.categoriesCreated} categories, ${report.itemsCreated} items`);

      if (report.errors.length > 0) {
        this.logger.warn(`Seed completed with ${report.errors.length} errors`);
        report.errors.forEach(err => this.logger.warn(err));
      }

    } catch (error) {
      const errMsg = `Seed failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errMsg);
      report.errors.push(errMsg);
    }

    return report;
  }

  /**
   * Seed categories
   */
  private async seedCategories(report: SeedReport, tenantId?: string): Promise<Map<string, string>> {
    const categoryMap = new Map<string, string>(); // slug -> id

    for (const seedCategory of SEED_CATEGORIES) {
      try {
        // Check if category already exists for this tenant
        const whereCondition: any = { slug: seedCategory.slug };
        if (tenantId) {
          whereCondition.tenantId = tenantId;
        }
        const existing = await this.categoryRepository.findOne({
          where: whereCondition,
        });

        if (existing) {
          categoryMap.set(seedCategory.slug, existing.id);
          this.logger.debug(`Category '${seedCategory.slug}' already exists, skipping`);
          continue;
        }

        // Create category
        const category = this.categoryRepository.create({
          slug: seedCategory.slug,
          name: seedCategory.name,
          nameTe: seedCategory.nameTe,
          icon: seedCategory.icon,
          sortOrder: seedCategory.sortOrder,
          isActive: true,
          ...(tenantId && { tenantId }),
        });

        const saved = await this.categoryRepository.save(category);
        categoryMap.set(seedCategory.slug, saved.id);
        report.categoriesCreated++;
        this.logger.debug(`Created category: ${saved.name} (${saved.slug})`);

      } catch (error) {
        const errMsg = `Failed to create category '${seedCategory.slug}': ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errMsg);
        this.logger.error(errMsg);
      }
    }

    return categoryMap;
  }

  /**
   * Seed items
   */
  private async seedItems(categoryMap: Map<string, string>, report: SeedReport, tenantId?: string): Promise<void> {
    for (const seedItem of SEED_ITEMS) {
      try {
        // Get category ID
        const categoryId = categoryMap.get(seedItem.categorySlug);
        if (!categoryId) {
          const errMsg = `Category '${seedItem.categorySlug}' not found for item '${seedItem.slug}'`;
          report.errors.push(errMsg);
          this.logger.warn(errMsg);
          continue;
        }

        // Check if item already exists for this tenant
        const whereCondition: any = { slug: seedItem.slug };
        if (tenantId) {
          whereCondition.tenantId = tenantId;
        }
        const existing = await this.itemRepository.findOne({
          where: whereCondition,
        });

        if (existing) {
          // Fix existing items with missing compareAtPrice (MRP)
          if (existing.compareAtPrice == null || existing.compareAtPrice === 0) {
            existing.compareAtPrice = seedItem.compareAtPrice;
            existing.price = seedItem.price;
            await this.itemRepository.save(existing);
            this.logger.debug(`Updated MRP for existing item '${seedItem.slug}'`);
          }
          continue;
        }

        // Create item
        const item = this.itemRepository.create({
          slug: seedItem.slug,
          name: seedItem.name,
          nameTe: seedItem.nameTe,
          categoryId,
          unit: seedItem.unit,
          defaultQuantity: seedItem.defaultQuantity,
          price: seedItem.price,
          compareAtPrice: seedItem.compareAtPrice,
          sortOrder: seedItem.sortOrder,
          isActive: true,
          ...(tenantId && { tenantId }),
        });

        const saved = await this.itemRepository.save(item);
        report.itemsCreated++;
        this.logger.debug(`Created item: ${saved.name} (${saved.slug})`);

      } catch (error) {
        const errMsg = `Failed to create item '${seedItem.slug}': ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errMsg);
        this.logger.error(errMsg);
      }
    }
  }

  /**
   * Clear all seed data (use with caution!)
   */
  async clearSeedData(): Promise<{ categoriesDeleted: number; itemsDeleted: number }> {
    this.logger.warn('Clearing all seed data...');

    // Get counts before deletion
    const itemsDeleted = await this.itemRepository.count();
    const categoriesDeleted = await this.categoryRepository.count();

    // Delete items first (foreign key constraint) using query builder
    if (itemsDeleted > 0) {
      await this.itemRepository.createQueryBuilder()
        .delete()
        .from(Item)
        .execute();
    }

    // Delete categories using query builder
    if (categoriesDeleted > 0) {
      await this.categoryRepository.createQueryBuilder()
        .delete()
        .from(Category)
        .execute();
    }

    this.logger.log(`Cleared ${categoriesDeleted} categories and ${itemsDeleted} items`);

    return { categoriesDeleted, itemsDeleted };
  }

  /**
   * Get current data counts
   */
  async getDataCounts(): Promise<{ categories: number; items: number }> {
    return {
      categories: await this.categoryRepository.count(),
      items: await this.itemRepository.count(),
    };
  }
}
