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

  @ApiPropertyOptional({ description: 'Product barcode (EAN-13, UPC-A, etc.)', example: '8901030793615' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

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

  @ApiPropertyOptional({ description: 'Item price per unit', example: 250.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Compare at price (MRP)', example: 280.0 })
  @IsNumber()
  @Min(0)
  compareAtPrice: number;

  @ApiPropertyOptional({ description: 'Cost price for merchant', example: 200.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is item active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Initial stock quantity', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock alert threshold', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Whether to track inventory for this item', example: false })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
}
