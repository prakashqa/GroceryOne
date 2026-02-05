/**
 * Update Tenant DTO
 */

import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  @ApiPropertyOptional({ enum: ['basic', 'standard', 'premium', 'enterprise'] })
  @IsOptional()
  @IsEnum(['basic', 'standard', 'premium', 'enterprise'])
  subscriptionPlan?: 'basic' | 'standard' | 'premium' | 'enterprise';
}
