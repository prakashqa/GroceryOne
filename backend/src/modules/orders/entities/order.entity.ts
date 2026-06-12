/**
 * Order Entity
 * Represents a completed order converted from a cart
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

@Entity('orders', { schema: 'public' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', length: 50, unique: true })
  @Index()
  orderNumber: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  // Nullable: a direct POS checkout (POST /orders/checkout) has no backend cart.
  @Column({ name: 'cart_id', type: 'uuid', nullable: true })
  cartId?: string;

  // Client-supplied idempotency key (the local POS cart id) so a retried/
  // double-submitted checkout returns the same order instead of double-deducting
  // stock. Unique only WITHIN a tenant.
  @Column({ name: 'client_ref', type: 'varchar', length: 100, nullable: true })
  @Index()
  clientRef?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 20,
    default: 'cod',
  })
  paymentMethod: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  subtotal: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  taxAmount: number;

  @Column({
    name: 'delivery_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  deliveryFee: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  discountAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  paidAmount?: number;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ name: 'processing_at', type: 'timestamp', nullable: true })
  processingAt?: Date;

  @Column({ name: 'dispatched_at', type: 'timestamp', nullable: true })
  dispatchedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
