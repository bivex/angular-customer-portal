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

import { describe, it, expect, beforeEach, afterEach, vi, mock } from 'bun:test';
import { RefreshTokenUseCase } from './refresh-token';
import { JWTServiceV2 } from '../../infrastructure/auth/jwt-service-v2';
import { SessionRepository } from '../../infrastructure/database/repositories/session-repository';
import { AuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import { UserRepository } from '../../infrastructure/database/repositories/user-repository';
import { db } from '../../infrastructure/database/connection';
import type { User } from '../../domain/models/user';

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

describe('RefreshTokenUseCase - Integration Tests', () => {
  let jwtService: JWTServiceV2;
  let sessionRepository: SessionRepository;
  let auditRepository: AuditRepository;
  let userRepository: UserRepository;
  let refreshTokenUseCase: RefreshTokenUseCase;

  let testUser: User;
  let testSession: any;

  beforeEach(async () => {
    // Initialize real services
    jwtService = new JWTServiceV2();
    await jwtService.initialize();

    sessionRepository = new SessionRepository();
    auditRepository = new AuditRepository();
    userRepository = new UserRepository();

    refreshTokenUseCase = new RefreshTokenUseCase(
      jwtService,
      sessionRepository,
      auditRepository,
      userRepository
    );

    // Create test user
    const hashedPassword = await jwtService.hashPassword('testpassword123');
    const userResult = await db.insert(require('../../infrastructure/database/schema').users)
      .values({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: hashedPassword,
        isActive: true,
      })
      .returning();

    testUser = {
      id: userResult[0].id,
      email: userResult[0].email,
      name: userResult[0].name,
      password: userResult[0].password,
      isActive: userResult[0].isActive,
      createdAt: userResult[0].createdAt,
      updatedAt: userResult[0].updatedAt,
    };
  });

  afterEach(async () => {
    // Clean up test data
    try {
      if (testUser?.id) {
        await db.delete(require('../../infrastructure/database/schema').users)
          .where(require('drizzle-orm').eq(require('../../infrastructure/database/schema').users.id, testUser.id));
      }
      if (testSession?.id) {
        await db.delete(require('../../infrastructure/database/schema').sessions)
          .where(require('drizzle-orm').eq(require('../../infrastructure/database/schema').sessions.id, testSession.id));
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Real Token Generation and Refresh', () => {
    it('should successfully generate and refresh tokens with real JWT service', async () => {
      // Generate initial token pair
      const tokenPair = await jwtService.generateTokenPair({
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sessionId: 'test-session-123',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();

      // Create session in database
      const sessionResult = await db.insert(require('../../infrastructure/database/schema').sessions)
        .values({
          userId: testUser.id,
          accessTokenJti: tokenPair.accessTokenJti,
          refreshTokenJti: tokenPair.refreshTokenJti,
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        })
        .returning();

      testSession = sessionResult[0];

      // Test refresh token verification
      const refreshPayload = await jwtService.verifyRefreshToken(tokenPair.refreshToken);
      expect(refreshPayload.userId).toBe(testUser.id);
      expect(refreshPayload.sid).toBe('test-session-123');
      expect(refreshPayload.type).toBe('refresh');

      // Test token refresh
      const refreshResult = await refreshTokenUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(tokenPair.accessToken); // Should be new
      expect(refreshResult.refreshToken).not.toBe(tokenPair.refreshToken); // Should be new
      expect(refreshResult.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(refreshResult.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should handle token refresh with different IP addresses', async () => {
      // Generate initial token pair
      const tokenPair = await jwtService.generateTokenPair({
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sessionId: 'test-session-ip',
        ipAddress: '192.168.1.100',
        userAgent: 'TestAgent/1.0',
      });

      // Create session
      const sessionResult = await db.insert(require('../../infrastructure/database/schema').sessions)
        .values({
          userId: testUser.id,
          accessTokenJti: tokenPair.accessTokenJti,
          refreshTokenJti: tokenPair.refreshTokenJti,
          ipAddress: '192.168.1.100',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning();

      testSession = sessionResult[0];

      // Test refresh with different IP (should work with soft binding)
      const refreshResult = await refreshTokenUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '10.0.0.50', // Different IP
        userAgent: 'TestAgent/1.0',
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });

    it('should properly handle invalid refresh tokens', async () => {
      // Test with completely invalid token
      await expect(refreshTokenUseCase.execute({
        refreshToken: 'invalid.jwt.token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      })).rejects.toThrow();

      // Test with valid JWT structure but wrong signature
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNjQ5OTE4NDAwLCJleHAiOjE2NTAwMDQ0MDB9.invalid_signature';

      await expect(refreshTokenUseCase.execute({
        refreshToken: invalidToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      })).rejects.toThrow('Refresh token verification failed');
    });

    it('should handle malformed tokens', async () => {
      // Test with completely malformed token
      await expect(refreshTokenUseCase.execute({
        refreshToken: 'not-a-jwt-token',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      })).rejects.toThrow('Refresh token verification failed');
    });

    it('should handle tokens signed with unknown keys', async () => {
      // Create a token that would be signed with a non-existent key
      // This simulates the scenario where the server restarted and old tokens are invalid
      const oldToken = 'eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInNpZCI6InNlc3Npb24iLCJqdGkiOiJvbGQtdG9rZW4iLCJ0eXBlIjoicmVmcmVzaCIsInRva2VuRmFtaWx5IjoiZmFtaWx5IiwiaWF0IjoxNjQ5OTE4NDAwLCJleHAiOjE2NTAwMDQ0MDAsImF1ZCI6ImtleWdlbi1jdXN0b21lci1wb3J0YWwtYXBpIiwiaXNzIjoia2V5Z2VuLWN1c3RvbWVyLXBvcnRhbCJ9.old_signature_with_unknown_key';

      await expect(refreshTokenUseCase.execute({
        refreshToken: oldToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      })).rejects.toThrow('Refresh token verification failed');
    });

    it('should create proper audit logs during token refresh', async () => {
      // Generate initial token pair
      const tokenPair = await jwtService.generateTokenPair({
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sessionId: 'audit-test-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      // Create session
      const sessionResult = await db.insert(require('../../infrastructure/database/schema').sessions)
        .values({
          userId: testUser.id,
          accessTokenJti: tokenPair.accessTokenJti,
          refreshTokenJti: tokenPair.refreshTokenJti,
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning();

      testSession = sessionResult[0];

      // Perform refresh
      await refreshTokenUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      // Check that audit events were created
      const auditEvents = await db.select()
        .from(require('../../infrastructure/database/schema').auditEvents)
        .where(require('drizzle-orm').eq(require('../../infrastructure/database/schema').auditEvents.userId, testUser.id))
        .orderBy(require('drizzle-orm').desc(require('../../infrastructure/database/schema').auditEvents.createdAt))
        .limit(5);

      expect(auditEvents.length).toBeGreaterThan(0);

      // Should have token_refresh and session_created events
      const refreshEvents = auditEvents.filter(e => e.eventType === 'token_refresh');
      const sessionEvents = auditEvents.filter(e => e.eventType === 'session_created');

      expect(refreshEvents.length).toBeGreaterThan(0);
      expect(sessionEvents.length).toBeGreaterThan(0);

      // Clean up audit events
      for (const event of auditEvents) {
        await db.delete(require('../../infrastructure/database/schema').auditEvents)
          .where(require('drizzle-orm').eq(require('../../infrastructure/database/schema').auditEvents.id, event.id));
      }
    });

    it('should handle concurrent refresh attempts (token reuse detection)', async () => {
      // Generate initial token pair
      const tokenPair = await jwtService.generateTokenPair({
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sessionId: 'concurrent-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      // Create session
      const sessionResult = await db.insert(require('../../infrastructure/database/schema').sessions)
        .values({
          userId: testUser.id,
          accessTokenJti: tokenPair.accessTokenJti,
          refreshTokenJti: tokenPair.refreshTokenJti,
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning();

      testSession = sessionResult[0];

      // First refresh should work
      const firstRefresh = await refreshTokenUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(firstRefresh.accessToken).toBeDefined();

      // Second refresh with same token should fail (token reuse)
      await expect(refreshTokenUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      })).rejects.toThrow('Security violation: token reuse detected');
    });
  });

  describe('Key Rotation Scenarios', () => {
    it('should handle key rotation between token generation and refresh', async () => {
      // This test simulates the scenario where keys change between token creation and refresh
      // In a real scenario, this would happen when the server restarts

      // Generate token with current key
      const tokenPair = await jwtService.generateTokenPair({
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sessionId: 'rotation-test-session',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      // Create session
      const sessionResult = await db.insert(require('../../infrastructure/database/schema').sessions)
        .values({
          userId: testUser.id,
          accessTokenJti: tokenPair.accessTokenJti,
          refreshTokenJti: tokenPair.refreshTokenJti,
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning();

      testSession = sessionResult[0];

      // Simulate key rotation by creating a new service instance
      // (In real scenario, this would happen on server restart)
      const newJwtService = new JWTServiceV2();
      await newJwtService.initialize();

      // Create new use case with the new service
      const newRefreshUseCase = new RefreshTokenUseCase(
        newJwtService,
        sessionRepository,
        auditRepository,
        userRepository
      );

      // The refresh should still work because we're using the same key
      // (In a real key rotation scenario, old tokens would fail)
      const refreshResult = await newRefreshUseCase.execute({
        refreshToken: tokenPair.refreshToken,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });
  });
});