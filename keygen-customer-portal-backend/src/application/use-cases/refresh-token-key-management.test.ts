/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:22:42
 * Last Updated: 2025-12-22T00:22:42
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { RefreshTokenUseCase } from './refresh-token';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import { JWTServiceV2 } from '../../infrastructure/auth/jwt-service-v2';

// Mock the monitoring and logger modules
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
    recordDatabaseQuery: vi.fn(),
    recordDatabaseError: vi.fn(),
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

describe('RefreshTokenUseCase - Key Management Scenarios', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepository: IUserRepository;
  let mockSessionRepository: ISessionRepository;
  let mockAuditRepository: IAuditRepository;
  let mockJwtServiceV2: JWTServiceV2;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockSession = {
    id: 'session-uuid-123',
    userId: 1,
    accessTokenJti: 'old-access-jti',
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

  const mockTokenPair = {
    accessToken: 'new.access.token',
    refreshToken: 'new.refresh.token',
    accessTokenJti: 'new-access-jti-456',
    refreshTokenJti: 'new-refresh-jti-789',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
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
      verifyRefreshToken: vi.fn(),
      decodeToken: vi.fn(),
    } as any;

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockJwtServiceV2,
      mockSessionRepository,
      mockAuditRepository,
      mockUserRepository
    );
  });

  describe('Token Verification with Key Management', () => {
    it('should handle tokens signed with unknown keys gracefully', async () => {
      const input = {
        refreshToken: 'token-with-unknown-key',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      // Mock JWT service to throw unknown key error
      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockRejectedValue(
        new Error('Refresh token verification failed: signing key not found. Please re-authenticate.')
      );

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
        'Refresh token verification failed: signing key not found. Please re-authenticate.'
      );

      // Verify audit logging was attempted
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'token_refresh',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: expect.objectContaining({
            error: 'Refresh token verification failed: signing key not found. Please re-authenticate.',
          }),
        })
      );
    });

    it('should successfully refresh tokens when keys are properly managed', async () => {
      const input = {
        refreshToken: 'valid-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const mockRefreshPayload = {
        userId: 1,
        sid: 'session-uuid-123',
        jti: 'refresh-jti-123',
        tokenFamily: 'family-123',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Setup mocks for successful refresh
      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue({
        ...mockSession,
        id: 'new-session-uuid',
        accessTokenJti: mockTokenPair.accessTokenJti,
        refreshTokenJti: mockTokenPair.refreshTokenJti,
      });

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        accessToken: mockTokenPair.accessToken,
        refreshToken: mockTokenPair.refreshToken,
        accessTokenExpiresAt: mockTokenPair.accessTokenExpiresAt,
        refreshTokenExpiresAt: mockTokenPair.refreshTokenExpiresAt,
      });

      // Verify token generation was called with correct parameters
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
    });

    it('should handle invalid tokens with proper error messages', async () => {
      const input = {
        refreshToken: 'invalid-token-format',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockRejectedValue(
        new Error('Refresh token verification failed: invalid signature')
      );

      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
        'Refresh token verification failed: invalid signature'
      );
    });

    it('should handle token reuse attacks with proper security measures', async () => {
      const input = {
        refreshToken: 'reused-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const mockRefreshPayload = {
        userId: 1,
        sid: 'session-uuid-123',
        jti: 'refresh-jti-123',
        tokenFamily: 'family-123',
        type: 'refresh',
      };

      const inactiveSession = { ...mockSession, isActive: false };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(inactiveSession);
      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue([mockSession]);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);

      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
        'Security violation: token reuse detected'
      );

      // Verify all active sessions for the user were revoked
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith(
        mockSession.id,
        'token_reuse_attack'
      );
    });

    it('should handle session expiration properly', async () => {
      const input = {
        refreshToken: 'valid-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const mockRefreshPayload = {
        userId: 1,
        sid: 'session-uuid-123',
        jti: 'refresh-jti-123',
        type: 'refresh',
      };

      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(expiredSession);

      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
        'Session has expired'
      );
    });
  });

  describe('Audit Logging Integration', () => {
    it('should create comprehensive audit logs for token refresh operations', async () => {
      const input = {
        refreshToken: 'audit-test-token',
        ipAddress: '192.168.1.100',
        userAgent: 'TestBrowser/1.0',
      };

      const mockRefreshPayload = {
        userId: 1,
        sid: 'audit-session-123',
        jti: 'audit-jti-123',
        tokenFamily: 'audit-family-123',
        type: 'refresh',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue({
        ...mockSession,
        id: 'new-audit-session-456',
        accessTokenJti: mockTokenPair.accessTokenJti,
        refreshTokenJti: mockTokenPair.refreshTokenJti,
      });

      await refreshTokenUseCase.execute(input);

      // Verify audit logs were created
      expect(mockAuditRepository.create).toHaveBeenCalledTimes(2);

      // Check token refresh audit log
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: 'new-audit-session-456',
          eventType: 'token_refresh',
          eventSeverity: 'info',
          result: 'success',
          ipAddress: '192.168.1.100', // Should be sanitized to null
          userAgent: 'TestBrowser/1.0',
        })
      );

      // Check session creation audit log
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: 'new-audit-session-456',
          eventType: 'session_created',
          eventSeverity: 'info',
          result: 'success',
        })
      );
    });

    it('should handle audit logging failures gracefully', async () => {
      const input = {
        refreshToken: 'audit-fail-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const mockRefreshPayload = {
        userId: 1,
        sid: 'session-uuid-123',
        jti: 'jti-123',
        type: 'refresh',
      };

      mockJwtServiceV2.verifyRefreshToken = vi.fn().mockResolvedValue(mockRefreshPayload);
      mockSessionRepository.findByRefreshTokenJti = vi.fn().mockResolvedValue(mockSession);
      mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser);
      mockSessionRepository.updateLastActivity = vi.fn().mockResolvedValue(undefined);
      mockJwtServiceV2.generateTokenPair = vi.fn().mockResolvedValue(mockTokenPair);
      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.create = vi.fn().mockResolvedValue({
        ...mockSession,
        id: 'new-session-uuid',
      });

      // Make audit logging fail
      mockAuditRepository.create = vi.fn().mockRejectedValue(new Error('Audit DB error'));

      // Should still succeed despite audit logging failure
      const result = await refreshTokenUseCase.execute(input);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});