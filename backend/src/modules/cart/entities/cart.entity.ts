/**
 * Cart Entity
 * Represents a shopping cart
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
import { CartItem } from './cart-item.entity';

export type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

@Entity('carts', { schema: 'public' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  deviceId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: CartStatus;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({
    name: 'paid_at',
    type: 'timestamp',
    nullable: true,
  })
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

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
