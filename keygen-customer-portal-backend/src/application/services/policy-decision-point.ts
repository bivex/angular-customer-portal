/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { PermissionService, type IPermissionService, type PermissionContext } from './permission-service';
import { RiskScoringService, type IRiskScoringService, type RiskContext } from './risk-scoring-service';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

// Policy Decision Point (PDP) - Pure authorization logic
export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  obligations?: string[]; // Additional actions required
  advice?: string[]; // Recommendations
  context: {
    riskScore: number;
    riskLevel: string;
    matchedPolicies: string[];
    evaluatedConditions: any[];
  };
}

export interface PolicyDecisionRequest {
  userId: number;
  resource: string;
  action: string;
  context: {
    ipAddress?: string;
    userAgent?: string;
    geolocation?: RiskContext['geolocation'];
    deviceFingerprint?: string;
    sessionId?: string;
    timestamp?: Date;
  };
}

/**
 * Policy Decision Point (PDP)
 *
 * Pure function for authorization decisions.
 * Separates decision logic from enforcement.
 * Enables testing, auditing, and future integration with OPA/Cedar.
 */
export class PolicyDecisionPoint {
  constructor(
    private readonly permissionService: IPermissionService,
    private readonly riskScoringService: IRiskScoringService,
  ) {}

  /**
   * Evaluate authorization request
   */
  async evaluate(request: PolicyDecisionRequest): Promise<PolicyDecision> {
    const startTime = Date.now();

    try {
      // Parallel evaluation for performance
      const [permissionResult, riskResult] = await Promise.all([
        this.evaluatePermissions(request),
        this.evaluateRisk(request),
      ]);

      // Combine results
      const allowed = permissionResult.allowed && this.isRiskAcceptable(riskResult, request);
      const reason = this.buildDecisionReason(permissionResult, riskResult);

      const decision: PolicyDecision = {
        allowed,
        reason,
        obligations: this.calculateObligations(request, riskResult),
        advice: this.generateAdvice(riskResult),
        context: {
          riskScore: riskResult.totalScore,
          riskLevel: riskResult.riskLevel,
          matchedPolicies: permissionResult.matchedRule ? [permissionResult.matchedRule.id] : [],
          evaluatedConditions: permissionResult.evaluatedConditions || [],
        },
      };

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('pdp_decision', {
        userId: request.userId.toString(),
        resource: request.resource,
        action: request.action,
        allowed: allowed.toString(),
        riskScore: riskResult.totalScore.toString(),
        duration: duration.toString(),
      });

      return decision;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDP evaluation failed', { error: errorMessage, request });

      // Fail-safe: deny on error
      return {
        allowed: false,
        reason: `Policy evaluation error: ${errorMessage}`,
        context: {
          riskScore: 100,
          riskLevel: 'critical',
          matchedPolicies: [],
          evaluatedConditions: [],
        },
      };
    }
  }

  /**
   * Evaluate permissions only
   */
  private async evaluatePermissions(request: PolicyDecisionRequest) {
    const permissionContext: PermissionContext = {
      userId: request.userId,
      resource: request.resource,
      action: request.action,
      ipAddress: request.context.ipAddress,
      userAgent: request.context.userAgent,
      riskScore: undefined, // Will be filled by risk evaluation
      sessionId: request.context.sessionId,
      timestamp: request.context.timestamp,
    };

    return await this.permissionService.evaluatePermission(permissionContext);
  }

  /**
   * Evaluate risk only
   */
  private async evaluateRisk(request: PolicyDecisionRequest) {
    const riskContext: RiskContext = {
      userId: request.userId,
      ipAddress: request.context.ipAddress,
      userAgent: request.context.userAgent,
      geolocation: request.context.geolocation,
      deviceFingerprint: request.context.deviceFingerprint,
      sessionId: request.context.sessionId,
      action: request.action,
      resource: request.resource,
      timestamp: request.context.timestamp,
    };

    return await this.riskScoringService.calculateRiskScore(riskContext);
  }

  /**
   * Check if risk level is acceptable
   */
  private isRiskAcceptable(riskResult: any, request: PolicyDecisionRequest): boolean {
    // High-risk actions require lower risk scores
    const riskThresholds = {
      'user:delete': 20,    // Account deletion: very low risk required
      'admin:*': 30,        // Admin actions: low risk required
      'license:*': 70,      // License operations: medium risk acceptable
      '*': 80,              // Default: allow medium-high risk
    };

    const key = `${request.resource}:${request.action}`;
    const threshold = riskThresholds[key] || riskThresholds['*'];

    return riskResult.totalScore <= threshold;
  }

  /**
   * Build human-readable decision reason
   */
  private buildDecisionReason(permissionResult: any, riskResult: any): string {
    const reasons: string[] = [];

    if (!permissionResult.allowed) {
      reasons.push(`Permission denied: ${permissionResult.reason}`);
    }

    if (!this.isRiskAcceptable(riskResult, { resource: '', action: '', userId: 0, context: {} } as any)) {
      reasons.push(`Risk score too high: ${riskResult.totalScore} (${riskResult.riskLevel})`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Access granted';
  }

  /**
   * Calculate obligations (additional requirements)
   */
  private calculateObligations(request: PolicyDecisionRequest, riskResult: any): string[] {
    const obligations: string[] = [];

    // Step-up for high-risk operations
    if (this.isHighRiskOperation(request) && riskResult.totalScore > 60) {
      obligations.push('step_up_authentication');
    }

    // Additional verification for suspicious activities
    if (riskResult.totalScore > 80) {
      obligations.push('additional_verification');
    }

    // Audit for sensitive operations
    if (this.isSensitiveOperation(request)) {
      obligations.push('enhanced_audit');
    }

    return obligations;
  }

  /**
   * Generate advice for the PEP
   */
  private generateAdvice(riskResult: any): string[] {
    const advice: string[] = [];

    if (riskResult.totalScore > 70) {
      advice.push('Consider additional authentication');
    }

    if (riskResult.factors?.accountAge < 30) {
      advice.push('New account - monitor closely');
    }

    if (riskResult.factors?.deviceFingerprint > 50) {
      advice.push('Unrecognized device detected');
    }

    return advice;
  }

  /**
   * Check if operation is high-risk
   */
  private isHighRiskOperation(request: PolicyDecisionRequest): boolean {
    const highRiskPatterns = [
      /delete$/,
      /admin:/,
      /account:/,
      /security:/,
    ];

    return highRiskPatterns.some(pattern =>
      pattern.test(`${request.resource}:${request.action}`)
    );
  }

  /**
   * Check if operation is sensitive
   */
  private isSensitiveOperation(request: PolicyDecisionRequest): boolean {
    const sensitivePatterns = [
      /password/,
      /email/,
      /security/,
      /billing/,
    ];

    return sensitivePatterns.some(pattern =>
      pattern.test(`${request.resource}:${request.action}`)
    );
  }
}

// Singleton instance
export const policyDecisionPoint = new PolicyDecisionPoint(
  {} as any, // Will be injected
  {} as any
);