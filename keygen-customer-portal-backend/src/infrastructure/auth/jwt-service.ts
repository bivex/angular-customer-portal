/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../../shared/config';

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
}

export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  generateToken(payload: JWTPayload): string;
  verifyToken(token: string): JWTPayload;
}

export class JWTService implements IAuthService {
  private readonly jwtSecret: string = config.jwt.secret;
  private readonly jwtExpiresIn: string = config.jwt.expiresIn;

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: JWTPayload, expiresIn?: string): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: expiresIn || this.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}