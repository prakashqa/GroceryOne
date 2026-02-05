/**
 * Standalone seed runner
 * Run with: npm run seed
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  console.log('Starting seed process...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    const report = await seedService.seed();

    console.log('\n=== Seed Report ===');
    console.log(`Categories: ${report.categoriesBefore} -> ${report.categoriesAfter} (+${report.categoriesCreated})`);
    console.log(`Items: ${report.itemsBefore} -> ${report.itemsAfter} (+${report.itemsCreated})`);

    if (report.errors.length > 0) {
      console.log('\nErrors:');
      report.errors.forEach((err) => console.log(`  - ${err}`));
    }

    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
