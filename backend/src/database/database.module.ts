/**
 * Database Module
 * Groups database-related functionality
 */

import { Module } from '@nestjs/common';
import { SeedModule } from './seeds/seed.module';

@Module({
  imports: [SeedModule],
  exports: [SeedModule],
})
export class DatabaseModule {}
