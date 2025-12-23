/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:13:37
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { config } from 'dotenv';
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { eq, and, lt, gt, desc, isNotNull } from 'drizzle-orm';
import { db } from './infrastructure/database/connection';
import { sessions } from './infrastructure/database/schema';
import { initSentry } from './shared/sentry';
import { monitoring } from './shared/monitoring';
import { logger } from './shared/logger';
import { authRateLimitMiddleware, tokenValidationRateLimitMiddleware } from './web/middleware/rate-limit-middleware';

// Load environment variables from .env file
config();

import { config as appConfig } from './shared/config';

// Extend Elysia context types to include user property
declare module 'elysia' {
  interface Context {
    user?: import('./infrastructure/auth/jwt-service').JWTPayload;
  }
  interface Store {
    user?: import('./infrastructure/auth/jwt-service').JWTPayload;
    session?: {
      id: string;
      isActive: boolean;
      lastActivityAt: Date;
      riskScore: number;
    };
  }
}

// Initialize Sentry
initSentry();

// Infrastructure
import { JWTService } from './infrastructure/auth/jwt-service';
import { JWTServiceV2 } from './infrastructure/auth/jwt-service-v2';
import { UserRepository } from './infrastructure/database/repositories/user-repository';
import { SessionRepository } from './infrastructure/database/repositories/session-repository';
import { AuditRepository } from './infrastructure/database/repositories/audit-repository';
import { RoleRepository } from './infrastructure/database/repositories/role-repository';
import { PermissionRepository } from './infrastructure/database/repositories/permission-repository';
import { UserAttributesRepository } from './infrastructure/database/repositories/user-attributes-repository';
import { AbacConditionRepository } from './infrastructure/database/repositories/abac-condition-repository';
import { db } from './infrastructure/database/connection';
import { sessions } from './infrastructure/database/schema';

// Application
import { LoginUserUseCase } from './application/use-cases/login-user';
import { LoginUserV2UseCase } from './application/use-cases/login-user-v2';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token';
import { LogoutUserUseCase } from './application/use-cases/logout-user';
import { RegisterUserUseCase } from './application/use-cases/register-user';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user';
import { UpdateUserUseCase } from './application/use-cases/update-user';
import { ChangePasswordUseCase } from './application/use-cases/change-password';

// Services
import { PermissionService } from './application/services/permission-service';
import { RiskScoringService } from './application/services/risk-scoring-service';

// Web
import { jwtMiddleware } from './web/middleware/jwt-middleware';
import { securityHeadersMiddleware } from './web/middleware/security-headers-middleware';
import { createAuthController } from './web/controllers/auth-controller';
import { createAuthControllerV2 } from './web/controllers/auth-controller-v2';
import { createErrorController } from './web/controllers/error-controller';
import { createSessionMiddleware, sessionValidationMiddleware, getCurrentUser, getCurrentSession } from './web/middleware/session-middleware';
import { createAuthorizationMiddleware } from './web/middleware/authorization-middleware';
import { createRiskAssessmentMiddleware } from './web/middleware/risk-assessment-middleware';

// Jobs
import { initializeSessionCleanupJob } from './shared/session-cleanup-job';

// Dependency injection setup (in a real app, this would be handled by a DI container)
const jwtService = new JWTService();
const jwtServiceV2 = new JWTServiceV2();
const userRepository = new UserRepository();
const sessionRepository = new SessionRepository();
const auditRepository = new AuditRepository();
const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();
const userAttributesRepository = new UserAttributesRepository();
const abacConditionRepository = new AbacConditionRepository();

// Phase 4: ABAC & Context-Aware Authorization Services
const riskScoringService = new RiskScoringService(auditRepository, sessionRepository, userRepository);
const permissionService = new PermissionService(
  permissionRepository,
  roleRepository,
  userRepository,
  userAttributesRepository,
  abacConditionRepository
);

// PDP (Policy Decision Point) - pure authorization logic
const { PolicyDecisionPoint } = await import('./application/services/policy-decision-point');
const policyDecisionPoint = new PolicyDecisionPoint(permissionService, riskScoringService);

