/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-22T00:18:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { keyManager } from '../crypto/key-manager';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { monitoring } from '../../shared/monitoring';

export interface AccessTokenPayload {
  userId: number;
  email: string;
  name: string;
  sid: string; // session ID
  jti: string; // JWT ID for access token
  ipHash?: string; // Bind to IP (for binding validation)
  uaHash?: string; // Bind to user agent (for binding validation)
  type: 'access';
  bindingLevel?: 'strict' | 'soft' | 'disabled'; // Adaptive binding
}

export interface PrivilegedTokenPayload extends AccessTokenPayload {
  scopes: string[]; // e.g., ["account:delete", "license:admin"]
  ttl: number; // seconds
  type: 'privileged';
}

export interface RefreshTokenPayload {
  userId: number;
  sid: string; // session ID
  jti: string; // JWT ID for refresh token
  type: 'refresh';
  tokenFamily: string; // Required for rotation tracking and family invalidation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  accessTokenJti: string;
  refreshTokenJti: string;
}

/**
 * JWTServiceV2 - Enhanced JWT service with RS256 support
 *
 * Features:
 * - RS256 asymmetric signing (vs HS256 symmetric)
 * - Token binding (IP hash, User-Agent hash)
 * - Separate Access & Refresh tokens
 * - Token type validation
 * - Backward compatibility with HS256
 */
export class JWTServiceV2 {
  private readonly accessTokenTTL: number;
  private readonly refreshTokenTTL: number;
  private readonly legacySecret: string; // For backward compatibility with HS256
  private readonly clockSkewTolerance: number; // seconds

  constructor() {
    // Default to 15 minutes for access, 7 days for refresh
    this.accessTokenTTL = config.jwt?.accessTokenTTL || 15 * 60; // 15 minutes
    this.refreshTokenTTL = config.jwt?.refreshTokenTTL || 7 * 24 * 60 * 60; // 7 days
    this.legacySecret = config.jwt.secret; // HS256 secret for transition period
    this.clockSkewTolerance = parseInt(config.jwt?.clockSkewTolerance || '60', 10);
  }

  /**
   * Initialize the service (ensure KeyManager is ready)
   */
  async initialize(): Promise<void> {
    // KeyManager will auto-initialize on first use
    // This method ensures it's ready
    await keyManager.initialize();
  }

