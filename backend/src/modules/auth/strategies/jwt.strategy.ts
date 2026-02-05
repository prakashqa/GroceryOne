/**
 * JWT Strategy
 * Passport strategy for JWT token validation with tenant context
 * Checks token blacklist (Redis) to reject revoked tokens
 */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../auth.service';
import { TokenBlacklistService } from '../../../core/redis/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Check if token has been blacklisted (revoked via logout)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && await this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify tenant context matches token
    if (req.tenantId && req.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
    };
  }
}
