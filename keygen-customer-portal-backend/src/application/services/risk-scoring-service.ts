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

import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';

// Risk factors and their weights
export interface RiskFactors {
  ipReputation: number; // 0-100, higher = more suspicious
  geolocationAnomaly: number; // 0-100
  timeOfDay: number; // 0-100
  userHistory: number; // 0-100
  deviceFingerprint: number; // 0-100
  sessionAnomaly: number; // 0-100
  failedAttempts: number; // 0-100
  accountAge: number; // 0-100, lower = newer account
  passwordAge: number; // 0-100, lower = recently changed
}

// Risk context for evaluation
export interface RiskContext {
  userId: number;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  deviceFingerprint?: string;
  sessionId?: string;
  timestamp?: Date;
  action?: string;
  resource?: string;
}

// Risk score result
export interface RiskScore {
  totalScore: number; // 0-100
  factors: RiskFactors;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  context: RiskContext;
}

// Known suspicious IP ranges (simplified example)
const SUSPICIOUS_IP_RANGES = [
  '10.0.0.0/8',      // Private network
  '172.16.0.0/12',   // Private network
  '192.168.0.0/16',  // Private network
  '127.0.0.0/8',     // Loopback
];

// Known VPN/Tor exit nodes (simplified example)
const VPN_TOR_IPS = new Set([
  '185.220.101.1',   // Example Tor exit
  '185.220.101.2',   // Example Tor exit
  // Add more known VPN/Tor IPs in production
]);

// High-risk countries (example)
const HIGH_RISK_COUNTRIES = new Set([
  'KP', // North Korea
  'IR', // Iran
  'CU', // Cuba
  // Add more as needed
]);

/**
 * RiskScoringService - Calculates risk scores for authentication and authorization
 *
 * Features:
 * - IP reputation analysis
 * - Geolocation anomaly detection
 * - Time-based risk assessment
 * - User behavior analysis
 * - Device fingerprint validation
 * - Session anomaly detection
 * - Failed attempt tracking
 * - Account age analysis
 */
