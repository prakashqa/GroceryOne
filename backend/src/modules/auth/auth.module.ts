/**
 * Auth Module
 * Handles authentication with tenant context
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './services/password.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SubscriptionModule } from '../subscription/subscription.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    SubscriptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, LocalStrategy, JwtStrategy, RolesGuard],
  exports: [AuthService, PasswordService, PassportModule, JwtModule],
})
export class AuthModule {}
