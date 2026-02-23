/**
 * Users Service
 * Business logic for user settings management
 * All operations are scoped to the requesting tenant
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './dto';

function validateTenantId(tenantId?: string): asserts tenantId is string {
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
  ) {}

  /**
   * Create user settings (scoped to tenant)
   */
  async create(createUserSettingsDto: CreateUserSettingsDto, tenantId: string): Promise<UserSettings> {
    validateTenantId(tenantId);
    const settings = this.userSettingsRepository.create({
      ...createUserSettingsDto,
      tenantId,
    });
    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Created user settings: ${saved.id} for tenant: ${tenantId}`);
    return saved;
  }

  /**
   * Find settings by user ID (scoped to tenant)
   */
  async findByUserId(userId: string, tenantId: string): Promise<UserSettings | null> {
    validateTenantId(tenantId);
    return this.userSettingsRepository.findOne({
      where: { userId, tenantId },
    });
  }

  /**
   * Find settings by device ID (scoped to tenant)
   */
  async findByDeviceId(deviceId: string, tenantId: string): Promise<UserSettings | null> {
    validateTenantId(tenantId);
    return this.userSettingsRepository.findOne({
      where: { deviceId, tenantId },
    });
  }

  /**
   * Find or create settings for user/device (scoped to tenant)
   */
  async findOrCreate(tenantId: string, userId?: string, deviceId?: string): Promise<UserSettings> {
    validateTenantId(tenantId);

    // Try to find existing settings
    if (userId) {
      const existing = await this.findByUserId(userId, tenantId);
      if (existing) return existing;
    }

    if (deviceId) {
      const existing = await this.findByDeviceId(deviceId, tenantId);
      if (existing) return existing;
    }

    // Create new settings
    const settings = this.userSettingsRepository.create({
      userId,
      deviceId,
      tenantId,
    });
    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Created new user settings: ${saved.id} for tenant: ${tenantId}`);
    return saved;
  }

  /**
   * Find settings by ID (scoped to tenant)
   */
  async findOne(id: string, tenantId: string): Promise<UserSettings> {
    validateTenantId(tenantId);
    const settings = await this.userSettingsRepository.findOne({
      where: { id, tenantId },
    });

    if (!settings) {
      throw new NotFoundException(`User settings with ID '${id}' not found`);
    }

    return settings;
  }

  /**
   * Update user settings (scoped to tenant)
   */
  async update(id: string, updateUserSettingsDto: UpdateUserSettingsDto, tenantId: string): Promise<UserSettings> {
    validateTenantId(tenantId);
    const settings = await this.findOne(id, tenantId);
    Object.assign(settings, updateUserSettingsDto);
    const updated = await this.userSettingsRepository.save(settings);
    this.logger.log(`Updated user settings: ${updated.id}`);
    return updated;
  }

  /**
   * Update settings by user ID (upsert, scoped to tenant)
   */
  async updateByUserId(userId: string, updateUserSettingsDto: UpdateUserSettingsDto, tenantId: string): Promise<UserSettings> {
    validateTenantId(tenantId);
    let settings = await this.findByUserId(userId, tenantId);

    if (!settings) {
      settings = this.userSettingsRepository.create({
        userId,
        tenantId,
        ...updateUserSettingsDto,
      });
    } else {
      Object.assign(settings, updateUserSettingsDto);
    }

    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Updated user settings for user ${userId}: ${saved.id}`);
    return saved;
  }

  /**
   * Update settings by device ID (upsert, scoped to tenant)
   */
  async updateByDeviceId(deviceId: string, updateUserSettingsDto: UpdateUserSettingsDto, tenantId: string): Promise<UserSettings> {
    validateTenantId(tenantId);
    let settings = await this.findByDeviceId(deviceId, tenantId);

    if (!settings) {
      settings = this.userSettingsRepository.create({
        deviceId,
        tenantId,
        ...updateUserSettingsDto,
      });
    } else {
      Object.assign(settings, updateUserSettingsDto);
    }

    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Updated user settings for device ${deviceId}: ${saved.id}`);
    return saved;
  }

  /**
   * Delete user settings (scoped to tenant)
   */
  async remove(id: string, tenantId: string): Promise<void> {
    validateTenantId(tenantId);
    const settings = await this.findOne(id, tenantId);
    await this.userSettingsRepository.delete(id);
    this.logger.log(`Deleted user settings: ${settings.id}`);
  }
}
