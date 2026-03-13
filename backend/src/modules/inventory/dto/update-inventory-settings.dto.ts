/**
 * Update Inventory Settings DTO
 */

import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventorySettingsDto {
  @ApiPropertyOptional({ description: 'Low stock alert threshold', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Whether to track inventory for this item', example: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
}
