/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T21:00:00
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { UserDomainService } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';

// Input DTO
export interface UpdateUserInput {
  userId: number;
  name?: string;
  email?: string;
}

// Output DTO
export interface UpdateUserOutput {
  user: User;
}

// Use case interface
export interface IUpdateUserUseCase {
  execute(input: UpdateUserInput): Promise<UpdateUserOutput>;
}

// Use case implementation
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      if (input.name && !UserDomainService.validateName(input.name)) {
        throw new Error('Invalid name format');
      }

      if (input.email && !UserDomainService.validateEmail(input.email)) {
        throw new Error('Invalid email format');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(input.userId);
      if (!existingUser) {
        monitoring.recordBusinessEvent('update_user_not_found', {
          userId: input.userId.toString(),
        });
        throw new Error('User not found');
      }

      // Check if email is already taken by another user
      if (input.email && input.email !== existingUser.email) {
        const emailUser = await this.userRepository.findByEmail(input.email);
        if (emailUser) {
          throw new Error('Email is already taken');
        }
      }

      // Prepare update data
      const updateData: Partial<User> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;

      // Update user
      const updatedUser = await this.userRepository.update(input.userId, updateData);
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('update_user_success', {
        userId: updatedUser.id.toString(),
        email: updatedUser.email,
        duration,
      });

      return {
        user: updatedUser,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('update_user_error', {
        userId: input.userId.toString(),
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}