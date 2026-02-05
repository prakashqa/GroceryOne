/**
 * Redis Module
 * Provides a global Redis client connection using ioredis.
 * Redis config is read from configuration.ts (redis.host, redis.port, redis.password).
 */

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TokenBlacklistService } from './token-blacklist.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
    TokenBlacklistService,
  ],
  exports: ['REDIS_CLIENT', TokenBlacklistService],
})
export class RedisModule {}
