/**
 * Cart Service Tests
 * Tests for tenant isolation in cart operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  TENANT_A_ID,
  TENANT_B_ID,
  buildMockCart,
  buildMockItem,
  createMockQueryBuilder,
} from '../../test-utils';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;

  const mockCartTenantA = buildMockCart({
    name: 'Tenant A Cart',
    deviceId: 'device-a',
  });

  const mockCartTenantB = buildMockCart({
    id: 'cart-b-uuid',
    name: 'Tenant B Cart',
    tenantId: TENANT_B_ID,
    userId: 'user-b-uuid',
    deviceId: 'device-b',
  });

  const queryBuilderMock = createMockQueryBuilder();

  const mockCartRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock),
  };

  const mockCartItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductsService = {
    findOne: jest.fn(),
  };

  const mockInventoryService = {
    validateStock: jest.fn(),
    addStock: jest.fn(),
    removeStock: jest.fn(),
    deductStockForOrder: jest.fn(),
    restoreStockForOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    cartItemRepository = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));

    jest.clearAllMocks();

    // Default: item validation passes (item belongs to tenant)
    mockProductsService.findOne.mockResolvedValue(buildMockItem());

    // Default: stock validation passes
    mockInventoryService.validateStock.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('should create cart with server-injected tenantId', async () => {
      const createDto = { name: 'Test Cart', userId: 'user-123' };
      const expectedCart = { ...createDto, tenantId: TENANT_A_ID, id: 'new-cart-uuid' };

      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(expectedCart);
      mockCartRepository.save.mockResolvedValue(expectedCart);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.tenantId).toBe(TENANT_A_ID);
      expect(mockCartRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: TENANT_A_ID,
      });
    });

    it('should reject duplicate cart name within the same tenant', async () => {
      const createDto = { name: 'Weekly Groceries' };
      const existingCart = buildMockCart({ name: 'Weekly Groceries' });

      mockCartRepository.findOne.mockResolvedValue(existingCart);

      await expect(service.create(createDto, TENANT_A_ID)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, TENANT_A_ID)).rejects.toThrow('A cart with this name already exists');
      expect(mockCartRepository.save).not.toHaveBeenCalled();
    });

    it('should allow same cart name in different tenants', async () => {
      const createDto = { name: 'Weekly Groceries' };
      const expectedCart = { ...createDto, tenantId: TENANT_B_ID, id: 'new-cart-uuid' };

      // No existing cart found for tenant B
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(expectedCart);
      mockCartRepository.save.mockResolvedValue(expectedCart);

      const result = await service.create(createDto, TENANT_B_ID);

      expect(result.name).toBe('Weekly Groceries');
      expect(mockCartRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Weekly Groceries', tenantId: TENANT_B_ID },
      });
    });

    it('should allow unique cart name within the same tenant', async () => {
      const createDto = { name: 'New Cart' };
      const expectedCart = { ...createDto, tenantId: TENANT_A_ID, id: 'new-cart-uuid' };

      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(expectedCart);
      mockCartRepository.save.mockResolvedValue(expectedCart);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.name).toBe('New Cart');
    });

    it('should ignore client-provided tenantId and use server-injected one', async () => {
      const createDto = { name: 'Test Cart', tenantId: TENANT_B_ID } as any;
      const expectedCart = { name: 'Test Cart', tenantId: TENANT_A_ID, id: 'new-cart-uuid' };

      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(expectedCart);
      mockCartRepository.save.mockResolvedValue(expectedCart);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.tenantId).toBe(TENANT_A_ID);
      expect(mockCartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });
  });

  describe('findAll', () => {
    it('should only return carts for the specified tenant', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockCartTenantA]);

      const result = await service.findAll('user-a-uuid', undefined, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'cart.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(TENANT_A_ID);
    });

    it('should apply tenant filter on category join', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mockCartTenantA]);

      await service.findAll('user-a-uuid', undefined, TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.category',
        'category',
        'category.tenantId = :categoryTenantId',
        { categoryTenantId: TENANT_A_ID },
      );
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findAll('user-a-uuid', undefined, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return cart when found and belongs to tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);

      const result = await service.findOne('cart-a-uuid', TENANT_A_ID);

      expect(result).toEqual(mockCartTenantA);
      expect(mockCartRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cart-a-uuid', tenantId: TENANT_A_ID },
        relations: ['items', 'items.item', 'items.item.category'],
      });
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('cart-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid', TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findOne('cart-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findActiveCart', () => {
    it('should only return active cart for the specified tenant', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCartTenantA);

      const result = await service.findActiveCart('user-a-uuid', undefined, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'cart.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result?.tenantId).toBe(TENANT_A_ID);
    });

    it('should apply tenant filter on category join', async () => {
      queryBuilderMock.getOne.mockResolvedValue(mockCartTenantA);

      await service.findActiveCart('user-a-uuid', undefined, TENANT_A_ID);

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.category',
        'category',
        'category.tenantId = :categoryTenantId',
        { categoryTenantId: TENANT_A_ID },
      );
    });

    it('should require tenantId parameter', async () => {
      await expect(service.findActiveCart('user-a-uuid', undefined, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update cart when it belongs to the tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartRepository.update.mockResolvedValue({ affected: 1 });
      mockCartRepository.save.mockResolvedValue({ ...mockCartTenantA, name: 'Updated Name' });

      const result = await service.update('cart-a-uuid', { name: 'Updated Name' }, TENANT_A_ID);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.update('cart-a-uuid', { name: 'Hack' }, TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.update('cart-a-uuid', { name: 'Test' }, undefined as any))
        .rejects.toThrow();
    });

    it('should persist paidItemCount when provided', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartRepository.save.mockImplementation((c: any) => Promise.resolve(c));

      const result = await service.update(
        'cart-a-uuid',
        { paidItemCount: 7, paidAt: '2026-01-30T11:00:00.000Z', paidAmount: 500, status: 'paid' } as any,
        TENANT_A_ID,
      );

      expect(result.paidItemCount).toBe(7);
      expect(result.status).toBe('paid');
    });

    it('should reject update where tenant B tries to modify tenant A cart (negative tenant-mismatch)', async () => {
      // Simulate tenantA has cart, tenantB tries to update it - findOne returns null (scoped)
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('cart-a-uuid', { paidItemCount: 99, status: 'paid' } as any, TENANT_B_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete cart when it belongs to the tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('cart-a-uuid', TENANT_A_ID);

      expect(mockCartRepository.softDelete).toHaveBeenCalledWith('cart-a-uuid');
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('cart-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.remove('cart-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('addItem', () => {
    it('should add item when cart belongs to the tenant', async () => {
      const addItemDto = { itemId: 'item-uuid', quantity: 2 };
      const newCartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', ...addItemDto };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockCartItemRepository.create.mockReturnValue(newCartItem);
      mockCartItemRepository.save.mockResolvedValue(newCartItem);

      const result = await service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID);

      expect(result).toEqual(newCartItem);
    });

    it('should validate itemId belongs to same tenant', async () => {
      const addItemDto = { itemId: 'item-a-uuid', quantity: 2 };
      const mockItem = buildMockItem();
      const newCartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', ...addItemDto };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockProductsService.findOne.mockResolvedValue(mockItem);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockCartItemRepository.create.mockReturnValue(newCartItem);
      mockCartItemRepository.save.mockResolvedValue(newCartItem);

      await service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID);

      expect(mockProductsService.findOne).toHaveBeenCalledWith(
        'item-a-uuid',
        TENANT_A_ID,
      );
    });

    it('should reject adding cross-tenant item to cart', async () => {
      const crossTenantItemId = 'item-b-uuid';
      const addItemDto = { itemId: crossTenantItemId, quantity: 1 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException(`Item with ID '${crossTenantItemId}' not found`),
      );

      await expect(service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
      expect(mockCartItemRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.addItem('cart-a-uuid', { itemId: 'item-uuid', quantity: 1 }, TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.addItem('cart-a-uuid', { itemId: 'item-uuid', quantity: 1 }, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('updateItem', () => {
    it('should update item when cart belongs to the tenant', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 1 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.save.mockResolvedValue({ ...cartItem, quantity: 5 });

      const result = await service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 5 }, TENANT_A_ID);

      expect(result.quantity).toBe(5);
    });

    it('should include tenantId in cartItem query', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 1 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.save.mockResolvedValue({ ...cartItem, quantity: 3 });

      await service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 3 }, TENANT_A_ID);

      expect(mockCartItemRepository.findOne).toHaveBeenCalledWith({
        where: { cartId: 'cart-a-uuid', itemId: 'item-uuid', tenantId: TENANT_A_ID },
      });
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 5 }, TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 5 }, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('removeItem', () => {
    it('should remove item when cart belongs to the tenant', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 1 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeItem('cart-a-uuid', 'item-uuid', TENANT_A_ID);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith('cart-item-uuid');
    });

    it('should include tenantId in cartItem query', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 1 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeItem('cart-a-uuid', 'item-uuid', TENANT_A_ID);

      expect(mockCartItemRepository.findOne).toHaveBeenCalledWith({
        where: { cartId: 'cart-a-uuid', itemId: 'item-uuid', tenantId: TENANT_A_ID },
      });
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.removeItem('cart-a-uuid', 'item-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.removeItem('cart-a-uuid', 'item-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('clearCart', () => {
    it('should clear cart when it belongs to the tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 5 });

      await service.clearCart('cart-a-uuid', TENANT_A_ID);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({ cartId: 'cart-a-uuid', tenantId: TENANT_A_ID });
    });

    it('should include tenantId in cartItem delete', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.delete.mockResolvedValue({ affected: 5 });

      await service.clearCart('cart-a-uuid', TENANT_A_ID);

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({
        cartId: 'cart-a-uuid',
        tenantId: TENANT_A_ID,
      });
    });

    it('should throw NotFoundException when cart belongs to different tenant', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.clearCart('cart-a-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.clearCart('cart-a-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should count carts only for the specified tenant', async () => {
      queryBuilderMock.getCount.mockResolvedValue(5);

      const result = await service.count('user-a-uuid', undefined, TENANT_A_ID);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'cart.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toBe(5);
    });

    it('should require tenantId parameter', async () => {
      await expect(service.count('user-a-uuid', undefined, undefined as any))
        .rejects.toThrow();
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should prevent Tenant A from accessing Tenant B cart by ID', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCartTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from updating Tenant B cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockCartTenantB.id, { name: 'Malicious Update' }, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from deleting Tenant B cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockCartTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from adding items to Tenant B cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.addItem(mockCartTenantB.id, { itemId: 'item-uuid', quantity: 1 }, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent Tenant A from clearing items in Tenant B cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.clearCart(mockCartTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('bulkCreate should not allow cross-tenant injection', async () => {
      const maliciousCarts = [
        { name: 'Injected Cart', tenantId: TENANT_B_ID } as any,
      ];

      mockCartRepository.create.mockImplementation((dto: any) => dto);
      mockCartRepository.save.mockResolvedValue([{ ...maliciousCarts[0], tenantId: TENANT_A_ID }]);

      await service.bulkCreate(maliciousCarts, TENANT_A_ID);

      expect(mockCartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });
  });

  describe('addItem - stock validation', () => {
    it('should reject adding item when stock is insufficient', async () => {
      const addItemDto = { itemId: 'item-uuid', quantity: 100 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockInventoryService.validateStock.mockRejectedValue(
        new BadRequestException('Insufficient stock'),
      );

      await expect(service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
      expect(mockCartItemRepository.create).not.toHaveBeenCalled();
    });

    it('should succeed adding item when stock is sufficient', async () => {
      const addItemDto = { itemId: 'item-uuid', quantity: 5 };
      const newCartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', ...addItemDto };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockInventoryService.validateStock.mockResolvedValue(undefined);
      mockCartItemRepository.create.mockReturnValue(newCartItem);
      mockCartItemRepository.save.mockResolvedValue(newCartItem);

      const result = await service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID);

      expect(mockInventoryService.validateStock).toHaveBeenCalledWith('item-uuid', 5, TENANT_A_ID);
      expect(result).toEqual(newCartItem);
    });

    it('should validate total quantity when adding to existing cart item', async () => {
      const addItemDto = { itemId: 'item-uuid', quantity: 10 };
      const existingCartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 5 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(existingCartItem);
      mockCartItemRepository.save.mockResolvedValue({ ...existingCartItem, quantity: 15 });

      await service.addItem('cart-a-uuid', addItemDto, TENANT_A_ID);

      // Should validate total quantity (5 existing + 10 new = 15), not just the added quantity
      expect(mockInventoryService.validateStock).toHaveBeenCalledWith('item-uuid', 15, TENANT_A_ID);
    });
  });

  describe('updateItem - stock validation', () => {
    it('should validate stock when increasing quantity', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 5 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.save.mockResolvedValue({ ...cartItem, quantity: 20 });

      await service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 20 }, TENANT_A_ID);

      expect(mockInventoryService.validateStock).toHaveBeenCalledWith('item-uuid', 20, TENANT_A_ID);
    });

    it('should skip stock validation when decreasing quantity', async () => {
      const cartItem = { id: 'cart-item-uuid', cartId: 'cart-a-uuid', itemId: 'item-uuid', quantity: 10 };

      mockCartRepository.findOne.mockResolvedValue(mockCartTenantA);
      mockCartItemRepository.findOne.mockResolvedValue(cartItem);
      mockCartItemRepository.save.mockResolvedValue({ ...cartItem, quantity: 3 });

      await service.updateItem('cart-a-uuid', 'item-uuid', { quantity: 3 }, TENANT_A_ID);

      expect(mockInventoryService.validateStock).not.toHaveBeenCalled();
    });
  });

  describe('bulkCreate', () => {
    it('should require tenantId parameter', async () => {
      const carts = [{ name: 'Cart 1', userId: 'user-1' }];

      await expect(service.bulkCreate(carts, undefined as any))
        .rejects.toThrow('Tenant ID is required');
    });

    it('should inject tenantId into all created carts', async () => {
      const carts = [
        { name: 'Cart 1', userId: 'user-1' },
        { name: 'Cart 2', userId: 'user-2' },
      ];

      mockCartRepository.create.mockImplementation((dto: any) => dto);
      mockCartRepository.save.mockResolvedValue(carts.map(c => ({ ...c, tenantId: TENANT_A_ID })));

      await service.bulkCreate(carts, TENANT_A_ID);

      expect(mockCartRepository.create).toHaveBeenCalledTimes(2);
      expect(mockCartRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        name: 'Cart 1',
        tenantId: TENANT_A_ID,
      }));
      expect(mockCartRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        name: 'Cart 2',
        tenantId: TENANT_A_ID,
      }));
    });

    it('should override client-provided tenantId with server tenantId', async () => {
      const carts = [{ name: 'Cart 1', tenantId: TENANT_B_ID } as any];

      mockCartRepository.create.mockImplementation((dto: any) => dto);
      mockCartRepository.save.mockResolvedValue([{ ...carts[0], tenantId: TENANT_A_ID }]);

      await service.bulkCreate(carts, TENANT_A_ID);

      expect(mockCartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
    });
  });
});
