/**
 * Refresh Token DTO
 * Data transfer object for token refresh requests
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token from login response',
    example: 'eyJhbGciOiJIUzI1...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
