/**
 * Checkout DTO
 * Creates an order directly from a list of items + payment (no backend cart) —
 * used by the offline/cloud POS where carts live only on the client. The backend
 * re-derives prices from the catalog and deducts stock.
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutItemDto {
  @ApiProperty({ description: 'Item (product) ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Quantity sold', example: 10 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto], description: 'Items being sold' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiPropertyOptional({ description: "Payment method (e.g. 'cash', 'upi', 'card')", example: 'cash' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Amount the customer paid', example: 620 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Idempotency key (the client cart id)', example: 'cart-1718000000000' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientRef?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
