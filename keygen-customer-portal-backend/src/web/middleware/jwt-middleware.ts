/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { JWTService, type JWTPayload } from '../../infrastructure/auth/jwt-service';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

export const jwtMiddleware = (authService: JWTService) => {
  return new Elysia()
    .decorate('authenticate', function (context: any) {
      const user = (context.store as any)?.user;
      logger.debug({ userInStore: !!user, user: user ? { userId: user.userId, email: user.email } : 'undefined' }, '[JWT] Authenticate called');
      logger.debug({ store: context.store }, '[JWT] Store contents');

      if (!user) {
        monitoring.recordBusinessEvent('authentication_required_access_denied', {});
        logger.warn('[JWT] Authentication failed: no user in store');
        throw new Error('Authentication required');
      }

      monitoring.recordBusinessEvent('protected_route_accessed', {
        userId: user.userId.toString(),
        email: user.email,
      });

      logger.debug({ userId: user.userId }, '[JWT] Authentication successful');
      return { user };
    })
    .onRequest(({ request, store }) => {
      const authHeader = request.headers.get('authorization');
      const url = new URL(request.url);
      const pathname = url.pathname;

      logger.debug({ method: request.method, url: url.toString(), hasAuthHeader: !!authHeader }, '[JWT] Processing request');

      // Skip JWT validation for auth endpoints that don't require authentication
      if (pathname.startsWith('/auth/') && !pathname.endsWith('/me') && !pathname.endsWith('/logout') && !pathname.endsWith('/change-password')) {
        logger.debug({ endpoint: pathname }, '[JWT] Skipping JWT validation for auth endpoint');
        (store as any).user = undefined;
        return;
      }

      let user: JWTPayload | undefined;
      const hasAuthHeader = authHeader && authHeader.startsWith('Bearer ');

      if (hasAuthHeader) {
        const token = authHeader!.substring(7); // Remove 'Bearer ' prefix
        logger.debug('[JWT] Token present, verifying...');

        try {
          user = authService.verifyToken(token);
          logger.debug({ userId: user.userId }, '[JWT] Token verified successfully');
          monitoring.recordBusinessEvent('jwt_token_validated', {
            userId: user.userId.toString(),
            email: user.email,
          });
        } catch (error) {
          logger.warn({ error: error instanceof Error ? error.message : 'Unknown error' }, '[JWT] Token verification failed');
          monitoring.recordBusinessEvent('jwt_token_invalid', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Token is invalid, user remains undefined
        }
      } else {
        logger.debug('[JWT] No auth header or not Bearer token');
        monitoring.recordBusinessEvent('jwt_no_token_provided', {});
      }

      (store as any).user = user;
      logger.debug({ hasUser: !!user }, '[JWT] User stored in request context');
    });
};