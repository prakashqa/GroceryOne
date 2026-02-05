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

      // Get a tenant for cart association
      const tenant = await this.tenantRepository.findOne({ where: {} });
      if (!tenant) {
        const errMsg = 'No tenant in database. Please run tenant seed first (npm run seed:tenants)';
        report.errors.push(errMsg);
        this.logger.error(errMsg);
        return report;
      }

      this.logger.log(`Using tenant: ${tenant.name} (${tenant.id})`);

      // Generate historic cart data
      const historicCarts = generateHistoricCarts();
      report.summary = getHistoricDataSummary(historicCarts);

      this.logger.log(`Generated ${historicCarts.length} historic carts`);
      this.logger.log(`Date range: ${report.summary.dateRange.start.toISOString()} to ${report.summary.dateRange.end.toISOString()}`);

      // Build item slug to ID map
      const items = await this.itemRepository.find();
      const itemMap = new Map<string, string>();
      for (const item of items) {
        itemMap.set(item.slug, item.id);
      }

      // Use transaction for data integrity
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
        this.logger.log(`Successfully created ${report.cartsCreated} carts with ${report.cartItemsCreated} items`);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      // Calculate total sales from created carts
      report.totalSales = report.summary.totalSales;

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
      // Create cart
      const cart = this.cartRepository.create({
        name: cartSeed.name,
        status: cartSeed.status,
        isActive: false,
        tenantId,
        paidAt: cartSeed.paidAt,
        paidAmount: cartSeed.paidAmount,
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
