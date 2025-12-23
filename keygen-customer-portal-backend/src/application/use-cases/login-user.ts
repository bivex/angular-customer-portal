/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { JWTService, type JWTPayload } from '../../infrastructure/auth/jwt-service';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { UserDomainService } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';

// Input DTO
export interface LoginUserInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Output DTO
export interface LoginUserOutput {
  user: User;
  token: string;
}

// Use case interface
export interface ILoginUserUseCase {
  execute(input: LoginUserInput): Promise<LoginUserOutput>;
}

// Use case implementation
export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    private readonly jwtService: JWTService,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!UserDomainService.validateEmail(input.email)) {
        monitoring.recordBusinessEvent('user_login_validation_failed', {
          email: input.email,
          reason: 'invalid_email_format'
        });
        throw new Error('Invalid email format');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(input.email);
      if (!user) {
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          reason: 'user_not_found'
        });
        monitoring.recordUserLogin('', input.email, false);
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'account_deactivated'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Account is deactivated');
      }

      // Verify password
      if (!user.password) {
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'no_password_hash'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await this.jwtService.verifyPassword(input.password, user.password);
      if (!isPasswordValid) {
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'invalid_password'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Invalid email or password');
      }

      // Generate JWT token with appropriate expiration
      const tokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };

      // Use 30 days for remember me, default 24 hours otherwise
      const expiresIn = input.rememberMe ? '30d' : undefined;
      const token = this.jwtService.generateToken(tokenPayload, expiresIn);

      // Record successful login
      monitoring.recordUserLogin(user.id.toString(), user.email, true);

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_login_success', {
        userId: user.id.toString(),
        email: user.email,
        duration,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_login_error', {
        email: input.email,
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}