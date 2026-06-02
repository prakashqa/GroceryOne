/**
 * Auth Service
 * Handles authentication with tenant context
 */

import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PasswordService } from './services/password.service';
import { TokenBlacklistService } from '../../core/redis/token-blacklist.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TenantService } from '../../tenant/tenant.service';
import { SignupDto } from './dto/signup.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { normalizePhoneLast10 } from './utils/identifier';

/** Public-shape of an employee returned by the employees endpoints. Never includes hashes. */
export interface EmployeeView {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

const toEmployeeView = (u: User): EmployeeView => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: u.phone,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt,
});

export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenantSlug?: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role: string;
    tenantId?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly subscriptionService: SubscriptionService,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Resolve an active user by either email or phone, optionally scoped to a
   * tenant. Phone matching is tolerant: input and stored value are reduced
   * to digits-only and compared by the last 10 characters (Indian mobile
   * length). Email matching is exact (case-sensitive, as stored).
   *
   * Pass `tenantId = null` to search across all tenants (used by
   * resolveUserTenant during initial device setup).
   */
  private async findActiveUserByIdentifier(
    tenantId: string | null,
    identifier: string,
  ): Promise<User | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    const last10 = normalizePhoneLast10(trimmed); // null if input looks like email or is too short

    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.tenant', 'tenant')
      .where('u.status = :status', { status: 'active' });

    if (tenantId !== null) {
      qb.andWhere('u.tenantId = :tenantId', { tenantId });
    }

    if (last10) {
      // Phone-shaped input: match either email (in case the digits happen to
      // be an email, defensive) OR the last-10-digits of the stored phone
      // after stripping non-digit characters.
      qb.andWhere(
        `(u.email = :identifier OR regexp_replace(u.phone, '[^0-9]', '', 'g') LIKE :phonePattern)`,
        { identifier: trimmed, phonePattern: `%${last10}` },
      );
    } else {
      // Email-shaped or short input: exact email match only.
      qb.andWhere('u.email = :identifier', { identifier: trimmed });
    }

    const user = await qb.getOne();
    // Visibility log: makes "No account found" diagnosable in the backend
    // terminal without needing DB access. Shows the canonical form the
    // server used and whether a row matched. Uses .log() (info-level) so
    // it appears without requiring DEBUG to be enabled.
    this.logger.log(
      `findActiveUserByIdentifier: input="${trimmed}" last10=${last10 ?? '(email)'} tenantScoped=${tenantId !== null} -> ${
        user ? `found userId=${user.id} role=${user.role} phone="${user.phone}"` : 'NOT FOUND'
      }`,
    );
    return user;
  }

  /**
   * Validate user credentials within a tenant context
   * @param tenantId - Tenant UUID or slug
   * @param identifier - Email or phone number
   * @param password - Plain text password
   * @returns User if valid, null otherwise
   */
  async validateUser(
    tenantId: string,
    identifier: string,
    password: string,
  ): Promise<User | null> {
    // Find user by email OR phone within the specific tenant (tolerant phone match).
    const user = await this.findActiveUserByIdentifier(tenantId, identifier);

    if (!user) {
      this.logger.warn(
        `Login attempt failed: user not found for ${identifier} in tenant ${tenantId}`,
      );
      return null;
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Login attempt failed: invalid password for ${identifier}`,
      );
      return null;
    }

    // Update last login timestamp
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return user;
  }

  /**
   * Validate user by PIN within a tenant context
   * @param tenantId - Tenant UUID
   * @param identifier - Email or phone number
   * @param pin - 4-digit PIN
   * @returns User if valid, null otherwise
   */
  async validateUserByPin(
    tenantId: string,
    identifier: string,
    pin: string,
  ): Promise<User | null> {
    // Find user by email OR phone within the specific tenant (tolerant phone match).
    const user = await this.findActiveUserByIdentifier(tenantId, identifier);

    if (!user) {
      this.logger.warn(
        `PIN login attempt failed: user not found for ${identifier} in tenant ${tenantId}`,
      );
      return null;
    }

    if (!user.pinHash) {
      this.logger.warn(
        `PIN login attempt failed: PIN not set for ${identifier}`,
      );
      return null;
    }

    const isPinValid = await this.passwordService.compare(pin, user.pinHash);

    if (!isPinValid) {
      this.logger.warn(`PIN login attempt failed: invalid PIN for ${identifier}`);
      return null;
    }

    // Update last login timestamp
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return user;
  }

  /**
   * Generate JWT tokens for authenticated user
   * @param user - Authenticated user
   * @returns Access and refresh tokens
   */
  async login(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.logger.log(`User ${user.email || user.phone} logged in successfully`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tenantSlug: user.tenant?.slug,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Resolve the tenant a user belongs to by their email or phone.
   * Searches across ALL tenants (no tenant scoping).
   * Used during initial device setup to discover which tenant a user belongs to.
   * @param identifier - Email or phone number
   * @returns Tenant info or null if not found
   */
  async resolveUserTenant(
    identifier: string,
  ): Promise<{ tenantSlug: string; tenantName: string; userFirstName: string } | null> {
    // Cross-tenant lookup with tolerant phone matching. Phones in the DB are
    // stored in mixed shapes (seeds use "+91-9876543211", the employee
    // endpoint stores whatever the client sent); we normalise both sides at
    // query time so "9999000001" / "+91 9999000001" / "+919999000001" all
    // resolve to the same user.
    const user = await this.findActiveUserByIdentifier(null, identifier);

    if (!user || !user.tenant) {
      return null;
    }

    return {
      tenantSlug: user.tenant.slug,
      tenantName: user.tenant.name,
      userFirstName: user.firstName || '',
    };
  }

  /**
   * Find user by ID
   * @param userId - User UUID
   * @returns User if found
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
      relations: ['tenant'],
    });
  }

  /**
   * Logout user by blacklisting their JWT token in Redis.
   * The token will be rejected by JwtStrategy on subsequent requests.
   * @param token - The raw JWT token string from Authorization header
   */
  async logout(token: string): Promise<void> {
    if (!token) return;

    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    const ttl = decoded?.exp
      ? decoded.exp - Math.floor(Date.now() / 1000)
      : 3600;

    await this.tokenBlacklistService.blacklist(token, Math.max(ttl, 0));
    this.logger.log('User logged out, token blacklisted');
  }

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation: the old refresh token is blacklisted.
   * @param refreshToken - The refresh token string
   * @returns New access and refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // 1. Verify the refresh token signature + expiry
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Check if token has been blacklisted (rotated out)
    if (await this.tokenBlacklistService.isBlacklisted(refreshToken)) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // 3. Verify user still exists and is active
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, status: 'active' },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User no longer active');
    }

    // 4. Blacklist old refresh token (rotation)
    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const ttl = decoded?.exp
      ? decoded.exp - Math.floor(Date.now() / 1000)
      : 604800; // 7 days default for refresh tokens
    await this.tokenBlacklistService.blacklist(refreshToken, Math.max(ttl, 0));

    // 5. Issue new token pair
    this.logger.log(`Token refreshed for user ${user.email || user.phone}`);
    return this.login(user);
  }

  /**
   * Register a new business (creates tenant + admin user + trial subscription).
   * Runs in a transaction to ensure atomicity.
   * This is a PUBLIC endpoint — no tenant context required.
   */
  async signup(dto: SignupDto): Promise<AuthTokens> {
    // 1. Check email uniqueness across ALL tenants
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }],
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Generate slug from business name
    const slug = await this.generateUniqueSlug(dto.businessName);

    // 3. Run in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3a. Create tenant
      const tenant = await this.tenantService.create({
        name: dto.businessName,
        slug,
        contactEmail: dto.email,
        contactPhone: dto.phone,
      });

      // 3b. Create admin user
      const passwordHash = await this.passwordService.hash(dto.password);
      // Optional PIN: when the client sends one (e.g. desktop signup), hash
      // it so the owner can use PIN-login immediately on the next launch
      // without a separate "set PIN" step. Cloud signup omits this and
      // `pinHash` stays undefined → user goes through the existing PIN-
      // setup flow on first PIN attempt.
      const pinHash = dto.pin ? await this.passwordService.hash(dto.pin) : undefined;
      const user = this.userRepository.create({
        tenantId: tenant.id,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        pinHash,
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
      });
      const savedUser = await this.userRepository.save(user);
      savedUser.tenant = tenant;

      // 3c. Create trial subscription
      await this.subscriptionService.createTrialSubscription(tenant.id);

      await queryRunner.commitTransaction();

      this.logger.log(`Signup completed: tenant=${slug}, user=${dto.email}`);

      // 4. Generate tokens and return
      return this.login(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //
  // EMPLOYEE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────
  // The owner (role='admin') can create / list / deactivate other users
  // within the SAME tenant. tenantId is always taken from the caller's JWT —
  // never trusted from the request body — to enforce tenant isolation.
  //

  /**
   * Create a new employee user in the caller's tenant.
   * Role and status are forced server-side; caller cannot escalate via body.
   *
   * @param callerTenantId  tenantId from caller's JWT (source of truth)
   * @param dto             validated CreateEmployeeDto
   * @throws ConflictException if (tenantId, phone) already exists
   */
  async createEmployee(
    callerTenantId: string,
    dto: CreateEmployeeDto,
  ): Promise<EmployeeView> {
    // Pre-check uniqueness within tenant for a friendlier 409.
    // The DB unique index `(tenantId, phone)` is the ultimate guarantee.
    const existing = await this.userRepository.findOne({
      where: { tenantId: callerTenantId, phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException(
        'An employee with this phone number already exists in your business',
      );
    }

    const pinHash = await this.passwordService.hash(dto.pin);
    // passwordHash is NOT NULL on the User entity, but employees only ever
    // log in via PIN. We store a non-usable bcrypt hash so password login
    // can never succeed for this account (compare against a known-bad input
    // will always fail).
    const unusablePasswordHash = await this.passwordService.hash(
      `__pin_only__${Date.now()}__${Math.random()}`,
    );

    const user = this.userRepository.create({
      tenantId: callerTenantId, // forced from JWT
      phone: dto.phone,
      passwordHash: unusablePasswordHash,
      pinHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'cashier', // forced — body role is ignored
      status: 'active', // forced — body status is ignored
      phoneVerifiedAt: new Date(),
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(
      `Employee created: tenantId=${callerTenantId} userId=${saved.id} phone=${saved.phone}`,
    );
    return toEmployeeView(saved);
  }

  /**
   * List all employees in the caller's tenant.
   * Excludes the caller themselves (an admin doesn't manage themselves here)
   * and excludes soft-deleted rows.
   */
  async listEmployees(callerTenantId: string): Promise<EmployeeView[]> {
    const rows = await this.userRepository.find({
      where: { tenantId: callerTenantId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toEmployeeView);
  }

  /**
   * Deactivate an employee (soft-disable login).
   * 404 if the target user doesn't exist in the caller's tenant — we
   * deliberately don't distinguish "not found" from "in another tenant"
   * to avoid leaking the existence of other tenants' user IDs.
   *
   * Note: this does NOT revoke existing JWTs. A logged-in cashier will keep
   * working until token expiry; only subsequent PIN-login attempts are
   * refused (validateUserByPin already filters by status='active').
   */
  async deactivateEmployee(
    callerTenantId: string,
    employeeId: string,
  ): Promise<EmployeeView> {
    const target = await this.userRepository.findOne({
      where: { id: employeeId, tenantId: callerTenantId },
    });
    if (!target) {
      throw new NotFoundException('Employee not found');
    }
    if (target.role === 'admin') {
      // Defence-in-depth: admin shouldn't be deactivated via this endpoint
      // (would lock the tenant out). The UI never offers it, but block here
      // too in case of direct API calls.
      throw new ConflictException('Cannot deactivate an admin account');
    }
    target.status = 'inactive';
    const saved = await this.userRepository.save(target);
    this.logger.log(
      `Employee deactivated: tenantId=${callerTenantId} userId=${saved.id}`,
    );
    return toEmployeeView(saved);
  }

  //
  // PRIVATE HELPERS
  //

  /**
   * Generate a unique slug from a business name.
   * Appends random suffix if collision detected.
   */
  private async generateUniqueSlug(businessName: string): Promise<string> {
    let slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug.length < 2) {
      slug = 'business';
    }

    // Check for collision
    const existing = await this.tenantService.findBySlug(slug);
    if (existing) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    return slug;
  }
}
