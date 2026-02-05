/**
 * TokenBlacklistService Tests
 * TDD: Write tests first, then implement
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    quit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  describe('blacklist', () => {
    it('should store token hash in Redis with TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.blacklist('some-jwt-token', 3600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringMatching(/^blacklist:/),
        '1',
        'EX',
        3600,
      );
    });

    it('should use a minimum TTL of 1 second', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.blacklist('some-jwt-token', 0);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringMatching(/^blacklist:/),
        '1',
        'EX',
        1,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw — blacklist failure should not break the app
      await expect(service.blacklist('token', 3600)).resolves.not.toThrow();
    });
  });

  describe('isBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      mockRedisClient.get.mockResolvedValue('1');

      const result = await service.isBlacklisted('blacklisted-token');

      expect(result).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.isBlacklisted('valid-token');

      expect(result).toBe(false);
    });

    it('should return false on Redis error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw — fallback to "not blacklisted" so users aren't locked out
      const result = await service.isBlacklisted('some-token');

      expect(result).toBe(false);
    });
  });
});
