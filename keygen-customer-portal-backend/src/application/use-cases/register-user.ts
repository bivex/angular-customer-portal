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

import { JWTService, type JWTPayload } from '../../infrastructure/auth/jwt-service';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { UserDomainService } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';
import { sanitizeInput, validateSafeInput } from '../../shared/sanitization';

// Input DTO
export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

// Output DTO
export interface RegisterUserOutput {
  user: User;
  token: string;
}

// Use case interface
export interface IRegisterUserUseCase {
  execute(input: RegisterUserInput): Promise<RegisterUserOutput>;
}

// Use case implementation
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    private readonly jwtService: JWTService,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!UserDomainService.validateEmail(input.email)) {
        monitoring.recordBusinessEvent('user_registration_validation_failed', {
          email: input.email,
          reason: 'invalid_email_format'
        });
        throw new Error('Invalid email format');
      }

      if (!UserDomainService.validateName(input.name)) {
        monitoring.recordBusinessEvent('user_registration_validation_failed', {
          email: input.email,
          reason: 'invalid_name_format'
        });
        throw new Error('Invalid name format');
      }

      // Sanitize and validate input for security
      const sanitizedName = sanitizeInput(input.name);
      if (!validateSafeInput(sanitizedName)) {
        monitoring.recordBusinessEvent('user_registration_validation_failed', {
          email: input.email,
          reason: 'potentially_dangerous_input'
        });
        throw new Error('Input contains potentially dangerous content');
      }

      if (input.password.length < 8) {
        monitoring.recordBusinessEvent('user_registration_validation_failed', {
          email: input.email,
          reason: 'password_too_short'
        });
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        monitoring.recordBusinessEvent('user_registration_failed', {
          email: input.email,
          reason: 'user_already_exists'
        });
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.jwtService.hashPassword(input.password);

      // Create user
      const user = await this.userRepository.create({
        email: input.email,
        name: sanitizedName,
        password: hashedPassword,
        isActive: true,
      });

      // Generate JWT token
      const tokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };

      const token = this.jwtService.generateToken(tokenPayload);

      // Record successful registration
      monitoring.recordUserRegistration(user.id.toString(), user.email);

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_registration_success', {
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
      monitoring.recordBusinessEvent('user_registration_error', {
        email: input.email,
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