export class RiskScoringService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Calculate comprehensive risk score for a context
   */
  async calculateRiskScore(context: RiskContext): Promise<RiskScore> {
    const startTime = Date.now();

    try {
      const factors = await this.evaluateRiskFactors(context);
      const totalScore = this.calculateTotalScore(factors);
      const riskLevel = this.determineRiskLevel(totalScore);
      const recommendations = this.generateRecommendations(factors, riskLevel);

      const result: RiskScore = {
        totalScore,
        factors,
        riskLevel,
        recommendations,
        context,
      };

      // Log high-risk activities
      if (totalScore > 70) {
        await this.auditRepository.create({
          userId: context.userId,
          sessionId: context.sessionId,
          eventType: 'suspicious_activity',
          eventSeverity: totalScore > 90 ? 'critical' : 'warning',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          result: 'success', // Risk assessment completed
          metadata: {
            riskScore: totalScore,
            riskLevel,
            action: context.action,
            resource: context.resource,
          },
          riskIndicators: {
            highRiskScore: true,
            factors: Object.keys(factors).filter(key => factors[key as keyof RiskFactors] > 50),
          },
        });
      }

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('risk_score_calculated', {
        userId: context.userId.toString(),
        score: totalScore.toString(),
        level: riskLevel,
        duration: duration.toString(),
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Risk score calculation failed', { error: errorMessage, context });

      // Return high risk score on error (fail-safe)
      return {
        totalScore: 100,
        factors: {
          ipReputation: 0,
          geolocationAnomaly: 0,
          timeOfDay: 0,
          userHistory: 0,
          deviceFingerprint: 0,
          sessionAnomaly: 0,
          failedAttempts: 0,
          accountAge: 0,
          passwordAge: 0,
        },
        riskLevel: 'critical',
        recommendations: ['Risk calculation failed - manual review required'],
        context,
      };
    }
  }

  /**
   * Evaluate individual risk factors
   */
  private async evaluateRiskFactors(context: RiskContext): Promise<RiskFactors> {
    const [
      ipReputation,
      geolocationAnomaly,
      timeOfDay,
      userHistory,
      deviceFingerprint,
      sessionAnomaly,
      failedAttempts,
      accountAge,
      passwordAge,
    ] = await Promise.all([
      this.evaluateIPReputation(context.ipAddress),
      this.evaluateGeolocationAnomaly(context.geolocation, context.userId),
      this.evaluateTimeOfDay(context.timestamp),
      this.evaluateUserHistory(context.userId),
      this.evaluateDeviceFingerprint(context.deviceFingerprint, context.userId),
      this.evaluateSessionAnomaly(context.sessionId, context.ipAddress, context.userAgent),
      this.evaluateFailedAttempts(context.userId),
      this.evaluateAccountAge(context.userId),
      this.evaluatePasswordAge(context.userId),
    ]);

    return {
      ipReputation,
      geolocationAnomaly,
      timeOfDay,
      userHistory,
      deviceFingerprint,
      sessionAnomaly,
      failedAttempts,
      accountAge,
      passwordAge,
    };
  }

  /**
   * Evaluate IP reputation (0-100, higher = more suspicious)
   */
  private async evaluateIPReputation(ipAddress?: string): Promise<number> {
    if (!ipAddress) return 50; // Unknown IP = medium risk

    // Check for private/reserved IPs
    if (this.isPrivateIP(ipAddress)) {
      return 30; // Private IPs are generally safe
    }

    // Check known VPN/Tor IPs
    if (VPN_TOR_IPS.has(ipAddress)) {
      return 90; // High risk
    }

    // Check suspicious ranges
    for (const range of SUSPICIOUS_IP_RANGES) {
      if (this.ipInRange(ipAddress, range)) {
        return 70; // Suspicious range
      }
    }

    // Default: low risk for public IPs
    return 10;
  }

  /**
   * Evaluate geolocation anomalies
   */
  private async evaluateGeolocationAnomaly(geolocation?: RiskContext['geolocation'], userId?: number): Promise<number> {
    if (!geolocation?.country) return 20; // Unknown location = low-medium risk

    // Check high-risk countries
    if (HIGH_RISK_COUNTRIES.has(geolocation.country)) {
      return 85; // Very high risk
    }

    // Check for unusual patterns (simplified - would need user history)
    if (userId) {
      const recentSessions = await this.sessionRepository.findActiveByUserId(userId);
      const countries = recentSessions
        .map(s => (s.geolocation as any)?.country)
        .filter(Boolean);

      if (countries.length > 0 && !countries.includes(geolocation.country)) {
        return 60; // New country = medium-high risk
      }
    }

    return 10; // Normal location
  }

  /**
   * Evaluate time of day risk
   */
  private evaluateTimeOfDay(timestamp?: Date): number {
    const now = timestamp || new Date();
    const hour = now.getHours();

    // High-risk hours (3 AM - 5 AM)
    if (hour >= 3 && hour <= 5) {
      return 70;
    }

    // Medium-risk hours (11 PM - 2 AM, 6 PM - 10 PM)
    if ((hour >= 23 || hour <= 2) || (hour >= 18 && hour <= 22)) {
      return 40;
    }

    // Normal business hours
    return 10;
  }

  /**
   * Evaluate user history patterns
   */
  private async evaluateUserHistory(userId: number): Promise<number> {
    try {
      // Get recent audit events
      const recentEvents = await this.auditRepository.findByUserId(userId, 50);
      const failedLogins = recentEvents.filter(e => e.eventType === 'user_login' && e.result === 'failure').length;
      const suspiciousActivities = recentEvents.filter(e => e.eventSeverity === 'warning' || e.eventSeverity === 'critical').length;

      // Calculate risk based on recent activity
      const failedLoginRisk = Math.min(failedLogins * 10, 50);
      const suspiciousRisk = Math.min(suspiciousActivities * 15, 50);

      return Math.min(failedLoginRisk + suspiciousRisk, 100);
    } catch (error) {
      logger.warn('Failed to evaluate user history', { userId, error });
      return 30; // Medium risk on error
    }
  }

  /**
   * Evaluate device fingerprint consistency
   */
  private async evaluateDeviceFingerprint(deviceFingerprint?: string, userId?: number): Promise<number> {
    if (!deviceFingerprint || !userId) return 20;

    try {
      const sessions = await this.sessionRepository.findActiveByUserId(userId);
      const fingerprints = sessions.map(s => s.deviceFingerprint).filter(Boolean);

      if (fingerprints.length === 0) {
        return 30; // First device = medium risk
      }

      if (!fingerprints.includes(deviceFingerprint)) {
        return 60; // New device = higher risk
      }

      return 10; // Known device = low risk
    } catch (error) {
      logger.warn('Failed to evaluate device fingerprint', { userId, error });
      return 20;
    }
  }

  /**
   * Evaluate session anomalies
   */
  private async evaluateSessionAnomaly(sessionId?: string, ipAddress?: string, userAgent?: string): Promise<number> {
    if (!sessionId) return 20;

    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) return 50;

      let anomalyScore = 0;

      // Check IP consistency
      if (ipAddress && session.ipAddress !== ipAddress) {
        anomalyScore += 40;
      }

      // Check User-Agent consistency (simplified)
      if (userAgent && session.userAgent !== userAgent) {
        anomalyScore += 30;
      }

      // Check session age (very old sessions are suspicious)
      const sessionAge = Date.now() - session.createdAt.getTime();
      const daysOld = sessionAge / (1000 * 60 * 60 * 24);
      if (daysOld > 30) {
        anomalyScore += 20;
      }

      return Math.min(anomalyScore, 100);
    } catch (error) {
      logger.warn('Failed to evaluate session anomaly', { sessionId, error });
      return 30;
    }
  }

  /**
   * Evaluate recent failed attempts
   */
  private async evaluateFailedAttempts(userId: number): Promise<number> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) return 50;

      const failedAttempts = user.failedLoginAttempts || 0;

      // Scale risk based on failed attempts
      if (failedAttempts >= 5) return 100; // Critical
      if (failedAttempts >= 3) return 80;  // High
      if (failedAttempts >= 1) return 50;  // Medium
      return 10; // Low
    } catch (error) {
      logger.warn('Failed to evaluate failed attempts', { userId, error });
      return 30;
    }
  }

  /**
   * Evaluate account age (newer accounts = higher risk)
   */
  private async evaluateAccountAge(userId: number): Promise<number> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) return 50;

      const accountAge = Date.now() - user.createdAt.getTime();
      const daysOld = accountAge / (1000 * 60 * 60 * 24);

      // New accounts are riskier
      if (daysOld < 1) return 80;    // Less than 1 day
      if (daysOld < 7) return 60;    // Less than 1 week
      if (daysOld < 30) return 40;   // Less than 1 month
      if (daysOld < 90) return 20;   // Less than 3 months
      return 5; // Established account
    } catch (error) {
      logger.warn('Failed to evaluate account age', { userId, error });
      return 30;
    }
  }

  /**
   * Evaluate password age (recently changed passwords = lower risk)
   */
  private async evaluatePasswordAge(userId: number): Promise<number> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) return 50;

      const passwordChangedAt = (user as any).passwordChangedAt || user.createdAt;
      const passwordAge = Date.now() - passwordChangedAt.getTime();
      const daysOld = passwordAge / (1000 * 60 * 60 * 24);

      // Recently changed passwords are good
      if (daysOld < 1) return 5;     // Changed today
      if (daysOld < 7) return 10;    // Changed this week
      if (daysOld < 30) return 20;   // Changed this month
      if (daysOld < 90) return 40;   // Changed recently
      return 70; // Old password = higher risk
    } catch (error) {
      logger.warn('Failed to evaluate password age', { userId, error });
      return 30;
    }
  }

  /**
   * Calculate total risk score with weights
   */
  private calculateTotalScore(factors: RiskFactors): number {
    const weights = {
      ipReputation: 0.2,
      geolocationAnomaly: 0.15,
      timeOfDay: 0.1,
      userHistory: 0.2,
      deviceFingerprint: 0.1,
      sessionAnomaly: 0.15,
      failedAttempts: 0.05,
      accountAge: 0.025,
      passwordAge: 0.025,
    };

    let totalScore = 0;
    for (const [factor, score] of Object.entries(factors)) {
      totalScore += score * weights[factor as keyof typeof weights];
    }

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * Determine risk level from total score
   */
  private determineRiskLevel(score: number): RiskScore['riskLevel'] {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on risk factors
   */
  private generateRecommendations(factors: RiskFactors, riskLevel: RiskScore['riskLevel']): string[] {
    const recommendations: string[] = [];

    if (factors.ipReputation > 70) {
      recommendations.push('Verify IP address reputation');
    }

    if (factors.geolocationAnomaly > 60) {
      recommendations.push('Unusual location detected - consider additional verification');
    }

    if (factors.failedAttempts > 50) {
      recommendations.push('Recent failed login attempts detected');
    }

    if (factors.deviceFingerprint > 50) {
      recommendations.push('New or unrecognized device detected');
    }

    if (factors.accountAge > 60) {
      recommendations.push('New account - additional verification recommended');
    }

    if (factors.passwordAge > 70) {
      recommendations.push('Password change recommended');
    }

    if (riskLevel === 'critical') {
      recommendations.push('Immediate security review required');
      recommendations.push('Consider account suspension');
    } else if (riskLevel === 'high') {
      recommendations.push('Multi-factor authentication recommended');
    } else if (riskLevel === 'medium') {
      recommendations.push('Additional verification may be beneficial');
    }

    return recommendations.length > 0 ? recommendations : ['Risk assessment completed - no issues detected'];
  }

  /**
   * Check if IP is in private/reserved range
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;

    return false;
  }

  /**
   * Check if IP is in CIDR range (simplified implementation)
   */
  private ipInRange(ip: string, cidr: string): boolean {
    // Simplified implementation - in production use a proper CIDR library
    const [network] = cidr.split('/');
    const networkParts = network.split('.').map(Number);
    const ipParts = ip.split('.').map(Number);

    if (networkParts.length !== 4 || ipParts.length !== 4) return false;

    // Simple check for /24 networks
    return networkParts[0] === ipParts[0] &&
           networkParts[1] === ipParts[1] &&
           networkParts[2] === ipParts[2];
  }
}

// Singleton instance
export const riskScoringService = new RiskScoringService(
  {} as any, // Will be injected
  {} as any,
  {} as any
);