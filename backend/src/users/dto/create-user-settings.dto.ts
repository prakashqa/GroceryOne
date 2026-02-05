/**
 * Create/Update User Settings DTO
 */

import { IsString, IsOptional, IsUUID, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ThemeMode, NotificationSettings, PrinterSettings } from '../entities/user-settings.entity';

export class CreateUserSettingsDto {
  @ApiPropertyOptional({ description: 'User ID (optional)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Device ID (optional)', example: 'device-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Theme mode', example: 'system', enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  themeMode?: ThemeMode;

  @ApiPropertyOptional({ description: 'Language code', example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notifications?: NotificationSettings;

  @ApiPropertyOptional({ description: 'Printer settings' })
  @IsOptional()
  @IsObject()
  printer?: PrinterSettings;
}
