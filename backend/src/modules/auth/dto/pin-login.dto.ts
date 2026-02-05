/**
 * PIN Login DTO
 * Data transfer object for PIN-based login requests
 */

import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PinLoginDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'admin@freshmart.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: '4-digit PIN',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}
