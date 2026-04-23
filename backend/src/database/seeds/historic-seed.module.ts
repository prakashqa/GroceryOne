/**
 * Historic Seed Module
 * Module for seeding historical cart data for Reports & Analytics testing
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TenantConfig } from '../../tenant/entities/tenant-config.entity';
import { HistoricSeedService } from './historic-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'gro_one'),
        // TenantConfig must be included because Tenant has @OneToOne(() => TenantConfig).
        entities: [Cart, CartItem, Item, Category, Tenant, TenantConfig],
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Cart, CartItem, Item, Category, Tenant]),
  ],
  providers: [HistoricSeedService],
  exports: [HistoricSeedService],
})
export class HistoricSeedModule {}
