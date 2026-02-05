/**
 * Tenant User Seed Runner
 * Standalone script to seed tenants and users for multi-tenant testing
 *
 * Usage: npm run seed:tenants
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TenantUserSeedService } from './tenant-user-seed.service';

async function bootstrap() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Tenant & User Seed Process                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const seedService = app.get(TenantUserSeedService);

  try {
    const report = await seedService.seed();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SEED REPORT                             ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(
      `║  Tenants: ${report.tenantsBefore} → ${report.tenantsAfter} (+${report.tenantsCreated})`.padEnd(
        61,
      ) + '║',
    );
    console.log(
      `║  Users:   ${report.usersBefore} → ${report.usersAfter} (+${report.usersCreated})`.padEnd(
        61,
      ) + '║',
    );
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (report.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errors:');
      report.errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                      LOGIN CREDENTIALS                             ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  🏪 FreshMart (X-Tenant-ID: freshmart)                             ║');
    console.log('║  ├─ Admin:    admin@freshmart.com / Admin@FM123 / PIN: 1234        ║');
    console.log('║  └─ Customer: customer@freshmart.com / Customer@FM123 / PIN: 5678  ║');
    console.log('║                                                                    ║');
    console.log('║  🛒 QuickBasket (X-Tenant-ID: quickbasket)                         ║');
    console.log('║  ├─ Admin:    admin@quickbasket.com / Admin@QB123 / PIN: 4321      ║');
    console.log('║  └─ Customer: customer@quickbasket.com / Customer@QB123 / PIN: 8765║');
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('Example password login:');
    console.log('  curl -X POST http://localhost:3000/auth/login \\');
    console.log('    -H "X-Tenant-ID: freshmart" \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log(
      '    -d \'{"identifier":"admin@freshmart.com","password":"Admin@FM123"}\'',
    );
    console.log('');
    console.log('Example PIN login:');
    console.log('  curl -X POST http://localhost:3000/auth/login/pin \\');
    console.log('    -H "X-Tenant-ID: freshmart" \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log(
      '    -d \'{"identifier":"admin@freshmart.com","pin":"1234"}\'',
    );
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
