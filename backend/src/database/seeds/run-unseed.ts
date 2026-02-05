/**
 * Standalone unseed runner
 * Run with: npm run unseed
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  console.log('Starting unseed process...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    const result = await seedService.clearSeedData();

    console.log('\n=== Unseed Report ===');
    console.log(`Categories deleted: ${result.categoriesDeleted}`);
    console.log(`Items deleted: ${result.itemsDeleted}`);

    console.log('\nUnseed completed successfully!');
  } catch (error) {
    console.error('Unseed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
