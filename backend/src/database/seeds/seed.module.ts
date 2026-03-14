/**
 * Seed Module
 * Module for database seeding functionality
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Category } from '../../modules/categories/entities/category.entity';
import { Item } from '../../modules/products/entities/item.entity';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TenantConfig } from '../../tenant/entities/tenant-config.entity';
import { User } from '../../modules/users/entities/user.entity';
import { SeedService } from './seed.service';
import { HistoricSeedService } from './historic-seed.service';
import { TenantUserSeedService } from './tenant-user-seed.service';
import { SeedController } from './seed.controller';
import { PasswordService } from '../../modules/auth/services/password.service';
import { SubscriptionModule } from '../../modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Category,
      Item,
      Cart,
      CartItem,
      Tenant,
      TenantConfig,
      User,
    ]),
    SubscriptionModule,
  ],
  controllers: [SeedController],
  providers: [
    SeedService,
    HistoricSeedService,
    TenantUserSeedService,
    PasswordService,
  ],
  exports: [SeedService, HistoricSeedService, TenantUserSeedService],
})
export class SeedModule {}
