/**
 * Set Stock DTO
 */

import { IsUUID, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetStockDto {
  @ApiProperty({ description: 'Item ID to set stock for' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Absolute target stock quantity', example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for stock correction' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
