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
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 10, default: '📁' })
  icon: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
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
