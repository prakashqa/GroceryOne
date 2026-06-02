import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateLicenseDto {
  @ApiProperty({
    description: 'License key being heartbeated',
    example: 'GROD-A1B2-C3D4-E5F6-G7H8',
  })
  @IsString()
  @Matches(/^GROD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  key: string;

  @ApiProperty({ description: 'Machine identifier (same value as activation)' })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  machineId: string;
}
