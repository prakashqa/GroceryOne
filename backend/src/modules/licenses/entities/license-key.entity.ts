/**
 * LicenseKey Entity
 *
 * Tracks per-tenant license keys for the Windows desktop app.
 *
 * Lifecycle:
 *   1. Admin (or Razorpay webhook) calls `licenses.generate()` → row created
 *      with status='pending', `machineId=null`.
 *   2. Customer pastes the key into the desktop app's license-gate.
 *      Desktop calls POST /licenses/activate {key, machineId}.
 *   3. Service binds `machineId`, flips status to 'active', sets
 *      `activatedAt`, and creates a mirror Subscription row so the rest of
 *      the backend's subscription guards work uniformly.
 *   4. Desktop heartbeats POST /licenses/validate every 24h. Server updates
 *      `lastValidatedAt`. Cached `validUntil` on the desktop allows a 7-day
 *      offline grace window.
 *
 * Tenant isolation: `tenantId` is NOT NULL on every row, and every endpoint
 * scopes by it. A key issued for tenant A cannot be activated against tenant B.
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

export type LicensePlanType = 'desktop_yearly';
export type LicenseStatusType = 'pending' | 'active' | 'expired' | 'revoked';

@Entity('license_keys', { schema: 'public' })
@Index(['tenantId', 'status'])
export class LicenseKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The plaintext license key, e.g. "GROD-XXXX-XXXX-XXXX-XXXX".
   * Stored as plaintext (not hashed) because the customer must paste it
   * verbatim into the desktop app; the value's secrecy is enforced by
   * delivery channel (email) and the machine-binding check.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 35 })
  key: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 32 })
  plan: LicensePlanType;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: LicenseStatusType;

  /**
   * Hashed machine identifier (SHA-256 of node-machine-id's value).
   * NULL until first activation. Hashed at write time so a DB dump never
   * reveals raw customer machine IDs.
   */
  @Column({ name: 'machine_id_hash', type: 'varchar', length: 64, nullable: true })
  machineIdHash?: string;

  @Column({ name: 'issued_at', type: 'timestamp' })
  issuedAt: Date;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt?: Date;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'last_validated_at', type: 'timestamp', nullable: true })
  lastValidatedAt?: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  /**
   * User id of the admin who minted this key (manual flow).
   * NULL when minted automatically (e.g. Razorpay webhook).
   */
  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy?: string;

  /**
   * Payment reference — Razorpay payment id (`pay_…`) or a human-readable
   * tag like `manual-UPI-2026-05-15`. Nullable for trial / promotional keys
   * (none in v1, but the column allows future use).
   */
  @Column({ name: 'payment_ref', type: 'varchar', length: 128, nullable: true })
  paymentRef?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
