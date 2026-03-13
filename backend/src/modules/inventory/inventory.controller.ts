/**
 * Inventory Controller
 * REST API endpoints for inventory management
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
import { InventoryService } from './inventory.service';
import { AdjustStockDto, SetStockDto, BulkAdjustStockDto, UpdateInventorySettingsDto } from './dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock (add or remove)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid input' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async adjust(@Req() req: Request, @Body() dto: AdjustStockDto) {
    const tenantId = req.tenantId!;
    const userId = (req as any).user?.userId;

    if (['restock', 'return', 'initial'].includes(dto.type)) {
      return this.inventoryService.addStock(
        dto.itemId, dto.quantity, dto.type, tenantId, dto.reason, userId,
      );
    } else {
      return this.inventoryService.removeStock(
        dto.itemId, dto.quantity, dto.type, tenantId, dto.reason, userId,
      );
    }
  }

  @Post('set')
  @ApiOperation({ summary: 'Set absolute stock level' })
  @ApiResponse({ status: 201, description: 'Stock set successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async setStock(@Req() req: Request, @Body() dto: SetStockDto) {
    const userId = (req as any).user?.userId;
    return this.inventoryService.setStock(
      dto.itemId, dto.quantity, req.tenantId!, dto.reason, userId,
    );
  }

  @Post('bulk-adjust')
  @ApiOperation({ summary: 'Bulk stock adjustments' })
  @ApiResponse({ status: 201, description: 'Bulk adjustments applied' })
  async bulkAdjust(@Req() req: Request, @Body() dto: BulkAdjustStockDto) {
    const userId = (req as any).user?.userId;
    return this.inventoryService.bulkAddStock(dto.adjustments, req.tenantId!, userId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get all low-stock items' })
  @ApiResponse({ status: 200, description: 'List of low-stock items' })
  async getLowStock(@Req() req: Request) {
    return this.inventoryService.getLowStockItems(req.tenantId!);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get stock report' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'Stock report' })
  async getReport(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.inventoryService.getStockReport(req.tenantId!, categoryId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions by date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by transaction type' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getTransactions(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.getTransactionsByDateRange(
      req.tenantId!,
      new Date(startDate),
      new Date(endDate),
      type as any,
    );
  }

  @Get('items/:itemId')
  @ApiOperation({ summary: 'Get stock level for an item' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Stock level info' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getStockLevel(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.inventoryService.getStockLevel(itemId, req.tenantId!);
  }

  @Get('items/:itemId/transactions')
  @ApiOperation({ summary: 'Get transaction history for an item' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size (default 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset (default 0)' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  async getItemTransactions(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getTransactionHistory(
      itemId, req.tenantId!,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Put('items/:itemId/settings')
  @ApiOperation({ summary: 'Update inventory settings for an item' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateSettings(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateInventorySettingsDto,
  ) {
    return this.inventoryService.updateItemInventorySettings(itemId, dto, req.tenantId!);
  }
}
