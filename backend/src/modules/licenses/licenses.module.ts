import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([LicenseKey, Tenant]), SubscriptionModule],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
