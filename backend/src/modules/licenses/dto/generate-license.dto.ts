import { IsString, IsOptional, IsIn, IsISO8601, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateLicenseDto {
  @ApiProperty({
    description: "Tenant slug to mint the key for. Must equal the admin's own tenant.",
    example: 'siri-general-stores',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantSlug: string;

  @ApiProperty({
    description: 'Plan type. v1 supports only desktop_yearly (₹2,000 / year).',
    enum: ['desktop_yearly'],
    example: 'desktop_yearly',
  })
  @IsIn(['desktop_yearly'])
  plan: 'desktop_yearly';

  @ApiPropertyOptional({
    description:
      'Payment reference. Razorpay payment id (`pay_…`) when auto-issued, or a manual tag like `manual-UPI-2026-05-15`.',
    example: 'manual-UPI-2026-05-15',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  paymentRef?: string;

  @ApiPropertyOptional({
    description: 'Explicit ISO-8601 expiry. Defaults to now + 365 days.',
    example: '2027-05-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
