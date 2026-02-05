/**
 * Local Strategy
 * Passport strategy for username/password authentication with tenant context
 */

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'identifier', // Can be email or phone
      passwordField: 'password',
      passReqToCallback: true, // To access tenantId from request
    });
  }

  async validate(
    req: Request,
    identifier: string,
    password: string,
  ): Promise<any> {
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }

    const user = await this.authService.validateUser(
      tenantId,
      identifier,
      password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
