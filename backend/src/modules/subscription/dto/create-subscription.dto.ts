import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan type',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsNotEmpty()
  @IsIn(['monthly', 'yearly'])
  plan: 'monthly' | 'yearly';

  @ApiProperty({
    description: 'External payment reference ID',
    required: false,
    example: 'pay_123abc',
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}
