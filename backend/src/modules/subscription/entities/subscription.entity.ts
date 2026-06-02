/**
 * Subscription Entity
 * Tracks subscription plans and billing for tenants.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../../tenant/entities/tenant.entity';

export type SubscriptionPlanType = 'monthly' | 'yearly' | 'desktop_yearly';
export type SubscriptionStatusType = 'trial' | 'active' | 'expired' | 'cancelled';

@Entity('subscriptions', { schema: 'public' })
@Index(['tenantId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 20 })
  plan: SubscriptionPlanType;

  @Column({ type: 'varchar', length: 20, default: 'trial' })
  status: SubscriptionStatusType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : v) },
  })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'payment_reference', type: 'varchar', length: 255, nullable: true })
  paymentReference?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
