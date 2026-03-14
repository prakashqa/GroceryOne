import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './entities/subscription.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepo: any;
  let redisClient: any;

  beforeEach(async () => {
    subscriptionRepo = {
      create: jest.fn((data: any) => ({ id: 'sub-test', ...data }) as any),
      save: jest.fn((data: any) => Promise.resolve(data)),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: 'REDIS_CLIENT', useValue: redisClient },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('createTrialSubscription', () => {
    it('should create a 14-day trial with status trial and amount 0', async () => {
      const beforeCreate = new Date();
      const result = await service.createTrialSubscription('tenant-aaa');

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-aaa',
          plan: 'monthly',
          status: 'trial',
          amount: 0,
          currency: 'INR',
        }),
      );

      const createArg = subscriptionRepo.create.mock.calls[0][0];
      const expiresAt = new Date(createArg.expiresAt);
      const startsAt = new Date(createArg.startsAt);
      const diffDays = Math.round((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(14);

      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalledWith('sub:active:tenant-aaa');
    });
  });

  describe('createSubscription', () => {
    beforeEach(() => {
      // Mock the expireExistingSubscriptions query builder chain
      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);
    });

    it('should create monthly subscription with amount 1000 and 30-day duration', async () => {
      const result = await service.createSubscription('tenant-aaa', 'monthly');

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-aaa',
          plan: 'monthly',
          status: 'active',
          amount: 1000,
          currency: 'INR',
        }),
      );

      const createArg = subscriptionRepo.create.mock.calls[0][0];
      const expiresAt = new Date(createArg.expiresAt);
      const startsAt = new Date(createArg.startsAt);
      const diffDays = Math.round((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('should create yearly subscription with amount 9000 and 365-day duration', async () => {
      const result = await service.createSubscription('tenant-aaa', 'yearly');

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-aaa',
          plan: 'yearly',
          status: 'active',
          amount: 9000,
          currency: 'INR',
        }),
      );

      const createArg = subscriptionRepo.create.mock.calls[0][0];
      const expiresAt = new Date(createArg.expiresAt);
      const startsAt = new Date(createArg.startsAt);
      const diffDays = Math.round((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(365);
    });

    it('should store payment reference when provided', async () => {
      await service.createSubscription('tenant-aaa', 'monthly', 'pay_xyz');

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReference: 'pay_xyz',
        }),
      );
    });

    it('should expire existing active/trial subscriptions before creating new one', async () => {
      await service.createSubscription('tenant-aaa', 'monthly');

      // Verify createQueryBuilder was called (for expire)
      expect(subscriptionRepo.createQueryBuilder).toHaveBeenCalled();
      const qb = subscriptionRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith({ status: 'expired' });
    });

    it('should reject invalid plan type', async () => {
      await expect(
        service.createSubscription('tenant-aaa', 'weekly' as any),
      ).rejects.toThrow('Invalid plan');
    });

    it('should invalidate Redis cache after creation', async () => {
      await service.createSubscription('tenant-aaa', 'monthly');
      expect(redisClient.del).toHaveBeenCalledWith('sub:active:tenant-aaa');
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true when cached as active', async () => {
      redisClient.get.mockResolvedValue('1');

      const result = await service.isSubscriptionActive('tenant-aaa');

      expect(result).toBe(true);
      expect(subscriptionRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return false when cached as inactive', async () => {
      redisClient.get.mockResolvedValue('0');

      const result = await service.isSubscriptionActive('tenant-aaa');

      expect(result).toBe(false);
    });

    it('should query DB and cache result when not cached', async () => {
      redisClient.get.mockResolvedValue(null);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'active' }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.isSubscriptionActive('tenant-aaa');

      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith('sub:active:tenant-aaa', '1', 'EX', 300);
    });

    it('should return false when no active subscription exists in DB', async () => {
      redisClient.get.mockResolvedValue(null);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.isSubscriptionActive('tenant-aaa');

      expect(result).toBe(false);
      expect(redisClient.set).toHaveBeenCalledWith('sub:active:tenant-aaa', '0', 'EX', 300);
    });

    it('should fall back to DB when Redis fails', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis down'));

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'sub-1' }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.isSubscriptionActive('tenant-aaa');
      expect(result).toBe(true);
    });
  });

  describe('getActiveSubscription', () => {
    it('should query with tenant_id filter', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'sub-1', tenantId: 'tenant-aaa' }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getActiveSubscription('tenant-aaa');

      expect(mockQb.where).toHaveBeenCalledWith('sub.tenant_id = :tenantId', { tenantId: 'tenant-aaa' });
    });
  });

  describe('tenant isolation', () => {
    it('getActiveSubscription for tenantA should not return tenantB data', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'sub-1', tenantId: 'tenant-aaa' }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getActiveSubscription('tenant-aaa');

      // Verify the WHERE clause uses tenant-aaa, not tenant-bbb
      expect(mockQb.where).toHaveBeenCalledWith('sub.tenant_id = :tenantId', { tenantId: 'tenant-aaa' });
      expect(mockQb.where).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenantId: 'tenant-bbb' }),
      );
    });

    it('isSubscriptionActive should be independent per tenant (different cache keys)', async () => {
      // TenantA is active
      redisClient.get.mockResolvedValueOnce('1');
      const resultA = await service.isSubscriptionActive('tenant-aaa');
      expect(resultA).toBe(true);
      expect(redisClient.get).toHaveBeenCalledWith('sub:active:tenant-aaa');

      // TenantB is expired
      redisClient.get.mockResolvedValueOnce('0');
      const resultB = await service.isSubscriptionActive('tenant-bbb');
      expect(resultB).toBe(false);
      expect(redisClient.get).toHaveBeenCalledWith('sub:active:tenant-bbb');
    });

    it('createSubscription should scope to specific tenant', async () => {
      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.createSubscription('tenant-aaa', 'monthly');

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-aaa' }),
      );
      // Verify expire query is also tenant-scoped
      expect(mockQb.where).toHaveBeenCalledWith('tenant_id = :tenantId', { tenantId: 'tenant-aaa' });
    });
  });

  describe('getSubscriptionsByTenant', () => {
    it('should return subscriptions filtered by tenantId', async () => {
      subscriptionRepo.find.mockResolvedValue([
        { id: 'sub-1', tenantId: 'tenant-aaa' },
        { id: 'sub-2', tenantId: 'tenant-aaa' },
      ]);

      const result = await service.getSubscriptionsByTenant('tenant-aaa');

      expect(subscriptionRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-aaa' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });
});
