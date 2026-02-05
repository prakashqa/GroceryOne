/**
 * Orders Service Tests
 * Tests for order creation from cart, tenant isolation, and status management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { Cart } from '../cart/entities/cart.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let cartService: CartService;

  const TENANT_A_ID = 'tenant-a-uuid';
  const TENANT_B_ID = 'tenant-b-uuid';
  const USER_ID = 'user-a-uuid';

  const mockCartWithItems: Cart = {
    id: 'cart-uuid',
    name: 'Weekly Groceries',
    tenantId: TENANT_A_ID,
    userId: USER_ID,
    status: 'paid',
    isActive: true,
    paidAt: new Date('2026-02-04T10:00:00Z'),
    paidAmount: 250,
    items: [
      {
        id: 'cart-item-1',
        cartId: 'cart-uuid',
        itemId: 'item-1-uuid',
        quantity: 2,
        priceSnapshot: 50,
        addedAt: new Date(),
        item: {
          id: 'item-1-uuid',
          slug: 'basmati-rice-1kg',
          name: 'Basmati Rice 1kg',
          categoryId: 'cat-uuid',
          unit: 'kg',
          defaultQuantity: 1,
          price: 50,
          compareAtPrice: 0,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        cart: {} as any,
      },
      {
        id: 'cart-item-2',
        cartId: 'cart-uuid',
        itemId: 'item-2-uuid',
        quantity: 3,
        priceSnapshot: 30,
        addedAt: new Date(),
        item: {
          id: 'item-2-uuid',
          slug: 'toor-dal-500g',
          name: 'Toor Dal 500g',
          categoryId: 'cat-uuid',
          unit: 'kg',
          defaultQuantity: 0.5,
          price: 30,
          compareAtPrice: 0,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        cart: {} as any,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder: Order = {
    id: 'order-uuid',
    orderNumber: 'ORD-20260204-001',
    tenantId: TENANT_A_ID,
    userId: USER_ID,
    cartId: 'cart-uuid',
    status: 'pending' as OrderStatus,
    paymentStatus: 'paid',
    paymentMethod: 'cod',
    subtotal: 190,
    taxAmount: 0,
    deliveryFee: 0,
    discountAmount: 0,
    totalAmount: 190,
    paidAt: new Date('2026-02-04T10:00:00Z'),
    paidAmount: 250,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderTenantB: Order = {
    ...mockOrder,
    id: 'order-b-uuid',
    tenantId: TENANT_B_ID,
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

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => createQueryBuilderMock),
  };

  const mockOrderItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCartService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
    cartService = module.get<CartService>(CartService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromCart', () => {
    it('should create order from a paid cart', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, items: [] });
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      // Mock findOne for return value
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, items: [] });

      const result = await service.createFromCart('cart-uuid', TENANT_A_ID);

      expect(result).toBeDefined();
      expect(mockCartService.findOne).toHaveBeenCalledWith('cart-uuid', TENANT_A_ID);
    });

    it('should reject non-paid cart', async () => {
      const draftCart = { ...mockCartWithItems, status: 'draft' as const };
      mockCartService.findOne.mockResolvedValue(draftCart);

      await expect(service.createFromCart('cart-uuid', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject printed (not yet paid) cart', async () => {
      const printedCart = { ...mockCartWithItems, status: 'printed' as const };
      mockCartService.findOne.mockResolvedValue(printedCart);

      await expect(service.createFromCart('cart-uuid', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should accept completed cart', async () => {
      const completedCart = { ...mockCartWithItems, status: 'completed' as const };
      mockCartService.findOne.mockResolvedValue(completedCart);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, items: [] });
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, items: [] });

      const result = await service.createFromCart('cart-uuid', TENANT_A_ID);

      expect(result).toBeDefined();
    });

    it('should snapshot item data into order items', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, id: 'new-order-uuid' });
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, items: [] });

      await service.createFromCart('cart-uuid', TENANT_A_ID);

      // Should create order items with snapshots from cart items
      expect(mockOrderItemRepository.create).toHaveBeenCalledTimes(2);
      expect(mockOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item-1-uuid',
          productName: 'Basmati Rice 1kg',
          productSlug: 'basmati-rice-1kg',
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
        }),
      );
      expect(mockOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item-2-uuid',
          productName: 'Toor Dal 500g',
          productSlug: 'toor-dal-500g',
          quantity: 3,
          unitPrice: 30,
          totalPrice: 90,
        }),
      );
    });

    it('should calculate totals correctly', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockImplementation((dto) => dto);
      mockOrderRepository.save.mockImplementation(async (entity) => ({ ...entity, id: 'new-order-uuid' }));
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockImplementation(async () => mockOrder);

      await service.createFromCart('cart-uuid', TENANT_A_ID);

      // subtotal should be sum: (2*50) + (3*30) = 100 + 90 = 190
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 190,
          totalAmount: 190,
        }),
      );
    });

    it('should generate an order number', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockImplementation((dto) => dto);
      mockOrderRepository.save.mockImplementation(async (entity) => ({ ...entity, id: 'new-order-uuid' }));
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockImplementation(async () => mockOrder);

      await service.createFromCart('cart-uuid', TENANT_A_ID);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: expect.stringMatching(/^ORD-\d{8}-[A-Z0-9]+$/),
        }),
      );
    });

    it('should copy payment info from cart', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockImplementation((dto) => dto);
      mockOrderRepository.save.mockImplementation(async (entity) => ({ ...entity, id: 'new-order-uuid' }));
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockImplementation(async () => mockOrder);

      await service.createFromCart('cart-uuid', TENANT_A_ID);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAt: mockCartWithItems.paidAt,
          paidAmount: mockCartWithItems.paidAmount,
          paymentStatus: 'paid',
        }),
      );
    });

    it('should deactivate cart after order creation', async () => {
      mockCartService.findOne.mockResolvedValue(mockCartWithItems);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, id: 'new-order-uuid' });
      mockOrderItemRepository.create.mockImplementation((dto) => dto);
      mockOrderItemRepository.save.mockResolvedValue([]);
      mockCartService.update.mockResolvedValue({});
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, items: [] });

      await service.createFromCart('cart-uuid', TENANT_A_ID);

      expect(mockCartService.update).toHaveBeenCalledWith(
        'cart-uuid',
        { isActive: false },
        TENANT_A_ID,
      );
    });

    it('should enforce tenant isolation', async () => {
      mockCartService.findOne.mockRejectedValue(new NotFoundException('Cart not found'));

      await expect(service.createFromCart('cart-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId', async () => {
      await expect(service.createFromCart('cart-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should filter by tenantId', async () => {
      createQueryBuilderMock.getMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll(TENANT_A_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'order.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toHaveLength(1);
    });

    it('should optionally filter by userId', async () => {
      createQueryBuilderMock.getMany.mockResolvedValue([mockOrder]);

      await service.findAll(TENANT_A_ID, USER_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'order.userId = :userId',
        { userId: USER_ID },
      );
    });

    it('should return empty array for other tenant', async () => {
      createQueryBuilderMock.getMany.mockResolvedValue([]);

      const result = await service.findAll(TENANT_B_ID);

      expect(result).toHaveLength(0);
    });

    it('should require tenantId', async () => {
      await expect(service.findAll(undefined as any))
        .rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should find by id and tenantId', async () => {
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-uuid', TENANT_A_ID);

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-uuid', tenantId: TENANT_A_ID },
        relations: ['items'],
      });
    });

    it('should throw NotFoundException for wrong tenant', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('order-uuid', TENANT_B_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid', TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should require tenantId', async () => {
      await expect(service.findOne('order-uuid', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update status and set timestamp', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'confirmed' });

      const result = await service.updateStatus('order-uuid', 'confirmed', TENANT_A_ID);

      expect(result.status).toBe('confirmed');
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          confirmedAt: expect.any(Date),
        }),
      );
    });

    it('should set processingAt when moving to processing', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'confirmed' });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'processing' });

      await service.updateStatus('order-uuid', 'processing', TENANT_A_ID);

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          processingAt: expect.any(Date),
        }),
      );
    });

    it('should set dispatchedAt when moving to out_for_delivery', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'processing' });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'out_for_delivery' });

      await service.updateStatus('order-uuid', 'out_for_delivery', TENANT_A_ID);

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'out_for_delivery',
          dispatchedAt: expect.any(Date),
        }),
      );
    });

    it('should set deliveredAt when moving to delivered', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'out_for_delivery' });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'delivered' });

      await service.updateStatus('order-uuid', 'delivered', TENANT_A_ID);

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should reject invalid transitions (delivered -> pending)', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'delivered' });

      await expect(service.updateStatus('order-uuid', 'pending', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject transition from cancelled', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      await expect(service.updateStatus('order-uuid', 'confirmed', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should require tenantId', async () => {
      await expect(service.updateStatus('order-uuid', 'confirmed', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('cancel', () => {
    it('should cancel order with reason', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      const result = await service.cancel('order-uuid', 'Customer request', TENANT_A_ID);

      expect(result.status).toBe('cancelled');
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancellationReason: 'Customer request',
          cancelledAt: expect.any(Date),
        }),
      );
    });

    it('should reject cancelling delivered order', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'delivered' });

      await expect(service.cancel('order-uuid', 'Changed mind', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject cancelling already cancelled order', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      await expect(service.cancel('order-uuid', 'Double cancel', TENANT_A_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should require tenantId', async () => {
      await expect(service.cancel('order-uuid', 'Reason', undefined as any))
        .rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should count by tenant', async () => {
      createQueryBuilderMock.getCount.mockResolvedValue(5);

      const result = await service.count(TENANT_A_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'order.tenantId = :tenantId',
        { tenantId: TENANT_A_ID },
      );
      expect(result).toBe(5);
    });

    it('should optionally filter by userId', async () => {
      createQueryBuilderMock.getCount.mockResolvedValue(3);

      await service.count(TENANT_A_ID, USER_ID);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'order.userId = :userId',
        { userId: USER_ID },
      );
    });

    it('should require tenantId', async () => {
      await expect(service.count(undefined as any))
        .rejects.toThrow();
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should prevent access to order from different tenant', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockOrderTenantB.id, TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent status update on order from different tenant', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(mockOrderTenantB.id, 'confirmed', TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent cancellation of order from different tenant', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.cancel(mockOrderTenantB.id, 'Reason', TENANT_A_ID))
        .rejects.toThrow(NotFoundException);
    });
  });
});
