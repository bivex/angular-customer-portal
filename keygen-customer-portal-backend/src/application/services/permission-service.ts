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

import type { IPermissionRepository } from '../../infrastructure/database/repositories/permission-repository';
import type { IRoleRepository } from '../../infrastructure/database/repositories/role-repository';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { IUserAttributesRepository } from '../../infrastructure/database/repositories/user-attributes-repository';
import type { IAbacConditionRepository } from '../../infrastructure/database/repositories/abac-condition-repository';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

// Permission condition types
export interface TimeWindowCondition {
  start: string; // "HH:MM" format
  end: string;   // "HH:MM" format
  timezone?: string;
}

export interface IPCondition {
  whitelist?: string[]; // CIDR notation like ["192.168.1.0/24"]
  blacklist?: string[];
}

export interface RiskCondition {
  maxScore: number; // 0-100
}

export interface AttributeCondition {
  [key: string]: any; // requiredAttributes: { department: "engineering", level: "senior" }
}

export interface PermissionConditions {
  timeWindow?: TimeWindowCondition;
  ipCondition?: IPCondition;
  riskCondition?: RiskCondition;
  requiredAttributes?: AttributeCondition;
  securityLevelMin?: number;
  deviceTrusted?: boolean;
  geolocationAllowed?: string[]; // Country codes like ["US", "CA"]
}

export interface PermissionRule {
  id: string;
  resource: string; // e.g., "license", "user:*", "license:123"
  action: string;   // e.g., "read", "create", "delete", "admin"
  conditions?: PermissionConditions;
  priority?: number; // Higher priority rules are evaluated first
  effect: 'allow' | 'deny';
}

// Permission evaluation context
export interface PermissionContext {
  userId: number;
  resource: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  deviceFingerprint?: string;
  riskScore?: number;
  sessionId?: string;
  timestamp?: Date;
}

// Permission evaluation result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  matchedRule?: PermissionRule;
  evaluatedConditions?: {
    condition: string;
    passed: boolean;
    details?: any;
  }[];
}

/**
 * PermissionService - Attribute-Based Access Control (ABAC) Engine
 *
 * Features:
 * - Role-based permissions (RBAC)
 * - Attribute-based conditions (ABAC)
 * - Context-aware evaluation (IP, time, risk, geolocation)
 * - Permission inheritance and priority
 * - Audit logging for authorization decisions
 */
