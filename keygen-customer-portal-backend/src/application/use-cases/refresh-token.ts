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

import { JWTServiceV2, type RefreshTokenPayload, type TokenPair } from '../../infrastructure/auth/jwt-service-v2';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

// Input DTO
export interface RefreshTokenInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

// Output DTO
export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// Use case interface
export interface IRefreshTokenUseCase {
  execute(input: RefreshTokenInput): Promise<RefreshTokenOutput>;
}

// Refresh token use case implementation with rotation
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly jwtServiceV2: JWTServiceV2,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Revoke entire token family on security violation
   */
  private async revokeTokenFamily(tokenFamily: string, userId: number, reason: string): Promise<void> {
    try {
      // Get all active sessions for user
      const activeSessions = await this.sessionRepository.findActiveByUserId(userId);

      let revokedCount = 0;
      for (const session of activeSessions) {
        // Check if session belongs to the compromised family
        // This is a simplified check - in production you might want to track family per session
        await this.sessionRepository.revokeSession(session.id, reason);
        revokedCount++;
      }

      logger.warn(`Token family revoked: ${revokedCount} sessions`, {
        tokenFamily,
        userId,
        reason,
        revokedCount,
      });

      monitoring.recordBusinessEvent('token_family_revoked', {
        userId: userId.toString(),
        tokenFamily,
        reason,
        revokedCount: revokedCount.toString(),
      });

    } catch (error) {
      logger.error('Failed to revoke token family', { tokenFamily, userId, reason, error });
      // Don't throw - security violation should still be reported
    }
  }

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const startTime = Date.now();

    try {
      // Verify refresh token
      const refreshPayload = await this.jwtServiceV2.verifyRefreshToken(input.refreshToken);

      // CRITICAL: Check for token reuse attack before any other validation
      // If this JTI has been used before, revoke entire token family
      const existingSession = await this.sessionRepository.findByRefreshTokenJti(refreshPayload.jti);
      if (existingSession && !existingSession.isActive) {
        // TOKEN REUSE DETECTED - Revoke entire token family
        await this.revokeTokenFamily(refreshPayload.tokenFamily, refreshPayload.userId, 'token_reuse_attack');

        await this.auditRepository.create({
          userId: refreshPayload.userId,
          sessionId: refreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: {
            reason: 'token_reuse_attack_detected',
            tokenFamily: refreshPayload.tokenFamily
          },
          riskIndicators: {
            tokenReuseAttack: true,
            entireFamilyRevoked: true
          },
        });

        logger.error('TOKEN REUSE ATTACK DETECTED - Revoking entire family', {
          jti: refreshPayload.jti,
          tokenFamily: refreshPayload.tokenFamily,
          userId: refreshPayload.userId,
        });

        throw new Error('Security violation: token reuse detected');
      }

      // Find session by refresh token JTI
      const session = await this.sessionRepository.findByRefreshTokenJti(refreshPayload.jti);
      if (!session) {
        await this.auditRepository.create({
          userId: refreshPayload.userId,
          sessionId: refreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { reason: 'session_not_found' },
          riskIndicators: { tokenReuseAttempt: true },
        });

        logger.warn('Refresh token attempted for non-existent session', {
          jti: refreshPayload.jti,
          userId: refreshPayload.userId,
        });

        throw new Error('Invalid refresh token');
      }

      // Check if session is active
      if (!session.isActive) {
        await this.auditRepository.create({
          userId: refreshPayload.userId,
          sessionId: refreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { reason: 'session_revoked' },
          riskIndicators: { tokenReuseAttempt: true },
        });

        logger.warn('Refresh token attempted for revoked session', {
          sessionId: session.id,
          userId: refreshPayload.userId,
        });

        throw new Error('Session has been revoked');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.auditRepository.create({
          userId: refreshPayload.userId,
          sessionId: refreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { reason: 'session_expired' },
        });

        logger.warn('Refresh token attempted for expired session', {
          sessionId: session.id,
          userId: refreshPayload.userId,
        });

        throw new Error('Session has expired');
      }

      // Get user info for new tokens
      const user = await this.userRepository.findById(refreshPayload.userId);
      if (!user) {
        await this.auditRepository.create({
          userId: refreshPayload.userId,
          sessionId: refreshPayload.sid,
          eventType: 'token_refresh',
          eventSeverity: 'critical',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { reason: 'user_not_found' },
        });

        throw new Error('User not found');
      }

      // Update session activity
      await this.sessionRepository.updateLastActivity(session.id);

      // Generate new token pair (rotation)
      const newTokenPair = await this.jwtServiceV2.generateTokenPair({
        userId: user.id,
        email: user.email,
        name: user.name,
        sessionId: session.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        roles: ['user'], // Basic role, expand in Phase 4
        permissions: [], // No specific permissions yet
        securityLevel: 1, // Basic level
      });

      // Revoke the old session and create a new one (token rotation)
      // This prevents reuse of the old refresh token
      await this.sessionRepository.revokeSession(session.id, 'token_rotation');

      // Create new session with rotated tokens
      const newSessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const newSession = await this.sessionRepository.create({
        userId: user.id,
        accessTokenJti: newTokenPair.accessTokenJti,
        refreshTokenJti: newTokenPair.refreshTokenJti,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: session.deviceFingerprint,
        expiresAt: newSessionExpiry,
        riskScore: session.riskScore,
      });

      // Log successful token refresh
      try {
        await this.auditRepository.create({
          userId: user.id,
          sessionId: newSession.id,
          eventType: 'token_refresh',
          eventSeverity: 'info',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'success',
          metadata: {
            oldSessionId: session.id,
            newSessionId: newSession.id,
            tokenFamily: refreshPayload.tokenFamily,
          },
        });
      } catch (auditError) {
        logger.error('Failed to audit successful token refresh', { auditError });
      }

      try {
        await this.auditRepository.create({
          userId: user.id,
          sessionId: newSession.id,
          eventType: 'session_created',
          eventSeverity: 'info',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'success',
          metadata: {
            reason: 'token_rotation',
            oldSessionId: session.id,
          },
        });
      } catch (auditError) {
        logger.error('Failed to audit session creation', { auditError });
      }

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('token_refresh_success', {
        userId: user.id.toString(),
        sessionId: newSession.id,
        duration,
      });

      logger.info('Token refresh successful', {
        userId: user.id,
        oldSessionId: session.id,
        newSessionId: newSession.id,
      });

      return {
        accessToken: newTokenPair.accessToken,
        refreshToken: newTokenPair.refreshToken,
        accessTokenExpiresAt: newTokenPair.accessTokenExpiresAt,
        refreshTokenExpiresAt: newTokenPair.refreshTokenExpiresAt,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      monitoring.recordBusinessEvent('token_refresh_failed', {
        duration,
        error: errorMessage,
      });

      // Log refresh failure
      try {
        let userId: number | undefined;
        let sessionId: string | undefined;

        // Try to extract info from token for logging
        try {
          const decoded = this.jwtServiceV2.decodeToken(input.refreshToken);
          if (decoded && typeof decoded === 'object') {
            userId = (decoded as any).userId;
            sessionId = (decoded as any).sid;
          }
        } catch {
          // Ignore decode errors for logging
        }

        await this.auditRepository.create({
          userId,
          sessionId,
          eventType: 'token_refresh',
          eventSeverity: errorMessage.includes('reuse') ? 'critical' : 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { error: errorMessage },
          riskIndicators: {
            suspiciousActivity: true,
            tokenReuseAttempt: errorMessage.includes('reuse'),
          },
        });
      } catch (auditError) {
        logger.error('Failed to audit token refresh error', { auditError });
      }

      logger.warn('Token refresh failed', { error: errorMessage });
      throw error;
    }
  }
}