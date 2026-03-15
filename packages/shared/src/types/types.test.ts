/**
 * Shared types runtime exports tests
 * Validates that all exported constants are defined and correctly shaped
 */

import { PRODUCT_UNITS } from './product.types';
import { SUBSCRIPTION_PLANS } from './subscription.types';
import { API_ERROR_CODES } from './api.types';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from './order.types';
import {
  DEFAULT_TENANT_BRANDING,
  DEFAULT_TENANT_FEATURES,
  DEFAULT_TENANT_LIMITS,
} from './tenant.types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './user.types';

describe('Shared type constants', () => {
  it('should export PRODUCT_UNITS with expected keys', () => {
    expect(PRODUCT_UNITS).toBeDefined();
    expect(PRODUCT_UNITS.kg).toBeDefined();
    expect(PRODUCT_UNITS.kg.label).toBe('Kilogram');
  });

  it('should export SUBSCRIPTION_PLANS', () => {
    expect(SUBSCRIPTION_PLANS).toBeDefined();
  });

  it('should export API_ERROR_CODES', () => {
    expect(API_ERROR_CODES).toBeDefined();
  });

  it('should export ORDER_STATUS_LABELS and PAYMENT_STATUS_LABELS', () => {
    expect(ORDER_STATUS_LABELS).toBeDefined();
    expect(PAYMENT_STATUS_LABELS).toBeDefined();
  });

  it('should export DEFAULT_TENANT_BRANDING with required fields', () => {
    expect(DEFAULT_TENANT_BRANDING).toBeDefined();
    expect(DEFAULT_TENANT_BRANDING).toHaveProperty('primaryColor');
  });

  it('should export DEFAULT_TENANT_FEATURES', () => {
    expect(DEFAULT_TENANT_FEATURES).toBeDefined();
  });

  it('should export DEFAULT_TENANT_LIMITS', () => {
    expect(DEFAULT_TENANT_LIMITS).toBeDefined();
  });

  it('should export DEFAULT_NOTIFICATION_PREFERENCES', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES).toBeDefined();
  });
});
