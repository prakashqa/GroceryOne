import { ForbiddenException } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

describe('SeedController — assignTestBarcodes (gated)', () => {
  let controller: SeedController;
  let seedService: { assignTestBarcodes: jest.Mock };
  const ORIGINAL_FLAG = process.env.TEST_TOOLS_ENABLED;

  const req = (tenantId: string) => ({ user: { userId: 'u1', tenantId, role: 'admin' } }) as any;

  beforeEach(() => {
    seedService = { assignTestBarcodes: jest.fn().mockResolvedValue({ updated: 2, skipped: 0, assignments: [] }) };
    controller = new SeedController(seedService as unknown as SeedService, {} as any, {} as any);
  });

  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) delete process.env.TEST_TOOLS_ENABLED;
    else process.env.TEST_TOOLS_ENABLED = ORIGINAL_FLAG;
  });

  it('returns 403 (Forbidden) when TEST_TOOLS_ENABLED is not "true" (cloud-safe)', async () => {
    delete process.env.TEST_TOOLS_ENABLED;
    await expect(controller.assignTestBarcodes(req('tenant-a'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(seedService.assignTestBarcodes).not.toHaveBeenCalled();
  });

  it('runs and uses the tenantId from the JWT (never the body) when enabled', async () => {
    process.env.TEST_TOOLS_ENABLED = 'true';
    const res = await controller.assignTestBarcodes(req('tenant-a'));
    expect(seedService.assignTestBarcodes).toHaveBeenCalledWith('tenant-a');
    expect(res).toEqual({ updated: 2, skipped: 0, assignments: [] });
  });
});
