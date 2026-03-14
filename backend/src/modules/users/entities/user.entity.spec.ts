/**
 * User Entity Tests
 */

import { User, UserRole, UserStatus } from './user.entity';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.id = '123e4567-e89b-12d3-a456-426614174000';
    user.tenantId = '123e4567-e89b-12d3-a456-426614174001';
    user.email = 'test@example.com';
    user.passwordHash = '$2b$12$hashedpassword';
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.role = 'cashier';
    user.status = 'active';
    user.preferredLanguage = 'en';
    user.createdAt = new Date();
    user.updatedAt = new Date();
  });

  describe('User creation', () => {
    it('should create a user with required fields', () => {
      expect(user.id).toBeDefined();
      expect(user.tenantId).toBeDefined();
      expect(user.passwordHash).toBeDefined();
      expect(user.role).toBe('cashier');
      expect(user.status).toBe('active');
    });

    it('should have correct email', () => {
      expect(user.email).toBe('test@example.com');
    });

    it('should have tenant relationship', () => {
      expect(user.tenantId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('User roles', () => {
    it('should accept valid roles', () => {
      const validRoles: UserRole[] = ['cashier', 'admin', 'manager', 'super_admin'];
      validRoles.forEach((role) => {
        user.role = role;
        expect(user.role).toBe(role);
      });
    });
  });

  describe('User status', () => {
    it('should accept valid statuses', () => {
      const validStatuses: UserStatus[] = ['active', 'inactive', 'blocked'];
      validStatuses.forEach((status) => {
        user.status = status;
        expect(user.status).toBe(status);
      });
    });
  });

  describe('fullName getter', () => {
    it('should return full name when both first and last name are set', () => {
      expect(user.fullName).toBe('John Doe');
    });

    it('should return first name only when last name is not set', () => {
      user.lastName = undefined;
      expect(user.fullName).toBe('John');
    });

    it('should return email when no names are set', () => {
      user.firstName = undefined;
      user.lastName = undefined;
      expect(user.fullName).toBe('test@example.com');
    });

    it('should return phone when no names or email', () => {
      user.firstName = undefined;
      user.lastName = undefined;
      user.email = undefined;
      user.phone = '+91-9876543210';
      expect(user.fullName).toBe('+91-9876543210');
    });

    it('should return Unknown User when nothing is set', () => {
      user.firstName = undefined;
      user.lastName = undefined;
      user.email = undefined;
      user.phone = undefined;
      expect(user.fullName).toBe('Unknown User');
    });
  });

  describe('Optional fields', () => {
    it('should allow nullable email', () => {
      user.email = undefined;
      user.phone = '+91-9876543210';
      expect(user.email).toBeUndefined();
      expect(user.phone).toBe('+91-9876543210');
    });

    it('should allow nullable phone', () => {
      user.phone = undefined;
      expect(user.phone).toBeUndefined();
    });

    it('should allow nullable avatar', () => {
      user.avatarUrl = undefined;
      expect(user.avatarUrl).toBeUndefined();
    });

    it('should allow verification timestamps', () => {
      user.emailVerifiedAt = new Date();
      user.phoneVerifiedAt = new Date();
      expect(user.emailVerifiedAt).toBeInstanceOf(Date);
      expect(user.phoneVerifiedAt).toBeInstanceOf(Date);
    });

    it('should allow last login timestamp', () => {
      user.lastLoginAt = new Date();
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should allow soft delete', () => {
      user.deletedAt = new Date();
      expect(user.deletedAt).toBeInstanceOf(Date);
    });
  });
});
