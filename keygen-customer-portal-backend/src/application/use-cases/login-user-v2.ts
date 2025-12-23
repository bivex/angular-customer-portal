/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T04:18:49
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { JWTServiceV2, type TokenPair } from '../../infrastructure/auth/jwt-service-v2';
import type { IUserRepository } from '../../infrastructure/database/repositories/user-repository';
import type { ISessionRepository } from '../../infrastructure/database/repositories/session-repository';
import type { IAuditRepository } from '../../infrastructure/database/repositories/audit-repository';
import type { User } from '../../domain/models/user';
import { UserDomainService } from '../../domain/models/user';
import { monitoring } from '../../shared/monitoring';
import { logger } from '../../shared/logger';
import { config } from '../../shared/config';
import crypto from 'crypto';

// Input DTO
export interface LoginUserV2Input {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

// Output DTO with session management
export interface LoginUserV2Output {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  sessionId: string;
}

// Use case interface
export interface ILoginUserV2UseCase {
  execute(input: LoginUserV2Input): Promise<LoginUserV2Output>;
}

// V2 use case implementation with session management
export class LoginUserV2UseCase implements ILoginUserV2UseCase {
  constructor(
    private readonly jwtServiceV2: JWTServiceV2,
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(input: LoginUserV2Input): Promise<LoginUserV2Output> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!UserDomainService.validateEmail(input.email)) {
        // TODO: Re-enable audit logging after fixing INSERT issue
        // await this.auditRepository.create({...});

        monitoring.recordBusinessEvent('user_login_validation_failed', {
          email: input.email,
          reason: 'invalid_email_format'
        });
        throw new Error('Invalid email format');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(input.email);
      if (!user) {
        await this.auditRepository.create({
          eventType: 'user_login',
          eventSeverity: 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { email: input.email, reason: 'user_not_found' },
        });

        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          reason: 'user_not_found'
        });
        monitoring.recordUserLogin('', input.email, false);
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        await this.auditRepository.create({
          userId: user.id,
          eventType: 'user_login',
          eventSeverity: 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: { reason: 'account_deactivated' },
        });

        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'account_deactivated'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Account is deactivated');
      }

      // Verify password
      if (!user.password) {
        // TODO: Re-enable audit logging
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'no_password_hash'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await this.jwtServiceV2.verifyPassword(input.password, user.password);
      if (!isPasswordValid) {
        // TODO: Re-enable audit logging
        monitoring.recordBusinessEvent('user_login_failed', {
          email: input.email,
          userId: user.id.toString(),
          reason: 'invalid_password'
        });
        monitoring.recordUserLogin(user.id.toString(), user.email, false);
        throw new Error('Invalid email or password');
      }

      // Calculate basic risk score (expand this in Phase 4)
      const riskScore = 0; // Basic implementation

      // Calculate session expiry (7 days for remember me, 24 hours default)
      const sessionExpiry = input.rememberMe
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create session in database first to get UUID
      const session = await this.sessionRepository.create({
        userId: user.id,
        accessTokenJti: null, // Will be updated after token generation
        refreshTokenJti: null, // Will be updated after token generation
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceFingerprint: input.deviceFingerprint,
        expiresAt: sessionExpiry,
        riskScore,
      });

      // Use the database-generated session ID (UUID)
      const sessionId = session.id;

      // Generate token pair with the actual session ID
      const tokenPair = await this.jwtServiceV2.generateTokenPair({
        userId: user.id,
        email: user.email,
        name: user.name,
        sessionId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        roles: ['user'], // Basic role, expand in Phase 4
        permissions: [], // No specific permissions yet
        securityLevel: 1, // Basic level
      });

      // Update session with actual JTIs
      await this.sessionRepository.updateJTIs(sessionId, tokenPair.accessTokenJti, tokenPair.refreshTokenJti);
      await this.sessionRepository.updateLastActivity(sessionId);

      // Use the session ID
      const correctSessionId = sessionId;

      // TODO: Re-enable audit logging after fixing INSERT issue
      // Log successful login
      // await this.auditRepository.create({...});

      // await this.auditRepository.create({...});

      // Record successful login
      monitoring.recordUserLogin(user.id.toString(), user.email, true);

      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_login_success', {
        userId: user.id.toString(),
        email: user.email,
        sessionId: correctSessionId,
        duration,
      });

      return {
        user,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
        sessionId: correctSessionId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordBusinessEvent('user_login_error', {
        email: input.email,
        duration,
        error: (error as Error).message,
      });

      // Log failed login attempt
      if (input.email) {
        await this.auditRepository.create({
          eventType: 'user_login',
          eventSeverity: 'warning',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          result: 'failure',
          metadata: {
            email: input.email,
            error: (error as Error).message,
          },
        }).catch(err => {
          // Don't throw audit errors
          logger.warn({ error: err }, 'Failed to audit login error');
        });
      }

      throw error;
    }
  }
}