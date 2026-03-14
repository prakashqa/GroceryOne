import { SubscriptionMiddleware } from './subscription.middleware';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('SubscriptionMiddleware', () => {
  let middleware: SubscriptionMiddleware;
  let mockSubscriptionService: { isSubscriptionActive: jest.Mock };
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockSubscriptionService = {
      isSubscriptionActive: jest.fn(),
    };
    middleware = new SubscriptionMiddleware(mockSubscriptionService as any);
    mockReq = { path: '/categories', tenantId: 'tenant-001' };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should allow request when subscription is active', async () => {
    mockSubscriptionService.isSubscriptionActive.mockResolvedValue(true);

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).toHaveBeenCalledWith('tenant-001');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow request when subscription is trial', async () => {
    mockSubscriptionService.isSubscriptionActive.mockResolvedValue(true);

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should block with 402 when subscription is expired', async () => {
    mockSubscriptionService.isSubscriptionActive.mockResolvedValue(false);

    await expect(
      middleware.use(mockReq as Request, mockRes as Response, mockNext),
    ).rejects.toThrow(HttpException);

    try {
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      const response = (error as HttpException).getResponse() as any;
      expect(response.error.code).toBe('SUBSCRIPTION_EXPIRED');
    }
  });

  it('should block with 402 when no subscription exists', async () => {
    mockSubscriptionService.isSubscriptionActive.mockResolvedValue(false);

    await expect(
      middleware.use(mockReq as Request, mockRes as Response, mockNext),
    ).rejects.toThrow(HttpException);
  });

  it('should skip auth routes', async () => {
    mockReq.path = '/auth/login';

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip subscription routes', async () => {
    mockReq.path = '/subscriptions/current';

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip health route', async () => {
    mockReq.path = '/health';

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip docs route', async () => {
    mockReq.path = '/docs';

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip seed route', async () => {
    mockReq.path = '/seed';

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip when no tenantId is present', async () => {
    mockReq.tenantId = undefined;

    await middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockSubscriptionService.isSubscriptionActive).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  describe('tenant isolation', () => {
    it('should check subscription per tenantId independently', async () => {
      // Tenant A has active subscription
      mockReq.tenantId = 'tenant-a';
      mockSubscriptionService.isSubscriptionActive.mockResolvedValueOnce(true);
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Tenant B has expired subscription
      mockReq.tenantId = 'tenant-b';
      mockSubscriptionService.isSubscriptionActive.mockResolvedValueOnce(false);
      await expect(
        middleware.use(mockReq as Request, mockRes as Response, mockNext),
      ).rejects.toThrow(HttpException);

      // Verify each tenant was checked independently
      expect(mockSubscriptionService.isSubscriptionActive).toHaveBeenCalledWith('tenant-a');
      expect(mockSubscriptionService.isSubscriptionActive).toHaveBeenCalledWith('tenant-b');
    });

    it('should not allow tenantA request to use tenantB subscription status', async () => {
      mockSubscriptionService.isSubscriptionActive.mockImplementation(
        async (tenantId: string) => tenantId === 'tenant-active',
      );

      // Active tenant passes
      mockReq.tenantId = 'tenant-active';
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Expired tenant blocked
      mockReq.tenantId = 'tenant-expired';
      await expect(
        middleware.use(mockReq as Request, mockRes as Response, mockNext),
      ).rejects.toThrow(HttpException);
    });
  });
});
