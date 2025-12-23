/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import type { Elysia } from 'elysia';
import { PermissionService, type IPermissionService } from '../../application/services/permission-service';
import { PolicyDecisionPoint, type PolicyDecisionRequest } from '../../application/services/policy-decision-point';
import { getCurrentUser, getCurrentSession } from './session-middleware';
import { logger } from '../../shared/logger';
import { monitoring } from '../../shared/monitoring';

// Authorization options
export interface AuthorizationOptions {
  resource: string;
  action: string;
  requireSecurityLevel?: number;
  allowAnonymous?: boolean;
  skipRiskCheck?: boolean;
}

// Authorization middleware factory (PEP - Policy Enforcement Point)
export const createAuthorizationMiddleware = (
  permissionService: IPermissionService,
  policyDecisionPoint: PolicyDecisionPoint
) => {
  return (options: AuthorizationOptions) => {
    return async (context: any) => {
      const { set, request } = context;

      // Validate options
      if (!options.resource || !options.action) {
        set.status = 500;
        return { message: 'Invalid authorization options: resource and action are required' };
      }

      try {
        // Extract request context
        const clientIp = request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Try to get current user (may be anonymous)
        let currentUser;
        let currentSession;

        try {
          currentUser = getCurrentUser(context);
          currentSession = getCurrentSession(context);
        } catch (error) {
          // User not authenticated
          if (!options.allowAnonymous) {
            set.status = 401;
            return { message: 'Authentication required' };
          }
          // Continue with anonymous access
        }

        // For anonymous access, only allow if explicitly allowed
        if (!currentUser && !options.allowAnonymous) {
          set.status = 401;
          return { message: 'Authentication required' };
        }

        // If user is authenticated, check permissions
        if (currentUser) {
          // Check security level requirement
          if (options.requireSecurityLevel && currentUser.securityLevel < options.requireSecurityLevel) {
            // User needs step-up authentication
            await permissionService.auditRepository?.create({
              userId: currentUser.userId,
              sessionId: currentUser.sessionId,
              eventType: 'step_up_required',
              eventSeverity: 'warning',
              ipAddress: clientIp,
              userAgent,
              result: 'denied',
              metadata: {
                resource: options.resource,
                action: options.action,
                requiredLevel: options.requireSecurityLevel,
                currentLevel: currentUser.securityLevel,
              },
            });

            set.status = 403;
            return {
              message: 'Step-up authentication required',
              error: 'STEP_UP_REQUIRED',
              requiredLevel: options.requireSecurityLevel,
              currentLevel: currentUser.securityLevel,
            };
          }

          // Prepare PDP request
          const pdpRequest: PolicyDecisionRequest = {
            userId: currentUser.userId,
            resource: options.resource,
            action: options.action,
            context: {
              ipAddress: clientIp,
              userAgent,
              deviceFingerprint: currentSession?.id,
              sessionId: currentUser.sessionId,
              timestamp: new Date(),
            },
          };

          logger.debug('Calling PDP evaluate', {
            resource: pdpRequest.resource,
            action: pdpRequest.action,
            userId: pdpRequest.userId
          });

          // Evaluate via PDP
          const decision = await policyDecisionPoint.evaluate(pdpRequest);

          if (!decision.allowed) {
            // Access denied
            logger.warn('PDP access denied', {
              userId: currentUser.userId,
              resource: options.resource,
              action: options.action,
              reason: decision.reason,
              riskScore: decision.context.riskScore,
              riskLevel: decision.context.riskLevel,
            });

            monitoring.recordBusinessEvent('pdp_access_denied', {
              userId: currentUser.userId.toString(),
              resource: options.resource,
              action: options.action,
              reason: decision.reason,
              riskScore: decision.context.riskScore.toString(),
              riskLevel: decision.context.riskLevel,
            });

            // Check if step-up is required
            const requiresStepUp = decision.obligations?.includes('step_up_authentication');

            set.status = requiresStepUp ? 403 : 403;
            return {
              message: decision.reason,
              resource: options.resource,
              action: options.action,
              requiresStepUp,
              advice: decision.advice,
            };
          }

          // Access granted
          logger.info('PDP access granted', {
            userId: currentUser.userId,
            resource: options.resource,
            action: options.action,
            riskScore: decision.context.riskScore,
            matchedPolicies: decision.context.matchedPolicies,
          });

          // Add decision result to context for downstream use
          context.store.authorization = {
            granted: true,
            resource: options.resource,
            action: options.action,
            decision,
            obligations: decision.obligations,
            advice: decision.advice,
          };
        } else {
          // Anonymous access
          logger.info('Anonymous access granted', {
            resource: options.resource,
            action: options.action,
          });

          context.store.authorization = {
            granted: true,
            anonymous: true,
            resource: options.resource,
            action: options.action,
          };
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error('Authorization middleware error', {
          error: errorMessage,
          resource: options.resource,
          action: options.action,
        });

        monitoring.recordBusinessEvent('authorization_error', {
          resource: options.resource,
          action: options.action,
          error: errorMessage,
        });

        set.status = 500;
        return { message: 'Authorization error' };
      }
    };
  };
};

// Helper function to require specific permission
export const requirePermission = (options: AuthorizationOptions) => {
  return (permissionService: IPermissionService) => {
    return createAuthorizationMiddleware(permissionService)(options);
  };
};

// Helper function to check if current request has permission
export const hasPermission = (context: any, resource: string, action: string): boolean => {
  const authorization = context.store?.authorization;
  if (!authorization) return false;

  return authorization.granted &&
         authorization.resource === resource &&
         authorization.action === action;
};

// Helper function to get authorization details
export const getAuthorizationDetails = (context: any) => {
  return context.store?.authorization || null;
};

// Decorator for route protection
export const authorize = (options: AuthorizationOptions) => {
  return (app: Elysia) => {
    // This would be used with a plugin system
    // For now, return the options for manual use
    return options;
  };
};