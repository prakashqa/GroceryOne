/**
 * Standalone historic seed runner
 * Run with: npm run seed:historic
 *
 * This creates historical cart data for testing Reports & Analytics
 * Make sure to run the main seed first: npm run seed
 */

import { NestFactory } from '@nestjs/core';
import { HistoricSeedModule } from './historic-seed.module';
import { HistoricSeedService } from './historic-seed.service';

async function bootstrap() {
  console.log('Starting historic seed process...');
  console.log('This will create sample cart data for the past 45 days.\n');

  const app = await NestFactory.createApplicationContext(HistoricSeedModule);
  const seedService = app.get(HistoricSeedService);

  try {
    // Check current data
    const beforeCounts = await seedService.getDataCounts();
    console.log('=== Before Seed ===');
    console.log(`Carts: ${beforeCounts.carts}`);
    console.log(`Cart Items: ${beforeCounts.cartItems}`);
    console.log(`Paid Carts: ${beforeCounts.paidCarts}`);
    console.log(`Total Sales: ₹${beforeCounts.totalSales.toFixed(2)}`);

    // Run seed
    console.log('\n=== Running Historic Seed ===');
    const report = await seedService.seedHistoricData();

    // Show results
    console.log('\n=== Seed Report ===');
    console.log(`Carts Created: ${report.cartsCreated}`);
    console.log(`Cart Items Created: ${report.cartItemsCreated}`);
    console.log(`Total Sales Generated: ₹${report.totalSales.toFixed(2)}`);

    console.log('\n=== Data Summary ===');
    console.log(`Status Breakdown:`);
    Object.entries(report.summary.statusBreakdown).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });
    console.log(`Date Range: ${report.summary.dateRange.start.toLocaleDateString()} to ${report.summary.dateRange.end.toLocaleDateString()}`);

    if (report.errors.length > 0) {
      console.log('\n=== Errors ===');
      report.errors.forEach((err) => console.log(`  - ${err}`));
    }

    // Show after counts
    const afterCounts = await seedService.getDataCounts();
    console.log('\n=== After Seed ===');
    console.log(`Carts: ${afterCounts.carts}`);
    console.log(`Cart Items: ${afterCounts.cartItems}`);
    console.log(`Paid Carts: ${afterCounts.paidCarts}`);
    console.log(`Total Sales: ₹${afterCounts.totalSales.toFixed(2)}`);

    console.log('\n✅ Historic seed completed successfully!');
    console.log('You can now test Reports & Analytics in the mobile app.');

  } catch (error) {
    console.error('\n❌ Historic seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
