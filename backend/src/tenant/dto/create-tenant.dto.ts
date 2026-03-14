/**
 * Create Tenant DTO
 */

import {
  IsString,
  IsOptional,
  IsEmail,
  Length,
  Matches,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Grocery Mart' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({ example: 'grocery-mart' })
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'grocerymart.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#4CAF50' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#2196F3' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color' })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'Roboto' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'admin@grocerymart.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'MG Road, Hyderabad' })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: ['en', 'te'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
