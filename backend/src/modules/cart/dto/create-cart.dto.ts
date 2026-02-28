/**
 * Create Cart DTO
 * Note: tenantId is server-injected from authenticated context, not client-provided
 */

import { IsString, IsOptional, IsUUID, IsEnum, IsISO8601, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartStatus } from '../entities/cart.entity';

export class CreateCartDto {
  @ApiProperty({ description: 'Cart name', example: 'Weekly Groceries' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  // tenantId is NOT accepted from client - it is server-injected from the
  // authenticated tenant context (X-Tenant-ID header validated by middleware)

  @ApiPropertyOptional({ description: 'User ID (optional)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Device ID (optional)', example: 'device-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Cart status', example: 'draft', enum: ['draft', 'printed', 'paid', 'completed'] })
  @IsOptional()
  @IsEnum(['draft', 'printed', 'paid', 'completed'])
  status?: CartStatus;

  @ApiPropertyOptional({
    description: 'Client-side creation timestamp (ISO 8601). Used to preserve the original creation time when the client syncs a cart that was created offline or with delayed connectivity.',
    example: '2026-02-27T14:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  createdAt?: string;
}
