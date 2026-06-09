/**
 * Products Module
 * Handles item/product management
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), CategoriesModule, InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
