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

import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';

// Input DTO
export interface GetCurrentUserInput {
  userId: number;
}

// Output DTO
export interface GetCurrentUserOutput {
  user: User;
}

// Use case interface
export interface IGetCurrentUserUseCase {
  execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput>;
}

// Use case implementation
export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const startTime = Date.now();

    try {
      // Find user by ID
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        monitoring.recordBusinessEvent('get_current_user_not_found', {
          userId: input.userId.toString(),
        });
        throw new Error('User not found');
      }

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('get_current_user_success', {
        userId: user.id.toString(),
        email: user.email,
        duration,
      });

      return {
        user,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('get_current_user_error', {
        userId: input.userId.toString(),
        duration,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
