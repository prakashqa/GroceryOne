/**
 * Products Controller
 * REST API endpoints for item management
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
import { ProductsService } from './products.service';
import { CreateItemDto, UpdateItemDto } from './dto';
import { Item } from './entities/item.entity';

@ApiTags('Items')
@Controller('items')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully', type: Item })
  @ApiResponse({ status: 409, description: 'Item with this slug already exists' })
  async create(
    @Req() req: Request,
    @Body() createItemDto: CreateItemDto,
  ): Promise<Item> {
    return this.productsService.create(createItemDto, req.tenantId!);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of items', type: [Item] })
  async findAll(
    @Req() req: Request,
    @Query('includeInactive') includeInactive?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<Item[]> {
    const inactive = includeInactive === 'true';

    if (categoryId) {
      return this.productsService.findByCategory(categoryId, inactive, req.tenantId!);
    }
    return this.productsService.findAll(inactive, req.tenantId!);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get item count' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Item count' })
  async count(
    @Req() req: Request,
    @Query('includeInactive') includeInactive?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<{ count: number }> {
    const inactive = includeInactive === 'true';
    const count = await this.productsService.count(inactive, categoryId, req.tenantId!);
    return { count };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get an item by slug' })
  @ApiParam({ name: 'slug', description: 'Item slug' })
  @ApiResponse({ status: 200, description: 'Item found', type: Item })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findBySlug(
    @Req() req: Request,
    @Param('slug') slug: string,
  ): Promise<Item> {
    return this.productsService.findBySlug(slug, req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item found', type: Item })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Item> {
    return this.productsService.findOne(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item updated', type: Item })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 409, description: 'Item with this slug already exists' })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    return this.productsService.update(id, updateItemDto, req.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.productsService.remove(id, req.tenantId!);
  }
}
