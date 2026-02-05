/**
 * Tenant Entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { TenantConfig } from './tenant-config.entity';

export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionPlan = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface TenantBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

@Entity('tenants', { schema: 'public' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  domain?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: TenantStatus;

  @Column({
    name: 'subscription_plan',
    type: 'varchar',
    length: 50,
    default: 'basic',
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ name: 'primary_color', length: 7, default: '#4CAF50' })
  primaryColor: string;

  @Column({ name: 'secondary_color', length: 7, default: '#2196F3' })
  secondaryColor: string;

  @Column({ name: 'font_family', length: 100, default: 'Roboto' })
  fontFamily: string;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'default_language', length: 5, default: 'en' })
  defaultLanguage: string;

  @Column({
    name: 'supported_languages',
    type: 'jsonb',
    default: '["en", "te"]',
  })
  supportedLanguages: string[];

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ length: 50, default: 'Asia/Kolkata' })
  timezone: string;

  @OneToOne(() => TenantConfig, (config) => config.tenant)
  config: TenantConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual property for branding
  get branding(): TenantBranding {
    return {
      logoUrl: this.logoUrl,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      fontFamily: this.fontFamily,
    };
  }
}
