/**
 * UserSettings Entity
 * Stores user preferences and settings
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../../tenant/entities/tenant.entity';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrinterConnectionType = 'bluetooth' | 'network' | 'none';
export type PaperSize = '80mm' | '58mm' | 'a4';
export type PrintFormat = 'receipt' | 'detailed' | 'compact';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface PrinterSettings {
  enabled: boolean;
  connectionType: PrinterConnectionType;
  selectedPrinterId: string | null;
  selectedPrinterName: string | null;
  selectedPrinterAddress: string | null;
  paperSize: PaperSize;
  printFormat: PrintFormat;
  connectionStatus: ConnectionStatus;
  lastConnectedAt: string | null;
  autoPrint: boolean;
}

@Entity('user_settings', { schema: 'public' })
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  deviceId?: string;

  @Column({
    name: 'theme_mode',
    type: 'varchar',
    length: 20,
    default: 'system',
  })
  themeMode: ThemeMode;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({
    type: 'jsonb',
    default: {
      enabled: true,
      orderUpdates: true,
      promotions: true,
      reminders: true,
      sound: true,
      vibration: true,
    },
  })
  notifications: NotificationSettings;

  @Column({
    type: 'jsonb',
    default: {
      enabled: false,
      connectionType: 'none',
      selectedPrinterId: null,
      selectedPrinterName: null,
      selectedPrinterAddress: null,
      paperSize: '80mm',
      printFormat: 'receipt',
      connectionStatus: 'disconnected',
      lastConnectedAt: null,
      autoPrint: false,
    },
  })
  printer: PrinterSettings;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
