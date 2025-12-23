/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-21T23:46:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { LoginUserV2UseCase, type LoginUserV2Input, type LoginUserV2Output } from './login-user-v2';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import type { User } from '../../domain/models/user';
import { JWTServiceV2, type TokenPair } from '../../infrastructure/auth/jwt-service-v2';

// Mock the monitoring module
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
    recordUserLogin: vi.fn(),
  },
}));

describe('LoginUserV2UseCase', () => {
  let loginUserV2UseCase: LoginUserV2UseCase;
  let mockUserRepository: IUserRepository;
  let mockSessionRepository: ISessionRepository;
  let mockAuditRepository: IAuditRepository;
  let mockJwtServiceV2: JWTServiceV2;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeM8JYdNf8qE0W1Ky', // hashed 'password123'
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    accessTokenJti: 'access-jti-123',
    refreshTokenJti: 'refresh-jti-456',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  const mockSession = {
    id: 'session-uuid-123',
    userId: 1,
    accessTokenJti: null,
    refreshTokenJti: null,
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent/1.0',
    deviceFingerprint: 'fingerprint-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    riskScore: 0,
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

    mockSessionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findActiveByUserId: vi.fn(),
      updateJTIs: vi.fn(),
      updateLastActivity: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllUserSessions: vi.fn(),
      cleanupExpiredSessions: vi.fn(),
    };

    mockAuditRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findByUserId: vi.fn(),
      findByEventType: vi.fn(),
      findByDateRange: vi.fn(),
    };

    mockJwtServiceV2 = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
      generateTokenPair: vi.fn(),
      validateAccessToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
    } as any;

    loginUserV2UseCase = new LoginUserV2UseCase(
      mockJwtServiceV2,
      mockUserRepository,
      mockSessionRepository,
      mockAuditRepository
    );
  });

  describe('execute - successful login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        deviceFingerprint: 'fingerprint-123',
      };

      const expectedOutput: LoginUserV2Output = {
        user: mockUser,
        accessToken: mockTokenPair.accessToken,
        refreshToken: mockTokenPair.refreshToken,
        accessTokenExpiresAt: mockTokenPair.accessTokenExpiresAt,
        refreshTokenExpiresAt: mockTokenPair.refreshTokenExpiresAt,
        sessionId: mockSession.id,
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.updateJTIs = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await loginUserV2UseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtServiceV2.verifyPassword).toHaveBeenCalledWith(input.password, mockUser.password);
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        accessTokenJti: null,
        refreshTokenJti: null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: input.deviceFingerprint,
        expiresAt: expect.any(Date),
        riskScore: 0,
      });
      expect(mockJwtServiceV2.generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        sessionId: mockSession.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        roles: ['user'],
        permissions: [],
        securityLevel: 1,
      });
      expect(mockSessionRepository.updateJTIs).toHaveBeenCalledWith(
        mockSession.id,
        mockTokenPair.accessTokenJti,
        mockTokenPair.refreshTokenJti
      );
      expect(mockSessionRepository.updateLastActivity).toHaveBeenCalledWith(mockSession.id);
    });

    it('should handle remember me option with extended session expiry', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.updateJTIs = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);

      // Act
      await loginUserV2UseCase.execute(input);

      // Assert
      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        })
      );

      const createCall = mockSessionRepository.create.mock.calls[0][0];
      const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const actualExpiry = createCall.expiresAt;
      expect(actualExpiry.getTime()).toBeGreaterThan(expectedExpiry.getTime() - 1000); // Allow 1 second tolerance
      expect(actualExpiry.getTime()).toBeLessThan(expectedExpiry.getTime() + 1000);
    });

    it('should handle default session expiry without remember me', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.updateJTIs = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);

      // Act
      await loginUserV2UseCase.execute(input);

      // Assert
      const createCall = mockSessionRepository.create.mock.calls[0][0];
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const actualExpiry = createCall.expiresAt;
      expect(actualExpiry.getTime()).toBeGreaterThan(expectedExpiry.getTime() - 1000);
      expect(actualExpiry.getTime()).toBeLessThan(expectedExpiry.getTime() + 1000);
    });
  });

  describe('execute - validation failures', () => {
    it('should throw error for invalid email format', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email format');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'notfound@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'user_login',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: expect.objectContaining({
            email: input.email,
            reason: 'user_not_found',
          }),
        })
      );
    });

    it('should throw error when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      const input: LoginUserV2Input = {
        email: 'inactive@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Account is deactivated');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockJwtServiceV2.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error when password hash is missing', async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, password: undefined };
      const input: LoginUserV2Input = {
        email: 'nopassword@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(userWithoutPassword);

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockJwtServiceV2.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'wrongpassword',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email or password');
      expect(mockJwtServiceV2.verifyPassword).toHaveBeenCalledWith(input.password, mockUser.password);
    });
  });

  describe('execute - session management', () => {
    it('should create session with correct parameters', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceFingerprint: 'device-fingerprint-123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.updateJTIs = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);

      // Act
      await loginUserV2UseCase.execute(input);

      // Assert
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        accessTokenJti: null,
        refreshTokenJti: null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: input.deviceFingerprint,
        expiresAt: expect.any(Date),
        riskScore: 0,
      });
    });

    it('should update session JTIs after token generation', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.updateJTIs = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);

      // Act
      await loginUserV2UseCase.execute(input);

      // Assert
      expect(mockSessionRepository.updateJTIs).toHaveBeenCalledWith(
        mockSession.id,
        mockTokenPair.accessTokenJti,
        mockTokenPair.refreshTokenJti
      );
      expect(mockSessionRepository.updateLastActivity).toHaveBeenCalledWith(mockSession.id);
    });
  });

  describe('execute - error handling', () => {
    it('should handle database errors during user lookup', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle session creation errors', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockRejectedValue(new Error('Session creation failed'));

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Session creation failed');
    });

    it('should handle token generation errors', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(true);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockSession);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockRejectedValue(new Error('Token generation failed'));

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Token generation failed');
    });
  });

  describe('execute - audit logging', () => {
    it('should create audit entries for failed login attempts', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'notfound@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email or password');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'user_login',
          eventSeverity: 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: expect.objectContaining({
            email: input.email,
            reason: 'user_not_found',
          }),
        })
      );
    });

    it('should handle audit logging errors gracefully', async () => {
      // Arrange
      const input: LoginUserV2Input = {
        email: 'test@example.com',
        password: 'wrongpassword',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      mockJwtServiceV2.verifyPassword = vi.fn().mockResolvedValue(false);
      mockAuditRepository.create = vi.fn().mockRejectedValue(new Error('Audit logging failed'));

      // Act & Assert
      await expect(loginUserV2UseCase.execute(input)).rejects.toThrow('Invalid email or password');
      // Should not throw audit error
    });
  });
});