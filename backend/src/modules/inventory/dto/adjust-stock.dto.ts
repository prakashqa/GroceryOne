/**
 * Adjust Stock DTO
 */

import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '../entities/inventory-transaction.entity';

export class AdjustStockDto {
  @ApiProperty({ description: 'Item ID to adjust stock for' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Quantity to adjust (always positive)', example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({
    description: 'Type of adjustment',
    enum: ['restock', 'damage', 'correction', 'return', 'initial'],
  })
  @IsEnum(['restock', 'damage', 'correction', 'return', 'initial'])
  type: InventoryTransactionType;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
