/**
 * InventoryTransaction Entity
 * Immutable audit record for every stock change
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../products/entities/item.entity';

export type InventoryTransactionType =
  | 'restock'
  | 'sale'
  | 'return'
  | 'damage'
  | 'correction'
  | 'initial';

@Entity('inventory_transactions', { schema: 'public' })
@Index(['itemId', 'tenantId'])
@Index(['tenantId', 'createdAt'])
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'item_id', type: 'uuid' })
  @Index()
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'varchar', length: 20 })
  type: InventoryTransactionType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : 0) },
  })
  quantity: number;

  @Column({
    name: 'stock_after',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : 0) },
  })
  stockAfter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
