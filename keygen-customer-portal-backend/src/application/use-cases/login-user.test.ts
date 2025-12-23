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

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { LoginUserUseCase } from './login-user';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { JWTService } from '../../infrastructure/auth/jwt-service';

// Mock the monitoring module
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
    recordUserLogin: vi.fn(),
  },
}));

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepository: IUserRepository;
  let mockJwtService: JWTService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeM8JYdNf8qE0W1Ky', // hashed 'password123'
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByAuth0Id: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockJwtService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
      generateToken: vi.fn(),
      verifyToken: vi.fn(),
    } as any;

    loginUserUseCase = new LoginUserUseCase(mockJwtService, mockUserRepository);
  });

  describe('execute - successful login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.verifyPassword = vi.fn().mockResolvedValue(true);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await loginUserUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        token: 'jwt-token-123',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtService.verifyPassword).toHaveBeenCalledWith(input.password, mockUser.password);
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        undefined // default expiration
      );
    });

    it('should login user with remember me option', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.verifyPassword = vi.fn().mockResolvedValue(true);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await loginUserUseCase.execute(input);

      // Assert
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        '30d' // extended expiration for remember me
      );
    });
  });

  describe('execute - validation failures', () => {
    it('should throw error for invalid email format', async () => {
      // Arrange
      const input = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid email format');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      const input = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    });

    it('should throw error when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      const input = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Account is deactivated');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error when password hash is missing', async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, password: undefined };
      const input = {
        email: 'nopassword@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(userWithoutPassword);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockJwtService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.verifyPassword = vi.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockJwtService.verifyPassword).toHaveBeenCalledWith(input.password, mockUser.password);
    });
  });

  describe('execute - edge cases', () => {
    it('should handle empty password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: '',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.verifyPassword = vi.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid email or password');
    });

    it('should handle database error during user lookup', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle password verification error', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.verifyPassword = vi.fn().mockRejectedValue(new Error('Hash verification failed'));

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Hash verification failed');
    });
  });
});
