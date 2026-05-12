/**
 * CreateEmployeeDto
 *
 * Body for POST /auth/employees. Note that `tenantId`, `role`, and `status`
 * are intentionally NOT accepted in the body — they are forced by the
 * controller/service from the caller's JWT (tenant) and to safe defaults
 * (role='cashier', status='active') to prevent privilege-escalation via
 * malicious payloads.
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Priya', description: 'Employee first name' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma', description: 'Employee last name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiProperty({ example: '+919876543211', description: 'Employee phone number (login identifier)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be 10-15 digits, optionally starting with +',
  })
  phone: string;

  @ApiProperty({ example: '1234', description: '4-digit numeric PIN for login' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}