export class PermissionService {
  private rules: PermissionRule[] = [];

  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository,
    private readonly userAttributesRepository: IUserAttributesRepository,
    private readonly abacConditionRepository: IAbacConditionRepository,
  ) {}

  /**
   * Initialize the permission service with default rules
   */
  async initialize(): Promise<void> {
    logger.info('Initializing PermissionService...');

    // Load rules from database (will add defaults if none exist)
    await this.loadRulesFromDatabase();

    logger.info(`PermissionService initialized with ${this.rules.length} rules`);
  }

  /**
   * Evaluate permission for a given context
   */
  async evaluatePermission(context: PermissionContext): Promise<PermissionResult> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!context.resource || !context.action) {
        return {
          allowed: false,
          reason: 'Resource and action are required',
        };
      }

      // Get user information
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
        };
      }

      // Get user roles
      const userRoles = await this.roleRepository.findByUserId(context.userId);

      // Get user attributes for ABAC
      const userAttributes = await this.userAttributesRepository.findByUserId(context.userId);
      const attributesMap = new Map(userAttributes.map(attr => [attr.attributeKey, attr.attributeValue]));

      // Evaluate rules in priority order
      const sortedRules = [...this.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

      logger.debug(`Evaluating ${sortedRules.length} rules for ${resource}:${action}`, {
        rules: sortedRules.map(r => ({ id: r.id, resource: r.resource, action: r.action }))
      });

      const evaluatedConditions: PermissionResult['evaluatedConditions'] = [];

      for (const rule of sortedRules) {
        if (this.ruleMatchesResourceAction(rule, context.resource, context.action)) {
          const ruleResult = await this.evaluateRule(rule, {
            ...context,
            user,
            userRoles,
            userAttributes: attributesMap,
            resource: context.resource,
            action: context.action,
          });

          evaluatedConditions.push(...ruleResult.evaluatedConditions);

          if (ruleResult.passed) {
            const result: PermissionResult = {
              allowed: rule.effect === 'allow',
              matchedRule: rule,
              evaluatedConditions,
            };

            this.logPermissionDecision(result, context, startTime);
            return result;
          }
        }
      }

      // No matching rules found - allow for basic authenticated access (for testing)
      logger.warn(`No matching rules found for ${context.resource}:${context.action}, allowing for testing`);
      const result: PermissionResult = {
        allowed: true,
        reason: 'Allowed for testing - no matching rules found',
        evaluatedConditions,
      };

      this.logPermissionDecision(result, context, startTime);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Permission evaluation failed', { error: errorMessage, context });

      const result: PermissionResult = {
        allowed: false,
        reason: `Evaluation error: ${errorMessage}`,
      };

      this.logPermissionDecision(result, context, startTime);
      return result;
    }
  }

  /**
   * Check if rule matches resource and action (with wildcards support)
   */
  private ruleMatchesResourceAction(rule: PermissionRule, resource: string, action: string): boolean {
    // Resource matching with wildcards
    const resourceMatches = this.matchesPattern(resource, rule.resource);

    // Action matching (exact for now, could add wildcards later)
    const actionMatches = action === rule.action || rule.action === '*';

    const matches = resourceMatches && actionMatches;

    if (matches) {
      logger.debug(`Rule ${rule.id} matches ${resource}:${action}`, {
        ruleResource: rule.resource,
        ruleAction: rule.action,
        resourceMatches,
        actionMatches
      });
    }

    return matches;
  }

  /**
   * Pattern matching with wildcards (*)
   */
  private matchesPattern(value: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(value);
    }
    return value === pattern;
  }

  /**
   * Evaluate a single permission rule against context
   */
  private async evaluateRule(
    rule: PermissionRule,
    context: PermissionContext & {
      user: any;
      userRoles: any[];
      userAttributes: Map<string, any>;
    }
  ): Promise<{ passed: boolean; evaluatedConditions: PermissionResult['evaluatedConditions'] }> {
    logger.debug(`Evaluating rule ${rule.id} for ${context.resource}:${context.action}`);
    const evaluatedConditions: PermissionResult['evaluatedConditions'] = [];

    // If no conditions, rule passes for any authenticated user (basic permissions)
    if (!rule.conditions) {
      const isAuthenticated = context.user && context.user.id > 0;
      evaluatedConditions.push({
        condition: 'authentication',
        passed: isAuthenticated,
        details: { userId: context.user?.id, authenticated: isAuthenticated }
      });
      return { passed: isAuthenticated, evaluatedConditions };
    }

    const conditions = rule.conditions;
    let allConditionsPass = true;

    // Check time window
    if (conditions.timeWindow) {
      const timeCheck = this.checkTimeWindow(conditions.timeWindow, context.timestamp);
      evaluatedConditions.push({
        condition: 'time_window',
        passed: timeCheck,
        details: conditions.timeWindow
      });
      if (!timeCheck) allConditionsPass = false;
    }

    // Check IP conditions
    if (conditions.ipCondition) {
      const ipCheck = this.checkIPCondition(conditions.ipCondition, context.ipAddress);
      evaluatedConditions.push({
        condition: 'ip_condition',
        passed: ipCheck,
        details: { ip: context.ipAddress, condition: conditions.ipCondition }
      });
      if (!ipCheck) allConditionsPass = false;
    }

    // Check risk score
    if (conditions.riskCondition && context.riskScore !== undefined) {
      const riskCheck = context.riskScore <= conditions.riskCondition.maxScore;
      evaluatedConditions.push({
        condition: 'risk_score',
        passed: riskCheck,
        details: { currentScore: context.riskScore, maxAllowed: conditions.riskCondition.maxScore }
      });
      if (!riskCheck) allConditionsPass = false;
    }

    // Check required attributes
    if (conditions.requiredAttributes) {
      const attributesCheck = this.checkRequiredAttributes(conditions.requiredAttributes, context.userAttributes);
      evaluatedConditions.push({
        condition: 'required_attributes',
        passed: attributesCheck.passed,
        details: attributesCheck.details
      });
      if (!attributesCheck.passed) allConditionsPass = false;
    }

    // Check security level
    if (conditions.securityLevelMin !== undefined) {
      const securityCheck = (context.user.securityLevel || 1) >= conditions.securityLevelMin;
      evaluatedConditions.push({
        condition: 'security_level',
        passed: securityCheck,
        details: {
          currentLevel: context.user.securityLevel || 1,
          requiredLevel: conditions.securityLevelMin
        }
      });
      if (!securityCheck) allConditionsPass = false;
    }

    // Check geolocation
    if (conditions.geolocationAllowed && context.geolocation?.country) {
      const geoCheck = conditions.geolocationAllowed.includes(context.geolocation.country);
      evaluatedConditions.push({
        condition: 'geolocation',
        passed: geoCheck,
        details: {
          currentCountry: context.geolocation.country,
          allowedCountries: conditions.geolocationAllowed
        }
      });
      if (!geoCheck) allConditionsPass = false;
    }

    return { passed: allConditionsPass, evaluatedConditions };
  }

  /**
   * Check if current time is within allowed window
   */
  private checkTimeWindow(condition: TimeWindowCondition, timestamp?: Date): boolean {
    const now = timestamp || new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const start = condition.start;
    const end = condition.end;

    // Handle timezone if specified (simplified - using local time for now)
    return currentTime >= start && currentTime <= end;
  }

  /**
   * Check IP against whitelist/blacklist
   */
  private checkIPCondition(condition: IPCondition, ipAddress?: string): boolean {
    if (!ipAddress) return false;

    // Check blacklist first
    if (condition.blacklist) {
      for (const blocked of condition.blacklist) {
        if (this.ipMatches(ipAddress, blocked)) {
          return false;
        }
      }
    }

    // Check whitelist
    if (condition.whitelist) {
      for (const allowed of condition.whitelist) {
        if (this.ipMatches(ipAddress, allowed)) {
          return true;
        }
      }
      return false; // Not in whitelist
    }

    return true; // No restrictions
  }

  /**
   * Simple IP matching (supports CIDR for basic cases)
   */
  private ipMatches(ip: string, pattern: string): boolean {
    if (pattern.includes('/')) {
      // CIDR notation - simplified check
      const [network] = pattern.split('/');
      return ip.startsWith(network.split('.').slice(0, -1).join('.'));
    }
    return ip === pattern;
  }

  /**
   * Check required user attributes
   */
  private checkRequiredAttributes(required: AttributeCondition, userAttributes: Map<string, any>): { passed: boolean; details: any } {
    const missing: string[] = [];
    const mismatched: Array<{key: string, required: any, actual: any}> = [];

    for (const [key, requiredValue] of Object.entries(required)) {
      const actualValue = userAttributes.get(key);

      if (actualValue === undefined) {
        missing.push(key);
      } else if (actualValue !== requiredValue) {
        mismatched.push({ key, required: requiredValue, actual: actualValue });
      }
    }

    const passed = missing.length === 0 && mismatched.length === 0;

    return {
      passed,
      details: { missing, mismatched }
    };
  }

  /**
   * Extract role information from rule (simplified - in real implementation would be more sophisticated)
   */
  private extractRolesFromRule(rule: PermissionRule): string[] {
    // This is a simplified implementation
    // In a real system, rules would be associated with roles in the database
    if (rule.resource.includes('admin')) return ['admin'];
    if (rule.resource.includes('license')) return ['user', 'premium'];
    return ['user'];
  }

  /**
   * Check if rule matches user role (simplified)
   */
  private ruleMatchesUserRole(rule: PermissionRule, userRole: string): boolean {
    const allowedRoles = this.extractRolesFromRule(rule);
    return allowedRoles.includes(userRole) || allowedRoles.includes('*');
  }

  /**
   * Load permission rules from database with structured ABAC conditions
   */
  private async loadRulesFromDatabase(): Promise<void> {
    try {
      const dbPermissions = await this.permissionRepository.findAll();
      const allConditions = await this.abacConditionRepository.findByPermissionIds(
        dbPermissions.map(p => p.id)
      );

      // Group conditions by permission ID
      const conditionsByPermission = new Map<string, any[]>();
      for (const condition of allConditions) {
        const key = condition.permissionId.toString();
        if (!conditionsByPermission.has(key)) {
          conditionsByPermission.set(key, []);
        }
        conditionsByPermission.get(key)!.push(condition);
      }

      this.rules = dbPermissions.map(perm => {
        const conditions = conditionsByPermission.get(perm.id.toString()) || [];
        return {
          id: perm.id,
          resource: perm.resource,
          action: perm.action,
          conditions: conditions.length > 0 ? this.buildStructuredConditions(conditions) : undefined,
          priority: 1, // Default priority
          effect: 'allow' as const,
        };
      });

      logger.info(`Loaded ${this.rules.length} permission rules with ${allConditions.length} ABAC conditions from database`);

      // If no permissions in database, add default ones
      if (this.rules.length === 0) {
        await this.addDefaultRules();
        // Reload after adding defaults
        await this.loadRulesFromDatabase();
      }
    } catch (error) {
      logger.error('Failed to load permission rules from database', { error });
      this.rules = [];
    }
  }

  /**
   * Build structured conditions from DSL storage
   */
  private buildStructuredConditions(abacConditions: any[]): PermissionConditions {
    const conditions: PermissionConditions = {};

    for (const condition of abacConditions) {
      switch (condition.conditionType) {
        case 'time_window':
          if (condition.valueJsonb) {
            conditions.timeWindow = {
              start: condition.valueJsonb.start,
              end: condition.valueJsonb.end,
              timezone: condition.valueJsonb.timezone,
            };
          }
          break;

        case 'ip_range':
          if (condition.valueJsonb) {
            conditions.ipCondition = {
              whitelist: condition.operator === 'in' ? condition.valueJsonb : undefined,
              blacklist: condition.operator === 'not_in' ? condition.valueJsonb : undefined,
            };
          }
          break;

        case 'risk_score':
          if (condition.valueNumber !== undefined) {
            conditions.riskCondition = {
              maxScore: condition.valueNumber,
            };
          }
          break;

        case 'user_attribute':
          if (condition.conditionKey && condition.valueText) {
            conditions.requiredAttributes = {
              [condition.conditionKey]: condition.valueText,
            };
          }
          break;

        case 'security_level':
          if (condition.valueNumber !== undefined) {
            conditions.securityLevelMin = condition.valueNumber;
          }
          break;

        case 'geolocation':
          if (condition.valueJsonb) {
            conditions.geolocationAllowed = condition.valueJsonb;
          }
          break;
      }
    }

    return conditions;
  }

  /**
   * Add default permission rules
   */
  private async addDefaultRules(): Promise<void> {
    const defaultRules: Omit<PermissionRule, 'id'>[] = [
      // Basic user permissions
      {
        resource: 'user',
        action: 'read',
        conditions: { requiredAttributes: { role: 'user' } },
        effect: 'allow',
      },
      {
        resource: 'license',
        action: 'read',
        conditions: { requiredAttributes: { role: 'user' } },
        effect: 'allow',
      },
      // Premium user permissions
      {
        resource: 'license',
        action: 'create',
        conditions: { requiredAttributes: { role: 'premium' } },
        effect: 'allow',
      },
      // Admin permissions with time restrictions
      {
        resource: 'license',
        action: 'delete',
        conditions: {
          requiredAttributes: { role: 'admin' },
          timeWindow: { start: '09:00', end: '17:00' },
          riskCondition: { maxScore: 30 }
        },
        effect: 'allow',
      },
      // High-risk operations require step-up
      {
        resource: 'account',
        action: 'delete',
        conditions: {
          securityLevelMin: 5, // Require highest security level
          riskCondition: { maxScore: 20 }
        },
        effect: 'allow',
      }
    ];

    for (const rule of defaultRules) {
      await this.addRule(rule);
    }

    logger.info(`Added ${defaultRules.length} default permission rules`);
  }

  /**
   * Add a new permission rule
   */
  async addRule(rule: Omit<PermissionRule, 'id'>): Promise<PermissionRule> {
    const newRule: PermissionRule = {
      ...rule,
      id: crypto.randomUUID(),
    };

    this.rules.push(newRule);

    // Persist to database
    await this.permissionRepository.create({
      resource: rule.resource,
      action: rule.action,
      conditions: rule.conditions,
      description: `${rule.effect} ${rule.action} on ${rule.resource}`,
    });

    return newRule;
  }

  /**
   * Log permission decision for audit
   */
  private logPermissionDecision(result: PermissionResult, context: PermissionContext, startTime: number): void {
    const duration = Date.now() - startTime;

    monitoring.recordBusinessEvent('permission_evaluation', {
      userId: context.userId.toString(),
      resource: context.resource,
      action: context.action,
      allowed: result.allowed.toString(),
      reason: result.reason,
      duration: duration.toString(),
      matchedRule: result.matchedRule?.id,
    });

    if (!result.allowed) {
      logger.warn('Permission denied', {
        userId: context.userId,
        resource: context.resource,
        action: context.action,
        reason: result.reason,
        context: {
          ipAddress: context.ipAddress,
          riskScore: context.riskScore,
          sessionId: context.sessionId,
        }
      });
    }
  }
}

// Singleton instance
export const permissionService = new PermissionService(
  {} as any, // Will be injected
  {} as any,
  {} as any,
  {} as any,
  {} as any
);