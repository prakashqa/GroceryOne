/**
 * Tenant Controller
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

// TODO: Add admin guard for tenant management
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('super_admin')

@ApiTags('Tenants')
@Controller('admin/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }

  @Get(':id/config')
  @ApiOperation({ summary: 'Get tenant configuration' })
  getConfig(@Param('id') id: string) {
    return this.tenantService.getConfig(id);
  }
}
