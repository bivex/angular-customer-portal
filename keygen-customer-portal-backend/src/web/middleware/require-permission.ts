/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-21T22:44:10
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { createAuthorizationMiddleware, type AuthorizationOptions } from './authorization-middleware';
import { createRiskAssessmentMiddleware, type RiskAssessmentOptions } from './risk-assessment-middleware';
import { createSessionMiddleware } from './session-middleware';
import type { IPermissionService } from '../../application/services/permission-service';
import type { IRiskScoringService } from '../../application/services/risk-scoring-service';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';

// Combined protection options
export interface RequirePermissionOptions extends AuthorizationOptions {
  // Authorization options (inherited from AuthorizationOptions)
  // resource: string;
  // action: string;
  // requireSecurityLevel?: number;
  // allowAnonymous?: boolean;

  // Risk assessment options
  assessRisk?: boolean;
  riskThreshold?: number;
  blockOnHighRisk?: boolean;

  // Session requirements
  requireActiveSession?: boolean;
}

// Protected route builder
export class RouteProtection {
  constructor(
    private readonly permissionService: IPermissionService,
    private readonly riskScoringService: IRiskScoringService,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  /**
   * Create middleware chain for protecting a route
   */
  requirePermission(options: RequirePermissionOptions) {
    const middlewares: any[] = [];

    // Always require session validation first
    if (options.requireActiveSession !== false) {
      const sessionMiddleware = createSessionMiddleware(
        this.permissionService.jwtServiceV2, // Assuming it's available
        this.sessionRepository,
        this.auditRepository
      );
      middlewares.push(sessionMiddleware);
    }

    // Add authorization middleware
    const authOptions: AuthorizationOptions = {
      resource: options.resource,
      action: options.action,
      requireSecurityLevel: options.requireSecurityLevel,
      allowAnonymous: options.allowAnonymous,
    };

    const authMiddleware = createAuthorizationMiddleware(this.permissionService)(authOptions);
    middlewares.push(authMiddleware);

    // Add risk assessment if requested
    if (options.assessRisk) {
      const riskOptions: RiskAssessmentOptions = {
        action: options.action,
        resource: options.resource,
        highRiskThreshold: options.riskThreshold || 80,
        blockHighRisk: options.blockOnHighRisk || false,
        blockCriticalRisk: true,
        updateSessionRisk: true,
      };

      const riskMiddleware = createRiskAssessmentMiddleware(this.riskScoringService)(riskOptions);
      middlewares.push(riskMiddleware);
    }

    // Return middleware chain
    return async (context: any) => {
      for (const middleware of middlewares) {
        const result = await middleware(context);
        if (result) {
          // Middleware returned a response (error/denial)
          return result;
        }
      }
      // All middlewares passed
      return null;
    };
  }

  /**
   * Convenience method for read operations
   */
  requireRead(resource: string, options: Partial<RequirePermissionOptions> = {}) {
    return this.requirePermission({
      resource,
      action: 'read',
      ...options,
    });
  }

  /**
   * Convenience method for write operations
   */
  requireWrite(resource: string, options: Partial<RequirePermissionOptions> = {}) {
    return this.requirePermission({
      resource,
      action: 'create',
      ...options,
    });
  }

  /**
   * Convenience method for admin operations
   */
  requireAdmin(resource: string = '*', options: Partial<RequirePermissionOptions> = {}) {
    return this.requirePermission({
      resource,
      action: 'admin',
      requireSecurityLevel: 3, // Require elevated security
      assessRisk: true,
      riskThreshold: 70,
      blockOnHighRisk: true,
      ...options,
    });
  }

  /**
   * Convenience method for sensitive operations (account deletion, etc.)
   */
  requireSensitive(resource: string, action: string = 'delete', options: Partial<RequirePermissionOptions> = {}) {
    return this.requirePermission({
      resource,
      action,
      requireSecurityLevel: 5, // Require highest security level
      assessRisk: true,
      riskThreshold: 50,
      blockOnHighRisk: true,
      ...options,
    });
  }
}

// Factory function to create route protection instance
export const createRouteProtection = (
  permissionService: IPermissionService,
  riskScoringService: IRiskScoringService,
  sessionRepository: ISessionRepository,
  auditRepository: IAuditRepository,
) => {
  return new RouteProtection(
    permissionService,
    riskScoringService,
    sessionRepository,
    auditRepository,
  );
};

// Pre-defined permission requirements for common use cases
export const PermissionRequirements = {
  // User management
  VIEW_OWN_PROFILE: { resource: 'user', action: 'read' },
  UPDATE_OWN_PROFILE: { resource: 'user', action: 'update' },
  DELETE_OWN_ACCOUNT: { resource: 'user', action: 'delete', requireSecurityLevel: 5 },

  // License management
  VIEW_LICENSES: { resource: 'license', action: 'read' },
  CREATE_LICENSE: { resource: 'license', action: 'create' },
  UPDATE_LICENSE: { resource: 'license', action: 'update' },
  DELETE_LICENSE: { resource: 'license', action: 'delete', requireSecurityLevel: 3 },

  // Administrative
  ADMIN_USERS: { resource: 'admin', action: 'users', requireSecurityLevel: 4 },
  ADMIN_LICENSES: { resource: 'admin', action: 'licenses', requireSecurityLevel: 4 },
  ADMIN_SYSTEM: { resource: 'admin', action: 'system', requireSecurityLevel: 5 },

  // Sensitive operations
  CHANGE_PASSWORD: { resource: 'user', action: 'change_password' },
  CHANGE_EMAIL: { resource: 'user', action: 'change_email', requireSecurityLevel: 3 },
  ENABLE_MFA: { resource: 'user', action: 'enable_mfa', requireSecurityLevel: 2 },
} as const;

// Helper function to check if current user has permission
export const userHasPermission = async (
  permissionService: IPermissionService,
  userId: number,
  resource: string,
  action: string,
  context?: {
    ipAddress?: string;
    userAgent?: string;
    riskScore?: number;
    sessionId?: string;
  }
): Promise<boolean> => {
  try {
    const result = await permissionService.evaluatePermission({
      userId,
      resource,
      action,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      riskScore: context?.riskScore,
      sessionId: context?.sessionId,
      timestamp: new Date(),
    });

    return result.allowed;
  } catch (error) {
    // On error, deny access (fail-safe)
    return false;
  }
};

// Helper to get user's effective permissions
export const getUserPermissions = async (
  permissionService: IPermissionService,
  userId: number
): Promise<string[]> => {
  // This would be implemented to return all permissions a user has
  // For now, return basic permissions
  return [
    'user:read:self',
    'user:update:self',
    'user:change_password',
    'license:read',
  ];
};