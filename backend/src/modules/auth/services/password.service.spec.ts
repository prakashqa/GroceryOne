/**
 * Password Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hash(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash with 12 rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hash(password);

      // bcrypt hash format: $2b$rounds$...
      expect(hash.startsWith('$2b$12$')).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hash(password);

      const isValid = await service.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await service.hash('correct');

      const isValid = await service.compare('wrong', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await service.hash('password');

      const isValid = await service.compare('', hash);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#$%^&*()';
      const hash = await service.hash(password);

      const isValid = await service.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'पासवर्ड123!';
      const hash = await service.hash(password);

      const isValid = await service.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
