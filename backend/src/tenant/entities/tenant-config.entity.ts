/**
 * Tenant Configuration Entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

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

@Entity('tenant_configs', { schema: 'public' })
export class TenantConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @OneToOne(() => Tenant, (tenant) => tenant.config)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({
    type: 'jsonb',
    default: JSON.stringify({
      reviewsEnabled: true,
      wishlistEnabled: true,
      multipleAddresses: true,
      orderTracking: true,
      pushNotifications: true,
      smsNotifications: false,
      loyaltyProgram: false,
    }),
  })
  features: TenantFeatures;

  @Column({ name: 'max_products', default: 10000 })
  maxProducts: number;

  @Column({ name: 'max_categories', default: 100 })
  maxCategories: number;

  @Column({ name: 'max_users', default: 50000 })
  maxUsers: number;

  @Column({ name: 'max_orders_per_day', default: 10000 })
  maxOrdersPerDay: number;

  @Column({
    name: 'payment_gateways',
    type: 'jsonb',
    default: '[]',
  })
  paymentGateways: Array<{
    provider: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }>;

  @Column({
    name: 'sms_provider',
    type: 'jsonb',
    nullable: true,
  })
  smsProvider?: Record<string, unknown>;

  @Column({
    name: 'email_provider',
    type: 'jsonb',
    nullable: true,
  })
  emailProvider?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual property for limits
  get limits(): TenantLimits {
    return {
      maxProducts: this.maxProducts,
      maxCategories: this.maxCategories,
      maxUsers: this.maxUsers,
      maxOrdersPerDay: this.maxOrdersPerDay,
    };
  }
}
