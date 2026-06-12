/**
 * Orders Service
 * Business logic for order management — cart→order conversion and status tracking
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';

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
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

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

    // Build order items from cart items (snapshot)
    const orderItemsData = (cart.items || []).map((cartItem) => {
      const unitPrice = cartItem.priceSnapshot ?? cartItem.item?.price ?? 0;
      const quantity = Number(cartItem.quantity);
      const totalPrice = quantity * unitPrice;

      return {
        itemId: cartItem.itemId,
        productName: cartItem.item?.name ?? 'Unknown Product',
        productSlug: cartItem.item?.slug ?? 'unknown',
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    // Calculate subtotal
    const subtotal = orderItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subtotal; // No tax/delivery for POS

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Determine payment status from cart
    const paymentStatus = (cart.status === 'paid' || cart.status === 'completed') ? 'paid' : 'pending';

    // Pre-flight: validate stock for ALL items up front so we fail BEFORE
    // writing anything — this prevents a phantom order being persisted (and the
    // cart left active) when stock later turns out to be insufficient.
    for (const oi of orderItemsData) {
      await this.inventoryService.validateStock(oi.itemId, oi.quantity, tenantId);
    }

    // Pre-generate the order id so stock movements can reference it and the
    // order is only persisted AFTER stock has been successfully deducted.
    const orderId = randomUUID();

    // Deduct stock FIRST. If this throws (e.g. a race slipped past validation),
    // no order row is created and the cart stays active for a retry.
    await this.inventoryService.deductStockForOrder(
      orderItemsData.map((oi) => ({ itemId: oi.itemId, quantity: oi.quantity })),
      orderId,
      tenantId,
    );

    // Create + persist the order entity (with the pre-generated id).
    const order = this.orderRepository.create({
      id: orderId,
      orderNumber,
      tenantId,
      userId: cart.userId,
      cartId: cart.id,
      status: 'pending' as OrderStatus,
      paymentStatus,
      paymentMethod: 'cod',
      subtotal,
      taxAmount: 0,
      deliveryFee: 0,
      discountAmount: 0,
      totalAmount,
      notes,
      paidAt: cart.paidAt,
      paidAmount: cart.paidAmount,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = orderItemsData.map((itemData) =>
      this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
        tenantId,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    // Deactivate the cart
    await this.cartService.update(cartId, { isActive: false }, tenantId);

    this.logger.log(`Created order ${savedOrder.orderNumber} from cart ${cartId} for tenant ${tenantId}`);

    // Return with items
    return this.findOne(savedOrder.id, tenantId);
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
