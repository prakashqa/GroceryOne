/**
 * Item Entity
 * Represents a product item in the catalog
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
import { Category } from '../../categories/entities/category.entity';

export type ItemUnit = 'kg' | 'gm' | 'pcs' | 'L' | 'ml';

@Entity('items', { schema: 'public' })
@Index(['slug', 'tenantId'], { unique: true })
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  slug: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: false })
  @Index()
  tenantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'name_te', length: 255, nullable: true })
  nameTe?: string;

  @Column({ length: 50, nullable: true })
  @Index()
  barcode?: string;

  @Column({ name: 'category_id', type: 'uuid' })
  @Index()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'pcs',
  })
  unit: ItemUnit;

  @Column({
    name: 'default_quantity',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : v) },
  })
  defaultQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : null) },
  })
  price?: number;

  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : v) },
  })
  compareAtPrice: number;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : null) },
  })
  costPrice?: number;

  @Column({
    name: 'stock_quantity',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : 0) },
  })
  stockQuantity: number;

  @Column({
    name: 'low_stock_threshold',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 10,
    transformer: { to: (v: number) => v, from: (v: string) => (v != null ? parseFloat(v) : 10) },
  })
  lowStockThreshold: number;

  @Column({ name: 'track_inventory', default: false })
  trackInventory: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
