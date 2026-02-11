/**
 * Cart Service Tests
 * Tests for tenant isolation in cart operations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;

  const TENANT_A_ID = 'tenant-a-uuid';
  const TENANT_B_ID = 'tenant-b-uuid';

  const mockCartTenantA: Cart = {
    id: 'cart-a-uuid',
    name: 'Tenant A Cart',
    tenantId: TENANT_A_ID,
    userId: 'user-a-uuid',
    deviceId: 'device-a',
    status: 'draft' as CartStatus,
    isActive: true,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartTenantB: Cart = {
    id: 'cart-b-uuid',
    name: 'Tenant B Cart',
    tenantId: TENANT_B_ID,
    userId: 'user-b-uuid',
    deviceId: 'device-b',
    status: 'draft' as CartStatus,
    isActive: true,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createQueryBuilderMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockCartRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => createQueryBuilderMock),
  };

  const mockCartItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
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
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    cartItemRepository = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create cart with server-injected tenantId', async () => {
      const createDto = { name: 'Test Cart', userId: 'user-123' };
      const expectedCart = { ...createDto, tenantId: TENANT_A_ID, id: 'new-cart-uuid' };

      mockCartRepository.create.mockReturnValue(expectedCart);
      mockCartRepository.save.mockResolvedValue(expectedCart);

      const result = await service.create(createDto, TENANT_A_ID);

      expect(result.tenantId).toBe(TENANT_A_ID);
      expect(mockCartRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: TENANT_A_ID,
      });
    });

    it('should ignore client-provided tenantId and use server-injected one', async () => {
      const createDto = { name: 'Test Cart', tenantId: TENANT_B_ID } as any;
      const expectedCart = { name: 'Test Cart', tenantId: TENANT_A_ID, id: 'new-cart-uuid' };

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
      createQueryBuilderMock.getMany.mockResolvedValue([mockCartTenantA]);

      const result = await service.findAll('user-a-uuid', undefined, TENANT_A_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'cart.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(TENANT_A_ID);
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
      createQueryBuilderMock.getOne.mockResolvedValue(mockCartTenantA);

      const result = await service.findActiveCart('user-a-uuid', undefined, TENANT_A_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'cart.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result?.tenantId).toBe(TENANT_A_ID);
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

      expect(mockCartItemRepository.delete).toHaveBeenCalledWith({ cartId: 'cart-a-uuid' });
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
      createQueryBuilderMock.getCount.mockResolvedValue(5);

      const result = await service.count('user-a-uuid', undefined, TENANT_A_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
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
      // Tenant A tries to access Tenant B's cart
      mockCartRepository.findOne.mockResolvedValue(null); // Won't find with mismatched tenant

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

      // Server-side tenantId must override any client-provided value
      expect(mockCartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A_ID }),
      );
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

      // Verify tenantId was injected into each cart
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
