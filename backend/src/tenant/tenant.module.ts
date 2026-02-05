/**
 * Tenant Module
 * Handles multi-tenant management
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';
import { TenantConfig } from './entities/tenant-config.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantConfig])],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
