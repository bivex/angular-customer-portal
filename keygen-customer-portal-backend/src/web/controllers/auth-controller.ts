/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Import types first to ensure global declarations are loaded before Elysia
import '../../types.d';
import { Elysia, t } from 'elysia';
import { LoginUserUseCase, type ILoginUserUseCase } from '../../application/use-cases/login-user';
import { RegisterUserUseCase, type IRegisterUserUseCase } from '../../application/use-cases/register-user';
import { GetCurrentUserUseCase, type IGetCurrentUserUseCase } from '../../application/use-cases/get-current-user';
import { UpdateUserUseCase, type IUpdateUserUseCase } from '../../application/use-cases/update-user';
import { ChangePasswordUseCase, type IChangePasswordUseCase } from '../../application/use-cases/change-password';
import { JWTService, type JWTPayload } from '../../infrastructure/auth/jwt-service';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';
import { authRateLimitMiddleware, tokenValidationRateLimitMiddleware } from '../middleware/rate-limit-middleware';

// Request/Response DTOs for transport layer
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  };
  token: string;
}

export interface AuthControllerDependencies {
  loginUserUseCase: ILoginUserUseCase;
  registerUserUseCase: IRegisterUserUseCase;
  getCurrentUserUseCase: IGetCurrentUserUseCase;
  updateUserUseCase: IUpdateUserUseCase;
  changePasswordUseCase: IChangePasswordUseCase;
  jwtService: JWTService;
}

