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
import { RiskScoringService, type IRiskScoringService, type RiskContext, type RiskScore } from '../../application/services/risk-scoring-service';
import { getCurrentUser, getCurrentSession } from './session-middleware';
import { logger } from '../../shared/logger';
import { monitoring } from '../../shared/monitoring';

// Risk assessment options
export interface RiskAssessmentOptions {
  action?: string;
  resource?: string;
  highRiskThreshold?: number; // Default: 80
  criticalRiskThreshold?: number; // Default: 90
  blockHighRisk?: boolean; // Default: false (warn but allow)
  blockCriticalRisk?: boolean; // Default: true (block)
  requireGeolocation?: boolean; // Default: false
  updateSessionRisk?: boolean; // Default: true
}

// Risk assessment result
export interface RiskAssessmentResult {
  riskScore: RiskScore;
  allowed: boolean;
  blockedReason?: string;
  recommendations: string[];
}

// Risk assessment middleware factory
export const createRiskAssessmentMiddleware = (
  riskScoringService: IRiskScoringService
) => {
  return (options: RiskAssessmentOptions = {}) => {
    const {
      action,
      resource,
      highRiskThreshold = 80,
      criticalRiskThreshold = 90,
      blockHighRisk = false,
      blockCriticalRisk = true,
      requireGeolocation = false,
      updateSessionRisk = true,
    } = options;

    return async (context: any) => {
      const { set, request } = context;

      try {
        // Get current user and session
        const currentUser = getCurrentUser(context);
        const currentSession = getCurrentSession(context);

        // Extract request context
        const clientIp = request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Get geolocation if available (simplified - would use a geolocation service)
        let geolocation;
        if (requireGeolocation || clientIp !== 'unknown') {
          // In production, use a geolocation service like MaxMind GeoIP
          // For now, we'll simulate basic geolocation
          geolocation = await getGeolocationFromIP(clientIp);
        }

        // Prepare risk context
        const riskContext: RiskContext = {
          userId: currentUser.userId,
          ipAddress: clientIp,
          userAgent,
          geolocation,
          deviceFingerprint: currentSession.id, // Use session ID as device fingerprint
          sessionId: currentUser.sessionId,
          timestamp: new Date(),
          action,
          resource,
        };

        // Calculate risk score
        const riskScore = await riskScoringService.calculateRiskScore(riskContext);

        // Update session risk score if enabled
        if (updateSessionRisk && riskScore.totalScore !== currentSession.riskScore) {
          await riskScoringService.sessionRepository?.updateRiskScore(currentSession.id, riskScore.totalScore);
        }

        // Determine if request should be blocked
        let allowed = true;
        let blockedReason: string | undefined;

        if (riskScore.totalScore >= criticalRiskThreshold && blockCriticalRisk) {
          allowed = false;
          blockedReason = 'Critical risk level detected';
        } else if (riskScore.totalScore >= highRiskThreshold && blockHighRisk) {
          allowed = false;
          blockedReason = 'High risk level detected';
        }

        const result: RiskAssessmentResult = {
          riskScore,
          allowed,
          blockedReason,
          recommendations: riskScore.recommendations,
        };

        // Store risk assessment in context
        context.store.riskAssessment = result;

        // Log risk assessment
        logger.info('Risk assessment completed', {
          userId: currentUser.userId,
          sessionId: currentUser.sessionId,
          riskScore: riskScore.totalScore,
          riskLevel: riskScore.riskLevel,
          allowed,
          blockedReason,
        });

        // Handle blocking
        if (!allowed) {
          monitoring.recordBusinessEvent('risk_assessment_blocked', {
            userId: currentUser.userId.toString(),
            sessionId: currentUser.sessionId,
            riskScore: riskScore.totalScore.toString(),
            riskLevel: riskScore.riskLevel,
            reason: blockedReason,
          });

          // For high-risk but not blocked, add warning header
          if (riskScore.totalScore >= highRiskThreshold && !blockHighRisk) {
            set.headers['X-Risk-Warning'] = `High risk detected: ${riskScore.riskLevel}`;
          }

          set.status = 403;
          return {
            message: blockedReason,
            error: 'RISK_BLOCKED',
            riskScore: riskScore.totalScore,
            riskLevel: riskScore.riskLevel,
            recommendations: riskScore.recommendations,
          };
        }

        // Add risk information to headers for debugging/monitoring
        set.headers['X-Risk-Score'] = riskScore.totalScore.toString();
        set.headers['X-Risk-Level'] = riskScore.riskLevel;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error('Risk assessment middleware error', {
          error: errorMessage,
          action,
          resource,
        });

        monitoring.recordBusinessEvent('risk_assessment_error', {
          error: errorMessage,
          action,
          resource,
        });

        // On error, allow request but log the issue
        context.store.riskAssessment = {
          riskScore: { totalScore: 50, riskLevel: 'medium' } as RiskScore,
          allowed: true,
          recommendations: ['Risk assessment failed - manual review may be needed'],
        };

        set.headers['X-Risk-Error'] = 'Assessment failed';
      }
    };
  };
};

// Helper function to get risk assessment result from context
export const getRiskAssessment = (context: any): RiskAssessmentResult | null => {
  return context.store?.riskAssessment || null;
};

// Helper function to check if current request is high risk
export const isHighRisk = (context: any, threshold: number = 80): boolean => {
  const assessment = getRiskAssessment(context);
  return assessment ? assessment.riskScore.totalScore >= threshold : false;
};

// Simplified geolocation function (would use a real geolocation service)
async function getGeolocationFromIP(ipAddress: string): Promise<RiskContext['geolocation']> {
  // In production, integrate with services like:
  // - MaxMind GeoIP
  // - IP-API
  // - IPInfo
  // - etc.

  // For demo purposes, return mock data
  if (ipAddress === 'unknown' || ipAddress.startsWith('127.')) {
    return {
      country: 'US',
      city: 'Local',
      coordinates: [40.7128, -74.0060], // New York coordinates
    };
  }

  // Mock different locations for different IP ranges
  const ipNum = ipAddress.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);

  if (ipNum % 3 === 0) {
    return {
      country: 'GB',
      city: 'London',
      coordinates: [51.5074, -0.1278],
    };
  } else if (ipNum % 3 === 1) {
    return {
      country: 'DE',
      city: 'Berlin',
      coordinates: [52.5200, 13.4050],
    };
  } else {
    return {
      country: 'US',
      city: 'New York',
      coordinates: [40.7128, -74.0060],
    };
  }
}

// Pre-configured middleware for common use cases
export const assessAuthenticationRisk = createRiskAssessmentMiddleware({} as any)({
  action: 'authentication',
  highRiskThreshold: 70,
  blockCriticalRisk: true,
  updateSessionRisk: true,
});

export const assessAuthorizationRisk = createRiskAssessmentMiddleware({} as any)({
  action: 'authorization',
  highRiskThreshold: 80,
  blockCriticalRisk: true,
  updateSessionRisk: false, // Don't update session risk for auth checks
});

export const assessSensitiveOperationRisk = createRiskAssessmentMiddleware({} as any)({
  action: 'sensitive_operation',
  highRiskThreshold: 60,
  criticalRiskThreshold: 85,
  blockHighRisk: true,
  blockCriticalRisk: true,
  requireGeolocation: true,
  updateSessionRisk: true,
});