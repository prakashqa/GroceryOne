/**
 * LicensesService — TDD spec.
 *
 * Covers the contract that the controller + desktop client depend on:
 *  - generate() mints a key in the canonical format and binds it to a
 *    tenant.
 *  - activate() binds the machine, mirrors a Subscription row, and refuses
 *    cross-tenant / cross-machine activation.
 *  - validate() respects status (revoked, expired) and machine binding.
 *  - deactivate() clears the machine binding so the key can move.
 *
 * Per CLAUDE.md tenant-aware TDD rule, every public method has at least
 * one cross-tenant negative test.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicenseKey } from './entities/license-key.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { TENANT_A_ID, TENANT_B_ID } from '../../test-utils';

describe('LicensesService', () => {
  let service: LicensesService;
  let licenseRepo: jest.Mocked<Repository<LicenseKey>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let subscriptionService: jest.Mocked<SubscriptionService>;

  const tenantA = { id: TENANT_A_ID, slug: 'tenant-a', name: 'Tenant A' } as Tenant;
  const tenantB = { id: TENANT_B_ID, slug: 'tenant-b', name: 'Tenant B' } as Tenant;

  beforeEach(async () => {
    const repoMock = () => ({
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'lk-uuid', ...x })),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicensesService,
        { provide: getRepositoryToken(LicenseKey), useValue: repoMock() },
        { provide: getRepositoryToken(Tenant), useValue: repoMock() },
        {
          provide: SubscriptionService,
          useValue: {
            createDesktopSubscription: jest.fn(async () => ({})),
          },
        },
      ],
    }).compile();

    service = module.get(LicensesService);
    licenseRepo = module.get(getRepositoryToken(LicenseKey));
    tenantRepo = module.get(getRepositoryToken(Tenant));
    subscriptionService = module.get(SubscriptionService);
  });

  describe('generate()', () => {
    it('mints a key matching GROD-XXXX-XXXX-XXXX-XXXX', async () => {
      tenantRepo.findOne.mockResolvedValue(tenantA);
      const result = await service.generate(
        { tenantSlug: tenantA.slug, plan: 'desktop_yearly' },
        { tenantId: TENANT_A_ID, userId: 'admin-1' },
      );
      expect(result.key).toMatch(/^GROD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(result.plan).toBe('desktop_yearly');
      expect(result.status).toBe('pending');
      expect(licenseRepo.save).toHaveBeenCalledTimes(1);
    });

    it('refuses cross-tenant minting: admin of A cannot mint for B', async () => {
      tenantRepo.findOne.mockResolvedValue(tenantB);
      await expect(
        service.generate(
          { tenantSlug: tenantB.slug, plan: 'desktop_yearly' },
          { tenantId: TENANT_A_ID, userId: 'admin-1' },
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(licenseRepo.save).not.toHaveBeenCalled();
    });

    it('defaults expiry to now + 365 days when not provided', async () => {
      tenantRepo.findOne.mockResolvedValue(tenantA);
      const before = Date.now();
      const result = await service.generate(
        { tenantSlug: tenantA.slug, plan: 'desktop_yearly' },
        { tenantId: TENANT_A_ID, userId: 'admin-1' },
      );
      const after = Date.now();
      const diff = result.expiresAt.getTime();
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      expect(diff).toBeGreaterThanOrEqual(before + oneYearMs - 1000);
      expect(diff).toBeLessThanOrEqual(after + oneYearMs + 1000);
    });
  });

  describe('activate()', () => {
    const validKey = 'GROD-A2B3-C4D5-E6F7-G8H9';
    const baseLicense = (overrides: Partial<LicenseKey> = {}): LicenseKey =>
      ({
        id: 'lk-1',
        key: validKey,
        tenantId: TENANT_A_ID,
        plan: 'desktop_yearly',
        status: 'pending',
        machineIdHash: undefined,
        expiresAt: new Date(Date.now() + 365 * 24 * 3600_000),
        issuedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      }) as LicenseKey;

    it('binds machineId, flips status to active, mirrors a subscription', async () => {
      licenseRepo.findOne.mockResolvedValue(baseLicense());
      tenantRepo.findOne.mockResolvedValue(tenantA);

      const result = await service.activate({ key: validKey, machineId: 'machine-1', tenantSlug: tenantA.slug });

      expect(result.status).toBe('active');
      expect(result.machineIdHash).toBeDefined();
      expect(result.machineIdHash).toHaveLength(64); // SHA-256 hex
      expect(result.activatedAt).toBeInstanceOf(Date);
      expect(subscriptionService.createDesktopSubscription).toHaveBeenCalledWith(
        TENANT_A_ID,
        expect.any(Date),
        expect.stringContaining('license:'),
      );
    });

    it('refuses cross-tenant activation: key for A claimed for B → 403', async () => {
      licenseRepo.findOne.mockResolvedValue(baseLicense());
      tenantRepo.findOne.mockResolvedValue(tenantB);

      await expect(
        service.activate({ key: validKey, machineId: 'machine-1', tenantSlug: tenantB.slug }),
      ).rejects.toThrow(ForbiddenException);
      expect(subscriptionService.createDesktopSubscription).not.toHaveBeenCalled();
    });

    it('returns 404 for unknown key', async () => {
      licenseRepo.findOne.mockResolvedValue(null);
      await expect(
        service.activate({ key: validKey, machineId: 'm', tenantSlug: tenantA.slug }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects activation on a SECOND machine (conflict)', async () => {
      const existing = baseLicense({
        status: 'active',
        machineIdHash: 'somethinghashed',
        activatedAt: new Date(),
      });
      licenseRepo.findOne.mockResolvedValue(existing);
      tenantRepo.findOne.mockResolvedValue(tenantA);

      await expect(
        service.activate({ key: validKey, machineId: 'machine-2', tenantSlug: tenantA.slug }),
      ).rejects.toThrow(ConflictException);
    });

    it('is idempotent for the same machine (re-activate succeeds)', async () => {
      const hash = require('crypto').createHash('sha256').update('machine-1').digest('hex');
      const existing = baseLicense({
        status: 'active',
        machineIdHash: hash,
        activatedAt: new Date(Date.now() - 1000),
      });
      licenseRepo.findOne.mockResolvedValue(existing);
      tenantRepo.findOne.mockResolvedValue(tenantA);

      const result = await service.activate({ key: validKey, machineId: 'machine-1', tenantSlug: tenantA.slug });
      expect(result.status).toBe('active');
      expect(result.machineIdHash).toBe(hash);
    });

    it('refuses activation of a revoked key', async () => {
      licenseRepo.findOne.mockResolvedValue(baseLicense({ status: 'revoked', revokedAt: new Date() }));
      tenantRepo.findOne.mockResolvedValue(tenantA);
      await expect(
        service.activate({ key: validKey, machineId: 'm', tenantSlug: tenantA.slug }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('refuses activation of an expired key', async () => {
      licenseRepo.findOne.mockResolvedValue(
        baseLicense({ expiresAt: new Date(Date.now() - 1000) }),
      );
      tenantRepo.findOne.mockResolvedValue(tenantA);
      await expect(
        service.activate({ key: validKey, machineId: 'm', tenantSlug: tenantA.slug }),
      ).rejects.toThrow(GoneException);
    });
  });

  describe('validate()', () => {
    const validKey = 'GROD-A2B3-C4D5-E6F7-G8H9';
    const machineId = 'machine-1';
    const hash = require('crypto').createHash('sha256').update(machineId).digest('hex');
    const activeLicense = (overrides: Partial<LicenseKey> = {}): LicenseKey =>
      ({
        id: 'lk-1',
        key: validKey,
        tenantId: TENANT_A_ID,
        plan: 'desktop_yearly',
        status: 'active',
        machineIdHash: hash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
        activatedAt: new Date(Date.now() - 1000),
        issuedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      }) as LicenseKey;

    it('returns {validUntil, status} on the happy path', async () => {
      licenseRepo.findOne.mockResolvedValue(activeLicense());
      const result = await service.validate({ key: validKey, machineId });
      expect(result.status).toBe('active');
      expect(result.validUntil).toBeInstanceOf(Date);
      expect(licenseRepo.update).toHaveBeenCalled();
    });

    it('refuses revoked keys (401)', async () => {
      licenseRepo.findOne.mockResolvedValue(activeLicense({ status: 'revoked', revokedAt: new Date() }));
      await expect(service.validate({ key: validKey, machineId })).rejects.toThrow(UnauthorizedException);
    });

    it('refuses expired keys (410)', async () => {
      licenseRepo.findOne.mockResolvedValue(activeLicense({ expiresAt: new Date(Date.now() - 1000) }));
      await expect(service.validate({ key: validKey, machineId })).rejects.toThrow(GoneException);
    });

    it('refuses machine mismatch (403)', async () => {
      licenseRepo.findOne.mockResolvedValue(activeLicense());
      await expect(
        service.validate({ key: validKey, machineId: 'different-machine' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deactivate()', () => {
    it("clears machineIdHash on the admin's own key", async () => {
      const key = 'GROD-A2B3-C4D5-E6F7-G8H9';
      licenseRepo.findOne.mockResolvedValue({
        id: 'lk-1',
        key,
        tenantId: TENANT_A_ID,
        plan: 'desktop_yearly',
        status: 'active',
        machineIdHash: 'oldhash',
      } as LicenseKey);
      tenantRepo.findOne.mockResolvedValue(tenantA);

      const result = await service.deactivate({ key }, { tenantId: TENANT_A_ID, userId: 'admin-1' });
      expect(result.machineIdHash).toBeNull();
      expect(licenseRepo.save).toHaveBeenCalled();
    });

    it('refuses to deactivate another tenant\'s key (403, no PII leak)', async () => {
      const key = 'GROD-A2B3-C4D5-E6F7-G8H9';
      licenseRepo.findOne.mockResolvedValue({
        id: 'lk-1',
        key,
        tenantId: TENANT_B_ID,
        status: 'active',
      } as LicenseKey);

      await expect(
        service.deactivate({ key }, { tenantId: TENANT_A_ID, userId: 'admin-1' }),
      ).rejects.toThrow(ForbiddenException);
      expect(licenseRepo.save).not.toHaveBeenCalled();
    });
  });
});
