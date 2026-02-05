/**
 * Create Category DTO
 */

import { IsString, IsOptional, IsInt, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Unique slug identifier', example: 'atta-rice' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiProperty({ description: 'Category name', example: 'Atta, Rice & Grains' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Category icon (emoji)', example: '🌾' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is category active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
