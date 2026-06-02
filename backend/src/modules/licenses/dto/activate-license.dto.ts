import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLicenseDto {
  @ApiProperty({
    description: 'License key as printed for the customer',
    example: 'GROD-A1B2-C3D4-E5F6-G7H8',
  })
  @IsString()
  @Matches(/^GROD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/, {
    message: 'License key must look like GROD-XXXX-XXXX-XXXX-XXXX',
  })
  key: string;

  @ApiProperty({
    description:
      'Stable per-machine identifier produced by node-machine-id. Raw value; server hashes it before storage.',
    example: '5c5e1c84-…-fb02',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  machineId: string;

  @ApiProperty({
    description:
      'Tenant slug the customer claims this key belongs to. Cross-checked against the key row; mismatch → 403.',
    example: 'siri-general-stores',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  tenantSlug: string;
}
