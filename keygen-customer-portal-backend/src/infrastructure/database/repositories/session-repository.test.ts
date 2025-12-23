/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { SessionRepository } from './session-repository';
import type { ISessionRepository } from './session-repository';

// Mock the database connection for individual test runs
vi.mock('../connection', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock crypto for individual test runs
vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mocked-hash'),
    }),
  },
}));

describe('SessionRepository', () => {
  let sessionRepository: SessionRepository;
  let mockDb: any;

  const mockSession = {
    id: 'session-uuid-123',
    userId: 1,
    accessTokenJti: 'access-jti-123',
    refreshTokenJti: 'refresh-jti-456',
    ipAddress: '127.0.0.1',
    ipHash: 'ip-hash-123',
    userAgent: 'TestAgent/1.0',
    userAgentHash: 'ua-hash-456',
    deviceFingerprint: 'device-fingerprint-789',
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

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Import and setup mock db
    const { db } = await import('../connection');
    mockDb = db;

    // Create repository instance
    sessionRepository = new SessionRepository();
  });

  describe('create', () => {
    it('should create a new session successfully', async () => {
      // Arrange
      const input = {
        userId: 1,
        accessTokenJti: 'access-jti-123',
        refreshTokenJti: 'refresh-jti-456',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceFingerprint: 'device-fingerprint-789',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        riskScore: 5,
      };

      const mockInsertResult = {
        id: 'generated-session-id',
        ...input,
        ipHash: 'mocked-hash',
        userAgentHash: 'mocked-hash',
        isActive: true,
        lastActivityAt: new Date(),
        revokedAt: null,
        revokedReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the database operations
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockInsertResult]),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act
      const result = await sessionRepository.create(input);

      // Assert
      expect(result).toEqual({
        id: 'generated-session-id',
        userId: 1,
        accessTokenJti: 'access-jti-123',
        refreshTokenJti: 'refresh-jti-456',
        ipAddress: '192.168.1.100',
        ipHash: 'mocked-hash',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        userAgentHash: 'mocked-hash',
        deviceFingerprint: 'device-fingerprint-789',
        geolocation: undefined,
        riskScore: 5,
        isActive: true,
        lastActivityAt: expect.any(Date),
        expiresAt: input.expiresAt,
        revokedAt: null,
        revokedReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertQuery.values).toHaveBeenCalledWith({
        userId: input.userId,
        accessTokenJti: input.accessTokenJti,
        refreshTokenJti: input.refreshTokenJti,
        ipAddress: input.ipAddress,
        ipHash: 'mocked-hash',
        userAgent: input.userAgent,
        userAgentHash: 'mocked-hash',
        deviceFingerprint: input.deviceFingerprint,
        geolocation: input.geolocation || null,
        riskScore: input.riskScore,
        isActive: true,
        lastActivityAt: expect.any(Date),
        expiresAt: input.expiresAt,
      });
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const input = {
        userId: 1,
        expiresAt: new Date(),
        riskScore: 0,
      };

      const mockInsertResult = {
        id: 'generated-session-id',
        ...input,
        accessTokenJti: null,
        refreshTokenJti: null,
        ipAddress: null,
        ipHash: null,
        userAgent: null,
        userAgentHash: null,
        deviceFingerprint: null,
        geolocation: null,
        isActive: true,
        lastActivityAt: expect.any(Date),
        revokedAt: null,
        revokedReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockInsertResult]),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act
      const result = await sessionRepository.create(input);

      // Assert
      expect(result.userId).toBe(1);
      expect(result.accessTokenJti).toBeNull();
      expect(result.ipAddress).toBeNull();
      expect(result.deviceFingerprint).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const input = {
        userId: 1,
        expiresAt: new Date(),
        riskScore: 0,
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act & Assert
      await expect(sessionRepository.create(input)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find session by ID', async () => {
      // Arrange
      const sessionId = 'session-uuid-123';

      const mockSelectResult = [mockSession];

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSelectResult),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findById(sessionId);

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockSelectQuery.where).toHaveBeenCalled();
    });

    it('should return null when session not found', async () => {
      // Arrange
      const sessionId = 'non-existent-session';

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findById(sessionId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByRefreshTokenJti', () => {
    it('should find session by refresh token JTI', async () => {
      // Arrange
      const jti = 'refresh-jti-456';

      const mockSelectResult = [mockSession];

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSelectResult),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findByRefreshTokenJti(jti);

      // Assert
      expect(result).toEqual(mockSession);
    });

    it('should return null when no session found with JTI', async () => {
      // Arrange
      const jti = 'non-existent-jti';

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findByRefreshTokenJti(jti);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('should find all active sessions for a user', async () => {
      // Arrange
      const userId = 1;
      const mockActiveSessions = [
        mockSession,
        { ...mockSession, id: 'session-2', accessTokenJti: 'access-jti-789' },
      ];

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockActiveSessions),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findActiveByUserId(userId);

      // Assert
      expect(result).toEqual(mockActiveSessions);
      expect(result).toHaveLength(2);
      expect(mockSelectQuery.where).toHaveBeenCalled();
      expect(mockSelectQuery.orderBy).toHaveBeenCalled();
    });

    it('should return empty array when user has no active sessions', async () => {
      // Arrange
      const userId = 1;

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      mockDb.select.mockReturnValue(mockSelectQuery);

      // Act
      const result = await sessionRepository.findActiveByUserId(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateJTIs', () => {
    it('should update access and refresh token JTIs', async () => {
      // Arrange
      const sessionId = 'session-uuid-123';
      const accessJti = 'new-access-jti';
      const refreshJti = 'new-refresh-jti';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act
      await sessionRepository.updateJTIs(sessionId, accessJti, refreshJti);

      // Assert
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        accessTokenJti: accessJti,
        refreshTokenJti: refreshJti,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle update errors', async () => {
      // Arrange
      const sessionId = 'session-uuid-123';
      const accessJti = 'new-access-jti';
      const refreshJti = 'new-refresh-jti';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act & Assert
      await expect(sessionRepository.updateJTIs(sessionId, accessJti, refreshJti)).rejects.toThrow('Update failed');
    });
  });

  describe('updateLastActivity', () => {
    it('should update last activity timestamp', async () => {
      // Arrange
      const sessionId = 'session-uuid-123';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act
      await sessionRepository.updateLastActivity(sessionId);

      // Assert
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        lastActivityAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session with reason', async () => {
      // Arrange
      const sessionId = 'session-uuid-123';
      const reason = 'user_logout';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act
      await sessionRepository.revokeSession(sessionId, reason);

      // Assert
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        isActive: false,
        revokedAt: expect.any(Date),
        revokedReason: reason,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      // Arrange
      const userId = 1;
      const reason = 'user_logout_all';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { id: 'session-1' },
          { id: 'session-2' },
          { id: 'session-3' },
        ]),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act
      await sessionRepository.revokeAllUserSessions(userId, reason);

      // Assert
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        isActive: false,
        revokedAt: expect.any(Date),
        revokedReason: reason,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle no sessions to revoke', async () => {
      // Arrange
      const userId = 1;
      const reason = 'user_logout_all';

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      // Act
      await sessionRepository.revokeAllUserSessions(userId, reason);

      // Assert
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        isActive: false,
        revokedAt: expect.any(Date),
        revokedReason: reason,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      // Arrange
      const mockDeleteQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { id: 'expired-session-1' },
          { id: 'expired-session-2' },
        ]),
      };

      mockDb.delete.mockReturnValue(mockDeleteQuery);

      // Act
      const result = await sessionRepository.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.where).toHaveBeenCalled();
    });

    it('should handle no expired sessions', async () => {
      // Arrange
      const mockDeleteQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      mockDb.delete.mockReturnValue(mockDeleteQuery);

      // Act
      const result = await sessionRepository.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('hash generation', () => {
    it('should generate IP hash correctly', async () => {
      // Arrange
      const input = {
        userId: 1,
        ipAddress: '192.168.1.100',
        expiresAt: new Date(),
        riskScore: 0,
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act
      await sessionRepository.create(input);

      // Assert
      const valuesCalled = mockInsertQuery.values.mock.calls[0][0];
      expect(valuesCalled.ipHash).toBe('mocked-hash');
    });

    it('should generate user agent hash correctly', async () => {
      // Arrange
      const input = {
        userId: 1,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        expiresAt: new Date(),
        riskScore: 0,
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act
      await sessionRepository.create(input);

      // Assert
      const valuesCalled = mockInsertQuery.values.mock.calls[0][0];
      expect(valuesCalled.userAgentHash).toBe('mocked-hash');
    });

    it('should handle null/undefined values for hashing', async () => {
      // Arrange
      const input = {
        userId: 1,
        expiresAt: new Date(),
        riskScore: 0,
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      // Act
      await sessionRepository.create(input);

      // Assert
      const valuesCalled = mockInsertQuery.values.mock.calls[0][0];
      expect(valuesCalled.ipHash).toBeNull();
      expect(valuesCalled.userAgentHash).toBeNull();
    });
  });
});