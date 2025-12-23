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

import { eq, and, lt, gt, desc, isNotNull } from 'drizzle-orm';
import { db } from '../connection';
import { sessions } from '../schema';
import { monitoring } from '../../../shared/monitoring';
import crypto from 'crypto';

// Session entity type
export interface Session {
  id: string;
  userId: number;
  accessTokenJti: string | null;
  refreshTokenJti: string | null;
  ipAddress: string | null;
  ipHash: string | null;
  userAgent: string | null;
  userAgentHash: string | null;
  deviceFingerprint: string | null;
  geolocation: any | null;
  riskScore: number;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  userId: number;
  accessTokenJti?: string; // Made optional for initial creation
  refreshTokenJti?: string; // Made optional for initial creation
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geolocation?: any;
  expiresAt: Date;
  riskScore?: number;
}

// Repository interface
export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByAccessTokenJti(jti: string): Promise<Session | null>;
  findByRefreshTokenJti(jti: string): Promise<Session | null>;
  findActiveByUserId(userId: number): Promise<Session[]>;
  updateLastActivity(sessionId: string): Promise<void>;
  updateRiskScore(sessionId: string, riskScore: number): Promise<void>;
  updateJTIs(sessionId: string, accessTokenJti: string, refreshTokenJti: string): Promise<void>;
  revokeSession(sessionId: string, reason: string): Promise<void>;
  revokeAllUserSessions(userId: number, reason: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>;
}

// Repository implementation
export class SessionRepository implements ISessionRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'sessions', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'sessions', duration, false);
      monitoring.recordDatabaseError(operation, 'sessions', error as Error);
      throw error;
    }
  }

  async create(input: CreateSessionInput): Promise<Session> {
    return this.executeQuery('create', async () => {
      // Validate and sanitize IP address for inet type
      const isValidIp = input.ipAddress && input.ipAddress !== 'unknown' &&
                       /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(input.ipAddress);
      const sanitizedIpAddress = isValidIp ? input.ipAddress : null;

      // Hash IP and User-Agent for privacy and token binding
      const ipHash = sanitizedIpAddress
        ? crypto.createHash('sha256').update(sanitizedIpAddress).digest('hex')
        : null;

      const uaHash = input.userAgent
        ? crypto.createHash('sha256').update(input.userAgent).digest('hex')
        : null;

      const result = await db.insert(sessions)
        .values({
          userId: input.userId,
          accessTokenJti: input.accessTokenJti || null,
          refreshTokenJti: input.refreshTokenJti || null,
          ipAddress: sanitizedIpAddress,
          ipHash: ipHash || null,
          userAgent: input.userAgent || null,
          userAgentHash: uaHash || null,
          deviceFingerprint: input.deviceFingerprint || null,
          geolocation: input.geolocation || null,
          riskScore: input.riskScore || 0,
          isActive: true,
          lastActivityAt: new Date(),
          expiresAt: input.expiresAt,
        })
        .returning({
          id: sessions.id,
          userId: sessions.userId,
          accessTokenJti: sessions.accessTokenJti,
          refreshTokenJti: sessions.refreshTokenJti,
          ipAddress: sessions.ipAddress,
          ipHash: sessions.ipHash,
          userAgent: sessions.userAgent,
          userAgentHash: sessions.userAgentHash,
          deviceFingerprint: sessions.deviceFingerprint,
          geolocation: sessions.geolocation,
          riskScore: sessions.riskScore,
          isActive: sessions.isActive,
          lastActivityAt: sessions.lastActivityAt,
          expiresAt: sessions.expiresAt,
        });

      return this.mapToDomain(result[0]);
    });
  }

  async findById(id: string): Promise<Session | null> {
    return this.executeQuery('findById', async () => {
      const result = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByAccessTokenJti(jti: string): Promise<Session | null> {
    return this.executeQuery('findByAccessTokenJti', async () => {
      const result = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.accessTokenJti, jti),
            eq(sessions.isActive, true),
            isNotNull(sessions.accessTokenJti)
          )
        )
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByRefreshTokenJti(jti: string): Promise<Session | null> {
    return this.executeQuery('findByRefreshTokenJti', async () => {
      const result = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.refreshTokenJti, jti),
            eq(sessions.isActive, true),
            isNotNull(sessions.refreshTokenJti)
          )
        )
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findActiveByUserId(userId: number): Promise<Session[]> {
    return this.executeQuery('findActiveByUserId', async () => {
      const result = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true),
            gt(sessions.expiresAt, new Date())
          )
        )
        .orderBy(desc(sessions.lastActivityAt));

      return result.map(row => this.mapToDomain(row));
    });
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    return this.executeQuery('updateLastActivity', async () => {
      await db
        .update(sessions)
        .set({
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    });
  }

  async updateRiskScore(sessionId: string, riskScore: number): Promise<void> {
    return this.executeQuery('updateRiskScore', async () => {
      await db
        .update(sessions)
        .set({
          riskScore,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    });
  }

  async updateJTIs(sessionId: string, accessTokenJti: string, refreshTokenJti: string): Promise<void> {
    return this.executeQuery('updateJTIs', async () => {
      await db
        .update(sessions)
        .set({
          accessTokenJti,
          refreshTokenJti,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    });
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    return this.executeQuery('revokeSession', async () => {
      await db
        .update(sessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    });
  }

  async revokeAllUserSessions(userId: number, reason: string): Promise<void> {
    return this.executeQuery('revokeAllUserSessions', async () => {
      await db
        .update(sessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: reason,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true)
          )
        );
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    return this.executeQuery('cleanupExpiredSessions', async () => {
      const result = await db
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()))
        .returning({ id: sessions.id });

      return result.length;
    });
  }

  private mapToDomain(dbSession: any): Session {
    return {
      id: dbSession.id,
      userId: dbSession.userId,
      accessTokenJti: dbSession.accessTokenJti || null,
      refreshTokenJti: dbSession.refreshTokenJti || null,
      ipAddress: dbSession.ipAddress,
      ipHash: dbSession.ipHash,
      userAgent: dbSession.userAgent,
      userAgentHash: dbSession.userAgentHash,
      deviceFingerprint: dbSession.deviceFingerprint,
      geolocation: dbSession.geolocation,
      riskScore: dbSession.riskScore,
      isActive: dbSession.isActive,
      lastActivityAt: dbSession.lastActivityAt,
      expiresAt: dbSession.expiresAt,
      revokedAt: dbSession.revokedAt,
      revokedReason: dbSession.revokedReason,
      createdAt: dbSession.createdAt,
      updatedAt: dbSession.updatedAt,
    };
  }
}
