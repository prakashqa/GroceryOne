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
import { getTenantSeedData, CategorySeed, ItemSeed } from './seed-data';

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

      // Get all tenants to seed tenant-specific data
      const tenants = await this.tenantRepository.find();
      if (tenants.length === 0) {
        this.logger.warn('No tenants found. Cannot seed tenant-specific data. Run tenant seed first.');
        return report;
      }

      // Seed distinct data for each tenant
      for (const tenant of tenants) {
        try {
          this.logger.log(`Seeding data for tenant: ${tenant.name} (${tenant.slug})`);
          const { categories, items } = getTenantSeedData(tenant.slug);

          // Seed categories for this tenant
          const categoryMap = await this.seedCategories(categories, report, tenant.id);

          // Seed items for this tenant (pass category seed data for trackInventory lookup)
          await this.seedItems(items, categoryMap, report, tenant.id, categories);
        } catch (error) {
          const errMsg = `Failed to seed tenant '${tenant.slug}': ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(errMsg);
          report.errors.push(errMsg);
        }
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
  private async seedCategories(categories: CategorySeed[], report: SeedReport, tenantId: string): Promise<Map<string, string>> {
    const categoryMap = new Map<string, string>(); // slug -> id

    for (const seedCategory of categories) {
      try {
        // Check if category already exists for this tenant
        const existing = await this.categoryRepository.findOne({
          where: { slug: seedCategory.slug, tenantId },
        });

        if (existing) {
          // Update trackInventory if it changed
          const expectedTrackInventory = seedCategory.trackInventory ?? false;
          if (existing.trackInventory !== expectedTrackInventory) {
            existing.trackInventory = expectedTrackInventory;
            await this.categoryRepository.save(existing);
            this.logger.debug(`Updated trackInventory for category '${seedCategory.slug}'`);
          }
          categoryMap.set(seedCategory.slug, existing.id);
          continue;
        }

        // Create category
        const category = this.categoryRepository.create({
          slug: seedCategory.slug,
          name: seedCategory.name,
          nameTe: seedCategory.nameTe,
          icon: seedCategory.icon,
          sortOrder: seedCategory.sortOrder,
          trackInventory: seedCategory.trackInventory ?? false,
          isActive: true,
          tenantId,
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
  private async seedItems(items: ItemSeed[], categoryMap: Map<string, string>, report: SeedReport, tenantId: string, categorySeedData?: CategorySeed[]): Promise<void> {
    // Build category slug -> trackInventory lookup.
    // Default to `false` to match the seedCategories path (lines ~140/157),
    // which also defaults to `false` when the seed omits the flag. Defaulting
    // items to `true` here produced a category/item mismatch: FreshMart
    // categories landed as trackInventory=false but every item landed as true,
    // causing the mobile POS filter (trackInventory !== true) to hide them all.
    const categoryTrackInventory = new Map<string, boolean>();
    if (categorySeedData) {
      for (const cat of categorySeedData) {
        categoryTrackInventory.set(cat.slug, cat.trackInventory ?? false);
      }
    }
    for (const seedItem of items) {
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
        const existing = await this.itemRepository.findOne({
          where: { slug: seedItem.slug, tenantId },
        });

        // Determine trackInventory from category seed data (default: false)
        const shouldTrackInventory = categoryTrackInventory.get(seedItem.categorySlug) ?? false;

        if (existing) {
          let changed = false;
          // Fix existing items with missing compareAtPrice (MRP)
          if (existing.compareAtPrice == null || existing.compareAtPrice === 0) {
            existing.compareAtPrice = seedItem.compareAtPrice;
            existing.price = seedItem.price;
            changed = true;
            this.logger.debug(`Updated MRP for existing item '${seedItem.slug}'`);
          }
          // Heal category/item trackInventory drift — prior seeds defaulted
          // items to true while categories defaulted to false, leaving them
          // out of sync. Re-seeding now reconciles the item to its category.
          if (existing.trackInventory !== shouldTrackInventory) {
            existing.trackInventory = shouldTrackInventory;
            changed = true;
            this.logger.debug(`Updated trackInventory for existing item '${seedItem.slug}' -> ${shouldTrackInventory}`);
          }
          if (changed) await this.itemRepository.save(existing);
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
          tenantId,
          trackInventory: shouldTrackInventory,
          stockQuantity: seedItem.stockQuantity ?? (shouldTrackInventory ? 100 : 0),
          lowStockThreshold: seedItem.lowStockThreshold ?? (shouldTrackInventory ? 10 : 0),
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
   * Clear seed data, optionally scoped to a specific tenant
   * @param tenantId If provided, only deletes data for this tenant
   */
  async clearSeedData(tenantId?: string): Promise<{ categoriesDeleted: number; itemsDeleted: number }> {
    this.logger.warn(`Clearing seed data${tenantId ? ` for tenant ${tenantId}` : ' (all tenants)'}...`);

    // Get counts before deletion
    const itemsDeleted = await this.itemRepository.count();
    const categoriesDeleted = await this.categoryRepository.count();

    // Delete items first (foreign key constraint) using query builder
    if (itemsDeleted > 0) {
      const itemQuery = this.itemRepository.createQueryBuilder()
        .delete()
        .from(Item);
      if (tenantId) {
        itemQuery.where('tenant_id = :tenantId', { tenantId });
      }
      await itemQuery.execute();
    }

    // Delete categories using query builder
    if (categoriesDeleted > 0) {
      const categoryQuery = this.categoryRepository.createQueryBuilder()
        .delete()
        .from(Category);
      if (tenantId) {
        categoryQuery.where('tenant_id = :tenantId', { tenantId });
      }
      await categoryQuery.execute();
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
