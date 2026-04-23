/**
 * Historic Seed Service
 * Service for seeding the database with historical cart data for Reports & Analytics testing
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import {
  generateHistoricCarts,
  getHistoricDataSummary,
  HistoricCartSeed,
} from './historic-seed-data';

export interface HistoricSeedReport {
  cartsCreated: number;
  cartItemsCreated: number;
  totalSales: number;
  errors: string[];
  summary: {
    totalCarts: number;
    totalItems: number;
    totalSales: number;
    statusBreakdown: Record<string, number>;
    dateRange: { start: Date; end: Date };
  };
  timestamp: Date;
}

@Injectable()
export class HistoricSeedService {
  private readonly logger = new Logger(HistoricSeedService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Seed historical cart data
   */
  async seedHistoricData(): Promise<HistoricSeedReport> {
    const report: HistoricSeedReport = {
      cartsCreated: 0,
      cartItemsCreated: 0,
      totalSales: 0,
      errors: [],
      summary: {
        totalCarts: 0,
        totalItems: 0,
        totalSales: 0,
        statusBreakdown: {},
        dateRange: { start: new Date(), end: new Date() },
      },
      timestamp: new Date(),
    };

    try {
      // Check if items exist (required for cart items)
      const itemCount = await this.itemRepository.count();
      if (itemCount === 0) {
        const errMsg = 'No items in database. Please run the main seed first (npm run seed)';
        report.errors.push(errMsg);
        this.logger.error(errMsg);
        return report;
      }

      // Iterate every tenant — historic data is per-tenant. A prior version
      // picked one arbitrary tenant via findOne({ where: {} }), leaving the
      // others with zero historic carts and using FreshMart's item slugs
      // for whichever tenant was chosen.
      const tenants = await this.tenantRepository.find();
      if (tenants.length === 0) {
        const errMsg = 'No tenant in database. Please run tenant seed first (npm run seed:tenants)';
        report.errors.push(errMsg);
        this.logger.error(errMsg);
        return report;
      }

      const aggregateSummary: typeof report.summary = {
        totalCarts: 0,
        totalItems: 0,
        totalSales: 0,
        statusBreakdown: {},
        dateRange: { start: new Date(8640000000000000), end: new Date(-8640000000000000) },
      };

      for (const tenant of tenants) {
        this.logger.log(`Seeding historic carts for tenant: ${tenant.name} (${tenant.id})`);

        // Idempotency guard — tenant-scoped. Running twice for the same
        // tenant is a no-op; the random hours/minutes used for most days
        // would otherwise produce silent duplicate "Cart N" rows.
        const existingCartCount = await this.cartRepository.count({ where: { tenantId: tenant.id } });
        if (existingCartCount > 0) {
          const msg = `Historic carts already present for tenant ${tenant.name} (${existingCartCount} rows). Skipping to stay idempotent. Run clearHistoricData() first to re-seed.`;
          this.logger.warn(msg);
          report.errors.push(msg);
          continue;
        }

        // Fetch this tenant's items ONLY — the generator must never pull
        // slugs from another tenant's catalog.
        const tenantItems = await this.itemRepository.find({ where: { tenantId: tenant.id } });
        if (tenantItems.length === 0) {
          const msg = `Tenant ${tenant.name} has no items — skipping historic seed. Run npm run seed first.`;
          this.logger.warn(msg);
          report.errors.push(msg);
          continue;
        }

        const itemMap = new Map<string, string>();
        for (const item of tenantItems) itemMap.set(item.slug, item.id);
        const pool = tenantItems.map((i) => ({
          slug: i.slug,
          price: i.price != null ? Number(i.price) : undefined,
        }));

        // Generate historic cart data from this tenant's own catalog.
        const historicCarts = generateHistoricCarts(pool);
        const tenantSummary = getHistoricDataSummary(historicCarts);
        this.logger.log(`Generated ${historicCarts.length} historic carts for ${tenant.name}`);
        this.logger.log(`Date range: ${tenantSummary.dateRange.start.toISOString()} to ${tenantSummary.dateRange.end.toISOString()}`);

        // Aggregate stats across tenants.
        aggregateSummary.totalCarts += tenantSummary.totalCarts;
        aggregateSummary.totalItems += tenantSummary.totalItems;
        aggregateSummary.totalSales += tenantSummary.totalSales;
        for (const [k, v] of Object.entries(tenantSummary.statusBreakdown)) {
          aggregateSummary.statusBreakdown[k] = (aggregateSummary.statusBreakdown[k] ?? 0) + v;
        }
        if (tenantSummary.dateRange.start < aggregateSummary.dateRange.start) {
          aggregateSummary.dateRange.start = tenantSummary.dateRange.start;
        }
        if (tenantSummary.dateRange.end > aggregateSummary.dateRange.end) {
          aggregateSummary.dateRange.end = tenantSummary.dateRange.end;
        }

        // One transaction per tenant — a failure in tenant A must not
        // leak into or poison tenant B's rows.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          for (const cartSeed of historicCarts) {
            const cart = await this.createCart(cartSeed, itemMap, tenant.id, report);
            if (cart) {
              report.cartsCreated++;
            }
          }
          await queryRunner.commitTransaction();
          this.logger.log(`Committed historic carts for tenant ${tenant.name}`);
        } catch (error) {
          await queryRunner.rollbackTransaction();
          const errMsg = `Historic seed rolled back for tenant ${tenant.name}: ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(errMsg);
          report.errors.push(errMsg);
          // Continue to next tenant — do not abort the whole seed.
        } finally {
          await queryRunner.release();
        }
      }

      report.summary = aggregateSummary;
      report.totalSales = aggregateSummary.totalSales;
      this.logger.log(`Historic seed finished: ${report.cartsCreated} carts with ${report.cartItemsCreated} items across ${tenants.length} tenants`);

    } catch (error) {
      const errMsg = `Historic seed failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errMsg);
      report.errors.push(errMsg);
    }

    return report;
  }

  /**
   * Create a single cart with its items
   */
  private async createCart(
    cartSeed: HistoricCartSeed,
    itemMap: Map<string, string>,
    tenantId: string,
    report: HistoricSeedReport,
  ): Promise<Cart | null> {
    try {
      // For paid/completed carts, snapshot the count of items that will actually
      // resolve against the current item catalog. Unresolved slugs are skipped
      // below, so counting the full cartSeed.items.length would over-report.
      const isPaid = cartSeed.status === 'paid' || cartSeed.status === 'completed';
      const resolvedItemCount = isPaid
        ? cartSeed.items.filter((i) => itemMap.has(i.itemSlug)).length
        : undefined;

      // Create cart
      const cart = this.cartRepository.create({
        name: cartSeed.name,
        status: cartSeed.status,
        isActive: false,
        tenantId,
        paidAt: cartSeed.paidAt,
        paidAmount: cartSeed.paidAmount,
        paidItemCount: resolvedItemCount,
      });

      // Save cart first to get ID
      const savedCart = await this.cartRepository.save(cart);

      // Update timestamps manually (TypeORM auto-generates them)
      await this.cartRepository
        .createQueryBuilder()
        .update(Cart)
        .set({
          createdAt: cartSeed.createdAt,
          updatedAt: cartSeed.updatedAt,
        })
        .where('id = :id', { id: savedCart.id })
        .execute();

      // Create cart items
      for (const itemSeed of cartSeed.items) {
        const itemId = itemMap.get(itemSeed.itemSlug);
        if (!itemId) {
          this.logger.warn(`Item '${itemSeed.itemSlug}' not found, skipping`);
          continue;
        }

        const cartItem = this.cartItemRepository.create({
          cartId: savedCart.id,
          itemId,
          tenantId,
          quantity: itemSeed.quantity,
          priceSnapshot: itemSeed.priceSnapshot,
        });

        await this.cartItemRepository.save(cartItem);
        report.cartItemsCreated++;
      }

      return savedCart;

    } catch (error) {
      const errMsg = `Failed to create cart '${cartSeed.name}': ${error instanceof Error ? error.message : String(error)}`;
      report.errors.push(errMsg);
      this.logger.error(errMsg);
      return null;
    }
  }

  /**
   * Clear all historic cart data
   */
  async clearHistoricData(): Promise<{ cartsDeleted: number; cartItemsDeleted: number }> {
    this.logger.warn('Clearing all cart data...');

    const cartItemsDeleted = await this.cartItemRepository.count();
    const cartsDeleted = await this.cartRepository.count();

    // Delete cart items first (foreign key constraint)
    if (cartItemsDeleted > 0) {
      await this.cartItemRepository.createQueryBuilder()
        .delete()
        .from(CartItem)
        .execute();
    }

    // Delete carts
    if (cartsDeleted > 0) {
      await this.cartRepository.createQueryBuilder()
        .delete()
        .from(Cart)
        .execute();
    }

    this.logger.log(`Cleared ${cartsDeleted} carts and ${cartItemsDeleted} cart items`);

    return { cartsDeleted, cartItemsDeleted };
  }

  /**
   * Get current cart data counts
   */
  async getDataCounts(): Promise<{
    carts: number;
    cartItems: number;
    paidCarts: number;
    totalSales: number;
  }> {
    const carts = await this.cartRepository.count();
    const cartItems = await this.cartItemRepository.count();
    const paidCarts = await this.cartRepository.count({ where: { status: 'paid' } });

    const salesResult = await this.cartRepository
      .createQueryBuilder('cart')
      .select('SUM(cart.paidAmount)', 'total')
      .where('cart.status = :status', { status: 'paid' })
      .getRawOne();

    return {
      carts,
      cartItems,
      paidCarts,
      totalSales: parseFloat(salesResult?.total || '0'),
    };
  }
}
