/**
 * Token Blacklist Service
 * Uses Redis to blacklist JWT tokens on logout.
 * Tokens are stored as hashed keys with TTL matching token expiry.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  /**
   * Blacklist a JWT token so it can no longer be used.
   * @param token - The raw JWT token string
   * @param ttlSeconds - Time-to-live in seconds (should match token expiry)
   */
  async blacklist(token: string, ttlSeconds: number): Promise<void> {
    try {
      const key = this.getKey(token);
      const ttl = Math.max(ttlSeconds, 1);
      await this.redis.set(key, '1', 'EX', ttl);
      this.logger.log('Token blacklisted successfully');
    } catch (err) {
      this.logger.error('Failed to blacklist token:', err);
      // Don't throw — blacklist failure should not break logout
    }
  }

  /**
   * Check if a JWT token has been blacklisted.
   * @param token - The raw JWT token string
   * @returns true if the token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getKey(token);
      const result = await this.redis.get(key);
      return result !== null;
    } catch (err) {
      this.logger.error('Failed to check token blacklist:', err);
      // Don't throw — fallback to "not blacklisted" so users aren't locked out
      return false;
    }
  }

  /**
   * Generate a Redis key from a token by hashing it.
   * We hash to avoid storing raw JWTs in Redis.
   */
  private getKey(token: string): string {
    const hash = createHash('sha256').update(token).digest('hex');
    return `blacklist:${hash}`;
  }
}
