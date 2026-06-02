/**
 * Redis Module
 * Provides a global Redis client connection using ioredis.
 * Redis config is read from configuration.ts (redis.host, redis.port, redis.password).
 */

import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TokenBlacklistService } from './token-blacklist.service';
import { InMemoryRedis } from './in-memory-redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        // Offline/desktop mode: no Redis server. Use an in-memory stub so we
        // never open a socket (avoids the 3s connect timeout + error spam).
        if (configService.get<boolean>('redis.disabled') === true) {
          new Logger('RedisModule').log('Redis disabled — using in-memory store');
          return new InMemoryRedis();
        }
        const redisPassword = configService.get<string>('redis.password');
        const redisTls = configService.get<boolean>('redis.tls');
        return new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: redisPassword || undefined,
          tls: redisTls ? {} : undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          enableOfflineQueue: false,
        });
      },
      inject: [ConfigService],
    },
    TokenBlacklistService,
  ],
  exports: ['REDIS_CLIENT', TokenBlacklistService],
})
export class RedisModule {}
