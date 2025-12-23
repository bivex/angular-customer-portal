/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { Auth0Service, type Auth0User } from '../../infrastructure/auth/auth0-service';

// Extend Elysia context to include user information
declare module 'elysia' {
  interface Context {
    user?: Auth0User;
  }
}

export const authMiddleware = (authService: Auth0Service) => {
  return new Elysia()
    .derive({ as: 'global' }, ({ request, set }) => {
      return {
        async authenticate() {
          const authHeader = request.headers.get('authorization');

          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return {
              error: {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required',
                type: 'authentication',
              },
            };
          }

          const token = authHeader.substring(7); // Remove 'Bearer ' prefix

          try {
            const user = await authService.validateToken(token);
            return { user };
          } catch (error) {
            set.status = 401;
            return {
              error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
                type: 'authentication',
              },
            };
          }
        },
      };
    })
    .guard(
      {
        beforeHandle: async ({ authenticate, set }) => {
          const result = await authenticate();
          if ('error' in result) {
            set.status = 401;
            return result;
          }
          return undefined; // Continue to next handler
        },
      },
      {
        detail: {
          tags: ['Authentication Required'],
        },
      }
    );
};