export const createAuthController = (deps: AuthControllerDependencies) => {
  return new Elysia({ prefix: '/auth' })
    .post('/login', async ({ body, set }) => {
      // Route logic here...
      try {
        monitoring.recordBusinessEvent('api_login_attempt', { email: body.email });

        const result = await deps.loginUserUseCase.execute({
          email: body.email,
          password: body.password,
          rememberMe: body.rememberMe,
        });

        // Map domain model to transport DTO
        const response: AuthResponse = {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt.toISOString(),
          },
          token: result.token,
        };

        monitoring.recordBusinessEvent('api_login_success', {
          userId: result.user.id.toString(),
          email: result.user.email
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_login_failed', {
          email: body.email,
          error: errorMessage
        });

        // Return appropriate HTTP status codes based on error type
        if (errorMessage.includes('Invalid email or password') || errorMessage.includes('Account is deactivated')) {
          set.status = 401; // Unauthorized
          return { message: errorMessage };
        } else if (errorMessage.includes('Invalid email format')) {
          set.status = 400; // Bad Request
          return { message: errorMessage };
        } else {
          set.status = 500; // Internal Server Error
          return { message: errorMessage };
        }
      }
    }, {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
        rememberMe: t.Optional(t.Boolean()),
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
          token: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
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
        429: t.Object({
          error: t.Object({
            message: t.String(),
            code: t.String(),
            retryAfter: t.Number(),
          }),
        }),
      },
      detail: {
        summary: 'Login user with email and password',
        tags: ['Authentication'],
      },
    })
    .post('/register', async ({ body, set }) => {
      try {
        monitoring.recordBusinessEvent('api_register_attempt', {
          email: body.email,
          name: body.name
        });

        const result = await deps.registerUserUseCase.execute({
          email: body.email,
          password: body.password,
          name: body.name,
        });

        // Map domain model to transport DTO
        const response: AuthResponse = {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt.toISOString(),
          },
          token: result.token,
        };

        monitoring.recordBusinessEvent('api_register_success', {
          userId: result.user.id.toString(),
          email: result.user.email,
          name: result.user.name
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_register_failed', {
          email: body.email,
          name: body.name,
          error: errorMessage
        });

        // Return appropriate HTTP status codes based on error type
        if (errorMessage.includes('User with this email already exists')) {
          set.status = 400; // Bad Request - user already exists
          return { message: errorMessage };
        } else if (errorMessage.includes('Invalid email format') ||
                   errorMessage.includes('Invalid name format') ||
                   errorMessage.includes('Password must be at least')) {
          set.status = 400; // Bad Request - validation error
          return { message: errorMessage };
        } else {
          set.status = 500; // Internal Server Error
          return { message: errorMessage };
        }
      }
    }, {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
        name: t.String(),
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
          token: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
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
        429: t.Object({
          error: t.Object({
            message: t.String(),
            code: t.String(),
            retryAfter: t.Number(),
          }),
        }),
      },
      detail: {
        summary: 'Register a new user',
        tags: ['Authentication'],
      },
    })
    .get('/me', async (context: any) => {
      const { set, store } = context;

      // Check authentication - user should be in store from JWT middleware
      const user = store.user;
      if (!user) {
        set.status = 401;
        monitoring.recordBusinessEvent('api_get_current_user_failed', {
          error: 'Authentication required'
        });
        return { message: 'Authentication required' };
      }

      try {
        monitoring.recordBusinessEvent('api_get_current_user_attempt', {
          userId: user.userId.toString(),
        });

        const result = await deps.getCurrentUserUseCase.execute({
          userId: user.userId,
        });

        // Map domain model to transport DTO
        const response: AuthResponse['user'] = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isActive: result.user.isActive,
          createdAt: result.user.createdAt.toISOString(),
        };

        monitoring.recordBusinessEvent('api_get_current_user_success', {
          userId: result.user.id.toString(),
          email: result.user.email,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_get_current_user_failed', {
          userId: user.userId.toString(),
          error: errorMessage
        });

        set.status = 500; // Internal Server Error for database/user lookup issues
        return { message: errorMessage };
      }
    }, {
      response: {
        200: t.Object({
          id: t.Number(),
          email: t.String({ format: 'email' }),
          name: t.String(),
          isActive: t.Boolean(),
          createdAt: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
      },
      detail: {
        summary: 'Get current authenticated user',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
      },
    })
    .post('/logout', async (context: any) => {
      const { store, set } = context;
      logger.debug('[LOGOUT] Logout endpoint called');

      // Check authentication - user should be in store from JWT middleware
      const user = store.user;
      if (!user) {
        set.status = 401;
        monitoring.recordBusinessEvent('api_logout_failed', {
          error: 'Authentication required'
        });
        return { message: 'Authentication required' };
      }

      const userId = user.userId.toString();
      const email = user.email;

      monitoring.recordBusinessEvent('api_logout_attempt', {
        userId,
        email,
      });

      monitoring.recordBusinessEvent('api_logout_success', {
        userId,
        email,
      });

      logger.debug({ userId }, '[LOGOUT] Logout successful');
      return {
        message: 'Logged out successfully'
      };
    }, {
      response: {
        200: t.Object({
          message: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
      },
      detail: {
        summary: 'Logout current user',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
      },
    })
    .put('/me', async ({ body, set, store }) => {
      // Check authentication - user should be in store from JWT middleware
      const user = store.user;
      if (!user) {
        set.status = 401;
        monitoring.recordBusinessEvent('api_update_profile_failed', {
          error: 'Authentication required'
        });
        return { message: 'Authentication required' };
      }

      try {
        monitoring.recordBusinessEvent('api_update_profile_attempt', {
          userId: user.userId.toString(),
        });

        const result = await deps.updateUserUseCase.execute({
          userId: user.userId,
          name: body.name,
          email: body.email,
        });

        // Map domain model to transport DTO
        const response: AuthResponse['user'] = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isActive: result.user.isActive,
          createdAt: result.user.createdAt.toISOString(),
        };

        monitoring.recordBusinessEvent('api_update_profile_success', {
          userId: result.user.id.toString(),
          email: result.user.email,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_update_profile_failed', {
          userId: user.userId.toString(),
          error: errorMessage
        });

        // Return appropriate HTTP status codes based on error type
        if (errorMessage.includes('Invalid name format') ||
            errorMessage.includes('Invalid email format') ||
            errorMessage.includes('Email is already taken')) {
          set.status = 400; // Bad Request - validation error
          return { message: errorMessage };
        } else if (errorMessage.includes('User not found')) {
          set.status = 404; // Not Found
          return { message: errorMessage };
        } else {
          set.status = 500; // Internal Server Error
          return { message: errorMessage };
        }
      }
    }, {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          id: t.Number(),
          email: t.String({ format: 'email' }),
          name: t.String(),
          isActive: t.Boolean(),
          createdAt: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
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
        summary: 'Update current user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
      },
    })
    .post('/change-password', async ({ body, set, store }) => {
      // Check authentication - user should be in store from JWT middleware
      const user = store.user;
      if (!user) {
        set.status = 401;
        monitoring.recordBusinessEvent('api_change_password_failed', {
          error: 'Authentication required'
        });
        return { message: 'Authentication required' };
      }

      try {
        monitoring.recordBusinessEvent('api_change_password_attempt', {
          userId: user.userId.toString(),
        });

        const result = await deps.changePasswordUseCase.execute({
          userId: user.userId,
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        });

        monitoring.recordBusinessEvent('api_change_password_success', {
          userId: user.userId.toString(),
        });

        return { message: 'Password changed successfully' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_change_password_failed', {
          userId: user.userId.toString(),
          error: errorMessage
        });

        // Return appropriate HTTP status codes based on error type
        if (errorMessage.includes('Current password is incorrect') ||
            errorMessage.includes('Password must be at least')) {
          set.status = 400; // Bad Request - validation error
          return { message: errorMessage };
        } else if (errorMessage.includes('Password change not available')) {
          set.status = 403; // Forbidden
          return { message: errorMessage };
        } else if (errorMessage.includes('User not found')) {
          set.status = 404; // Not Found
          return { message: errorMessage };
        } else {
          set.status = 500; // Internal Server Error
          return { message: errorMessage };
        }
      }
    }, {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
        403: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
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
        summary: 'Change current user password',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
      },
    })
    .post('/refresh', async (context: any) => {
      const { set, store } = context;

      // Check authentication - user should be in store from JWT middleware
      const user = store.user;
      if (!user) {
        set.status = 401;
        monitoring.recordBusinessEvent('api_refresh_token_failed', {
          error: 'Authentication required'
        });
        return { message: 'Authentication required' };
      }

      try {
        monitoring.recordBusinessEvent('api_refresh_token_attempt', {
          userId: user.userId.toString(),
        });

        // Generate new token with same payload but updated expiration
        const tokenPayload: JWTPayload = {
          userId: user.userId,
          email: user.email,
          name: user.name,
        };

        // Determine expiration based on original token's expiration time
        // If original token expires in > 24 hours, it was a remember me token (30d)
        const originalToken = authHeader!.substring(7);
        const originalPayload = deps.jwtService.verifyToken(originalToken);
        const originalExp = originalPayload.exp ? new Date(originalPayload.exp * 1000) : new Date();
        const now = new Date();
        const timeUntilExpiry = originalExp.getTime() - now.getTime();

        // If original token had > 24 hours remaining (was remember me), use 30d, else 24h
        const expiresIn = timeUntilExpiry > (24 * 60 * 60 * 1000) ? '30d' : '24h';
        const token = deps.jwtService.generateToken(tokenPayload, expiresIn);

        monitoring.recordBusinessEvent('api_refresh_token_success', {
          userId: user.userId.toString(),
        });

        return { token };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        monitoring.recordBusinessEvent('api_refresh_token_failed', {
          userId: user.userId.toString(),
          error: errorMessage
        });

        set.status = 500;
        return { message: errorMessage };
      }
    }, {
      response: {
        200: t.Object({
          token: t.String(),
        }),
        401: t.Object({
          message: t.String(),
        }),
      },
      detail: {
        summary: 'Refresh JWT token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
      },
    });
};
