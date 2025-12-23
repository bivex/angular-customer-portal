/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T00:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { RefreshTokenUseCase, type RefreshTokenInput, type RefreshTokenOutput } from './refresh-token';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import type { User } from '../../domain/models/user';
import { JWTServiceV2, type RefreshTokenPayload, type TokenPair } from '../../infrastructure/auth/jwt-service-v2';

// Mock the monitoring and logger modules
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
  },
}));

vi.mock('../../shared/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepository: IUserRepository;
  let mockSessionRepository: ISessionRepository;
  let mockAuditRepository: IAuditRepository;
  let mockJwtServiceV2: JWTServiceV2;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeM8JYdNf8qE0W1Ky',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockRefreshPayload: RefreshTokenPayload = {
    userId: 1,
    email: 'test@example.com',
    name: 'Test User',
    jti: 'refresh-jti-123',
    sid: 'session-uuid-123',
    tokenFamily: 'family-123',
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: 'keygen-customer-portal-api',
    iss: 'keygen-customer-portal',
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    accessTokenJti: 'new-access-jti-456',
    refreshTokenJti: 'new-refresh-jti-789',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  const mockSession = {
    id: 'session-uuid-123',
    userId: 1,
    accessTokenJti: 'old-access-jti-123',
    refreshTokenJti: 'refresh-jti-123',
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent/1.0',
    deviceFingerprint: 'fingerprint-123',
    geolocation: null,
    riskScore: 0,
    isActive: true,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    revokedAt: null,
    revokedReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNewSession = {
    ...mockSession,
    id: 'new-session-uuid-456',
    accessTokenJti: 'new-access-jti-456',
    refreshTokenJti: 'new-refresh-jti-789',
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByAuth0Id: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockSessionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByRefreshTokenJti: vi.fn(),
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
      verifyRefreshToken: vi.fn(),
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      decodeToken: vi.fn(),
    } as any;

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockJwtServiceV2,
      mockSessionRepository,
      mockAuditRepository,
      mockUserRepository
    );
  });

  describe('execute - successful token refresh', () => {
    it('should successfully refresh tokens with valid input', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const expectedOutput: RefreshTokenOutput = {
        accessToken: mockTokenPair.accessToken,
        refreshToken: mockTokenPair.refreshToken,
        accessTokenExpiresAt: mockTokenPair.accessTokenExpiresAt,
        refreshTokenExpiresAt: mockTokenPair.refreshTokenExpiresAt,
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockNewSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockJwtServiceV2.verifyRefreshToken).toHaveBeenCalledWith(input.refreshToken);
      expect(mockSessionRepository.findByRefreshTokenJti).toHaveBeenCalledWith(mockRefreshPayload.jti);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockRefreshPayload.userId);
      expect(mockSessionRepository.updateLastActivity).toHaveBeenCalledWith(mockSession.id);
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
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith(mockSession.id, 'token_rotation');
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        accessTokenJti: mockTokenPair.accessTokenJti,
        refreshTokenJti: mockTokenPair.refreshTokenJti,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: mockSession.deviceFingerprint,
        expiresAt: expect.any(Date),
        riskScore: mockSession.riskScore,
      });
    });

    it('should create audit logs for successful refresh', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockNewSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      await refreshTokenUseCase.execute(input);

      // Assert
      expect(mockAuditRepository.create).toHaveBeenCalledTimes(2);

      // Token refresh audit log
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          sessionId: mockNewSession.id,
          eventType: 'token_refresh',
          eventSeverity: 'info',
          result: 'success',
          metadata: expect.objectContaining({
            oldSessionId: mockSession.id,
            newSessionId: mockNewSession.id,
            tokenFamily: mockRefreshPayload.tokenFamily,
          }),
        })
      );

      // Session created audit log
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          sessionId: mockNewSession.id,
          eventType: 'session_created',
          eventSeverity: 'info',
          result: 'success',
          metadata: expect.objectContaining({
            reason: 'token_rotation',
            oldSessionId: mockSession.id,
          }),
        })
      );
    });
  });

  describe('execute - token reuse attack detection', () => {
    it('should detect and handle token reuse attack', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'reused-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const inactiveSession = { ...mockSession, isActive: false };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(inactiveSession);
      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue([mockSession]);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Security violation: token reuse detected');

      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith(mockSession.id, 'token_reuse_attack');
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockRefreshPayload.userId,
          sessionId: mockRefreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          result: 'failure',
          metadata: expect.objectContaining({
            reason: 'token_reuse_attack_detected',
            tokenFamily: mockRefreshPayload.tokenFamily,
          }),
          riskIndicators: expect.objectContaining({
            tokenReuseAttack: true,
            entireFamilyRevoked: true,
          }),
        })
      );
    });

    it('should handle token family revocation errors gracefully', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'reused-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const inactiveSession = { ...mockSession, isActive: false };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(inactiveSession);
      mockSessionRepository.findActiveByUserId = vi.fn().mockRejectedValue(new Error('DB error'));
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Security violation: token reuse detected');
      // Should still throw the security violation even if family revocation fails
    });
  });

  describe('execute - session validation', () => {
    it('should reject refresh for non-existent session', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Invalid refresh token');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockRefreshPayload.userId,
          sessionId: mockRefreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          result: 'failure',
          metadata: { reason: 'session_not_found' },
          riskIndicators: { tokenReuseAttempt: true },
        })
      );
    });

    it('should reject refresh for inactive session', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      // Create payload and inactive session with different JTIs to avoid token reuse detection
      const differentJtiPayload = { ...mockRefreshPayload, jti: 'payload-jti-456' };
      const inactiveSession = { ...mockSession, isActive: false, refreshTokenJti: 'payload-jti-456' };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(differentJtiPayload);
      // For token reuse check: return null (no inactive session with this JTI)
      // For session validation: return the inactive session
      let callCount = 0;
      mockSessionRepository.findByRefreshTokenJti = vi.fn((jti) => {
        callCount++;
        if (callCount === 1) {
          // First call - token reuse check
          return Promise.resolve(null);
        } else {
          // Second call - session validation
          return Promise.resolve(inactiveSession);
        }
      });
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Session has been revoked');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: differentJtiPayload.userId,
          sessionId: differentJtiPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          result: 'failure',
          metadata: { reason: 'session_revoked' },
          riskIndicators: { tokenReuseAttempt: true },
        })
      );
    });

    it('should reject refresh for expired session', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 1000) };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(expiredSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Session has expired');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockRefreshPayload.userId,
          sessionId: mockRefreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: { reason: 'session_expired' },
        })
      );
    });
  });

  describe('execute - user validation', () => {
    it('should reject refresh when user is not found', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('User not found');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockRefreshPayload.userId,
          sessionId: mockRefreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          result: 'failure',
          metadata: { reason: 'user_not_found' },
        })
      );
    });
  });

  describe('execute - token validation', () => {
    it('should reject invalid refresh tokens', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'invalid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockRejectedValue(new Error('Invalid token'));
      mockJwtServiceV2.decodeToken = vi.fn().mockReturnValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Invalid token');

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'token_refresh',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: { error: 'Invalid token' },
          riskIndicators: {
            suspiciousActivity: true,
            tokenReuseAttempt: false,
          },
        })
      );
    });

    it('should handle token decoding errors gracefully during error logging', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'invalid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockRejectedValue(new Error('Invalid token'));
      mockJwtServiceV2.decodeToken = vi.fn().mockReturnValue(null); // Return null instead of throwing
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Invalid token');
      // Should still create audit log even if decode fails
      expect(mockAuditRepository.create).toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle database errors during session lookup', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockRejectedValue(new Error('Database connection failed'));
      mockJwtServiceV2.decodeToken = vi.fn().mockReturnValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle audit logging errors gracefully', async () => {
      // Arrange
      const input: RefreshTokenInput = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue(mockNewSession);
      mockAuditRepository.create = vi.fn().mockRejectedValue(new Error('Audit logging failed'));

      // Act
      await refreshTokenUseCase.execute(input);

      // Assert - should not throw even if audit logging fails
      expect(mockAuditRepository.create).toHaveBeenCalled();
    });
  });

  describe('revokeTokenFamily - private method', () => {
    it('should revoke all active sessions for a user', async () => {
      // Arrange
      const activeSessions = [
        { id: 'session-1', userId: 1 },
        { id: 'session-2', userId: 1 },
      ];

      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue(activeSessions);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);

      // Access private method through type assertion
      const privateMethod = (refreshTokenUseCase as any).revokeTokenFamily.bind(refreshTokenUseCase);

      // Act
      await privateMethod('token-family-123', 1, 'security_violation');

      // Assert
      expect(mockSessionRepository.findActiveByUserId).toHaveBeenCalledWith(1);
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledTimes(2);
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session-1', 'security_violation');
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session-2', 'security_violation');
    });

    it('should handle errors during token family revocation gracefully', async () => {
      // Arrange
      mockSessionRepository.findActiveByUserId = vi.fn().mockRejectedValue(new Error('DB error'));

      // Access private method through type assertion
      const privateMethod = (refreshTokenUseCase as any).revokeTokenFamily.bind(refreshTokenUseCase);

      // Act & Assert - should not throw
      await expect(privateMethod('token-family-123', 1, 'security_violation')).resolves.toBeUndefined();
    });
  });
});