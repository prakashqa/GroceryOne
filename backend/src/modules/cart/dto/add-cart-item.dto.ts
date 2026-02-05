/**
 * Add Cart Item DTO
 */

import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ description: 'Item ID to add', example: 'uuid-here' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Quantity to add', example: 1 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Price snapshot at time of adding to cart', example: 40.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceSnapshot?: number;
}
