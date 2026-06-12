/**
 * Orders Service
 * Business logic for order management — cart→order conversion and status tracking
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Item } from '../products/entities/item.entity';
import { CheckoutDto } from './dto';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';

/** Snapshot of one line item used to build an order + deduct stock. */
interface OrderLine {
  itemId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Validates that tenantId is provided
 * @throws BadRequestException if tenantId is missing
 */
function validateTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }
}

/**
 * Valid status transitions map
 * Key = current status, Value = set of valid next statuses
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Shared order-creation core (used by createFromCart + checkout):
   * validate stock for ALL lines → deduct → persist order + items. Deducting
   * BEFORE persisting means a stock failure leaves NO phantom order. Returns the
   * persisted order (with items).
   */
  private async buildAndPersistOrder(params: {
    tenantId: string;
    lines: OrderLine[];
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    userId?: string;
    cartId?: string;
    clientRef?: string;
    notes?: string;
    paidAt?: Date;
    paidAmount?: number;
  }): Promise<Order> {
    const { tenantId, lines } = params;

    // Block oversell: validate every line up front (throws BadRequestException).
    for (const line of lines) {
      await this.inventoryService.validateStock(line.itemId, line.quantity, tenantId);
    }

    const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
    const orderId = randomUUID();

    // Deduct stock FIRST — if this throws, no order row is written.
    await this.inventoryService.deductStockForOrder(
      lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      orderId,
      tenantId,
    );

    const order = this.orderRepository.create({
      id: orderId,
      orderNumber: this.generateOrderNumber(),
      tenantId,
      userId: params.userId,
      cartId: params.cartId,
      clientRef: params.clientRef,
      status: 'pending' as OrderStatus,
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod,
      subtotal,
      taxAmount: 0,
      deliveryFee: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      notes: params.notes,
      paidAt: params.paidAt,
      paidAmount: params.paidAmount,
    });
    const savedOrder = await this.orderRepository.save(order);

    const orderItems = lines.map((line) =>
      this.orderItemRepository.create({ ...line, orderId: savedOrder.id, tenantId }),
    );
    await this.orderItemRepository.save(orderItems);

    return this.findOne(savedOrder.id, tenantId);
  }

  /**
   * Direct POS checkout — create an order from a client-supplied item list +
   * payment, with NO backend cart. Prices are re-derived from the catalog
   * (never trusted from the client), stock is deducted, and the call is
   * idempotent on `clientRef`. All lookups are tenant-scoped.
   */
  async checkout(tenantId: string, dto: CheckoutDto, userId?: string): Promise<Order> {
    validateTenantId(tenantId);

    // Idempotency: a retried checkout (same client cart) returns the existing
    // order instead of deducting stock again.
    if (dto.clientRef) {
      const existing = await this.orderRepository.findOne({
        where: { tenantId, clientRef: dto.clientRef },
      });
      if (existing) {
        return this.findOne(existing.id, tenantId);
      }
    }

    // Re-derive each line from the catalog (server-authoritative price/name).
    const lines: OrderLine[] = [];
    for (const it of dto.items) {
      const item = await this.itemRepository.findOne({ where: { id: it.itemId, tenantId } });
      if (!item) {
        throw new NotFoundException(`Item with ID '${it.itemId}' not found`);
      }
      const quantity = Number(it.quantity);
      const unitPrice = Number(item.price) || 0;
      lines.push({
        itemId: item.id,
        productName: item.name,
        productSlug: item.slug,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      });
    }

    const order = await this.buildAndPersistOrder({
      tenantId,
      lines,
      paymentStatus: 'paid',
      paymentMethod: dto.paymentMethod ?? 'cash',
      userId,
      clientRef: dto.clientRef,
      notes: dto.notes,
      paidAt: new Date(),
      paidAmount: dto.paidAmount,
    });

    this.logger.log(`Checkout created order ${order.orderNumber} (${lines.length} lines) for tenant ${tenantId}`);
    return order;
  }

  /**
   * Create an order from a paid/completed cart
   */
  async createFromCart(cartId: string, tenantId: string, notes?: string): Promise<Order> {
    validateTenantId(tenantId);

    // Load cart with items (also validates tenant isolation)
    const cart = await this.cartService.findOne(cartId, tenantId);

    // Only allow order creation from paid or completed carts
    if (cart.status !== 'paid' && cart.status !== 'completed') {
      throw new BadRequestException(
        `Cart must be in 'paid' or 'completed' status to create an order. Current status: '${cart.status}'`,
      );
    }

    // Build order lines from cart items (snapshot).
    const lines: OrderLine[] = (cart.items || []).map((cartItem) => {
      const unitPrice = cartItem.priceSnapshot ?? cartItem.item?.price ?? 0;
      const quantity = Number(cartItem.quantity);
      return {
        itemId: cartItem.itemId,
        productName: cartItem.item?.name ?? 'Unknown Product',
        productSlug: cartItem.item?.slug ?? 'unknown',
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      };
    });

    const paymentStatus: PaymentStatus =
      (cart.status === 'paid' || cart.status === 'completed') ? 'paid' : 'pending';

    // Validate → deduct stock → persist (shared with checkout).
    const order = await this.buildAndPersistOrder({
      tenantId,
      lines,
      paymentStatus,
      paymentMethod: 'cod',
      userId: cart.userId,
      cartId: cart.id,
      notes,
      paidAt: cart.paidAt,
      paidAmount: cart.paidAmount,
    });

    // Deactivate the cart now that the order is committed.
    await this.cartService.update(cartId, { isActive: false }, tenantId);

    this.logger.log(`Created order ${order.orderNumber} from cart ${cartId} for tenant ${tenantId}`);
    return order;
  }

  /**
   * Find all orders for a tenant, optionally filtered by userId
   */
  async findAll(tenantId: string, userId?: string): Promise<Order[]> {
    validateTenantId(tenantId);

    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'orderItem')
      .orderBy('order.createdAt', 'DESC');

    query.andWhere('order.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    return query.getMany();
  }

  /**
   * Find an order by ID within a tenant
   */
  async findOne(id: string, tenantId: string): Promise<Order> {
    validateTenantId(tenantId);

    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }

    return order;
  }

  /**
   * Update order status with validation of allowed transitions
   */
  async updateStatus(id: string, status: OrderStatus, tenantId: string): Promise<Order> {
    validateTenantId(tenantId);

    const order = await this.findOne(id, tenantId);

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order from '${order.status}' to '${status}'`,
      );
    }

    order.status = status;

    // Set the relevant timestamp
    const now = new Date();
    switch (status) {
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'processing':
        order.processingAt = now;
        break;
      case 'out_for_delivery':
        order.dispatchedAt = now;
        break;
      case 'delivered':
        order.deliveredAt = now;
        break;
      case 'cancelled':
        order.cancelledAt = now;
        break;
    }

    const saved = await this.orderRepository.save(order);
    this.logger.log(`Order ${order.orderNumber} status updated to '${status}'`);
    return saved;
  }

  /**
   * Cancel an order with a reason
   */
  async cancel(id: string, reason: string, tenantId: string): Promise<Order> {
    validateTenantId(tenantId);

    const order = await this.findOne(id, tenantId);

    if (order.status === 'delivered') {
      throw new BadRequestException('Cannot cancel a delivered order');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled');
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    const saved = await this.orderRepository.save(order);

    // Restore stock for all order items
    if (order.items && order.items.length > 0) {
      await this.inventoryService.restoreStockForOrder(
        order.items.map((oi) => ({ itemId: oi.itemId, quantity: Number(oi.quantity) })),
        id,
        tenantId,
      );
    }

    this.logger.log(`Order ${order.orderNumber} cancelled: ${reason}`);
    return saved;
  }

  /**
   * Get order count for a tenant, optionally filtered by userId
   */
  async count(tenantId: string, userId?: string): Promise<number> {
    validateTenantId(tenantId);

    const query = this.orderRepository.createQueryBuilder('order');

    query.andWhere('order.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    return query.getCount();
  }

  /**
   * Generate a unique order number: ORD-YYYYMMDD-XXXXX
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }
}
