/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T21:15:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { IAuthService } from '../../infrastructure/auth/jwt-service';
import type { User } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';

// Input DTO
export interface ChangePasswordInput {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

// Output DTO
export interface ChangePasswordOutput {
  success: boolean;
}

// Use case interface
export interface IChangePasswordUseCase {
  execute(input: ChangePasswordInput): Promise<ChangePasswordOutput>;
}

// Use case implementation
export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const startTime = Date.now();

    try {
      // Validate new password length
      if (input.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        monitoring.recordBusinessEvent('change_password_user_not_found', {
          userId: input.userId.toString(),
        });
        throw new Error('User not found');
      }

      // Check if user has a password (not Auth0 user)
      if (!user.password) {
        throw new Error('Password change not available for this account type');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.authService.verifyPassword(
        input.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        monitoring.recordBusinessEvent('change_password_invalid_current_password', {
          userId: user.id.toString(),
          email: user.email,
        });
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.authService.hashPassword(input.newPassword);

      // Update password
      const updatedUser = await this.userRepository.update(user.id, {
        password: hashedNewPassword,
      });

      if (!updatedUser) {
        throw new Error('Failed to update password');
      }

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('change_password_success', {
        userId: user.id.toString(),
        email: user.email,
        duration,
      });

      return {
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('change_password_error', {
        userId: input.userId.toString(),
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}