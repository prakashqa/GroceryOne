/**
 * Users Controller
 * REST API endpoints for user settings management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './dto';
import { UserSettings } from './entities/user-settings.entity';

@ApiTags('User Settings')
@Controller('users/settings')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user settings' })
  @ApiResponse({ status: 201, description: 'Settings created successfully', type: UserSettings })
  async create(@Body() createUserSettingsDto: CreateUserSettingsDto): Promise<UserSettings> {
    return this.usersService.create(createUserSettingsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get settings for user or device' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiQuery({ name: 'deviceId', required: false, description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'User settings', type: UserSettings })
  async findOrCreate(
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
  ): Promise<UserSettings> {
    return this.usersService.findOrCreate(userId, deviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settings by ID' })
  @ApiParam({ name: 'id', description: 'Settings UUID' })
  @ApiResponse({ status: 200, description: 'Settings found', type: UserSettings })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserSettings> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update settings by ID' })
  @ApiParam({ name: 'id', description: 'Settings UUID' })
  @ApiResponse({ status: 200, description: 'Settings updated', type: UserSettings })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.usersService.update(id, updateUserSettingsDto);
  }

  @Put('user/:userId')
  @ApiOperation({ summary: 'Update settings by user ID (upsert)' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Settings updated', type: UserSettings })
  async updateByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateUserSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.usersService.updateByUserId(userId, updateUserSettingsDto);
  }

  @Put('device/:deviceId')
  @ApiOperation({ summary: 'Update settings by device ID (upsert)' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Settings updated', type: UserSettings })
  async updateByDeviceId(
    @Param('deviceId') deviceId: string,
    @Body() updateUserSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.usersService.updateByDeviceId(deviceId, updateUserSettingsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user settings' })
  @ApiParam({ name: 'id', description: 'Settings UUID' })
  @ApiResponse({ status: 204, description: 'Settings deleted' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
