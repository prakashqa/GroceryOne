/**
 * Full database reset: clears historic carts, then catalog, then tenants/users.
 * Order matters — delete leaves before roots because of FK constraints.
 *
 * Run with: npm run seed:reset
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { HistoricSeedService } from './historic-seed.service';
import { SeedService } from './seed.service';
import { TenantUserSeedService } from './tenant-user-seed.service';

async function bootstrap() {
  console.log('=== Full DB reset ===');
  console.log('WARNING: this deletes every cart, category, item, user, and tenant.\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const historicSeedService = app.get(HistoricSeedService);
  const seedService = app.get(SeedService);
  const tenantUserSeedService = app.get(TenantUserSeedService);

  try {
    console.log('[1/3] Clearing historic carts and cart_items...');
    const historic = await historicSeedService.clearHistoricData();
    console.log(`      carts deleted: ${historic.cartsDeleted}`);
    console.log(`      cart_items deleted: ${historic.cartItemsDeleted}\n`);

    console.log('[2/3] Clearing categories and items (all tenants)...');
    const catalog = await seedService.clearSeedData();
    console.log(`      categories deleted: ${catalog.categoriesDeleted}`);
    console.log(`      items deleted: ${catalog.itemsDeleted}\n`);

    console.log('[3/3] Clearing tenants, tenant_config, and users...');
    const tenantUser = await tenantUserSeedService.clearTenantUserData();
    console.log(`      users deleted: ${tenantUser.usersDeleted}`);
    console.log(`      tenants deleted: ${tenantUser.tenantsDeleted}\n`);

    console.log('Reset complete. Run `npm run seed:all` to re-seed.');
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
