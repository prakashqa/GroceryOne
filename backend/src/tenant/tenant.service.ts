/**
 * Tenant Service
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantConfig } from './entities/tenant-config.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantConfig)
    private readonly configRepository: Repository<TenantConfig>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create(createTenantDto);
    const savedTenant = await this.tenantRepository.save(tenant);

    // Create default config
    const config = this.configRepository.create({
      tenantId: savedTenant.id,
    });
    await this.configRepository.save(config);

    // Create tenant schema
    await this.createTenantSchema(savedTenant.slug);

    this.logger.log(`Created tenant: ${savedTenant.slug}`);
    return savedTenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['config'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['config'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { slug },
      relations: ['config'],
    });
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { domain },
      relations: ['config'],
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.softDelete(id);
    this.logger.log(`Soft deleted tenant: ${tenant.slug}`);
  }

  async getConfig(tenantId: string): Promise<TenantConfig> {
    const config = await this.configRepository.findOne({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Tenant config not found');
    }

    return config;
  }

  async updateConfig(
    tenantId: string,
    updates: Partial<TenantConfig>,
  ): Promise<TenantConfig> {
    const config = await this.getConfig(tenantId);
    Object.assign(config, updates);
    return this.configRepository.save(config);
  }

  /**
   * Creates a new schema for the tenant
   */
  private async createTenantSchema(slug: string): Promise<void> {
    const schemaName = `tenant_${slug.replace(/-/g, '_')}`;
    const connection = this.tenantRepository.manager.connection;

    try {
      // Create schema
      await connection.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      this.logger.log(`Created schema: ${schemaName}`);

      // TODO: Run tenant-specific migrations
      // This would create all the tenant-specific tables (users, products, orders, etc.)
    } catch (error) {
      this.logger.error(`Failed to create schema ${schemaName}:`, error);
      throw error;
    }
  }

  /**
   * Gets the schema name for a tenant
   */
  getSchemaName(slug: string): string {
    return `tenant_${slug.replace(/-/g, '_')}`;
  }
}
