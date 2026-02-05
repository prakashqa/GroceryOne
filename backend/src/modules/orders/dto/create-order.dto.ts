/**
 * Create Order DTO
 * Creates an order from a cart
 */

import { IsUUID, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Cart ID to convert to order', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  cartId: string;

  @ApiPropertyOptional({ description: 'Order notes', example: 'Please deliver to back door' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
