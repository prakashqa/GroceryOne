/**
 * Cart Service
 * Business logic for cart management
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CreateCartDto, UpdateCartDto, AddCartItemDto, UpdateCartItemDto } from './dto';

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
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  /**
   * Create a new cart with server-injected tenant ID
   * @param createCartDto Cart creation data
   * @param tenantId Server-authenticated tenant ID (from middleware)
   */
  async create(createCartDto: CreateCartDto, tenantId: string): Promise<Cart> {
    validateTenantId(tenantId);

    // Reject duplicate cart names within the same tenant
    const existing = await this.cartRepository.findOne({
      where: { name: createCartDto.name, tenantId },
    });
    if (existing) {
      throw new BadRequestException('A cart with this name already exists');
    }

    // Server injects tenantId - ignore any client-provided value
    const cart = this.cartRepository.create({
      ...createCartDto,
      tenantId,
    });
    const saved = await this.cartRepository.save(cart);
    this.logger.log(`Created cart: ${saved.name} (${saved.id}) for tenant ${tenantId}`);
    return saved;
  }

  /**
   * Find all carts for a user or device within a tenant
   * @param userId Optional user ID filter
   * @param deviceId Optional device ID filter
   * @param tenantId Required tenant ID for isolation
   */
  async findAll(userId?: string, deviceId?: string, tenantId?: string): Promise<Cart[]> {
    validateTenantId(tenantId);

    const query = this.cartRepository.createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .orderBy('cart.updatedAt', 'DESC');

    // Always filter by tenant for data isolation
    query.andWhere('cart.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('cart.userId = :userId', { userId });
    }

    if (deviceId) {
      query.andWhere('cart.deviceId = :deviceId', { deviceId });
    }

    return query.getMany();
  }

  /**
   * Find a cart by ID within a tenant
   * @param id Cart UUID
   * @param tenantId Required tenant ID for isolation
   */
  async findOne(id: string, tenantId: string): Promise<Cart> {
    validateTenantId(tenantId);

    const cart = await this.cartRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.item', 'items.item.category'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID '${id}' not found`);
    }

    return cart;
  }

  /**
   * Get active cart for user/device within a tenant
   * @param userId Optional user ID filter
   * @param deviceId Optional device ID filter
   * @param tenantId Required tenant ID for isolation
   */
  async findActiveCart(userId?: string, deviceId?: string, tenantId?: string): Promise<Cart | null> {
    validateTenantId(tenantId);

    const query = this.cartRepository.createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .where('cart.isActive = :isActive', { isActive: true });

    // Always filter by tenant for data isolation
    query.andWhere('cart.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('cart.userId = :userId', { userId });
    }

    if (deviceId) {
      query.andWhere('cart.deviceId = :deviceId', { deviceId });
    }

    return query.getOne();
  }

  /**
   * Update a cart within a tenant
   * @param id Cart UUID
   * @param updateCartDto Update data
   * @param tenantId Required tenant ID for isolation
   */
  async update(id: string, updateCartDto: UpdateCartDto, tenantId: string): Promise<Cart> {
    validateTenantId(tenantId);

    const cart = await this.findOne(id, tenantId);

    // If setting this cart as active, deactivate others for same user/device within tenant
    if (updateCartDto.isActive) {
      await this.cartRepository.update(
        { userId: cart.userId, deviceId: cart.deviceId, tenantId },
        { isActive: false },
      );
    }

    Object.assign(cart, updateCartDto);
    const updated = await this.cartRepository.save(cart);
    this.logger.log(`Updated cart: ${updated.name} (${updated.id})`);
    return updated;
  }

  /**
   * Delete a cart (soft delete) within a tenant
   * @param id Cart UUID
   * @param tenantId Required tenant ID for isolation
   */
  async remove(id: string, tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    const cart = await this.findOne(id, tenantId);
    await this.cartRepository.softDelete(id);
    this.logger.log(`Deleted cart: ${cart.name} (${cart.id})`);
  }

  /**
   * Add item to cart within a tenant
   * @param cartId Cart UUID
   * @param addCartItemDto Item data
   * @param tenantId Required tenant ID for isolation
   */
  async addItem(cartId: string, addCartItemDto: AddCartItemDto, tenantId: string): Promise<CartItem> {
    validateTenantId(tenantId);

    await this.findOne(cartId, tenantId); // Verify cart exists and belongs to tenant

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId, itemId: addCartItemDto.itemId },
    });

    if (existingItem) {
      // Update quantity instead of creating new
      existingItem.quantity = Number(existingItem.quantity) + addCartItemDto.quantity;
      const updated = await this.cartItemRepository.save(existingItem);
      this.logger.log(`Updated cart item quantity in cart ${cartId}: ${addCartItemDto.itemId}`);
      return updated;
    }

    const cartItem = this.cartItemRepository.create({
      cartId,
      tenantId,
      ...addCartItemDto,
    });
    const saved = await this.cartItemRepository.save(cartItem);
    this.logger.log(`Added item to cart ${cartId}: ${addCartItemDto.itemId}`);
    return saved;
  }

  /**
   * Update item in cart within a tenant
   * @param cartId Cart UUID
   * @param itemId Item UUID
   * @param updateCartItemDto Update data
   * @param tenantId Required tenant ID for isolation
   */
  async updateItem(cartId: string, itemId: string, updateCartItemDto: UpdateCartItemDto, tenantId: string): Promise<CartItem> {
    validateTenantId(tenantId);

    // Verify cart exists and belongs to tenant before modifying items
    await this.findOne(cartId, tenantId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { cartId, itemId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Item '${itemId}' not found in cart '${cartId}'`);
    }

    // If quantity is 0, remove the item
    if (updateCartItemDto.quantity === 0) {
      await this.cartItemRepository.delete(cartItem.id);
      this.logger.log(`Removed item from cart ${cartId}: ${itemId}`);
      return cartItem;
    }

    cartItem.quantity = updateCartItemDto.quantity;
    const updated = await this.cartItemRepository.save(cartItem);
    this.logger.log(`Updated item in cart ${cartId}: ${itemId} to quantity ${updateCartItemDto.quantity}`);
    return updated;
  }

  /**
   * Remove item from cart within a tenant
   * @param cartId Cart UUID
   * @param itemId Item UUID
   * @param tenantId Required tenant ID for isolation
   */
  async removeItem(cartId: string, itemId: string, tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    // Verify cart exists and belongs to tenant before removing items
    await this.findOne(cartId, tenantId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { cartId, itemId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Item '${itemId}' not found in cart '${cartId}'`);
    }

    await this.cartItemRepository.delete(cartItem.id);
    this.logger.log(`Removed item from cart ${cartId}: ${itemId}`);
  }

  /**
   * Clear all items from cart within a tenant
   * @param cartId Cart UUID
   * @param tenantId Required tenant ID for isolation
   */
  async clearCart(cartId: string, tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    await this.findOne(cartId, tenantId); // Verify cart exists and belongs to tenant
    await this.cartItemRepository.delete({ cartId });
    this.logger.log(`Cleared all items from cart ${cartId}`);
  }

  /**
   * Get cart count within a tenant
   * @param userId Optional user ID filter
   * @param deviceId Optional device ID filter
   * @param tenantId Required tenant ID for isolation
   */
  async count(userId?: string, deviceId?: string, tenantId?: string): Promise<number> {
    validateTenantId(tenantId);

    const query = this.cartRepository.createQueryBuilder('cart');

    // Always filter by tenant for data isolation
    query.andWhere('cart.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('cart.userId = :userId', { userId });
    }

    if (deviceId) {
      query.andWhere('cart.deviceId = :deviceId', { deviceId });
    }

    return query.getCount();
  }

  /**
   * Bulk create carts with server-injected tenant ID
   * @param carts Cart creation data array
   * @param tenantId Server-authenticated tenant ID (from middleware)
   */
  async bulkCreate(carts: CreateCartDto[], tenantId: string): Promise<Cart[]> {
    validateTenantId(tenantId);

    // Server injects tenantId into every cart - override any client-provided value
    const entities = carts.map(dto => this.cartRepository.create({
      ...dto,
      tenantId,
    }));
    const saved = await this.cartRepository.save(entities);
    this.logger.log(`Bulk created ${saved.length} carts for tenant ${tenantId}`);
    return saved;
  }
}