// Initialize V2 services
await jwtServiceV2.initialize();

// Initialize Phase 4 services
await permissionService.initialize();

// Legacy use cases (backward compatibility)
const loginUserUseCase = new LoginUserUseCase(jwtService, userRepository);
const registerUserUseCase = new RegisterUserUseCase(jwtService, userRepository);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, jwtService);

// V2 use cases with session management
const loginUserV2UseCase = new LoginUserV2UseCase(jwtServiceV2, userRepository, sessionRepository, auditRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(jwtServiceV2, sessionRepository, auditRepository, userRepository);
const logoutUserUseCase = new LogoutUserUseCase(sessionRepository, auditRepository);

// Initialize background jobs
initializeSessionCleanupJob(sessionRepository);

// Request logging middleware
const requestLogger = new Elysia({ name: 'request-logger' })
  .onRequest(({ request }) => {
    const startTime = Date.now();
    request.startTime = startTime;
  })
  .onAfterResponse(({ request, response }) => {
    const startTime = request.startTime as number;
    const duration = Date.now() - startTime;
    const url = new URL(request.url);
    const method = request.method;

    // Get status code from response
    let statusCode = 200;
    if (response && typeof response === 'object' && 'status' in response) {
      statusCode = (response as any).status || 200;
    }

    monitoring.recordRequest(method, url.pathname, statusCode, duration);

    // Check performance thresholds every 100 requests
    if (monitoring.getHealthData().metrics.requests.total % 100 === 0) {
      monitoring.checkPerformanceThresholds();
    }
  })
  .onError(({ error, request }) => {
    const startTime = request.startTime as number;
    const duration = startTime ? Date.now() - startTime : 0;
    const url = new URL(request.url);
    const method = request.method;

    monitoring.recordRequestError(method, url.pathname, error as Error, duration);
  });

// Create Elysia app
async function createApp() {
  const app = new Elysia()
  .use(cors({
    origin: true, // Allow any origin for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Accept',
      'Accept-Encoding',
      'Accept-Language',
      'Authorization',
      'Cache-Control',
      'Content-Type',
      'Content-Length',
      'Origin',
      'User-Agent',
      'X-Requested-With',
      'X-Forwarded-For',
      'X-Forwarded-Proto',
      'X-Real-IP',
      'X-Client-IP'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  }))
  .use(securityHeadersMiddleware())
  .use(openapi({
    documentation: {
      info: {
        title: 'Keygen Customer Portal API',
        description: 'REST API for the Keygen Customer Portal backend',
        version: '1.0.0',
        contact: {
          name: 'Bivex Support',
          email: 'support@b-b.top',
          url: 'https://github.com/bivex'
        },
        license: {
          name: 'MIT License'
        }
      },
      servers: [
        {
          url: `http://localhost:${appConfig.port}`,
          description: 'Development server'
        },
        {
          url: 'https://api.keygen-portal.com',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))
  .use(requestLogger)
  .use(jwtMiddleware(jwtService))
  .get('/', () => ({
    message: 'Welcome to Keygen Customer Portal API',
    version: '1.0.0',
    environment: appConfig.environment,
  }), {
    response: t.Object({
      message: t.String(),
      version: t.String(),
      environment: t.String(),
    }),
    detail: {
      summary: 'API Information',
      tags: ['System'],
    },
  })
  .get('/health', () => monitoring.getHealthData(), {
    response: t.Object({
      status: t.String(),
      timestamp: t.String(),
      uptime: t.Number(),
      version: t.String(),
      metrics: t.Object({
        requests: t.Object({
          total: t.Number(),
          errors: t.Number(),
          averageResponseTime: t.Number(),
        }),
        database: t.Object({
          queryCount: t.Number(),
          errors: t.Number(),
          averageQueryTime: t.Number(),
        }),
        business: t.Object({
          userRegistrations: t.Number(),
          userLogins: t.Number(),
          failedLogins: t.Number(),
          activeUsers: t.Number(),
        }),
      }),
    }),
    detail: {
      summary: 'Health Check',
      tags: ['System'],
    },
  })
  .get('/metrics', () => monitoring.getHealthData(), {
    response: t.Object({
      status: t.String(),
      timestamp: t.String(),
      uptime: t.Number(),
      version: t.String(),
      metrics: t.Object({
        requests: t.Object({
          total: t.Number(),
          errors: t.Number(),
          averageResponseTime: t.Number(),
        }),
        database: t.Object({
          queryCount: t.Number(),
          errors: t.Number(),
          averageQueryTime: t.Number(),
        }),
        business: t.Object({
          userRegistrations: t.Number(),
          userLogins: t.Number(),
          failedLogins: t.Number(),
          activeUsers: t.Number(),
        }),
      }),
    }),
    detail: {
      summary: 'Metrics',
      tags: ['System'],
    },
  }) // Alias for health endpoint
  // .use(authRateLimitMiddleware()) // Temporarily disabled for development
  .use(tokenValidationRateLimitMiddleware())
  .use(createAuthController({ loginUserUseCase, registerUserUseCase, getCurrentUserUseCase, updateUserUseCase, changePasswordUseCase, jwtService }))
  // Phase 3: Session Management & Token Refresh with Rotation
  .use(createAuthControllerV2({
    loginUserV2UseCase,
    refreshTokenUseCase,
    logoutUserUseCase,
    jwtServiceV2,
    sessionRepository,
    auditRepository,
  }))

  // Protected auth V2 routes with session middleware
  .get('/auth/v2/sessions', async ({ set, store }) => {
    console.log('========================================');
    console.log('[Sessions Controller] HANDLER CALLED!!!');
    console.log('========================================');
    console.log('[Sessions Controller] Store contents:', {
      hasUser: !!store.user,
      hasSession: !!store.session,
      user: store.user,
      session: store.session,
    });
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

      const sessions = await sessionRepository.findActiveByUserId(currentUser.userId);

      const response = {
        sessions: sessions.map(session => {
          // Parse user agent to get device info
          const ua = session.userAgent || '';
          let device = 'Unknown Device';

          if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')) {
            device = 'Android Mobile';
          } else if (ua.toLowerCase().includes('iphone')) {
            device = 'iPhone';
          } else if (ua.toLowerCase().includes('ipad')) {
            device = 'iPad';
          } else if (ua.toLowerCase().includes('mac')) {
            device = 'Mac';
          } else if (ua.toLowerCase().includes('windows')) {
            device = 'Windows PC';
          } else if (ua.toLowerCase().includes('linux')) {
            device = 'Linux PC';
          } else if (ua.toLowerCase().includes('chrome')) {
            device = 'Chrome Browser';
          } else if (ua.toLowerCase().includes('firefox')) {
            device = 'Firefox Browser';
          } else if (ua.toLowerCase().includes('safari')) {
            device = 'Safari Browser';
          }

          return {
            id: session.id,
            device: device,
            location: session.ipAddress ? `${session.ipAddress}` : 'Unknown Location',
            lastActivity: session.lastActivityAt.toISOString(),
            current: session.id === currentSession.id,
            ipAddress: session.ipAddress || undefined,
            userAgent: session.userAgent || undefined,
            riskScore: session.riskScore,
          };
        }),
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
        error: errorMessage,
      });

      set.status = 500;
      return { message: errorMessage };
    }
  }, {
    beforeHandle: [sessionValidationMiddleware(jwtServiceV2, sessionRepository, auditRepository)],
  })

  // Test endpoint for DELETE functionality
  .get('/auth/v2/test-delete/:sessionId', async ({ params }) => {
    console.log('========================================');
    console.log('[TEST DELETE] Handler called for sessionId:', params.sessionId);
    console.log('========================================');
    return { success: true, message: 'Test DELETE endpoint reached', sessionId: params.sessionId };
  })

  // Revoke session endpoint
  .delete('/auth/v2/sessions/:sessionId', async ({ params, set, store }) => {
    console.log('========================================');
    console.log('[DELETE /auth/v2/sessions/:sessionId] HANDLER CALLED!!!');
    console.log('========================================');

    const currentUser = getCurrentUser({ store });
    const currentSession = getCurrentSession({ store });

    logger.info({
      message: '[DELETE Sessions] Handler started',
      userId: currentUser?.userId,
      sessionId: currentSession?.id,
      targetSessionId: params.sessionId,
    });

    try {
      monitoring.recordBusinessEvent('api_v2_session_revoke_attempt', {
        userId: currentUser.userId.toString(),
        targetSessionId: params.sessionId,
      });

      // Verify the session belongs to the current user
      const session = await sessionRepository.findById(params.sessionId);
      if (!session || session.userId !== currentUser.userId) {
        logger.warn({
          message: '[DELETE Sessions] Session not found or not owned by user',
          targetSessionId: params.sessionId,
          userId: currentUser.userId,
          sessionFound: !!session,
          sessionUserId: session?.userId,
        });
        set.status = 404;
        return { message: 'Session not found' };
      }

      await sessionRepository.revokeSession(params.sessionId, 'user_revoked');

      monitoring.recordBusinessEvent('api_v2_session_revoke_success', {
        userId: currentUser.userId.toString(),
        targetSessionId: params.sessionId,
      });

      logger.info({
        message: '[DELETE Sessions] Session revoked successfully',
        userId: currentUser.userId,
        targetSessionId: params.sessionId,
      });

      return { success: true, message: 'Session revoked successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log detailed error information for debugging
      logger.error(error instanceof Error ? error : new Error(errorMessage), 'Session revoke V2 endpoint error');

      monitoring.recordBusinessEvent('api_v2_session_revoke_failed', {
        userId: currentUser.userId.toString(),
        targetSessionId: params.sessionId,
        error: errorMessage
      });

      set.status = 500;
      return { message: errorMessage };
    }
  }, {
    beforeHandle: [sessionValidationMiddleware(jwtServiceV2, sessionRepository, auditRepository)],
  })

  // Debug endpoint to show all session data from database
  .get('/auth/v2/sessions/debug', async ({ set, store }) => {
    console.log('========================================');
    console.log('[DEBUG] Sessions Debug Endpoint Called');
    console.log('========================================');

    const currentUser = getCurrentUser({ store });

    try {
      monitoring.recordBusinessEvent('api_v2_sessions_debug_attempt', {
        userId: currentUser.userId.toString(),
      });

      // Get all sessions for the current user with full database fields
      const allSessions = await sessionRepository.findActiveByUserId(currentUser.userId);

      const response = {
        totalSessions: allSessions.length,
        sessions: allSessions.map(session => ({
          // All database fields
          id: session.id,
          userId: session.userId,
          accessTokenJti: session.accessTokenJti,
          refreshTokenJti: session.refreshTokenJti,
          ipAddress: session.ipAddress,
          ipHash: session.ipHash,
          userAgent: session.userAgent,
          userAgentHash: session.userAgentHash,
          deviceFingerprint: session.deviceFingerprint,
          geolocation: session.geolocation,
          riskScore: session.riskScore,
          isActive: session.isActive,
          lastActivityAt: session.lastActivityAt?.toISOString(),
          expiresAt: session.expiresAt?.toISOString(),
          revokedAt: session.revokedAt?.toISOString(),
          revokedReason: session.revokedReason,
          createdAt: session.createdAt?.toISOString(),
          updatedAt: session.updatedAt?.toISOString(),

          // Computed fields for UI
          device: (() => {
            const ua = session.userAgent || '';
            if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')) return 'Android Mobile';
            if (ua.toLowerCase().includes('iphone')) return 'iPhone';
            if (ua.toLowerCase().includes('ipad')) return 'iPad';
            if (ua.toLowerCase().includes('mac')) return 'Mac';
            if (ua.toLowerCase().includes('windows')) return 'Windows PC';
            if (ua.toLowerCase().includes('linux')) return 'Linux PC';
            if (ua.toLowerCase().includes('chrome')) return 'Chrome Browser';
            if (ua.toLowerCase().includes('firefox')) return 'Firefox Browser';
            if (ua.toLowerCase().includes('safari')) return 'Safari Browser';
            return 'Unknown Device';
          })(),
          location: session.ipAddress ? `${session.ipAddress}` : 'Unknown Location',
          current: false, // Will be set below
          timeAgo: (() => {
            const now = new Date();
            const lastActivity = session.lastActivityAt;
            if (!lastActivity) return 'Never';

            const diffMs = now.getTime() - lastActivity.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays < 7) return `${diffDays} days ago`;
            return lastActivity.toLocaleDateString();
          })(),
          expiresIn: (() => {
            const now = new Date();
            const expires = session.expiresAt;
            if (!expires) return 'Never';

            const diffMs = expires.getTime() - now.getTime();
            if (diffMs < 0) return 'Expired';

            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) return `${diffMins} minutes`;
            if (diffHours < 24) return `${diffHours} hours`;
            if (diffDays < 7) return `${diffDays} days`;
            return expires.toLocaleDateString();
          })(),
        })),
      };

      // Set current session flag
      const currentSession = getCurrentSession({ store });
      if (currentSession) {
        const currentSessionData = response.sessions.find(s => s.id === currentSession.id);
        if (currentSessionData) {
          currentSessionData.current = true;
        }
      }

      monitoring.recordBusinessEvent('api_v2_sessions_debug_success', {
        userId: currentUser.userId.toString(),
        sessionCount: response.sessions.length,
      });

      console.log('[DEBUG] Returning debug data for', response.sessions.length, 'sessions');

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('[DEBUG] Error in sessions debug endpoint:', errorMessage);

      monitoring.recordBusinessEvent('api_v2_sessions_debug_failed', {
        userId: currentUser.userId.toString(),
        error: errorMessage,
      });

      set.status = 500;
      return { message: errorMessage };
    }
  }, {
    beforeHandle: [sessionValidationMiddleware(jwtServiceV2, sessionRepository, auditRepository)],
  })

  // Admin debug endpoint - shows ALL sessions in database (for development only)
  .get('/admin/debug/sessions', async ({ set }) => {
    console.log('========================================');
    console.log('[ADMIN DEBUG] All Sessions Debug Endpoint Called');
    console.log('========================================');

    try {
      // Direct database query to get all sessions
      const allSessions = await db
        .select()
        .from(sessions)
        .orderBy(desc(sessions.createdAt));

      const response = {
        totalSessions: allSessions.length,
        sessions: allSessions.map(session => ({
          // Raw database fields
          id: session.id,
          userId: session.userId,
          accessTokenJti: session.accessTokenJti,
          refreshTokenJti: session.refreshTokenJti,
          ipAddress: session.ipAddress,
          ipHash: session.ipHash,
          userAgent: session.userAgent,
          userAgentHash: session.userAgentHash,
          deviceFingerprint: session.deviceFingerprint,
          geolocation: session.geolocation,
          riskScore: session.riskScore,
          isActive: session.isActive,
          lastActivityAt: session.lastActivityAt?.toISOString(),
          expiresAt: session.expiresAt?.toISOString(),
          revokedAt: session.revokedAt?.toISOString(),
          revokedReason: session.revokedReason,
          createdAt: session.createdAt?.toISOString(),
          updatedAt: session.updatedAt?.toISOString(),

          // Computed fields
          deviceType: (() => {
            const ua = session.userAgent || '';
            if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')) return 'Android Mobile';
            if (ua.toLowerCase().includes('iphone')) return 'iPhone';
            if (ua.toLowerCase().includes('ipad')) return 'iPad';
            if (ua.toLowerCase().includes('mac')) return 'Mac';
            if (ua.toLowerCase().includes('windows')) return 'Windows PC';
            if (ua.toLowerCase().includes('linux')) return 'Linux PC';
            if (ua.toLowerCase().includes('chrome')) return 'Chrome Browser';
            if (ua.toLowerCase().includes('firefox')) return 'Firefox Browser';
            if (ua.toLowerCase().includes('safari')) return 'Safari Browser';
            return 'Unknown Device';
          })(),
          status: session.isActive ? 'Active' : 'Inactive',
          isExpired: session.expiresAt ? new Date() > session.expiresAt : false,
          isRevoked: !!session.revokedAt,
        })),
      };

      console.log('[ADMIN DEBUG] Returning all sessions data:', response.totalSessions, 'total sessions');

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('[ADMIN DEBUG] Error in admin sessions debug endpoint:', errorMessage);

      set.status = 500;
      return { message: errorMessage };
    }
  })

  // Error logging from frontend
  .use(createErrorController())

  // Phase 4: ABAC Protected Routes Example
  .get('/protected/license', async (context: any) => {
    const { store } = context;

    return {
      message: 'License data accessed successfully',
      user: store.user ? { id: store.user.userId, email: store.user.email } : null,
      authorization: store.authorization,
      riskAssessment: store.riskAssessment,
    };
  }, {
    beforeHandle: [
      // Session validation
      createSessionMiddleware(jwtServiceV2, sessionRepository, auditRepository),
      // Permission check (via PDP)
      createAuthorizationMiddleware(permissionService, policyDecisionPoint)({
        resource: 'license',
        action: 'read',
      }),
      // Risk assessment
      createRiskAssessmentMiddleware(riskScoringService)({
        resource: 'license',
        action: 'read',
        highRiskThreshold: 80,
        blockCriticalRisk: true,
      }),
    ],
    response: t.Object({
      message: t.String(),
      user: t.Optional(t.Object({
        id: t.Number(),
        email: t.String(),
      })),
      authorization: t.Optional(t.Any()),
      riskAssessment: t.Optional(t.Any()),
    }),
    detail: {
      summary: 'Protected license endpoint with ABAC',
      tags: ['ABAC Demo'],
      security: [{ bearerAuth: [] }],
    },
  })

  .post('/protected/license', async (context: any) => {
    const { store } = context;

    return {
      message: 'License created successfully',
      authorization: store.authorization,
      riskAssessment: store.riskAssessment,
    };
  }, {
    beforeHandle: [
      createSessionMiddleware(jwtServiceV2, sessionRepository, auditRepository),
      createAuthorizationMiddleware(permissionService, policyDecisionPoint)({
        resource: 'license',
        action: 'create',
        requireSecurityLevel: 2, // Require recent login
      }),
      createRiskAssessmentMiddleware(riskScoringService)({
        resource: 'license',
        action: 'create',
        highRiskThreshold: 70,
        blockHighRisk: true,
      }),
    ],
    response: t.Object({
      message: t.String(),
      authorization: t.Any(),
      riskAssessment: t.Any(),
    }),
    detail: {
      summary: 'Create license with elevated security requirements',
      tags: ['ABAC Demo'],
      security: [{ bearerAuth: [] }],
    },
  })
  .get('/protected', ({ store, set }: any) => {
    const user = store.user;
    if (!user) {
      set.status = 401;
      return { message: 'Authentication required' };
    }
    return {
      message: 'This is a protected route',
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
    };
  }, {
    response: {
      200: t.Object({
        message: t.String(),
        user: t.Object({
          id: t.Number(),
          email: t.String(),
          name: t.String(),
        }),
      }),
      401: t.Object({
        message: t.String(),
      }),
    },
    detail: {
      summary: 'Protected Route',
      tags: ['System'],
      security: [{ bearerAuth: [] }],
    },
  })
  .listen(appConfig.port);

console.log(`🚀 Keygen Customer Portal Backend is running at ${app.server?.hostname}:${app.server?.port}`);
  return app;
}

// Initialize and start the application
createApp().catch((error) => {
  logger.error(error, 'Failed to start application');
  process.exit(1);
});
