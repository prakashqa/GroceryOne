/**
 * Bulk Adjust Stock DTO
 */

import { ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdjustStockDto } from './adjust-stock.dto';

export class BulkAdjustStockDto {
  @ApiProperty({ description: 'List of stock adjustments', type: [AdjustStockDto] })
  @ValidateNested({ each: true })
  @Type(() => AdjustStockDto)
  @ArrayMinSize(1)
  adjustments: AdjustStockDto[];
}
