/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Auth0Service, type Auth0User } from '../../infrastructure/auth/auth0-service';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { UserDomainService } from '../../domain/models/user';

// Input DTO
export interface AuthenticateUserInput {
  token: string;
}

// Output DTO
export interface AuthenticateUserOutput {
  user: User;
  isNewUser: boolean;
}

// Use case interface
export interface IAuthenticateUserUseCase {
  execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput>;
}

// Use case implementation
export class AuthenticateUserUseCase implements IAuthenticateUserUseCase {
  constructor(
    private readonly auth0Service: Auth0Service,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    // Validate token and get user info from Auth0
    const auth0User = await this.auth0Service.validateToken(input.token);

    // Check if user exists in our database
    let user = await this.userRepository.findByAuth0Id(auth0User.sub);
    let isNewUser = false;

    if (!user) {
      // Create new user
      if (!auth0User.email) {
        throw new Error('Email is required for user registration');
      }

      if (!UserDomainService.validateEmail(auth0User.email)) {
        throw new Error('Invalid email format');
      }

      const userName = auth0User.name || auth0User.nickname || 'Unknown User';
      if (!UserDomainService.validateName(userName)) {
        throw new Error('Invalid user name');
      }

      user = await this.userRepository.create({
        auth0Id: auth0User.sub,
        email: auth0User.email,
        name: userName,
        isActive: true,
      });

      isNewUser = true;
    }

    return {
      user,
      isNewUser,
    };
  }
}

