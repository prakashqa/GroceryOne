/**
 * Create Cart DTO
 */

import { IsString, IsOptional, IsUUID, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartStatus } from '../entities/cart.entity';

export class CreateCartDto {
  @ApiProperty({ description: 'Cart name', example: 'Weekly Groceries' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'User ID (optional)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Device ID (optional)', example: 'device-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Cart status', example: 'draft', enum: ['draft', 'printed', 'completed'] })
  @IsOptional()
  @IsEnum(['draft', 'printed', 'completed'])
  status?: CartStatus;
}
