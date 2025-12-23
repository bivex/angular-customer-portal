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
import { LogoutUserUseCase, type LogoutUserInput, type LogoutUserOutput } from './logout-user';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';

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
  },
}));

describe('LogoutUserUseCase', () => {
  let logoutUserUseCase: LogoutUserUseCase;
  let mockSessionRepository: ISessionRepository;
  let mockAuditRepository: IAuditRepository;

  const mockSession = {
    id: 'session-uuid-123',
    userId: 1,
    accessTokenJti: 'access-jti-123',
    refreshTokenJti: 'refresh-jti-456',
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

  const mockActiveSessions = [
    mockSession,
    { ...mockSession, id: 'session-uuid-456' },
    { ...mockSession, id: 'session-uuid-789' },
  ];

  beforeEach(() => {
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

    logoutUserUseCase = new LogoutUserUseCase(mockSessionRepository, mockAuditRepository);
  });

  describe('execute - logout from all devices', () => {
    it('should successfully logout from all devices', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        revokeAllSessions: true,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const expectedOutput: LogoutUserOutput = {
        success: true,
        sessionsRevoked: 3,
        message: 'Logged out from all devices (3 sessions)',
      };

      mockSessionRepository.revokeAllUserSessions = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue(mockActiveSessions);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await logoutUserUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockSessionRepository.revokeAllUserSessions).toHaveBeenCalledWith(1, 'user_logout_all');
      expect(mockSessionRepository.findActiveByUserId).toHaveBeenCalledWith(1);
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: undefined,
          eventType: 'user_logout',
          eventSeverity: 'info',
          result: 'success',
          metadata: {
            revokeAllSessions: true,
            sessionsRevoked: 3,
          },
        })
      );
    });

    it('should handle empty active sessions list', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        revokeAllSessions: true,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const expectedOutput: LogoutUserOutput = {
        success: true,
        sessionsRevoked: 0,
        message: 'Logged out from all devices (0 sessions)',
      };

      mockSessionRepository.revokeAllUserSessions = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue([]);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await logoutUserUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockSessionRepository.revokeAllUserSessions).toHaveBeenCalledWith(1, 'user_logout_all');
    });
  });

  describe('execute - logout from specific session', () => {
    it('should successfully logout from specific session', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const expectedOutput: LogoutUserOutput = {
        success: true,
        sessionsRevoked: 1,
        message: 'Logged out successfully',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(mockSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await logoutUserUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session-uuid-123', 'user_logout');
      expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-uuid-123');
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: 'session-uuid-123',
          eventType: 'user_logout',
          eventSeverity: 'info',
          result: 'success',
          metadata: {
            revokeAllSessions: undefined,
            sessionsRevoked: 1,
          },
        })
      );
    });

    it('should throw error when session does not exist', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'non-existent-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Session not found or does not belong to user');
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('non-existent-session', 'user_logout');
    });

    it('should throw error when session belongs to different user', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      const differentUserSession = { ...mockSession, userId: 2 };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(differentUserSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Session not found or does not belong to user');
    });
  });

  describe('execute - validation errors', () => {
    it('should throw error when neither sessionId nor revokeAllSessions is provided', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Session ID required for logout');
      // Audit repository is called in the error handling catch block
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          eventType: 'user_logout',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: { error: 'Session ID required for logout' },
        })
      );
    });
  });

  describe('execute - error handling', () => {
    it('should handle database errors during session revocation', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockRejectedValue(new Error('Database connection failed'));
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle errors during session counting', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        revokeAllSessions: true,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeAllUserSessions = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findActiveByUserId = vi.fn().mockRejectedValue(new Error('Count query failed'));
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Count query failed');
    });

    it('should handle audit logging errors gracefully', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(mockSession);
      mockAuditRepository.create = vi.fn().mockRejectedValue(new Error('Audit logging failed'));

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Audit logging failed');
    });

    it('should handle audit logging errors in catch block gracefully', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockRejectedValue(new Error('Session revocation failed'));
      mockAuditRepository.create = vi.fn().mockRejectedValue(new Error('Audit logging failed'));

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow('Session revocation failed');
      // Should still attempt audit logging even if it fails
      expect(mockAuditRepository.create).toHaveBeenCalled();
    });
  });

  describe('execute - audit logging', () => {
    it('should create audit log for successful logout from specific session', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(mockSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      await logoutUserUseCase.execute(input);

      // Assert
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: 'session-uuid-123',
          eventType: 'user_logout',
          eventSeverity: 'info',
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          result: 'success',
          metadata: {
            revokeAllSessions: undefined,
            sessionsRevoked: 1,
          },
        })
      );
    });

    it('should create audit log for successful logout from all devices', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        revokeAllSessions: true,
        ipAddress: '192.168.1.1',
        userAgent: 'MobileApp/1.0',
      };

      mockSessionRepository.revokeAllUserSessions = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findActiveByUserId = vi.fn().mockResolvedValue(mockActiveSessions);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      await logoutUserUseCase.execute(input);

      // Assert
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: undefined,
          eventType: 'user_logout',
          eventSeverity: 'info',
          ipAddress: '192.168.1.1',
          userAgent: 'MobileApp/1.0',
          result: 'success',
          metadata: {
            revokeAllSessions: true,
            sessionsRevoked: 3,
          },
        })
      );
    });

    it('should create audit log for failed logout attempts', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'invalid-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow();

      // Should create failure audit log
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          sessionId: 'invalid-session',
          eventType: 'user_logout',
          eventSeverity: 'warning',
          result: 'failure',
          metadata: { error: 'Session not found or does not belong to user' },
        })
      );
    });
  });

  describe('execute - business event logging', () => {
    it('should record successful logout business event', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'session-uuid-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(mockSession);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act
      await logoutUserUseCase.execute(input);

      // Assert - monitoring.recordBusinessEvent should be called
      const { monitoring } = await import('../../shared/monitoring');
      expect(monitoring.recordBusinessEvent).toHaveBeenCalledWith('user_logout_success', {
        userId: '1',
        sessionsRevoked: 1,
        duration: expect.any(Number),
      });
    });

    it('should record failed logout business event', async () => {
      // Arrange
      const input: LogoutUserInput = {
        userId: 1,
        sessionId: 'invalid-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      };

      mockSessionRepository.revokeSession = vi.fn().mockResolvedValue(undefined);
      mockSessionRepository.findById = vi.fn().mockResolvedValue(null);
      mockAuditRepository.create = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(logoutUserUseCase.execute(input)).rejects.toThrow();

      // Assert - monitoring.recordBusinessEvent should be called for failure
      const { monitoring } = await import('../../shared/monitoring');
      expect(monitoring.recordBusinessEvent).toHaveBeenCalledWith('user_logout_failed', {
        userId: '1',
        duration: expect.any(Number),
        error: 'Session not found or does not belong to user',
      });
    });
  });
});