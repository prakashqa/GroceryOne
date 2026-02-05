/**
 * Users Service
 * Business logic for user settings management
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
  ) {}

  /**
   * Create user settings
   */
  async create(createUserSettingsDto: CreateUserSettingsDto): Promise<UserSettings> {
    const settings = this.userSettingsRepository.create(createUserSettingsDto);
    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Created user settings: ${saved.id}`);
    return saved;
  }

  /**
   * Find settings by user ID
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.userSettingsRepository.findOne({
      where: { userId },
    });
  }

  /**
   * Find settings by device ID
   */
  async findByDeviceId(deviceId: string): Promise<UserSettings | null> {
    return this.userSettingsRepository.findOne({
      where: { deviceId },
    });
  }

  /**
   * Find or create settings for user/device
   */
  async findOrCreate(userId?: string, deviceId?: string): Promise<UserSettings> {
    // Try to find existing settings
    if (userId) {
      const existing = await this.findByUserId(userId);
      if (existing) return existing;
    }

    if (deviceId) {
      const existing = await this.findByDeviceId(deviceId);
      if (existing) return existing;
    }

    // Create new settings
    const settings = this.userSettingsRepository.create({
      userId,
      deviceId,
    });
    const saved = await this.userSettingsRepository.save(settings);
    this.logger.log(`Created new user settings: ${saved.id}`);
    return saved;
  }

  /**
   * Find settings by ID
   */
  async findOne(id: string): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.findOne({
      where: { id },
    });

    if (!settings) {
      throw new NotFoundException(`User settings with ID '${id}' not found`);
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async update(id: string, updateUserSettingsDto: UpdateUserSettingsDto): Promise<UserSettings> {
    const settings = await this.findOne(id);
    Object.assign(settings, updateUserSettingsDto);
    const updated = await this.userSettingsRepository.save(settings);
    this.logger.log(`Updated user settings: ${updated.id}`);
    return updated;
  }

  /**
   * Update settings by user ID (upsert)
   */
  async updateByUserId(userId: string, updateUserSettingsDto: UpdateUserSettingsDto): Promise<UserSettings> {
    let settings = await this.findByUserId(userId);

    if (!settings) {
      settings = this.userSettingsRepository.create({
        userId,
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
   * Update settings by device ID (upsert)
   */
  async updateByDeviceId(deviceId: string, updateUserSettingsDto: UpdateUserSettingsDto): Promise<UserSettings> {
    let settings = await this.findByDeviceId(deviceId);

    if (!settings) {
      settings = this.userSettingsRepository.create({
        deviceId,
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
   * Delete user settings
   */
  async remove(id: string): Promise<void> {
    const settings = await this.findOne(id);
    await this.userSettingsRepository.delete(id);
    this.logger.log(`Deleted user settings: ${settings.id}`);
  }
}
