/**
 * Main Application Module
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreModule } from './core/core.module';
import { RedisModule } from './core/redis';
import { FirebaseAdminModule } from './core/firebase/firebase-admin.module';
import { TenantModule } from './tenant/tenant.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { LicensesModule } from './modules/licenses/licenses.module';

import { TenantMiddleware } from './core/middleware/tenant.middleware';
import { SubscriptionMiddleware } from './core/middleware/subscription.middleware';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import configuration from './core/config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database - Public schema connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        schema: 'public',
        autoLoadEntities: true,
        synchronize: ['development', 'test'].includes(configService.get<string>('NODE_ENV') || ''),
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // Core module (guards, filters, interceptors)
    CoreModule,

    // Redis module (global — provides REDIS_CLIENT and TokenBlacklistService)
    RedisModule,

    // Firebase Admin module (global — provides FirebaseAdminService for FCM)
    FirebaseAdminModule,

    // Tenant module
    TenantModule,

    // Database module (seeds, migrations)
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    CartModule,
    OrdersModule,
    SubscriptionModule,
    LicensesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, TenantMiddleware)
      .exclude(
        'docs',
        'docs/(.*)',
        'health',
        'admin',
        'admin/(.*)',
        'seed',
        'seed/(.*)',
        'auth/resolve-tenant',
        'auth/signup',
        // Desktop license endpoints — public, keyed by license value itself,
        // never carry an X-Tenant-ID header.
        'licenses/activate',
        'licenses/validate',
      )
      .forRoutes('*');

    consumer
      .apply(SubscriptionMiddleware)
      .exclude(
        'docs',
        'docs/(.*)',
        'health',
        'admin',
        'admin/(.*)',
        'seed',
        'seed/(.*)',
        'auth/(.*)',
        'subscriptions/(.*)',
        'subscriptions',
        // Don't gate license activation / heartbeat on having an active
        // subscription (chicken-and-egg: activation is HOW you get one).
        'licenses/(.*)',
        'licenses',
      )
      .forRoutes('*');
  }
}
