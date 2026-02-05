/**
 * Cart Controller
 * REST API endpoints for cart management
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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CreateCartDto, UpdateCartDto, AddCartItemDto, UpdateCartItemDto } from './dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@ApiTags('Carts')
@ApiBearerAuth()
@Controller('carts')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiResponse({ status: 201, description: 'Cart created successfully', type: Cart })
  async create(
    @Req() req: Request,
    @Body() createCartDto: CreateCartDto,
  ): Promise<Cart> {
    return this.cartService.create(createCartDto, req.tenantId!);
  }

  @Get()
  @ApiOperation({ summary: 'Get all carts' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiResponse({ status: 200, description: 'List of carts', type: [Cart] })
  async findAll(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
  ): Promise<Cart[]> {
    return this.cartService.findAll(userId, deviceId, req.tenantId!);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active cart' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiResponse({ status: 200, description: 'Active cart', type: Cart })
  async findActiveCart(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
  ): Promise<Cart | null> {
    return this.cartService.findActiveCart(userId, deviceId, req.tenantId!);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart count' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiResponse({ status: 200, description: 'Cart count' })
  async count(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
  ): Promise<{ count: number }> {
    const count = await this.cartService.count(userId, deviceId, req.tenantId!);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cart by ID' })
  @ApiParam({ name: 'id', description: 'Cart UUID' })
  @ApiResponse({ status: 200, description: 'Cart found', type: Cart })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Cart> {
    return this.cartService.findOne(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cart' })
  @ApiParam({ name: 'id', description: 'Cart UUID' })
  @ApiResponse({ status: 200, description: 'Cart updated', type: Cart })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    return this.cartService.update(id, updateCartDto, req.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cart' })
  @ApiParam({ name: 'id', description: 'Cart UUID' })
  @ApiResponse({ status: 204, description: 'Cart deleted' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.cartService.remove(id, req.tenantId!);
  }

  // Cart Items endpoints

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiParam({ name: 'id', description: 'Cart UUID' })
  @ApiResponse({ status: 201, description: 'Item added to cart', type: CartItem })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async addItem(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addCartItemDto: AddCartItemDto,
  ): Promise<CartItem> {
    return this.cartService.addItem(id, addCartItemDto, req.tenantId!);
  }

  @Put(':cartId/items/:itemId')
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiParam({ name: 'cartId', description: 'Cart UUID' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item updated', type: CartItem })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async updateItem(
    @Req() req: Request,
    @Param('cartId', ParseUUIDPipe) cartId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    return this.cartService.updateItem(cartId, itemId, updateCartItemDto, req.tenantId!);
  }

  @Delete(':cartId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'cartId', description: 'Cart UUID' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiResponse({ status: 204, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async removeItem(
    @Req() req: Request,
    @Param('cartId', ParseUUIDPipe) cartId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    return this.cartService.removeItem(cartId, itemId, req.tenantId!);
  }

  @Delete(':id/items')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiParam({ name: 'id', description: 'Cart UUID' })
  @ApiResponse({ status: 204, description: 'Cart cleared' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async clearCart(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.cartService.clearCart(id, req.tenantId!);
  }
}
