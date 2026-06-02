import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateLicenseDto {
  @ApiProperty({ description: 'License key to clear machine binding for', example: 'GROD-A1B2-C3D4-E5F6-G7H8' })
  @IsString()
  @Matches(/^GROD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  key: string;
}
