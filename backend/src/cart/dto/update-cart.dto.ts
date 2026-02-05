/**
 * Update Cart DTO
 */

import { PartialType } from '@nestjs/swagger';
import { CreateCartDto } from './create-cart.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @ApiPropertyOptional({ description: 'Set as active cart', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
