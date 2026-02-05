/**
 * Core Module
 * Provides shared functionality across the application
 */

import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HealthController } from './controllers/health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [],
})
export class CoreModule {}
