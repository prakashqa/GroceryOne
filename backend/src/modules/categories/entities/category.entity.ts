/**
 * Category Entity
 * Represents a product category in the catalog
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
import { Item } from '../../products/entities/item.entity';

@Entity('categories', { schema: 'public' })
@Index(['slug', 'tenantId'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  slug: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index()
  tenantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'name_te', length: 255, nullable: true })
  nameTe?: string;

  @Column({ length: 10, default: '📁' })
  icon: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
