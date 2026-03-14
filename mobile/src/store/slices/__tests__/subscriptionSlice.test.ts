import subscriptionReducer, {
  setSubscription,
  setExpired,
  clearSubscription,
  setLoading,
  setError,
  selectSubscription,
  selectIsSubscriptionActive,
  selectIsSubscriptionExpired,
  selectSubscriptionLoading,
  selectSubscriptionError,
} from '../subscriptionSlice';
import type { Subscription } from '@groceryone/shared';

const mockSubscription: Subscription = {
  id: 'sub-001',
  tenantId: 'tenant-001',
  plan: 'monthly',
  status: 'active',
  amount: 1000,
  currency: 'INR',
  startsAt: new Date('2026-03-01'),
  expiresAt: new Date('2026-03-31'),
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

describe('subscriptionSlice', () => {
  const initialState = {
    subscription: null,
    isActive: false,
    isExpired: false,
    isLoading: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(subscriptionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setSubscription with active status', () => {
    const state = subscriptionReducer(initialState, setSubscription(mockSubscription));
    expect(state.subscription).toEqual(mockSubscription);
    expect(state.isActive).toBe(true);
    expect(state.isExpired).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle setSubscription with trial status', () => {
    const trialSub = { ...mockSubscription, status: 'trial' as const };
    const state = subscriptionReducer(initialState, setSubscription(trialSub));
    expect(state.isActive).toBe(true);
  });

  it('should handle setSubscription with expired status', () => {
    const expiredSub = { ...mockSubscription, status: 'expired' as const };
    const state = subscriptionReducer(initialState, setSubscription(expiredSub));
    expect(state.isActive).toBe(false);
  });

  it('should handle setExpired', () => {
    const activeState = subscriptionReducer(initialState, setSubscription(mockSubscription));
    const state = subscriptionReducer(activeState, setExpired());
    expect(state.isExpired).toBe(true);
    expect(state.isActive).toBe(false);
  });

  it('should handle clearSubscription', () => {
    const activeState = subscriptionReducer(initialState, setSubscription(mockSubscription));
    const state = subscriptionReducer(activeState, clearSubscription());
    expect(state).toEqual(initialState);
  });

  it('should handle setLoading', () => {
    const state = subscriptionReducer(initialState, setLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('should handle setError', () => {
    const state = subscriptionReducer(initialState, setError('Something went wrong'));
    expect(state.error).toBe('Something went wrong');
    expect(state.isLoading).toBe(false);
  });

  describe('selectors', () => {
    const mockRootState = {
      subscription: {
        subscription: mockSubscription,
        isActive: true,
        isExpired: false,
        isLoading: false,
        error: null,
      },
    } as any;

    it('selectSubscription returns subscription', () => {
      expect(selectSubscription(mockRootState)).toEqual(mockSubscription);
    });

    it('selectIsSubscriptionActive returns isActive', () => {
      expect(selectIsSubscriptionActive(mockRootState)).toBe(true);
    });

    it('selectIsSubscriptionExpired returns isExpired', () => {
      expect(selectIsSubscriptionExpired(mockRootState)).toBe(false);
    });

    it('selectSubscriptionLoading returns isLoading', () => {
      expect(selectSubscriptionLoading(mockRootState)).toBe(false);
    });

    it('selectSubscriptionError returns error', () => {
      expect(selectSubscriptionError(mockRootState)).toBeNull();
    });
  });

  describe('tenant isolation', () => {
    it('clearSubscription resets all state on tenant switch', () => {
      // Simulate active subscription for tenant A
      let state = subscriptionReducer(initialState, setSubscription(mockSubscription));
      expect(state.isActive).toBe(true);

      // Tenant switch: clear subscription
      state = subscriptionReducer(state, clearSubscription());
      expect(state.subscription).toBeNull();
      expect(state.isActive).toBe(false);
      expect(state.isExpired).toBe(false);
    });

    it('subscription state is scoped to current tenant', () => {
      const tenantASub = { ...mockSubscription, tenantId: 'tenant-a' };
      const tenantBSub = { ...mockSubscription, tenantId: 'tenant-b', status: 'expired' as const };

      // Set tenant A subscription
      let state = subscriptionReducer(initialState, setSubscription(tenantASub));
      expect(state.isActive).toBe(true);

      // Clear and set tenant B
      state = subscriptionReducer(state, clearSubscription());
      state = subscriptionReducer(state, setSubscription(tenantBSub));
      expect(state.isActive).toBe(false);
      expect(state.subscription?.tenantId).toBe('tenant-b');
    });
  });
});
