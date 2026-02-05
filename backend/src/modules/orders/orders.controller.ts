/**
 * Orders Controller
 * REST API endpoints for order management
 */

import {
  Controller,
  Get,
  Post,
  Put,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Cart not in valid state for order creation' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async create(
    @Req() req: Request,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.createFromCart(
      createOrderDto.cartId,
      req.tenantId!,
      createOrderDto.notes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'List of orders', type: [Order] })
  async findAll(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ): Promise<Order[]> {
    return this.ordersService.findAll(req.tenantId!, userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get order count' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'Order count' })
  async count(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ): Promise<{ count: number }> {
    const count = await this.ordersService.count(req.tenantId!, userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Order> {
    return this.ordersService.findOne(id, req.tenantId!);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order status updated', type: Order })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status, req.tenantId!);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order cancelled', type: Order })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ): Promise<Order> {
    return this.ordersService.cancel(id, cancelOrderDto.reason, req.tenantId!);
  }
}
