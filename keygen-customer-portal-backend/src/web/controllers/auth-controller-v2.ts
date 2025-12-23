/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T05:08:48
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia, t } from 'elysia';
import { LoginUserV2UseCase, type ILoginUserV2UseCase } from '../../application/use-cases/login-user-v2';
import { RefreshTokenUseCase, type IRefreshTokenUseCase } from '../../application/use-cases/refresh-token';
import { LogoutUserUseCase, type ILogoutUserUseCase } from '../../application/use-cases/logout-user';
import { JWTServiceV2 } from '../../infrastructure/auth/jwt-service-v2';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';
import { createSessionMiddleware, getCurrentUser, getCurrentSession } from '../middleware/session-middleware';

// Request/Response DTOs
export interface LoginV2Request {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface LoginV2Response {
  user: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LogoutRequest {
  sessionId?: string;
  revokeAllSessions?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  sessionsRevoked: number;
  message: string;
}

export interface SessionsResponse {
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActivity: string;
    current: boolean;
    ipAddress?: string;
    userAgent?: string;
    riskScore: number;
  }>;
}

export interface AuthControllerV2Dependencies {
  loginUserV2UseCase: ILoginUserV2UseCase;
  refreshTokenUseCase: IRefreshTokenUseCase;
  logoutUserUseCase: ILogoutUserUseCase;
  jwtServiceV2: JWTServiceV2;
  sessionRepository: ISessionRepository;
  auditRepository: IAuditRepository;
}

export const createAuthControllerV2 = (deps: AuthControllerV2Dependencies) => {
  // Create session middleware for protected routes
  const sessionMiddleware = createSessionMiddleware(
    deps.jwtServiceV2,
    deps.sessionRepository,
    deps.auditRepository
  );

  return new Elysia({ prefix: '/auth/v2' })
    // Login V2 endpoint with session management
    .post('/login', async ({ body, set, request }) => {
      try {
        monitoring.recordBusinessEvent('api_v2_login_attempt', { email: body.email });

        // Use client-provided values, fallback to headers
        const clientIp = body.ipAddress ||
                        request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown';
        const userAgent = body.userAgent ||
                         request.headers.get('user-agent') ||
                         'unknown';

        const result = await deps.loginUserV2UseCase.execute({
          email: body.email,
          password: body.password,
          rememberMe: body.rememberMe,
          ipAddress: clientIp,
          userAgent,
          deviceFingerprint: body.deviceFingerprint,
          deviceFingerprint: request.headers.get('x-device-fingerprint') || undefined,
        });

        const response: LoginV2Response = {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt.toISOString(),
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
          refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
          sessionId: result.sessionId,
        };

        monitoring.recordBusinessEvent('api_v2_login_success', {
          userId: result.user.id.toString(),
          email: result.user.email,
          sessionId: result.sessionId,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log detailed error information for debugging
        logger.error(error instanceof Error ? error : new Error(errorMessage), 'Login V2 endpoint error');

        monitoring.recordBusinessEvent('api_v2_login_failed', {
          email: body.email,
          error: errorMessage
        });

        // Check if this is a key-related error that requires re-authentication
        const requiresReauth = errorMessage.includes('signing key not found') ||
                               errorMessage.includes('Unknown signing key');

        monitoring.recordBusinessEvent('api_v2_login_failed', {
          email: body.email,
          error: errorMessage,
          requiresReauth
        });

        if (errorMessage.includes('Invalid email or password')) {
          set.status = 401;
          return { message: errorMessage, requiresReauth: false };
        } else if (errorMessage.includes('Invalid email format')) {
          set.status = 400;
          return { message: errorMessage, requiresReauth: false };
        } else if (errorMessage.includes('Account is deactivated')) {
          set.status = 403;
          return { message: errorMessage, requiresReauth: false };
        } else if (requiresReauth) {
          set.status = 401;
          return { message: 'Session expired. Please re-authenticate.', requiresReauth: true };
        } else {
          set.status = 500;
          return { message: errorMessage, requiresReauth: false };
        }
      }
    }, {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
        rememberMe: t.Optional(t.Boolean()),
        ipAddress: t.Optional(t.String()),
        userAgent: t.Optional(t.String()),
        deviceFingerprint: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          user: t.Object({
            id: t.Number(),
            email: t.String({ format: 'email' }),
            name: t.String(),
            isActive: t.Boolean(),
            createdAt: t.String(),
          }),
          accessToken: t.String(),
          refreshToken: t.String(),
          accessTokenExpiresAt: t.String(),
          refreshTokenExpiresAt: t.String(),
          sessionId: t.String(),
        }),
        400: t.Object({ message: t.String() }),
        401: t.Object({ message: t.String() }),
        403: t.Object({ message: t.String() }),
        422: t.Object({
          type: t.String(),
          on: t.String(),
          property: t.String(),
          message: t.String(),
          summary: t.String(),
          expected: t.Any(),
          found: t.Any(),
          errors: t.Array(t.Any()),
        }),
      },
      detail: {
        summary: 'Login V2 with session management',
        tags: ['Authentication V2'],
      },
    })

