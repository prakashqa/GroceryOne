/**
 * LicensesController — HTTP surface for the desktop license lifecycle.
 *
 * Public endpoints (no auth, no tenant header needed — keyed by the license
 * value itself):
 *   POST /licenses/activate
 *   POST /licenses/validate
 *
 * Admin-only endpoints (JWT + admin role):
 *   POST /licenses/generate
 *   POST /licenses/deactivate
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request as Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LicensesService } from './licenses.service';
import {
  ActivateLicenseDto,
  ValidateLicenseDto,
  GenerateLicenseDto,
  DeactivateLicenseDto,
} from './dto';

interface JwtAuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    tenantId: string;
    email?: string;
    phone?: string;
    role: string;
  };
}

@ApiTags('licenses')
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  // ─── Public (no auth) endpoints used by the desktop app ──────────────

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a license key on a customer machine',
    description:
      'Binds the key to the machineId on first call. Subsequent calls from the same machine are idempotent.',
  })
  @ApiResponse({ status: 200, description: 'Activated. Body includes plan, expires, tenantSlug.' })
  @ApiResponse({ status: 404, description: 'Key not recognised' })
  @ApiResponse({ status: 409, description: 'Already activated on another machine' })
  @ApiResponse({ status: 403, description: 'Key does not belong to the claimed tenant' })
  @ApiResponse({ status: 410, description: 'License has expired' })
  async activate(@Body() dto: ActivateLicenseDto) {
    const license = await this.licensesService.activate(dto);
    return {
      key: license.key,
      plan: license.plan,
      status: license.status,
      validUntil: license.expiresAt,
      activatedAt: license.activatedAt,
      tenantSlug: dto.tenantSlug,
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Heartbeat — confirm a previously-activated license is still valid',
    description:
      'Desktop calls this on launch and every 24h. Returns minimal data; no tenant info leaked.',
  })
  @ApiResponse({ status: 200, description: '{validUntil, status}' })
  @ApiResponse({ status: 401, description: 'License has been revoked' })
  @ApiResponse({ status: 403, description: 'License bound to a different machine' })
  @ApiResponse({ status: 404, description: 'Key not recognised' })
  @ApiResponse({ status: 410, description: 'License has expired' })
  async validate(@Body() dto: ValidateLicenseDto) {
    return this.licensesService.validate(dto);
  }

  // ─── Admin-only endpoints ───────────────────────────────────────────

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mint a new license key for the admin\'s own tenant',
    description:
      'Manual flow: customer pays via UPI / bank, admin mints a key with a paymentRef, support emails it.',
  })
  @ApiResponse({ status: 201, description: 'Key minted. Plaintext returned — show ONCE.' })
  @ApiResponse({ status: 403, description: 'Admin cannot mint a key for a different tenant' })
  async generate(@Req() req: JwtAuthenticatedRequest, @Body() dto: GenerateLicenseDto) {
    const license = await this.licensesService.generate(dto, {
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
    return {
      id: license.id,
      key: license.key,
      tenantSlug: dto.tenantSlug,
      plan: license.plan,
      status: license.status,
      issuedAt: license.issuedAt,
      expiresAt: license.expiresAt,
      paymentRef: license.paymentRef,
    };
  }

  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear the machine binding so the customer can re-activate on a new machine',
  })
  @ApiResponse({ status: 200, description: 'Binding cleared' })
  @ApiResponse({ status: 403, description: 'Key does not belong to your tenant' })
  @ApiResponse({ status: 404, description: 'Key not recognised' })
  async deactivate(@Req() req: JwtAuthenticatedRequest, @Body() dto: DeactivateLicenseDto) {
    const license = await this.licensesService.deactivate(dto, {
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
    return {
      id: license.id,
      key: license.key,
      status: license.status,
      machineIdHash: license.machineIdHash,
    };
  }
}
