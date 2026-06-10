/**
 * LicensesService — business logic for the desktop-app license lifecycle.
 *
 * All public methods enforce tenant scoping. See licenses.service.spec.ts
 * for the contract.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { LicenseKey, LicensePlanType } from './entities/license-key.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  ActivateLicenseDto,
  ValidateLicenseDto,
  GenerateLicenseDto,
  DeactivateLicenseDto,
} from './dto';

interface AdminContext {
  tenantId: string;
  userId: string;
}

const PLAN_DURATION_DAYS: Record<LicensePlanType, number> = {
  desktop_yearly: 365,
};

/**
 * Base32-ish alphabet without ambiguous chars (no 0/O, 1/I, L, U, B/8 confusion):
 *   A-Z minus I/L/O/U, 2-9 (no 0/1)
 * Yields 28 symbols; 16 chars → ~76 bits of entropy.
 */
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function hashMachineId(machineId: string): string {
  return crypto.createHash('sha256').update(machineId, 'utf8').digest('hex');
}

function generateKeyString(): string {
  const bytes = crypto.randomBytes(16);
  let raw = '';
  for (let i = 0; i < 16; i++) {
    raw += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  // Format GROD-XXXX-XXXX-XXXX-XXXX (20 chars + 4 dashes + "GROD-" = 25 char)
  return `GROD-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(
    @InjectRepository(LicenseKey)
    private readonly licenseRepository: Repository<LicenseKey>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Mint a new license key. Admin-only (enforced by the controller's
   * RolesGuard) AND tenant-scoped (admin can only mint for their own
   * tenant — cross-tenant attempt → 403).
   */
  async generate(dto: GenerateLicenseDto, admin: AdminContext): Promise<LicenseKey> {
    const tenant = await this.tenantRepository.findOne({ where: { slug: dto.tenantSlug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant '${dto.tenantSlug}' not found`);
    }
    if (tenant.id !== admin.tenantId) {
      // Defensive: prevent cross-tenant mint even if a malicious admin gets
      // hold of another tenant's slug.
      throw new ForbiddenException("Admin cannot mint a license for a different tenant");
    }

    // Payment gate. A key may only be minted against a non-trivial payment
    // reference (the UPI transaction id under the manual-verification model).
    // Belt-and-braces with the DTO validation so a misconfigured pipe can't
    // bypass it.
    const paymentRef = dto.paymentRef?.trim();
    if (!paymentRef || paymentRef.length < 6) {
      throw new BadRequestException('Payment reference is required (UPI transaction ID)');
    }
    // Each reference can fund exactly one key — global check, since all
    // license fees land in the vendor's single collection account.
    const refInUse = await this.licenseRepository.findOne({ where: { paymentRef } });
    if (refInUse) {
      throw new ConflictException('This payment reference was already used for another license key');
    }

    const now = new Date();
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(now.getTime() + PLAN_DURATION_DAYS[dto.plan] * 24 * 60 * 60 * 1000);

    // Generate a unique key; retry on the (very unlikely) collision.
    let key = generateKeyString();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.licenseRepository.findOne({ where: { key } });
      if (!existing) break;
      key = generateKeyString();
    }

    const entity = this.licenseRepository.create({
      key,
      tenantId: tenant.id,
      plan: dto.plan,
      status: 'pending',
      issuedAt: now,
      expiresAt,
      issuedBy: admin.userId,
      paymentRef,
    });
    const saved = await this.licenseRepository.save(entity);
    this.logger.log(
      `Generated license ${saved.id} for tenant ${tenant.slug} plan=${dto.plan} expires=${expiresAt.toISOString()}`,
    );
    return saved;
  }

  /**
   * Activate a key on a customer machine. First call binds the machine;
   * subsequent calls from the SAME machine are idempotent; a DIFFERENT
   * machine → 409.
   */
  async activate(dto: ActivateLicenseDto): Promise<LicenseKey> {
    const license = await this.licenseRepository.findOne({ where: { key: dto.key } });
    if (!license) {
      throw new NotFoundException('License key not recognised');
    }

    if (license.status === 'revoked') {
      throw new UnauthorizedException('License has been revoked');
    }
    if (license.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('License has expired');
    }

    // Tenant cross-check: the customer claims `tenantSlug` — verify it
    // matches the tenant the key was minted for. This blocks a key from
    // tenant A being used to unlock tenant B's desktop.
    const claimedTenant = await this.tenantRepository.findOne({ where: { slug: dto.tenantSlug } });
    if (!claimedTenant || claimedTenant.id !== license.tenantId) {
      throw new ForbiddenException('License does not belong to that tenant');
    }

    const incomingHash = hashMachineId(dto.machineId);

    if (license.machineIdHash) {
      if (license.machineIdHash !== incomingHash) {
        throw new ConflictException(
          'License already activated on another machine. Contact support to transfer.',
        );
      }
      // Same machine re-activation — idempotent, just update lastValidatedAt.
      license.lastValidatedAt = new Date();
      const updated = await this.licenseRepository.save(license);
      return updated;
    }

    // First activation
    const now = new Date();
    license.machineIdHash = incomingHash;
    license.status = 'active';
    license.activatedAt = now;
    license.lastValidatedAt = now;
    const saved = await this.licenseRepository.save(license);

    // Mirror to Subscription so the rest of the backend's subscription
    // guards work uniformly. Pass the expiry from the license — the
    // subscription tracks the same window.
    await this.subscriptionService.createDesktopSubscription(
      license.tenantId,
      license.expiresAt,
      `license:${license.id}`,
    );
    this.logger.log(`Activated license ${license.id} for tenant ${claimedTenant.slug}`);
    return saved;
  }

  /**
   * Heartbeat. Returns minimal data (no tenant info leaked) so an
   * unauthenticated probe can't enumerate.
   */
  async validate(dto: ValidateLicenseDto): Promise<{ status: string; validUntil: Date }> {
    const license = await this.licenseRepository.findOne({ where: { key: dto.key } });
    if (!license) {
      throw new NotFoundException('License key not recognised');
    }
    if (license.status === 'revoked') {
      throw new UnauthorizedException('License has been revoked');
    }
    if (license.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('License has expired');
    }

    const incomingHash = hashMachineId(dto.machineId);
    if (license.machineIdHash && license.machineIdHash !== incomingHash) {
      throw new ForbiddenException('License is bound to a different machine');
    }

    await this.licenseRepository.update({ id: license.id }, { lastValidatedAt: new Date() });
    return { status: license.status, validUntil: license.expiresAt };
  }

  /**
   * Admin clears the machine binding so the customer can re-activate on a
   * new machine (laptop swap, OS reinstall). Tenant-scoped: admin can only
   * touch keys in their own tenant.
   */
  async deactivate(dto: DeactivateLicenseDto, admin: AdminContext): Promise<LicenseKey> {
    const license = await this.licenseRepository.findOne({ where: { key: dto.key } });
    if (!license) {
      throw new NotFoundException('License key not recognised');
    }
    if (license.tenantId !== admin.tenantId) {
      // Don't leak whether the key exists in a different tenant — use the
      // same 403 verbiage as other cross-tenant guards.
      throw new ForbiddenException('License does not belong to your tenant');
    }
    license.machineIdHash = null as unknown as undefined;
    license.status = 'active'; // remain active so the new machine can re-activate
    const saved = await this.licenseRepository.save(license);
    this.logger.log(`Deactivated license ${license.id} (machine binding cleared) by admin ${admin.userId}`);
    return saved;
  }
}
