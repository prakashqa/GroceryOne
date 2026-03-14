/**
 * Tenant-related type definitions
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlan;
  branding: TenantBranding;
  contactEmail?: string;
  contactPhone?: string;
  businessAddress?: string;
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  currency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = 'active' | 'inactive' | 'suspended';

export type SubscriptionPlan = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface TenantBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface TenantConfig {
  id: string;
  tenantId: string;
  features: TenantFeatures;
  limits: TenantLimits;
  paymentGateways: PaymentGatewayConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantFeatures {
  reviewsEnabled: boolean;
  wishlistEnabled: boolean;
  multipleAddresses: boolean;
  orderTracking: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  loyaltyProgram: boolean;
}

export interface TenantLimits {
  maxProducts: number;
  maxCategories: number;
  maxUsers: number;
  maxOrdersPerDay: number;
}

export interface PaymentGatewayConfig {
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export type SupportedLanguage = 'en' | 'te';

export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  primaryColor: '#4CAF50',
  secondaryColor: '#2196F3',
  fontFamily: 'Roboto',
};

export const DEFAULT_TENANT_FEATURES: TenantFeatures = {
  reviewsEnabled: true,
  wishlistEnabled: true,
  multipleAddresses: true,
  orderTracking: true,
  pushNotifications: true,
  smsNotifications: false,
  loyaltyProgram: false,
};

export const DEFAULT_TENANT_LIMITS: TenantLimits = {
  maxProducts: 10000,
  maxCategories: 100,
  maxUsers: 50000,
  maxOrdersPerDay: 10000,
};
