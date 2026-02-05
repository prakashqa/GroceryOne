/**
 * Auth Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenBlacklistService } from '../../core/redis/token-blacklist.service';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let passwordService: PasswordService;
  let jwtService: JwtService;

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'FreshMart Groceries',
    slug: 'freshmart',
    status: 'active',
    subscriptionPlan: 'premium',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    phone: '+91-9876543210',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: mockTenant,
    get fullName() {
      return 'John Doe';
    },
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockPasswordService = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  const mockTokenBlacklistService = {
    blacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct email and password within tenant context', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.validateUser(
        'tenant-123',
        'test@example.com',
        'password',
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.tenantId).toBe('tenant-123');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { tenantId: 'tenant-123', email: 'test@example.com', status: 'active' },
          { tenantId: 'tenant-123', phone: 'test@example.com', status: 'active' },
        ],
        relations: ['tenant'],
      });
    });

    it('should validate user with phone number', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.validateUser(
        'tenant-123',
        '+91-9876543210',
        'password',
      );

      expect(result).toBeDefined();
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'tenant-123',
        'unknown@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      const result = await service.validateUser(
        'tenant-123',
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should reject user from different tenant', async () => {
      // User exists in tenant-123 but login attempt from tenant-456
      mockUserRepository.findOne.mockResolvedValue(null); // Won't find in different tenant

      const result = await service.validateUser(
        'tenant-456',
        'test@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should update last login timestamp on successful validation', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await service.validateUser('tenant-123', 'test@example.com', 'password');

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });
  });

  describe('login', () => {
    it('should return JWT tokens with tenant context', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(mockUser);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(mockUser.role);
    });

    it('should include tenantId in JWT payload', async () => {
      mockJwtService.sign.mockImplementation((payload) => {
        expect(payload.tenantId).toBe('tenant-123');
        return 'token';
      });

      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockUser.tenantId,
          email: mockUser.email,
          role: mockUser.role,
        }),
        expect.any(Object),
      );
    });

    it('should include tenantSlug in login response', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(mockUser);

      expect(result.tenantSlug).toBe('freshmart');
    });

    it('should include tenantSlug even when tenant relation is loaded', async () => {
      const userWithTenant = {
        ...mockUser,
        tenant: mockTenant,
      } as User;
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login(userWithTenant);

      expect(result.tenantSlug).toBe('freshmart');
    });
  });

  describe('resolveUserTenant', () => {
    it('should find tenant by user email across all tenants', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.resolveUserTenant('test@example.com');

      expect(result).not.toBeNull();
      expect(result!.tenantSlug).toBe('freshmart');
      expect(result!.tenantName).toBe('FreshMart Groceries');
      expect(result!.userFirstName).toBe('John');
    });

    it('should find tenant by user phone across all tenants', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.resolveUserTenant('+91-9876543210');

      expect(result).not.toBeNull();
      expect(result!.tenantSlug).toBe('freshmart');
    });

    it('should return null when no user found for identifier', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.resolveUserTenant('unknown@example.com');

      expect(result).toBeNull();
    });

    it('should query without tenant scoping (search across all tenants)', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.resolveUserTenant('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'test@example.com', status: 'active' },
          { phone: 'test@example.com', status: 'active' },
        ],
        relations: ['tenant'],
      });
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserById('user-123');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('user-123');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', status: 'active' },
        relations: ['tenant'],
      });
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should blacklist the provided token', async () => {
      mockJwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);

      await service.logout('valid-jwt-token');

      expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith(
        'valid-jwt-token',
        expect.any(Number),
      );
    });

    it('should calculate correct TTL from token expiry', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      mockJwtService.decode.mockReturnValue({ exp: futureExp });
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);

      await service.logout('valid-jwt-token');

      const calledTtl = mockTokenBlacklistService.blacklist.mock.calls[0][1];
      // TTL should be approximately 1800 seconds (allowing 2s tolerance)
      expect(calledTtl).toBeGreaterThanOrEqual(1798);
      expect(calledTtl).toBeLessThanOrEqual(1800);
    });

    it('should handle null token gracefully', async () => {
      await service.logout(null as any);

      expect(mockTokenBlacklistService.blacklist).not.toHaveBeenCalled();
    });

    it('should handle empty string token gracefully', async () => {
      await service.logout('');

      expect(mockTokenBlacklistService.blacklist).not.toHaveBeenCalled();
    });

    it('should default to 3600s TTL when token has no exp claim', async () => {
      mockJwtService.decode.mockReturnValue({});
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);

      await service.logout('token-without-exp');

      expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith(
        'token-without-exp',
        3600,
      );
    });
  });
});
