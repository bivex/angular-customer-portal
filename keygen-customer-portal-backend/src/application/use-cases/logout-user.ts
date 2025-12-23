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

import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

// Input DTO
export interface LogoutUserInput {
  userId: number;
  sessionId?: string; // Optional: logout specific session
  revokeAllSessions?: boolean; // Optional: logout from all devices
  ipAddress?: string;
  userAgent?: string;
}

// Output DTO
export interface LogoutUserOutput {
  success: boolean;
  sessionsRevoked: number;
  message: string;
}

// Use case interface
export interface ILogoutUserUseCase {
  execute(input: LogoutUserInput): Promise<LogoutUserOutput>;
}

// Logout use case implementation
export class LogoutUserUseCase implements ILogoutUserUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(input: LogoutUserInput): Promise<LogoutUserOutput> {
    const startTime = Date.now();

    try {
      let sessionsRevoked = 0;
      let message = 'Logged out successfully';

      if (input.revokeAllSessions) {
        // Revoke all user sessions (logout from all devices)
        await this.sessionRepository.revokeAllUserSessions(input.userId, 'user_logout_all');

        // Count revoked sessions
        const activeSessions = await this.sessionRepository.findActiveByUserId(input.userId);
        sessionsRevoked = activeSessions.length;

        message = `Logged out from all devices (${sessionsRevoked} sessions)`;

        logger.info('User logged out from all devices', {
          userId: input.userId,
          sessionsRevoked,
        });
      } else if (input.sessionId) {
        // Revoke specific session
        await this.sessionRepository.revokeSession(input.sessionId, 'user_logout');

        // Verify the session belonged to the user
        const session = await this.sessionRepository.findById(input.sessionId);
        if (!session || session.userId !== input.userId) {
          throw new Error('Session not found or does not belong to user');
        }

        sessionsRevoked = 1;
        message = 'Logged out successfully';

        logger.info('User logged out from specific session', {
          userId: input.userId,
          sessionId: input.sessionId,
        });
      } else {
        // Logout current session (determined by middleware)
        // This should be handled by session middleware providing sessionId
        throw new Error('Session ID required for logout');
      }

      // Log logout event
      await this.auditRepository.create({
        userId: input.userId,
        sessionId: input.sessionId,
        eventType: 'user_logout',
        eventSeverity: 'info',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        result: 'success',
        metadata: {
          revokeAllSessions: input.revokeAllSessions,
          sessionsRevoked,
        },
      });

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_logout_success', {
        userId: input.userId.toString(),
        sessionsRevoked,
        duration,
      });

      return {
        success: true,
        sessionsRevoked,
        message,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      monitoring.recordBusinessEvent('user_logout_failed', {
        userId: input.userId.toString(),
        duration,
        error: errorMessage,
      });

      // Log failed logout attempt
      await this.auditRepository.create({
        userId: input.userId,
        sessionId: input.sessionId,
        eventType: 'user_logout',
        eventSeverity: 'warning',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        result: 'failure',
        metadata: { error: errorMessage },
      }).catch(err => {
        logger.error('Failed to audit logout error', { error: err });
      });

      logger.warn('User logout failed', {
        userId: input.userId,
        sessionId: input.sessionId,
        error: errorMessage,
      });

      throw error;
    }
  }
}