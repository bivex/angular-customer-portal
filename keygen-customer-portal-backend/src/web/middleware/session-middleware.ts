/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T04:33:37
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { JWTServiceV2, type AccessTokenPayload } from '../../infrastructure/auth/jwt-service-v2';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import { logger } from '../../shared/logger';
import { monitoring } from '../../shared/monitoring';

// Extended context type for session middleware
export interface SessionContext {
  user: AccessTokenPayload & {
    sessionId: string;
    sessionValidated: boolean;
  };
  session: {
    id: string;
    isActive: boolean;
    lastActivityAt: Date;
    riskScore: number;
  };
}

// Session validation middleware function
export const sessionValidationMiddleware = (
  jwtServiceV2: JWTServiceV2,
  sessionRepository: ISessionRepository,
  auditRepository: IAuditRepository
) => async ({ request, set, store }: any) => {
  console.log('[Session Middleware] START - onBeforeHandle called for path:', request.url);

  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { message: 'Authorization header missing or invalid' };
    }

    const token = authHeader.substring(7);
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify access token
    const payload = await jwtServiceV2.verifyAccessToken(token, {
      ipAddress: clientIp,
      userAgent,
    });

    // Validate session exists and is active
    logger.info({
      message: '[Session Middleware] Looking for session',
      jti: payload.jti,
      userId: payload.userId,
      sessionId: payload.sid,
    });

    const session = await sessionRepository.findByAccessTokenJti(payload.jti);

    logger.info({
      message: '[Session Middleware] Session lookup result',
      found: !!session,
      jti: payload.jti,
      sessionId: session?.id,
      isActive: session?.isActive,
      userId: session?.userId,
    });

    if (!session) {
      await auditRepository.create({
        userId: payload.userId,
        sessionId: payload.sid,
        eventType: 'permission_denied',
        eventSeverity: 'warning',
        ipAddress: clientIp,
        userAgent,
        result: 'failure',
        metadata: { reason: 'session_not_found', jti: payload.jti },
        riskIndicators: { suspiciousActivity: true },
      });

      logger.warn({
        message: 'Access token validation failed: session not found',
        userId: payload.userId,
        jti: payload.jti,
        sessionId: payload.sid,
      });

      set.status = 401;
      return { message: 'Invalid session' };
    }

    // Check if session is active
    if (!session.isActive) {
      await auditRepository.create({
        userId: payload.userId,
        sessionId: payload.sid,
        eventType: 'permission_denied',
        eventSeverity: 'warning',
        ipAddress: clientIp,
        userAgent,
        result: 'failure',
        metadata: { reason: 'session_revoked' },
        riskIndicators: { suspiciousActivity: true },
      });

          logger.warn({
            message: 'Access token validation failed: session revoked',
            userId: payload.userId,
            sessionId: session.id,
          });

      set.status = 401;
      return { message: 'Session has been revoked' };
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await auditRepository.create({
        userId: payload.userId,
        sessionId: payload.sid,
        eventType: 'permission_denied',
        eventSeverity: 'warning',
        ipAddress: clientIp,
        userAgent,
        result: 'failure',
        metadata: { reason: 'session_expired' },
      });

          logger.warn({
            message: 'Access token validation failed: session expired',
            userId: payload.userId,
            sessionId: session.id,
            expiresAt: session.expiresAt,
          });

      set.status = 401;
      return { message: 'Session has expired' };
    }

    // Update session activity
    await sessionRepository.updateLastActivity(session.id);

    // Add session info to store
    store.user = {
      ...payload,
      sessionId: session.id,
      sessionValidated: true,
    };

    store.session = {
      id: session.id,
      isActive: session.isActive,
      lastActivityAt: session.lastActivityAt,
      riskScore: session.riskScore,
    };

    // Log successful validation (optional - could be too noisy)
    if (session.riskScore > 50) {
      await auditRepository.create({
        userId: payload.userId,
        sessionId: session.id,
        eventType: 'permission_denied', // Actually allowed but suspicious
        eventSeverity: 'warning',
        ipAddress: clientIp,
        userAgent,
        result: 'failure',
        metadata: { reason: 'high_risk_session_access' },
        riskIndicators: {
          riskScore: session.riskScore,
          highRiskAccess: true,
        },
      });
    }

    monitoring.recordBusinessEvent('session_validation_success', {
      userId: payload.userId.toString(),
      sessionId: session.id,
    });

    console.log('[Session Middleware] Validation complete, store set:', {
      hasUser: !!store.user,
      hasSession: !!store.session,
      userId: store.user?.userId,
      sessionId: store.session?.id,
        });
        logger.info({
          message: '[Session Middleware] Validation complete, passing control to route handler',
        });

    // Return undefined to continue to route handler
    return undefined;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log('[Session Middleware] Error during validation:', errorMessage);

    // Log validation failure
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwtServiceV2.decodeToken(token);

        if (decoded && typeof decoded === 'object') {
          const payload = decoded as AccessTokenPayload;
          await auditRepository.create({
            userId: payload.userId,
            sessionId: payload.sid,
            eventType: 'permission_denied',
            eventSeverity: 'warning',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            result: 'failure',
            metadata: { error: errorMessage },
            riskIndicators: { tokenValidationFailure: true },
          });
        }
      }
        } catch (auditError) {
          logger.error({
            message: 'Failed to audit session validation error',
            error: auditError,
          });
        }

    // Check if this is a key-related error that requires re-authentication
    const requiresReauth = errorMessage.includes('signing key not found') ||
                           errorMessage.includes('Unknown signing key');

        logger.warn({
          message: 'Session validation failed',
          error: errorMessage,
          requiresReauth,
        });

    monitoring.recordBusinessEvent('session_validation_failed', {
      error: errorMessage,
      requiresReauth,
    });

    set.status = 401;
    return {
      message: requiresReauth ? 'Session expired. Please re-authenticate.' : 'Invalid or expired token',
      requiresReauth
    };
  }
};

// Session validation middleware factory - returns Elysia instance with onBeforeHandle (for backward compatibility)
export const createSessionMiddleware = (
  jwtServiceV2: JWTServiceV2,
  sessionRepository: ISessionRepository,
  auditRepository: IAuditRepository
) => {
  return new Elysia()
    .onBeforeHandle(sessionValidationMiddleware(jwtServiceV2, sessionRepository, auditRepository));
};

// Helper function to get current session from context
export const getCurrentSession = (context: any) => {
  if (!context.store?.session) {
    throw new Error('Session middleware not applied or session not validated');
  }
  return context.store.session as SessionContext['session'];
};

// Helper function to get current user with session info
export const getCurrentUser = (context: any) => {
  if (!context.store?.user) {
    throw new Error('Session middleware not applied or user not authenticated');
  }
  return context.store.user as SessionContext['user'];
};