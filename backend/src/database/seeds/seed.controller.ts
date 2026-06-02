/**
 * Seed Controller
 * Admin endpoints for database seeding (development only)
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SeedService, SeedReport } from './seed.service';
import { HistoricSeedService } from './historic-seed.service';
import { TenantUserSeedService } from './tenant-user-seed.service';

interface JwtAuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

@ApiTags('Database Seeds (Dev)')
@Controller('admin/seeds')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly historicSeedService: HistoricSeedService,
    private readonly tenantUserSeedService: TenantUserSeedService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Seed database with initial data' })
  @ApiResponse({ status: 200, description: 'Seed completed' })
  async seed(): Promise<SeedReport> {
    return this.seedService.seed();
  }

  @Post('if-empty')
  @ApiOperation({ summary: 'Seed database only if empty' })
  @ApiResponse({ status: 200, description: 'Seed completed or skipped' })
  async seedIfEmpty(): Promise<SeedReport | { message: string }> {
    const report = await this.seedService.seedIfEmpty();
    if (!report) {
      return { message: 'Database already has data, seed skipped' };
    }
    return report;
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current data counts' })
  @ApiResponse({ status: 200, description: 'Data counts' })
  async getStatus(): Promise<{ categories: number; items: number }> {
    return this.seedService.getDataCounts();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all seed data (dangerous!)' })
  @ApiResponse({ status: 200, description: 'Data cleared' })
  async clearData(): Promise<{ categoriesDeleted: number; itemsDeleted: number }> {
    return this.seedService.clearSeedData();
  }

  @Post('historic')
  @ApiOperation({ summary: 'Seed database with historic cart data for reports' })
  @ApiResponse({ status: 200, description: 'Historic seed completed' })
  async seedHistoric(): Promise<any> {
    return this.historicSeedService.seedHistoricData();
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Seed tenants and users for multi-tenant testing' })
  @ApiResponse({ status: 200, description: 'Tenant/user seed completed' })
  async seedTenants(): Promise<any> {
    return this.tenantUserSeedService.seed();
  }

  /**
   * Per-tenant sample-data seed for the caller's own tenant.
   *
   * Used by the "Load sample data" button on the empty-state of the web
   * Categories/Items pages (cloud + offline desktop). Reads tenantId from the
   * JWT — NEVER from the request body — so an admin of tenant A cannot
   * accidentally seed tenant B's data.
   *
   * Idempotent: if the tenant already has any categories the response is
   * `{alreadySeeded:true}` and nothing is written.
   */
  @Post('sample')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Seed the caller's tenant with the FreshMart sample catalog (admin only)",
  })
  @ApiResponse({
    status: 200,
    description: '{ alreadySeeded, categories, items }',
  })
  async seedSample(
    @Request() req: JwtAuthenticatedRequest,
  ): Promise<{ alreadySeeded: boolean; categories: number; items: number }> {
    return this.seedService.seedSampleDataForTenant(req.user.tenantId);
  }
}
