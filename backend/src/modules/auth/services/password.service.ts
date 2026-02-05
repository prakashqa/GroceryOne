/**
 * Password Service
 * Handles password hashing and comparison using bcrypt
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
