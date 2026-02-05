/**
 * Create Item DTO
 */

import { IsString, IsOptional, IsInt, IsBoolean, IsUUID, IsNumber, IsEnum, MaxLength, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemUnit } from '../entities/item.entity';

export class CreateItemDto {
  @ApiProperty({ description: 'Unique slug identifier', example: 'atta-1' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiProperty({ description: 'Item name', example: 'Aashirvaad Atta' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Category ID', example: 'uuid-here' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'kg', enum: ['kg', 'gm', 'pcs', 'L', 'ml'] })
  @IsOptional()
  @IsEnum(['kg', 'gm', 'pcs', 'L', 'ml'])
  unit?: ItemUnit;

  @ApiPropertyOptional({ description: 'Default quantity', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultQuantity?: number;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is item active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
