/**
 * Cancel Order DTO
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
