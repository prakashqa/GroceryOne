/**
 * Categories Controller
 * REST API endpoints for category management
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
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: Category })
  @ApiResponse({ status: 409, description: 'Category with this slug already exists' })
  async create(
    @Req() req: Request,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(createCategoryDto, req.tenantId!);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'includeItems', required: false, type: Boolean })
  @ApiQuery({ name: 'trackInventory', required: false, type: Boolean, description: 'Filter by inventory tracking: true=inventory categories, false=ordering categories' })
  @ApiResponse({ status: 200, description: 'List of categories', type: [Category] })
  async findAll(
    @Req() req: Request,
    @Query('includeInactive') includeInactive?: string,
    @Query('includeItems') includeItems?: string,
    @Query('trackInventory') trackInventory?: string,
  ): Promise<Category[]> {
    const inactive = includeInactive === 'true';
    const withItems = includeItems === 'true';
    const trackInv = trackInventory === undefined ? undefined : trackInventory === 'true';

    if (withItems) {
      return this.categoriesService.findAllWithItems(inactive, req.tenantId!, trackInv);
    }
    return this.categoriesService.findAll(inactive, req.tenantId!, trackInv);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get category count' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Category count' })
  async count(
    @Req() req: Request,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<{ count: number }> {
    const inactive = includeInactive === 'true';
    const count = await this.categoriesService.count(inactive, req.tenantId!);
    return { count };
  }

  @Get('deleted')
  @ApiOperation({ summary: 'List soft-deleted categories (for recovery)' })
  @ApiResponse({ status: 200, description: 'List of deleted categories', type: [Category] })
  async findDeleted(@Req() req: Request): Promise<Category[]> {
    return this.categoriesService.findDeleted(req.tenantId!);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiResponse({ status: 200, description: 'Category found', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(
    @Req() req: Request,
    @Param('slug') slug: string,
  ): Promise<Category> {
    return this.categoriesService.findBySlug(slug, req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Category> {
    return this.categoriesService.findOne(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category with this slug already exists' })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto, req.tenantId!);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 201, description: 'Category restored', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'An active category with this slug already exists' })
  async restore(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Category> {
    return this.categoriesService.restore(id, req.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.categoriesService.remove(id, req.tenantId!);
  }
}
