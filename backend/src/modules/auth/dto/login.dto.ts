/**
 * Login DTO
 * Data transfer object for login requests
 */

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'admin@freshmart.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'Password',
    example: 'Admin@FM123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
