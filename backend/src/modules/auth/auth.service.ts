/**
 * Auth Service
 * Handles authentication with tenant context
 */

import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PasswordService } from './services/password.service';
import { TokenBlacklistService } from '../../core/redis/token-blacklist.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TenantService } from '../../tenant/tenant.service';
import { SignupDto } from './dto/signup.dto';

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
    // Find user by email OR phone within the specific tenant
    const user = await this.userRepository.findOne({
      where: [
        { tenantId, email: identifier, status: 'active' },
        { tenantId, phone: identifier, status: 'active' },
      ],
      relations: ['tenant'],
    });

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
    // Find user by email OR phone within the specific tenant
    const user = await this.userRepository.findOne({
      where: [
        { tenantId, email: identifier, status: 'active' },
        { tenantId, phone: identifier, status: 'active' },
      ],
      relations: ['tenant'],
    });

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
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier, status: 'active' },
        { phone: identifier, status: 'active' },
      ],
      relations: ['tenant'],
    });

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
      const user = this.userRepository.create({
        tenantId: tenant.id,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
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
