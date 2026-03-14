/**
 * Auth Controller
 * Handles authentication endpoints with tenant context
 */

import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResolveTenantDto } from './dto/resolve-tenant.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';

interface AuthenticatedRequest extends ExpressRequest {
  user: User;
}

interface JwtAuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    tenantId: string;
    email?: string;
    phone?: string;
    role: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login with email/phone and password' })
  @ApiHeader({
    name: 'X-Tenant-ID',
    required: true,
    description: 'Tenant slug (e.g., freshmart, quickbasket)',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1...',
        refreshToken: 'eyJhbGciOiJIUzI1...',
        expiresIn: 3600,
        user: {
          id: 'uuid',
          email: 'admin@freshmart.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Request() req: AuthenticatedRequest,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(req.user);
  }

  @Post('login/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and PIN' })
  @ApiHeader({
    name: 'X-Tenant-ID',
    required: true,
    description: 'Tenant slug (e.g., freshmart, quickbasket)',
  })
  @ApiResponse({
    status: 200,
    description: 'PIN login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1...',
        refreshToken: 'eyJhbGciOiJIUzI1...',
        expiresIn: 3600,
        user: {
          id: 'uuid',
          email: 'admin@freshmart.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  async loginWithPin(
    @Request() req: ExpressRequest,
    @Body() pinLoginDto: PinLoginDto,
  ) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }

    const user = await this.authService.validateUserByPin(
      tenantId,
      pinLoginDto.identifier,
      pinLoginDto.pin,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new business (creates tenant + admin user + trial subscription)' })
  @ApiResponse({
    status: 201,
    description: 'Signup successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1...',
        refreshToken: 'eyJhbGciOiJIUzI1...',
        expiresIn: 3600,
        tenantSlug: 'fresh-mart-groceries',
        user: {
          id: 'uuid',
          email: 'admin@freshmart.com',
          firstName: 'Rajesh',
          lastName: 'Kumar',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1...',
        refreshToken: 'eyJhbGciOiJIUzI1...',
        expiresIn: 3600,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('resolve-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve tenant from user email/phone (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant resolved successfully',
    schema: {
      example: {
        tenantSlug: 'freshmart',
        tenantName: 'FreshMart Groceries',
        userFirstName: 'Rajesh',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No account found for this identifier' })
  async resolveTenant(@Body() resolveTenantDto: ResolveTenantDto) {
    const result = await this.authService.resolveUserTenant(
      resolveTenantDto.identifier,
    );

    if (!result) {
      throw new UnauthorizedException('No account found for this identifier');
    }

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: ExpressRequest) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token ?? '');
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiHeader({
    name: 'X-Tenant-ID',
    required: true,
    description: 'Tenant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved',
    schema: {
      example: {
        userId: 'uuid',
        tenantId: 'uuid',
        email: 'admin@freshmart.com',
        phone: '+91-9876543210',
        role: 'admin',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: JwtAuthenticatedRequest) {
    return {
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full user details' })
  @ApiHeader({
    name: 'X-Tenant-ID',
    required: true,
    description: 'Tenant slug',
  })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: JwtAuthenticatedRequest) {
    const user = await this.authService.findUserById(req.user.userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