  /**
   * Hash password using bcrypt (same as legacy JWTService)
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash using bcrypt
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(payload: {
    userId: number;
    email: string;
    name: string;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    roles?: string[];
    permissions?: string[];
    securityLevel?: number;
  }): Promise<TokenPair> {
    const activeKey = keyManager.getActiveKey();
    if (!activeKey) {
      logger.error('No active signing key available');
      throw new Error('No active signing key available');
    }

    try {
      // Generate JTIs (JWT IDs) for tracking and revocation
      const accessJti = crypto.randomUUID();
      const refreshJti = crypto.randomUUID();
      const tokenFamily = crypto.randomUUID(); // For rotation detection

      // Hash IP and User-Agent for token binding (privacy + security)
      const ipHash = payload.ipAddress
        ? crypto.createHash('sha256').update(payload.ipAddress).digest('hex').substring(0, 16)
        : undefined;

      const uaHash = payload.userAgent
        ? crypto.createHash('sha256').update(payload.userAgent).digest('hex').substring(0, 16)
        : undefined;

      const now = Math.floor(Date.now() / 1000);

      // Access token payload (minimal - authorization via runtime lookup)
      const accessPayload: AccessTokenPayload = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        sid: payload.sessionId,
        jti: accessJti,
        ipHash,
        uaHash,
        bindingLevel: 'soft', // Default to soft binding
        type: 'access',
      };

      // Refresh token payload (minimal info for security)
      const refreshPayload: RefreshTokenPayload = {
        userId: payload.userId,
        sid: payload.sessionId,
        jti: refreshJti,
        type: 'refresh',
        tokenFamily,
      };

      // Sign tokens with PS256 (RSA-PSS) - stronger than RS256
      const accessToken = jwt.sign(accessPayload, activeKey.privateKey, {
        algorithm: 'PS256', // Upgraded to RSA-PSS for enhanced security
        expiresIn: this.accessTokenTTL,
        issuer: config.jwt?.issuer || 'keygen-portal',
        audience: config.jwt?.audience || 'keygen-portal-api',
        keyid: activeKey.keyId, // Include KID for key rotation
      });

      const refreshToken = jwt.sign(refreshPayload, activeKey.privateKey, {
        algorithm: 'PS256', // Upgraded to RSA-PSS for enhanced security
        expiresIn: this.refreshTokenTTL,
        issuer: config.jwt?.issuer || 'keygen-portal',
        audience: config.jwt?.audience || 'keygen-portal-api',
        keyid: activeKey.keyId,
      });

      const result: TokenPair = {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date((now + this.accessTokenTTL) * 1000),
        refreshTokenExpiresAt: new Date((now + this.refreshTokenTTL) * 1000),
        accessTokenJti: accessJti,
        refreshTokenJti: refreshJti,
      };

      logger.info('Token pair generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        accessJti,
        refreshJti,
      });

      monitoring.recordBusinessEvent('token_pair_generated', {
        userId: payload.userId.toString(),
        algorithm: 'RS256',
        tokenBinding: !!(ipHash || uaHash),
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate token pair', { error });
      throw error;
    }
  }

  /**
   * Verify access token (supports both RS256 and legacy HS256)
   */
  async verifyAccessToken(
    token: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AccessTokenPayload> {
    try {
      // Decode header to determine algorithm
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      let verified: any;

      if (decoded.header.alg === 'RS256' || decoded.header.alg === 'PS256') {
        // RS256/PS256 verification
        const kid = decoded.header.kid as string | undefined;
        if (!kid) {
          logger.error('Missing key ID in token header', {
            algorithm: decoded.header.alg,
            tokenType: (decoded.payload as any).type,
            hasExp: !!(decoded.payload as any).exp,
            hasIat: !!(decoded.payload as any).iat,
          });
          throw new Error('Missing key ID in token header');
        }

        logger.debug('Attempting token verification', {
          kid,
          algorithm: decoded.header.alg,
          tokenType: (decoded.payload as any).type,
          userId: (decoded.payload as any).userId,
        });

        const keyPair = keyManager.getVerificationKey(kid);
        if (!keyPair) {
          // Log all available keys for debugging
          const availableKeys = keyManager.getAllVerificationKeys();
          logger.error('Unknown signing key requested - token may be from previous server session', {
            requestedKid: kid,
            algorithm: decoded.header.alg,
            tokenType: (decoded.payload as any).type,
            availableKids: Object.keys(availableKeys),
            activeKeyId: keyManager.getActiveKey()?.keyId,
            userId: (decoded.payload as any).userId,
          });
          // Provide a more user-friendly error for expired/invalid tokens
          throw new Error(`Token verification failed: signing key not found. This may be due to a server restart or security update. Please re-authenticate.`);
        }

        verified = jwt.verify(token, keyPair.publicKey, {
          algorithms: ['PS256', 'RS256'], // Support both PS256 and RS256 for transition
          issuer: config.jwt?.issuer || 'keygen-portal',
          audience: config.jwt?.audience || 'keygen-portal-api',
          clockTolerance: this.clockSkewTolerance,
        });
      } else if (decoded.header.alg === 'HS256') {
        // Legacy HS256 support (backward compatibility)
        logger.warn('HS256 token received (legacy mode)', {
          userId: (decoded.payload as any).userId,
        });

        verified = jwt.verify(token, this.legacySecret, {
          algorithms: ['HS256'],
          clockTolerance: this.clockSkewTolerance,
        });
      } else {
        throw new Error(`Unsupported token algorithm: ${decoded.header.alg}`);
      }

      // Validate token type
      if (verified.type !== 'access') {
        throw new Error(`Invalid token type: ${verified.type}`);
      }

      // Verify token binding adaptively
      if (context && verified.bindingLevel !== 'disabled') {
        const isStrict = verified.bindingLevel === 'strict';

        if (verified.ipHash && context.ipAddress) {
          const currentIpHash = crypto
            .createHash('sha256')
            .update(context.ipAddress)
            .digest('hex')
            .substring(0, 16);

          if (verified.ipHash !== currentIpHash) {
            const errorMsg = 'Token IP binding mismatch';

            if (isStrict) {
              logger.warn(errorMsg, {
                userId: verified.userId,
                jti: verified.jti,
                bindingLevel: verified.bindingLevel,
              });
              throw new Error(errorMsg);
            } else {
              // Soft binding - log but allow
              logger.info('Token IP binding mismatch (soft)', {
                userId: verified.userId,
                jti: verified.jti,
                bindingLevel: verified.bindingLevel,
              });

              // Could increase risk score here
              monitoring.recordBusinessEvent('token_binding_mismatch', {
                userId: verified.userId.toString(),
                type: 'ip',
                bindingLevel: verified.bindingLevel,
              });
            }
          }
        }

        if (verified.uaHash && context.userAgent) {
          const currentUaHash = crypto
            .createHash('sha256')
            .update(context.userAgent)
            .digest('hex')
            .substring(0, 16);

          if (verified.uaHash !== currentUaHash) {
            const errorMsg = 'Token User-Agent binding mismatch';

            if (isStrict) {
              logger.warn(errorMsg, {
                userId: verified.userId,
                jti: verified.jti,
                bindingLevel: verified.bindingLevel,
              });
              throw new Error(errorMsg);
            } else {
              // Soft binding - log but allow
              logger.info('Token User-Agent binding mismatch (soft)', {
                userId: verified.userId,
                jti: verified.jti,
                bindingLevel: verified.bindingLevel,
              });

              monitoring.recordBusinessEvent('token_binding_mismatch', {
                userId: verified.userId.toString(),
                type: 'user_agent',
                bindingLevel: verified.bindingLevel,
              });
            }
          }
        }
      }

      return verified as AccessTokenPayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Access token verification failed', { error: errorMessage });

      monitoring.recordBusinessEvent('access_token_verification_failed', {
        error: errorMessage,
      });

      throw new Error(`Access token verification failed: ${errorMessage}`);
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      let verified: any;

      if (decoded.header.alg === 'RS256' || decoded.header.alg === 'PS256') {
        const kid = decoded.header.kid as string | undefined;
        if (!kid) {
          logger.error('Missing key ID in refresh token header', {
            algorithm: decoded.header.alg,
            tokenType: (decoded.payload as any).type,
            hasExp: !!(decoded.payload as any).exp,
            hasIat: !!(decoded.payload as any).iat,
          });
          throw new Error('Missing key ID in token header');
        }

        logger.debug('Attempting refresh token verification', {
          kid,
          algorithm: decoded.header.alg,
          tokenType: (decoded.payload as any).type,
          userId: (decoded.payload as any).userId,
          tokenFamily: (decoded.payload as any).tokenFamily,
        });

        const keyPair = keyManager.getVerificationKey(kid);
        if (!keyPair) {
          // Log all available keys for debugging
          const availableKeys = keyManager.getAllVerificationKeys();
          logger.error('Unknown signing key requested for refresh token - token may be from previous server session', {
            requestedKid: kid,
            algorithm: decoded.header.alg,
            tokenType: (decoded.payload as any).type,
            availableKids: Object.keys(availableKeys),
            activeKeyId: keyManager.getActiveKey()?.keyId,
            userId: (decoded.payload as any).userId,
          });
          // Provide a more user-friendly error for expired/invalid tokens
          throw new Error(`Refresh token verification failed: signing key not found. This may be due to a server restart or security update. Please re-authenticate.`);
        }

        verified = jwt.verify(token, keyPair.publicKey, {
          algorithms: ['PS256', 'RS256'], // Support both PS256 and RS256 for transition
          issuer: config.jwt?.issuer || 'keygen-portal',
          audience: config.jwt?.audience || 'keygen-portal-api',
          clockTolerance: this.clockSkewTolerance,
        });
      } else if (decoded.header.alg === 'HS256') {
        // Legacy HS256 support
        logger.warn('HS256 refresh token received (legacy mode)');

        verified = jwt.verify(token, this.legacySecret, {
          algorithms: ['HS256'],
          clockTolerance: this.clockSkewTolerance,
        });
      } else {
        throw new Error(`Unsupported token algorithm: ${decoded.header.alg}`);
      }

      // Validate token type
      if (verified.type !== 'refresh') {
        throw new Error(`Invalid token type: ${verified.type}`);
      }

      return verified as RefreshTokenPayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Refresh token verification failed', { error: errorMessage });

      monitoring.recordBusinessEvent('refresh_token_verification_failed', {
        error: errorMessage,
      });

      throw new Error(`Refresh token verification failed: ${errorMessage}`);
    }
  }

  /**
   * Generate privileged token for step-up operations
   */
  async generatePrivilegedToken(payload: {
    userId: number;
    email: string;
    name: string;
    sessionId: string;
    scopes: string[];
    ipAddress?: string;
    userAgent?: string;
    ttl?: number; // seconds, default 5 minutes
  }): Promise<string> {
    const activeKey = keyManager.getActiveKey();
    if (!activeKey) {
      logger.error('No active signing key available');
      throw new Error('No active signing key available');
    }

    try {
      const jti = crypto.randomUUID();
      const ttl = payload.ttl || 300; // 5 minutes default

      // Hash IP and User-Agent for token binding
      const ipHash = payload.ipAddress
        ? crypto.createHash('sha256').update(payload.ipAddress).digest('hex').substring(0, 16)
        : undefined;

      const uaHash = payload.userAgent
        ? crypto.createHash('sha256').update(payload.userAgent).digest('hex').substring(0, 16)
        : undefined;

      const now = Math.floor(Date.now() / 1000);

      const privilegedPayload: PrivilegedTokenPayload = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        sid: payload.sessionId,
        jti,
        ipHash,
        uaHash,
        bindingLevel: 'strict', // Privileged tokens use strict binding
        scopes: payload.scopes,
        ttl,
        type: 'privileged',
      };

      const token = jwt.sign(privilegedPayload, activeKey.privateKey, {
        algorithm: 'PS256', // Upgraded to RSA-PSS for stronger security
        expiresIn: ttl,
        issuer: config.jwt?.issuer || 'keygen-portal',
        audience: config.jwt?.audience || 'keygen-portal-api',
        keyid: activeKey.keyId,
      });

      logger.info('Privileged token generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        scopes: payload.scopes,
        ttl,
      });

      monitoring.recordBusinessEvent('privileged_token_generated', {
        userId: payload.userId.toString(),
        scopes: payload.scopes.join(','),
        ttl: ttl.toString(),
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate privileged token', { error });
      throw error;
    }
  }

  /**
   * Verify privileged token
   */
  async verifyPrivilegedToken(
    token: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<PrivilegedTokenPayload> {
    try {
      const payload = await this.verifyAccessToken(token, context) as PrivilegedTokenPayload;

      // Validate token type
      if (payload.type !== 'privileged') {
        throw new Error('Invalid token type for privileged operation');
      }

      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Privileged token verification failed', { error: errorMessage });
      throw new Error(`Privileged token verification failed: ${errorMessage}`);
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Failed to decode token', { error });
      return null;
    }
  }

  /**
   * Extract JTI from token (for session tracking)
   */
  extractJti(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.jti || null;
  }

  /**
   * Get token info (for debugging)
   */
  getTokenInfo(token: string): {
    algorithm: string | null;
    keyId: string | null;
    expiresAt: Date | null;
    issuedAt: Date | null;
    type: string | null;
  } {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        return {
          algorithm: null,
          keyId: null,
          expiresAt: null,
          issuedAt: null,
          type: null,
        };
      }

      return {
        algorithm: decoded.header.alg || null,
        keyId: (decoded.header.kid as string) || null,
        expiresAt: decoded.payload.exp ? new Date(decoded.payload.exp * 1000) : null,
        issuedAt: decoded.payload.iat ? new Date(decoded.payload.iat * 1000) : null,
        type: (decoded.payload as any).type || null,
      };
    } catch (error) {
      logger.error('Failed to get token info', { error });
      return {
        algorithm: null,
        keyId: null,
        expiresAt: null,
        issuedAt: null,
        type: null,
      };
    }
  }
}

// Singleton instance
export const jwtServiceV2 = new JWTServiceV2();