    // Refresh token endpoint with rotation
    .post('/refresh', async ({ body, set, request }) => {
      try {
        monitoring.recordBusinessEvent('api_v2_refresh_attempt', {});

        const clientIp = request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const result = await deps.refreshTokenUseCase.execute({
          refreshToken: body.refreshToken,
          ipAddress: clientIp,
          userAgent,
        });

        const response: RefreshTokenResponse = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
          refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
        };

        monitoring.recordBusinessEvent('api_v2_refresh_success', {});

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if this is a key-related error that requires re-authentication
        const requiresReauth = errorMessage.includes('signing key not found') ||
                               errorMessage.includes('Unknown signing key');

        // Log detailed error information for debugging
        logger.error(error instanceof Error ? error : new Error(errorMessage), 'Refresh token V2 endpoint error');

        monitoring.recordBusinessEvent('api_v2_refresh_failed', {
          error: errorMessage,
          requiresReauth
        });

        set.status = 401;
        return {
          message: requiresReauth ? 'Session expired. Please re-authenticate.' : 'Invalid or expired refresh token',
          requiresReauth
        };
      }
    }, {
      body: t.Object({
        refreshToken: t.String(),
      }),
      response: {
        200: t.Object({
          accessToken: t.String(),
          refreshToken: t.String(),
          accessTokenExpiresAt: t.String(),
          refreshTokenExpiresAt: t.String(),
        }),
        401: t.Object({ message: t.String() }),
        422: t.Object({
          type: t.String(),
          on: t.String(),
          property: t.String(),
          message: t.String(),
          summary: t.String(),
          expected: t.Any(),
          found: t.Any(),
          errors: t.Array(t.Any()),
        }),
      },
      detail: {
        summary: 'Refresh access token with rotation',
        tags: ['Authentication V2'],
      },
    })

    // Logout endpoint with session revocation
    .use(sessionMiddleware)
    .post('/logout', async ({ body, set, store }) => {
        const currentUser = getCurrentUser({ store });
        const currentSession = getCurrentSession({ store });

        try {
          monitoring.recordBusinessEvent('api_v2_logout_attempt', {
            userId: currentUser.userId.toString(),
            sessionId: currentSession.id,
          });

          const result = await deps.logoutUserUseCase.execute({
            userId: currentUser.userId,
            sessionId: body.sessionId || currentSession.id,
            revokeAllSessions: body.revokeAllSessions,
            ipAddress: 'unknown', // TODO: Extract from request
            userAgent: 'unknown', // TODO: Extract from request
          });

          const response: LogoutResponse = {
            success: result.success,
            sessionsRevoked: result.sessionsRevoked,
            message: result.message,
          };

          monitoring.recordBusinessEvent('api_v2_logout_success', {
            userId: currentUser.userId.toString(),
            sessionsRevoked: result.sessionsRevoked,
          });

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Log detailed error information for debugging
          logger.error(error instanceof Error ? error : new Error(errorMessage), 'Logout V2 endpoint error');

          monitoring.recordBusinessEvent('api_v2_logout_failed', {
            userId: currentUser.userId.toString(),
            error: errorMessage
          });

          set.status = 500;
          return { message: errorMessage };
        }
      }, {
        body: t.Object({
          sessionId: t.Optional(t.String()),
          revokeAllSessions: t.Optional(t.Boolean()),
        }),
        response: {
          200: t.Object({
            success: t.Boolean(),
            sessionsRevoked: t.Number(),
            message: t.String(),
          }),
          500: t.Object({ message: t.String() }),
        },
        detail: {
          summary: 'Logout with session revocation',
          tags: ['Authentication V2'],
          security: [{ bearerAuth: [] }],
        },
      })

    // Get active sessions - MOVED TO APP LEVEL
    /*
    .use(sessionMiddleware)
    .get('/sessions', async ({ set, store }) => {
      console.log('========================================');
      console.log('[Sessions Controller] HANDLER CALLED!!!');
      console.log('========================================');
      logger.info({
        message: '[Sessions Controller] Handler started',
      });
      logger.info({
        message: '[Sessions Controller] Store contents',
        hasUser: !!store.user,
        hasSession: !!store.session,
        user: store.user,
        session: store.session,
      });

      const currentUser = getCurrentUser({ store });
      const currentSession = getCurrentSession({ store });

      logger.info({
        message: '[Sessions Controller] Got current user and session',
        userId: currentUser?.userId,
        sessionId: currentSession?.id,
      });

      try {
        monitoring.recordBusinessEvent('api_v2_sessions_list_attempt', {
          userId: currentUser.userId.toString(),
        });

        const sessions = await deps.sessionRepository.findActiveByUserId(currentUser.userId);

        const response: SessionsResponse = {
          sessions: sessions.map(session => ({
            id: session.id,
            device: session.userAgent ? session.userAgent.substring(0, 100) : 'Unknown',
            location: session.geolocation ? 'Unknown' : 'Unknown', // TODO: Implement geolocation
            lastActivity: session.lastActivityAt.toISOString(),
            current: session.id === currentSession.id,
            ipAddress: session.ipAddress || undefined,
            userAgent: session.userAgent || undefined,
            riskScore: session.riskScore,
          })),
        };

        monitoring.recordBusinessEvent('api_v2_sessions_list_success', {
          userId: currentUser.userId.toString(),
          sessionCount: sessions.length,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log detailed error information for debugging
        logger.error(error instanceof Error ? error : new Error(errorMessage), 'Sessions list V2 endpoint error');

        monitoring.recordBusinessEvent('api_v2_sessions_list_failed', {
          userId: currentUser.userId.toString(),
          error: errorMessage
        });

        set.status = 500;
        return { message: errorMessage };
      }
    }, {
      response: {
        200: t.Object({
          sessions: t.Array(t.Object({
            id: t.String(),
            device: t.String(),
            location: t.String(),
            lastActivity: t.String(),
            current: t.Boolean(),
            ipAddress: t.Optional(t.String()),
            userAgent: t.Optional(t.String()),
            riskScore: t.Number(),
          })),
        }),
        500: t.Object({ message: t.String() }),
      },
      detail: {
        summary: 'List active user sessions',
        tags: ['Authentication V2'],
        security: [{ bearerAuth: [] }],
      },
    })
    */

    // Revoke specific session
};