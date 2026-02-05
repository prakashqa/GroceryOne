/**
 * User Entity
 * Stores user accounts with tenant relationship for multi-tenancy
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

export type UserRole = 'customer' | 'admin' | 'manager' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'blocked';

@Entity('users', { schema: 'public' })
@Index(['tenantId', 'email'], { unique: true, where: '"email" IS NOT NULL' })
@Index(['tenantId', 'phone'], { unique: true, where: '"phone" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'pin_hash', length: 255, nullable: true })
  pinHash?: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'customer',
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: UserStatus;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ name: 'preferred_language', length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'phone_verified_at', type: 'timestamp', nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /**
   * Get full name
   */
  get fullName(): string {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    return parts.join(' ') || this.email || this.phone || 'Unknown User';
  }
}
