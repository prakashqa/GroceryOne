/**
 * Inventory Service
 * Business logic for stock management, validation, and audit trail
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Item } from '../products/entities/item.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { UpdateInventorySettingsDto } from './dto';

/**
 * Validates that tenantId is provided
 * @throws BadRequestException if tenantId is missing
 */
function validateTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(InventoryTransaction)
    private readonly txnRepository: Repository<InventoryTransaction>,
  ) {}

  /**
   * Add stock to an item (restock, return, initial, correction)
   */
  async addStock(
    itemId: string,
    quantity: number,
    type: InventoryTransactionType,
    tenantId: string,
    reason?: string,
    performedBy?: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryTransaction> {
    validateTenantId(tenantId);

    const item = await this.findItemOrFail(itemId, tenantId);

    item.stockQuantity = Number(item.stockQuantity) + quantity;
    const saved = await this.itemRepository.save(item);

    const txn = this.txnRepository.create({
      tenantId,
      itemId,
      type,
      quantity,
      stockAfter: Number(saved.stockQuantity),
      reason,
      referenceType,
      referenceId,
      performedBy,
    });

    const savedTxn = await this.txnRepository.save(txn);
    this.logger.log(`Added ${quantity} stock to item ${itemId} (type=${type}, tenant=${tenantId})`);
    return savedTxn;
  }

  /**
   * Remove stock from an item (sale, damage, correction)
   * @throws BadRequestException if insufficient stock
   */
  async removeStock(
    itemId: string,
    quantity: number,
    type: InventoryTransactionType,
    tenantId: string,
    reason?: string,
    performedBy?: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryTransaction> {
    validateTenantId(tenantId);

    // Atomic conditional decrement: a single
    //   UPDATE items SET stock_quantity = stock_quantity - q
    //   WHERE id = … AND tenant_id = … AND stock_quantity >= q
    // prevents the lost-update race where two concurrent sales both read the
    // same starting stock and oversell. `affected === 0` means the row didn't
    // satisfy the guard — either it doesn't exist for this tenant, or there
    // wasn't enough stock.
    const result = await this.itemRepository
      .createQueryBuilder()
      .update(Item)
      .set({ stockQuantity: () => 'stock_quantity - :decQty' })
      .where('id = :itemId AND tenant_id = :tenantId AND stock_quantity >= :decQty', {
        itemId,
        tenantId,
      })
      // Bind :decQty explicitly — a parameter referenced inside the .set() raw
      // expression is NOT reliably bound from the .where() params object alone.
      .setParameter('decQty', quantity)
      .execute();

    if (!result.affected) {
      const existing = await this.itemRepository.findOne({ where: { id: itemId, tenantId } });
      if (!existing) {
        throw new NotFoundException(`Item with ID '${itemId}' not found`);
      }
      throw new BadRequestException(
        `Insufficient stock for item '${existing.name}'. Available: ${existing.stockQuantity}, Requested: ${quantity}`,
      );
    }

    // Re-read to record the post-decrement level + name in the audit row.
    const item = await this.findItemOrFail(itemId, tenantId);

    const txn = this.txnRepository.create({
      tenantId,
      itemId,
      type,
      quantity: -quantity,
      stockAfter: Number(item.stockQuantity),
      reason,
      referenceType,
      referenceId,
      performedBy,
    });

    const savedTxn = await this.txnRepository.save(txn);
    this.logger.log(`Removed ${quantity} stock from item ${itemId} (type=${type}, tenant=${tenantId})`);
    return savedTxn;
  }

  /**
   * Set absolute stock level (records correction transaction)
   */
  async setStock(
    itemId: string,
    absoluteQuantity: number,
    tenantId: string,
    reason?: string,
    performedBy?: string,
  ): Promise<InventoryTransaction> {
    validateTenantId(tenantId);

    const item = await this.findItemOrFail(itemId, tenantId);

    const currentStock = Number(item.stockQuantity);
    const delta = absoluteQuantity - currentStock;

    item.stockQuantity = absoluteQuantity;
    await this.itemRepository.save(item);

    const txn = this.txnRepository.create({
      tenantId,
      itemId,
      type: 'correction' as InventoryTransactionType,
      quantity: delta,
      stockAfter: absoluteQuantity,
      reason,
      performedBy,
    });

    const savedTxn = await this.txnRepository.save(txn);
    this.logger.log(`Set stock for item ${itemId} to ${absoluteQuantity} (delta=${delta}, tenant=${tenantId})`);
    return savedTxn;
  }

  /**
   * Bulk add stock for multiple items
   */
  async bulkAddStock(
    adjustments: { itemId: string; quantity: number; type: InventoryTransactionType; reason?: string }[],
    tenantId: string,
    performedBy?: string,
  ): Promise<InventoryTransaction[]> {
    validateTenantId(tenantId);

    const transactions: InventoryTransaction[] = [];
    for (const adj of adjustments) {
      const txn = await this.addStock(
        adj.itemId, adj.quantity, adj.type, tenantId, adj.reason, performedBy,
      );
      transactions.push(txn);
    }
    return transactions;
  }

  /**
   * Validate that sufficient stock exists for requested quantity
   * Skips validation if trackInventory is false
   * @throws BadRequestException if insufficient stock
   * @throws NotFoundException if item not found for tenant
   */
  async validateStock(itemId: string, requestedQuantity: number, tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    const item = await this.findItemOrFail(itemId, tenantId);

    if (!item.trackInventory) {
      return;
    }

    if (Number(item.stockQuantity) < requestedQuantity) {
      throw new BadRequestException(
        `Insufficient stock for item '${item.name}'. Available: ${item.stockQuantity}, Requested: ${requestedQuantity}`,
      );
    }
  }

  /**
   * Deduct stock for all items in an order
   */
  async deductStockForOrder(
    orderItems: { itemId: string; quantity: number }[],
    orderId: string,
    tenantId: string,
  ): Promise<void> {
    validateTenantId(tenantId);

    for (const oi of orderItems) {
      const item = await this.itemRepository.findOne({
        where: { id: oi.itemId, tenantId },
      });

      if (!item || !item.trackInventory) {
        continue;
      }

      await this.removeStock(
        oi.itemId, oi.quantity, 'sale', tenantId,
        undefined, undefined, 'order', orderId,
      );
    }
  }

  /**
   * Restore stock for all items when order is cancelled
   */
  async restoreStockForOrder(
    orderItems: { itemId: string; quantity: number }[],
    orderId: string,
    tenantId: string,
  ): Promise<void> {
    validateTenantId(tenantId);

    for (const oi of orderItems) {
      const item = await this.itemRepository.findOne({
        where: { id: oi.itemId, tenantId },
      });

      if (!item || !item.trackInventory) {
        continue;
      }

      await this.addStock(
        oi.itemId, oi.quantity, 'return', tenantId,
        undefined, undefined, 'order', orderId,
      );
    }
  }

  /**
   * Get stock level for a single item
   */
  async getStockLevel(
    itemId: string,
    tenantId: string,
  ): Promise<{
    itemId: string;
    stockQuantity: number;
    lowStockThreshold: number;
    isLowStock: boolean;
    trackInventory: boolean;
  }> {
    validateTenantId(tenantId);

    const item = await this.findItemOrFail(itemId, tenantId);

    return {
      itemId: item.id,
      stockQuantity: Number(item.stockQuantity),
      lowStockThreshold: Number(item.lowStockThreshold),
      isLowStock: Number(item.stockQuantity) <= Number(item.lowStockThreshold),
      trackInventory: item.trackInventory,
    };
  }

  /**
   * Get all items that are below their low stock threshold
   */
  async getLowStockItems(tenantId: string): Promise<Item[]> {
    validateTenantId(tenantId);

    return this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.tenantId = :tenantId', { tenantId })
      .andWhere('item.trackInventory = :trackInventory', { trackInventory: true })
      .andWhere('item.stock_quantity <= item.low_stock_threshold')
      .orderBy('item.stock_quantity', 'ASC')
      .getMany();
  }

  /**
   * Get stock report for all items, optionally filtered by category
   */
  async getStockReport(tenantId: string, categoryId?: string): Promise<Item[]> {
    validateTenantId(tenantId);

    const qb = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.tenantId = :tenantId', { tenantId })
      .andWhere('item.trackInventory = :trackInventory', { trackInventory: true })
      .orderBy('item.stock_quantity', 'ASC');

    if (categoryId) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    return qb.getMany();
  }

  /**
   * Get paginated transaction history for an item
   */
  async getTransactionHistory(
    itemId: string,
    tenantId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    validateTenantId(tenantId);

    const [transactions, total] = await this.txnRepository.findAndCount({
      where: { itemId, tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  /**
   * Get transactions by date range, optionally filtered by type
   */
  async getTransactionsByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    type?: InventoryTransactionType,
  ): Promise<InventoryTransaction[]> {
    validateTenantId(tenantId);

    const where: FindOptionsWhere<InventoryTransaction> = {
      tenantId,
      createdAt: Between(startDate, endDate),
    };

    if (type) {
      where.type = type;
    }

    return this.txnRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update inventory settings for an item (threshold, tracking toggle)
   */
  async updateItemInventorySettings(
    itemId: string,
    settings: UpdateInventorySettingsDto,
    tenantId: string,
  ): Promise<Item> {
    validateTenantId(tenantId);

    const item = await this.findItemOrFail(itemId, tenantId);

    if (settings.lowStockThreshold !== undefined) {
      item.lowStockThreshold = settings.lowStockThreshold;
    }
    if (settings.trackInventory !== undefined) {
      item.trackInventory = settings.trackInventory;
    }

    return this.itemRepository.save(item);
  }

  /**
   * Find an item by ID and tenant, or throw NotFoundException
   */
  private async findItemOrFail(itemId: string, tenantId: string): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID '${itemId}' not found`);
    }

    return item;
  }
}
