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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService, SeedReport } from './seed.service';
import { HistoricSeedService } from './historic-seed.service';
import { TenantUserSeedService } from './tenant-user-seed.service';

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
}
