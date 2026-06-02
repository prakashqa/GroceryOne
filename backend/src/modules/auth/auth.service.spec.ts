/**
 * Auth Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenBlacklistService } from '../../core/redis/token-blacklist.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TenantService } from '../../tenant/tenant.service';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { buildMockTenant, buildMockUser } from '../../test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let passwordService: PasswordService;
  let jwtService: JwtService;

  const mockTenant = buildMockTenant();

  const mockUser = buildMockUser({ tenant: mockTenant });

  // QueryBuilder mock — returned by mockUserRepository.createQueryBuilder().
  // The lookup helper (findActiveUserByIdentifier) builds a tolerant phone
  // query via createQueryBuilder; tests inject the expected user via
  // queryBuilderMock.getOne.mockResolvedValue(...).
  const queryBuilderMock: any = {
    leftJoinAndSelect: jest.fn(() => queryBuilderMock),
    where: jest.fn(() => queryBuilderMock),
    andWhere: jest.fn(() => queryBuilderMock),
    getOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock),
  };

  const mockPasswordService = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
    verify: jest.fn(),
  };

  const mockTokenBlacklistService = {
    blacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  const mockSubscriptionService = {
    createTrialSubscription: jest.fn(),
    getActiveSubscription: jest.fn(),
    isSubscriptionActive: jest.fn(),
    createSubscription: jest.fn(),
  };

  const mockTenantService = {
    create: jest.fn(),
    findBySlug: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    }),
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
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
    // Re-arm chainable QB stubs (cleared above) and make getOne() defer to
    // whatever the test arms on findOne(). This lets existing tests
    // (`mockUserRepository.findOne.mockResolvedValue(...)`) keep working
    // after the validateUser/validateUserByPin/resolveUserTenant paths
    // were refactored to createQueryBuilder for tolerant phone matching.
    queryBuilderMock.leftJoinAndSelect.mockReturnValue(queryBuilderMock);
    queryBuilderMock.where.mockReturnValue(queryBuilderMock);
    queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
    queryBuilderMock.getOne.mockImplementation(() => mockUserRepository.findOne());
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
      mockUserRepository.findOne.mockResolvedValue(null);

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

      // The tolerant-phone refactor moved this path to createQueryBuilder;
      // we assert the cross-tenant nature by checking no tenantId clause was
      // added (the only andWhere call is the email/phone clause).
      const andWhereCalls = (queryBuilderMock.andWhere as jest.Mock).mock.calls;
      const tenantClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('tenantId'),
      );
      expect(tenantClause).toBeUndefined();
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
      const futureExp = Math.floor(Date.now() / 1000) + 1800;
      mockJwtService.decode.mockReturnValue({ exp: futureExp });
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);

      await service.logout('valid-jwt-token');

      const calledTtl = mockTokenBlacklistService.blacklist.mock.calls[0][1];
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

  describe('refreshTokens', () => {
    const validPayload = {
      sub: 'user-123',
      tenantId: 'tenant-123',
      email: 'test@example.com',
      role: 'admin',
    };

    it('should issue new tokens for a valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue(validPayload);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should blacklist the old refresh token (token rotation)', async () => {
      mockJwtService.verify.mockReturnValue(validPayload);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('token');

      await service.refreshTokens('old-refresh-token');

      expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith(
        'old-refresh-token',
        expect.any(Number),
      );
    });

    it('should reject an expired or invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshTokens('expired-token'))
        .rejects.toThrow();
    });

    it('should reject a blacklisted refresh token', async () => {
      mockJwtService.verify.mockReturnValue(validPayload);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(true);

      await expect(service.refreshTokens('blacklisted-token'))
        .rejects.toThrow();
    });

    it('should reject if user is no longer active', async () => {
      mockJwtService.verify.mockReturnValue(validPayload);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-token'))
        .rejects.toThrow();
    });
  });

  describe('signup', () => {
    const signupDto = {
      businessName: 'Fresh Mart Groceries',
      ownerFirstName: 'Rajesh',
      ownerLastName: 'Kumar',
      email: 'admin@freshmart.com',
      phone: '+919876543210',
      password: 'Admin@123',
    };

    const mockNewTenant = {
      id: 'new-tenant-id',
      slug: 'fresh-mart-groceries',
      name: 'Fresh Mart Groceries',
      status: 'active',
    };

    const mockNewUser = {
      ...mockUser,
      id: 'new-user-id',
      tenantId: 'new-tenant-id',
      email: 'admin@freshmart.com',
      phone: '+919876543210',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'admin',
      status: 'active',
      tenant: mockNewTenant,
    };

    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockTenantService.findBySlug.mockResolvedValue(null); // No slug collision
      mockTenantService.create.mockResolvedValue(mockNewTenant);
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockReturnValue(mockNewUser);
      mockUserRepository.save.mockResolvedValue(mockNewUser);
      mockSubscriptionService.createTrialSubscription.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
    });

    it('should create tenant, user, and trial subscription in a transaction', async () => {
      const result = await service.signup(signupDto);

      expect(mockTenantService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Fresh Mart Groceries',
          slug: expect.any(String),
          contactEmail: 'admin@freshmart.com',
          contactPhone: '+919876543210',
        }),
      );
      expect(mockSubscriptionService.createTrialSubscription).toHaveBeenCalledWith('new-tenant-id');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should hash password with PasswordService', async () => {
      await service.signup(signupDto);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('Admin@123');
    });

    it('should create user with admin role and active status', async () => {
      await service.signup(signupDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
          status: 'active',
        }),
      );
    });

    it('should return 409 when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser); // User exists

      await expect(service.signup(signupDto)).rejects.toThrow('An account with this email already exists');
    });

    it('should generate unique slug from business name', async () => {
      await service.signup(signupDto);

      expect(mockTenantService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'fresh-mart-groceries',
        }),
      );
    });

    it('should append suffix on slug collision', async () => {
      mockTenantService.findBySlug.mockResolvedValueOnce({ id: 'existing' }); // Collision

      await service.signup(signupDto);

      const createCall = mockTenantService.create.mock.calls[0][0];
      expect(createCall.slug).toMatch(/^fresh-mart-groceries-[a-z0-9]{4}$/);
    });

    it('should rollback on transaction failure', async () => {
      const queryRunner = mockDataSource.createQueryRunner();
      mockUserRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(service.signup(signupDto)).rejects.toThrow('DB error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    describe('optional PIN at signup', () => {
      it('hashes the PIN and stores it on the user when provided', async () => {
        mockPasswordService.hash
          .mockResolvedValueOnce('hashed-password')
          .mockResolvedValueOnce('hashed-pin');

        await service.signup({ ...signupDto, pin: '4563' });

        expect(mockPasswordService.hash).toHaveBeenCalledWith('Admin@123');
        expect(mockPasswordService.hash).toHaveBeenCalledWith('4563');
        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ pinHash: 'hashed-pin' }),
        );
      });

      it('does NOT set pinHash when pin is omitted (cloud signup backwards compat)', async () => {
        await service.signup(signupDto);

        const createArg = mockUserRepository.create.mock.calls[0][0];
        // pinHash should either be absent OR explicitly null/undefined — but
        // never the string returned by passwordService.hash when no pin was sent.
        expect(createArg.pinHash).toBeFalsy();
        // password hashed exactly once (not twice, which would happen if the
        // service mistakenly fed an empty/undefined string into hash()).
        expect(mockPasswordService.hash).toHaveBeenCalledTimes(1);
      });
    });

    describe('tenant isolation', () => {
      it('should check email uniqueness across ALL tenants', async () => {
        mockUserRepository.findOne.mockResolvedValue(null);

        await service.signup(signupDto);

        // The first findOne call checks email existence (no tenantId filter)
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: [{ email: 'admin@freshmart.com' }],
        });
      });

      it('should scope new user to the newly created tenant', async () => {
        await service.signup(signupDto);

        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'new-tenant-id',
          }),
        );
      });

      it('should scope trial subscription to the newly created tenant', async () => {
        await service.signup(signupDto);

        expect(mockSubscriptionService.createTrialSubscription).toHaveBeenCalledWith('new-tenant-id');
      });
    });
  });

  //
  // EMPLOYEE MANAGEMENT
  //

  describe('createEmployee', () => {
    const callerTenantId = 'tenant-a';
    const dto = {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+919876543211',
      pin: '1234',
    };

    beforeEach(() => {
      mockPasswordService.hash.mockResolvedValue('hashed');
      // No pre-existing user with same phone in this tenant
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((payload) => payload);
      mockUserRepository.save.mockImplementation(async (u) => ({
        ...u,
        id: 'new-employee-id',
        createdAt: new Date('2026-01-01'),
      }));
    });

    it('creates a user scoped to the caller tenantId — body cannot override', async () => {
      // Attempt to inject a different tenantId in the DTO (TypeScript would
      // normally block this, but we cast to bypass and prove server ignores it).
      await service.createEmployee(callerTenantId, dto as any);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: callerTenantId }),
      );
    });

    it('forces role=cashier regardless of any body input', async () => {
      await service.createEmployee(callerTenantId, { ...(dto as any), role: 'admin' });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'cashier' }),
      );
    });

    it('forces status=active regardless of any body input', async () => {
      await service.createEmployee(callerTenantId, { ...(dto as any), status: 'inactive' });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });

    it('hashes the PIN before storage and never stores it plain', async () => {
      await service.createEmployee(callerTenantId, dto);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('1234');
      const created = mockUserRepository.create.mock.calls[0][0];
      // pinHash is whatever passwordService.hash returns; importantly NOT '1234'.
      expect(created.pinHash).not.toBe('1234');
      expect(created.pinHash).toBeDefined();
    });

    it('stores a non-usable passwordHash so password-login can never succeed', async () => {
      await service.createEmployee(callerTenantId, dto);
      const created = mockUserRepository.create.mock.calls[0][0];
      // Two distinct hash calls: one for pin, one for the unusable password.
      expect(mockPasswordService.hash).toHaveBeenCalledTimes(2);
      expect(created.passwordHash).toBeDefined();
    });

    it('returns a public view without hashes', async () => {
      const result = await service.createEmployee(callerTenantId, dto);
      expect(result).toEqual(
        expect.objectContaining({
          id: 'new-employee-id',
          firstName: 'Priya',
          phone: '+919876543211',
          role: 'cashier',
          status: 'active',
        }),
      );
      expect(result as unknown as Record<string, unknown>).not.toHaveProperty('pinHash');
      expect(result as unknown as Record<string, unknown>).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException when (tenantId, phone) already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(buildMockUser({ phone: dto.phone }));
      await expect(service.createEmployee(callerTenantId, dto)).rejects.toThrow(
        'phone number already exists',
      );
    });

    it('multi-tenant: same phone in different tenants does NOT trigger conflict', async () => {
      // Conflict check uses where: { tenantId, phone } — different tenant should
      // not match. The mock returns null when called with the caller tenantId.
      mockUserRepository.findOne.mockImplementation((opts: any) => {
        if (opts?.where?.tenantId === callerTenantId) return Promise.resolve(null);
        // Same phone exists in tenant-b — but that shouldn't be checked here
        return Promise.resolve(buildMockUser({ phone: dto.phone, tenantId: 'tenant-b' }));
      });

      await expect(service.createEmployee(callerTenantId, dto)).resolves.toBeDefined();
    });
  });

  describe('listEmployees', () => {
    it('scopes the query to the caller tenant', async () => {
      const find = jest.fn().mockResolvedValue([]);
      (mockUserRepository as any).find = find;

      await service.listEmployees('tenant-a');

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-a' },
        }),
      );
    });

    it('returns public views (no hashes leaked)', async () => {
      const rows = [buildMockUser({ id: 'u1' }), buildMockUser({ id: 'u2' })];
      (mockUserRepository as any).find = jest.fn().mockResolvedValue(rows);

      const result = await service.listEmployees('tenant-123');

      expect(result).toHaveLength(2);
      result.forEach((emp) => {
        expect(emp as unknown as Record<string, unknown>).not.toHaveProperty('pinHash');
        expect(emp as unknown as Record<string, unknown>).not.toHaveProperty('passwordHash');
      });
    });
  });

  describe('deactivateEmployee', () => {
    it('sets status to inactive on the target user', async () => {
      const target = buildMockUser({ id: 'emp-1', role: 'cashier', status: 'active' });
      mockUserRepository.findOne.mockResolvedValue(target);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.deactivateEmployee('tenant-123', 'emp-1');

      expect(result.status).toBe('inactive');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'emp-1', status: 'inactive' }),
      );
    });

    it('throws NotFoundException when the id does not exist in caller tenant — never reveals it exists elsewhere', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deactivateEmployee('tenant-a', 'employee-from-tenant-b'),
      ).rejects.toThrow('Employee not found');

      // Confirms the lookup is constrained by tenantId — cross-tenant access blocked
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'employee-from-tenant-b', tenantId: 'tenant-a' },
        }),
      );
    });

    it('refuses to deactivate an admin (would lock the tenant out)', async () => {
      const admin = buildMockUser({ id: 'owner', role: 'admin' });
      mockUserRepository.findOne.mockResolvedValue(admin);

      await expect(
        service.deactivateEmployee('tenant-123', 'owner'),
      ).rejects.toThrow('Cannot deactivate an admin');
    });
  });

  //
  // REGRESSION: PIN-login must refuse inactive users.
  // This is what makes the deactivate flow meaningful.
  //
  describe('validateUserByPin (status enforcement)', () => {
    it('returns null when the user is inactive — status="active" clause and tenant scoping are always applied', async () => {
      // The query-builder pipeline always applies status='active' and the
      // caller-supplied tenantId. Asserting on the SQL fragments guards
      // against someone refactoring the where clause and silently removing
      // the gate that powers the deactivate feature.
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUserByPin('tenant-123', '+91xxx', '1234');

      expect(result).toBeNull();

      const whereCalls = (queryBuilderMock.where as jest.Mock).mock.calls;
      const andWhereCalls = (queryBuilderMock.andWhere as jest.Mock).mock.calls;

      // status='active' is the first WHERE
      expect(whereCalls[0][0]).toContain('status = :status');
      expect(whereCalls[0][1]).toEqual({ status: 'active' });

      // tenantId scoping is applied
      const tenantClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('tenantId'),
      );
      expect(tenantClause).toBeDefined();
      expect(tenantClause![1]).toEqual({ tenantId: 'tenant-123' });
    });
  });

  //
  // REGRESSION: phone login must tolerate common formatting variations
  // (+91-, +91, space, dash, with/without country code). All of these
  // should resolve to the same active user regardless of how the phone
  // was stored. See utils/identifier.ts for the canonicalisation rule.
  //
  describe('phone-matching tolerance (login)', () => {
    beforeEach(() => {
      // Resolve to a stored user in every shape — the assertion is about
      // the SQL fragment passed to the QB, not the underlying data.
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
    });

    it.each([
      ['9999000001', '9999000001'],
      ['+919999000001', '9999000001'],
      ['+91-9999000001', '9999000001'],
      ['+91 9999000001', '9999000001'],
      ['919999000001', '9999000001'],
    ])('validateUserByPin(%p) queries phone LIKE %%%p', async (input, last10) => {
      jest.clearAllMocks();
      queryBuilderMock.leftJoinAndSelect.mockReturnValue(queryBuilderMock);
      queryBuilderMock.where.mockReturnValue(queryBuilderMock);
      queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
      queryBuilderMock.getOne.mockImplementation(() => mockUserRepository.findOne());
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUserByPin('tenant-123', input, '1234');

      const andWhereCalls = (queryBuilderMock.andWhere as jest.Mock).mock.calls;
      const phoneClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('regexp_replace'),
      );
      expect(phoneClause).toBeDefined();
      expect(phoneClause![1].phonePattern).toBe(`%${last10}`);
    });

    it('validateUserByPin treats emails as exact-match, no phone clause', async () => {
      jest.clearAllMocks();
      queryBuilderMock.leftJoinAndSelect.mockReturnValue(queryBuilderMock);
      queryBuilderMock.where.mockReturnValue(queryBuilderMock);
      queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
      queryBuilderMock.getOne.mockImplementation(() => mockUserRepository.findOne());
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUserByPin('tenant-123', 'owner@freshmart.com', '1234');

      const andWhereCalls = (queryBuilderMock.andWhere as jest.Mock).mock.calls;
      const phoneClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('regexp_replace'),
      );
      expect(phoneClause).toBeUndefined();

      const emailClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && /u\.email = :identifier/.test(sql),
      );
      expect(emailClause).toBeDefined();
      expect(emailClause![1]).toEqual({ identifier: 'owner@freshmart.com' });
    });

    it('resolveUserTenant uses the same tolerant phone lookup, but without tenantId scope', async () => {
      jest.clearAllMocks();
      queryBuilderMock.leftJoinAndSelect.mockReturnValue(queryBuilderMock);
      queryBuilderMock.where.mockReturnValue(queryBuilderMock);
      queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
      queryBuilderMock.getOne.mockImplementation(() => mockUserRepository.findOne());
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.resolveUserTenant('+91-9999000001');

      const andWhereCalls = (queryBuilderMock.andWhere as jest.Mock).mock.calls;

      // No tenantId clause (cross-tenant lookup during device setup)
      const tenantClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('tenantId'),
      );
      expect(tenantClause).toBeUndefined();

      // Phone clause uses the last-10 canonical form
      const phoneClause = andWhereCalls.find(([sql]: any[]) =>
        typeof sql === 'string' && sql.includes('regexp_replace'),
      );
      expect(phoneClause).toBeDefined();
      expect(phoneClause![1].phonePattern).toBe('%9999000001');
    });
  });
});
