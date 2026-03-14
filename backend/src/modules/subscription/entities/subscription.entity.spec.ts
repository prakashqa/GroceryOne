import { Subscription } from './subscription.entity';

describe('Subscription Entity', () => {
  it('should create a subscription instance with all required fields', () => {
    const subscription = new Subscription();
    subscription.id = 'sub-001';
    subscription.tenantId = 'tenant-001';
    subscription.plan = 'monthly';
    subscription.status = 'active';
    subscription.amount = 1000;
    subscription.currency = 'INR';
    subscription.startsAt = new Date('2026-03-01');
    subscription.expiresAt = new Date('2026-03-31');

    expect(subscription.id).toBe('sub-001');
    expect(subscription.tenantId).toBe('tenant-001');
    expect(subscription.plan).toBe('monthly');
    expect(subscription.status).toBe('active');
    expect(subscription.amount).toBe(1000);
    expect(subscription.currency).toBe('INR');
    expect(subscription.startsAt).toEqual(new Date('2026-03-01'));
    expect(subscription.expiresAt).toEqual(new Date('2026-03-31'));
  });

  it('should support yearly plan with correct amount', () => {
    const subscription = new Subscription();
    subscription.plan = 'yearly';
    subscription.amount = 9000;

    expect(subscription.plan).toBe('yearly');
    expect(subscription.amount).toBe(9000);
  });

  it('should support trial status', () => {
    const subscription = new Subscription();
    subscription.status = 'trial';
    subscription.amount = 0;

    expect(subscription.status).toBe('trial');
    expect(subscription.amount).toBe(0);
  });

  it('should support optional fields', () => {
    const subscription = new Subscription();
    subscription.cancelledAt = new Date('2026-04-01');
    subscription.paymentReference = 'pay_123abc';

    expect(subscription.cancelledAt).toEqual(new Date('2026-04-01'));
    expect(subscription.paymentReference).toBe('pay_123abc');
  });

  it('should have undefined optional fields by default', () => {
    const subscription = new Subscription();

    expect(subscription.cancelledAt).toBeUndefined();
    expect(subscription.paymentReference).toBeUndefined();
    expect(subscription.deletedAt).toBeUndefined();
  });
});
