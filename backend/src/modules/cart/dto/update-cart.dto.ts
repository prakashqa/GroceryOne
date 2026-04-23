/**
 * Update Cart DTO
 */

import { PartialType } from '@nestjs/swagger';
import { CreateCartDto } from './create-cart.dto';
import { IsBoolean, IsOptional, IsNumber, IsDateString, Min, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @ApiPropertyOptional({ description: 'Set as active cart', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Timestamp when payment was made', example: '2026-02-05T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Amount paid', example: 150.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Item count snapshot at payment time', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  paidItemCount?: number;
}
