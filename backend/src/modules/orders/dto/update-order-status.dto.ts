/**
 * Update Order Status DTO
 */

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: ORDER_STATUSES,
    example: 'confirmed',
  })
  @IsNotEmpty()
  @IsEnum(ORDER_STATUSES)
  status: OrderStatus;
}
