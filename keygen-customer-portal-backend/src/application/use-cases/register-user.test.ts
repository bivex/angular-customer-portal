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
import { RegisterUserUseCase } from './register-user';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { User } from '../../domain/models/user';
import { JWTService } from '../../infrastructure/auth/jwt-service';

// Mock the monitoring module
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
    recordUserRegistration: vi.fn(),
  },
}));

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;
  let mockUserRepository: IUserRepository;
  let mockJwtService: JWTService;

  const mockCreatedUser: User = {
    id: 1,
    email: 'newuser@example.com',
    name: 'New User',
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

    registerUserUseCase = new RegisterUserUseCase(mockJwtService, mockUserRepository);
  });

  describe('execute - successful registration', () => {
    it('should register user successfully with valid data', async () => {
      // Arrange
      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockResolvedValue('$2a$12$hashedpassword');
      mockUserRepository.create = vi.fn().mockResolvedValue(mockCreatedUser);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        user: mockCreatedUser,
        token: 'jwt-token-123',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtService.hashPassword).toHaveBeenCalledWith(input.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: input.email,
        name: input.name,
        password: '$2a$12$hashedpassword',
        isActive: true,
      });
      expect(mockJwtService.generateToken).toHaveBeenCalledWith({
        userId: mockCreatedUser.id,
        email: mockCreatedUser.email,
        name: mockCreatedUser.name,
      });
    });
  });

  describe('execute - validation failures', () => {
    it('should throw error for invalid email format', async () => {
      // Arrange
      const input = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Valid Name',
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Invalid email format');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error for invalid name (too short)', async () => {
      // Arrange
      const input = {
        email: 'valid@example.com',
        password: 'password123',
        name: 'A',
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Invalid name format');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error for invalid name (too long)', async () => {
      // Arrange
      const input = {
        email: 'valid@example.com',
        password: 'password123',
        name: 'A'.repeat(101), // 101 characters
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Invalid name format');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error for password too short', async () => {
      // Arrange
      const input = {
        email: 'valid@example.com',
        password: '12345', // 5 characters, minimum is 8
        name: 'Valid Name',
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Password must be at least 8 characters long');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      const existingUser = { ...mockCreatedUser, email: input.email };
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(existingUser);

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('User with this email already exists');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtService.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('execute - edge cases', () => {
    it('should handle empty strings', async () => {
      // Arrange
      const input = {
        email: '',
        password: 'password123',
        name: 'Valid Name',
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Invalid email format');
    });

    it('should handle name with only whitespace', async () => {
      // Arrange
      const input = {
        email: 'valid@example.com',
        password: 'password123',
        name: '   ', // only whitespace
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Invalid name format');
    });

    it('should handle database error during user lookup', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUserRepository.findByEmail = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle password hashing error', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Hashing failed');
    });

    it('should handle user creation error', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockResolvedValue('$2a$12$hashedpassword');
      mockUserRepository.create = vi.fn().mockRejectedValue(new Error('User creation failed'));

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('User creation failed');
    });
  });

  describe('execute - boundary cases', () => {
    it('should accept minimum valid password length', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: '12345678', // exactly 8 characters
        name: 'Test User',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockResolvedValue('$2a$12$hashedpassword');
      mockUserRepository.create = vi.fn().mockResolvedValue(mockCreatedUser);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(mockCreatedUser);
    });

    it('should accept minimum valid name length', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'AB', // exactly 2 characters
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockResolvedValue('$2a$12$hashedpassword');
      mockUserRepository.create = vi.fn().mockResolvedValue(mockCreatedUser);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(mockCreatedUser);
    });

    it('should accept maximum valid name length', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A'.repeat(100), // exactly 100 characters
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockJwtService.hashPassword = vi.fn().mockResolvedValue('$2a$12$hashedpassword');
      mockUserRepository.create = vi.fn().mockResolvedValue(mockCreatedUser);
      mockJwtService.generateToken = vi.fn().mockReturnValue('jwt-token-123');

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user).toEqual(mockCreatedUser);
    });
  });
});
