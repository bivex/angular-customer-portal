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

import { eq, and, gte, or, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../connection';
import { auditEvents } from '../schema';
import { monitoring } from '../../../shared/monitoring';
import { logger } from '../../../shared/logger';

// Audit event types from enum
export type AuditEventType =
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'password_change'
  | 'token_refresh'
  | 'token_revoked'
  | 'session_created'
  | 'session_revoked'
  | 'permission_denied'
  | 'step_up_required'
  | 'step_up_completed'
  | 'suspicious_activity'
  | 'account_locked'
  | 'account_unlocked';

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type EventResult = 'success' | 'failure' | 'denied';

// Audit event entity
export interface AuditEvent {
  id: string;
  userId: number | null;
  sessionId: string | null;
  eventType: AuditEventType;
  eventSeverity: EventSeverity;
  ipAddress: string | null;
  userAgent: string | null;
  resource: string | null;
  action: string | null;
  result: EventResult | null;
  metadata: any | null;
  riskIndicators: any | null;
  eventHash: string | null;
  previousEventHash: string | null;
  createdAt: Date;
}

export interface CreateAuditEventInput {
  userId?: number;
  sessionId?: string;
  eventType: AuditEventType;
  eventSeverity?: EventSeverity;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result?: EventResult;
  metadata?: any;
  riskIndicators?: any;
  skipHashChain?: boolean; // For testing/backward compatibility
}

// Repository interface
export interface IAuditRepository {
  create(input: CreateAuditEventInput): Promise<AuditEvent>;
  findByUserId(userId: number, limit?: number): Promise<AuditEvent[]>;
  findBySessionId(sessionId: string): Promise<AuditEvent[]>;
  findSuspiciousActivity(hours?: number): Promise<AuditEvent[]>;
  findByEventType(eventType: AuditEventType, limit?: number): Promise<AuditEvent[]>;
  findRecent(limit?: number): Promise<AuditEvent[]>;
}

// Repository implementation
export class AuditRepository implements IAuditRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'audit_events', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'audit_events', duration, false);
      monitoring.recordDatabaseError(operation, 'audit_events', error as Error);
      throw error;
    }
  }

  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    return this.executeQuery('create', async () => {
      // Hash chain temporarily disabled for compatibility
      let previousEventHash = null;

      // Validate and sanitize IP address for inet type
      const isValidIp = input.ipAddress && input.ipAddress !== 'unknown' &&
                       /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(input.ipAddress);
      const sanitizedIpAddress = isValidIp ? input.ipAddress : null;

      logger.debug('Creating audit event', {
        eventType: input.eventType,
        userId: input.userId,
        sessionId: input.sessionId,
        originalIpAddress: input.ipAddress,
        sanitizedIpAddress,
        isValidIp,
        result: input.result,
      });

      // Log if we're sanitizing the IP
      if (input.ipAddress !== sanitizedIpAddress) {
        logger.warn('IP address sanitized for audit event', {
          original: input.ipAddress,
          sanitized: sanitizedIpAddress,
          eventType: input.eventType,
        });
      }

      // Create event data for hashing
      const eventData = {
        userId: input.userId || null,
        sessionId: input.sessionId || null,
        eventType: input.eventType,
        eventSeverity: input.eventSeverity || 'info',
        ipAddress: sanitizedIpAddress,
        userAgent: input.userAgent || null,
        resource: input.resource || null,
        action: input.action || null,
        result: input.result || null,
        metadata: input.metadata || null,
        riskIndicators: input.riskIndicators || null,
      };

      // Generate hash of this event
      const eventHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(eventData))
        .digest('hex');

      const result = await db.insert(auditEvents).values({
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        eventType: eventData.eventType,
        eventSeverity: eventData.eventSeverity,
        ipAddress: sanitizedIpAddress,
        userAgent: eventData.userAgent,
        resource: eventData.resource,
        action: eventData.action,
        result: eventData.result,
        metadata: eventData.metadata,
        riskIndicators: eventData.riskIndicators,
        eventHash,
        previousEventHash,
      }).returning();

      if (!result[0]) {
        throw new Error('Failed to insert audit event');
      }

      // Return the domain object with sanitized data
      return {
        id: result[0].id,
        userId: result[0].userId,
        sessionId: result[0].sessionId,
        eventType: result[0].eventType,
        eventSeverity: result[0].eventSeverity,
        ipAddress: sanitizedIpAddress,
        userAgent: result[0].userAgent,
        resource: result[0].resource,
        action: result[0].action,
        result: result[0].result,
        metadata: result[0].metadata,
        riskIndicators: result[0].riskIndicators,
        eventHash: result[0].eventHash,
        previousEventHash: result[0].previousEventHash,
        createdAt: result[0].createdAt,
      };
    });
  }

  async findByUserId(userId: number, limit: number = 100): Promise<AuditEvent[]> {
    return this.executeQuery('findByUserId', async () => {
      const result = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, userId))
        .orderBy(desc(auditEvents.createdAt))
        .limit(limit);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findBySessionId(sessionId: string): Promise<AuditEvent[]> {
    return this.executeQuery('findBySessionId', async () => {
      const result = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.sessionId, sessionId))
        .orderBy(desc(auditEvents.createdAt));

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findSuspiciousActivity(hours: number = 24): Promise<AuditEvent[]> {
    return this.executeQuery('findSuspiciousActivity', async () => {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await db
        .select()
        .from(auditEvents)
        .where(
          and(
            gte(auditEvents.createdAt, since),
            or(
              eq(auditEvents.eventSeverity, 'warning'),
              eq(auditEvents.eventSeverity, 'error'),
              eq(auditEvents.eventSeverity, 'critical'),
              eq(auditEvents.result, 'denied')
            )
          )
        )
        .orderBy(desc(auditEvents.createdAt));

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findByEventType(eventType: AuditEventType, limit: number = 100): Promise<AuditEvent[]> {
    return this.executeQuery('findByEventType', async () => {
      const result = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.eventType, eventType))
        .orderBy(desc(auditEvents.createdAt))
        .limit(limit);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findRecent(limit: number = 50): Promise<AuditEvent[]> {
    return this.executeQuery('findRecent', async () => {
      const result = await db
        .select()
        .from(auditEvents)
        .orderBy(desc(auditEvents.createdAt))
        .limit(limit);

      return result.map(row => this.mapToDomain(row));
    });
  }

  private mapToDomain(dbEvent: any): AuditEvent {
    return {
      id: dbEvent.id,
      userId: dbEvent.userId,
      sessionId: dbEvent.sessionId,
      eventType: dbEvent.eventType,
      eventSeverity: dbEvent.eventSeverity,
      ipAddress: dbEvent.ipAddress,
      userAgent: dbEvent.userAgent,
      resource: dbEvent.resource,
      action: dbEvent.action,
      result: dbEvent.result,
      metadata: dbEvent.metadata,
      riskIndicators: dbEvent.riskIndicators,
      eventHash: dbEvent.eventHash || null,
      previousEventHash: dbEvent.previousEventHash,
      createdAt: dbEvent.createdAt,
    };
  }
}
