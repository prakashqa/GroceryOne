/**
 * Resolve Tenant DTO
 * Validates input for the tenant resolution endpoint
 */

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveTenantDto {
  @ApiProperty({
    description: 'User email or phone number',
    example: 'admin@freshmart.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
