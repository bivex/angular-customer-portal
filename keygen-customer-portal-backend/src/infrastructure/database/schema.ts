/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-21T22:44:13
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { pgTable, serial, text, timestamp, boolean, uuid, integer, inet, jsonb, pgEnum, check, decimal } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const auditEventTypeEnum = pgEnum('audit_event_type', [
  'user_login',
  'user_logout',
  'user_register',
  'password_change',
  'token_refresh',
  'token_revoked',
  'session_created',
  'session_revoked',
  'permission_denied',
  'step_up_required',
  'step_up_completed',
  'suspicious_activity',
  'account_locked',
  'account_unlocked',
]);

export const eventSeverityEnum = pgEnum('event_severity', [
  'info',
  'warning',
  'error',
  'critical',
]);

export const eventResultEnum = pgEnum('event_result', [
  'success',
  'failure',
  'denied',
]);

// ABAC DSL enums
export const conditionTypeEnum = pgEnum('condition_type', [
  'time_window',
  'ip_range',
  'risk_score',
  'user_attribute',
  'geolocation',
  'device_fingerprint',
  'security_level',
]);

export const conditionOperatorEnum = pgEnum('condition_operator', [
  '=', '!=', '>', '<', '>=', '<=',
  'in', 'not_in', 'contains', 'not_contains',
  'between', 'regex_match',
]);

// User entity (persistence layer)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  auth0Id: text('auth0_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password'),
  isActive: boolean('is_active').default(true).notNull(),

  // Security fields
  lastLoginAt: timestamp('last_login_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  requireStepUp: boolean('require_step_up').default(false).notNull(),
  securityLevel: integer('security_level').default(1).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  securityLevelCheck: check('security_level_check', sql`${table.securityLevel} >= 1 AND ${table.securityLevel} <= 5`),
}));

// Example entity for demonstration
export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  licenseKey: text('license_key').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table - tracks active user sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accessTokenJti: text('access_token_jti'), // Made nullable for initial creation
  refreshTokenJti: text('refresh_token_jti'), // Made nullable for initial creation
  ipAddress: inet('ip_address'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  userAgentHash: text('user_agent_hash'),
  deviceFingerprint: text('device_fingerprint'),
  geolocation: jsonb('geolocation'),
  riskScore: integer('risk_score').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  riskScoreCheck: check('risk_score_check', sql`${table.riskScore} >= 0 AND ${table.riskScore} <= 100`),
  // Unique constraints only for non-null values
  accessTokenJtiUnique: sql`UNIQUE NULLS NOT DISTINCT (${table.accessTokenJti})`,
  refreshTokenJtiUnique: sql`UNIQUE NULLS NOT DISTINCT (${table.refreshTokenJti})`,
}));

// Audit events table - comprehensive security event logging (append-only, immutable)
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  eventType: auditEventTypeEnum('event_type').notNull(),
  eventSeverity: eventSeverityEnum('event_severity').default('info').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  resource: text('resource'),
  action: text('action'),
  result: eventResultEnum('result'),
  metadata: jsonb('metadata'),
  riskIndicators: jsonb('risk_indicators'),
  eventHash: text('event_hash'), // Hash of this event (nullable for migration)
  previousEventHash: text('previous_event_hash'), // Hash chain for immutability
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Roles table - user roles for RBAC/ABAC
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Permissions table - granular permissions for ABAC
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  conditions: jsonb('conditions'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Role permissions junction table
export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.roleId}, ${table.permissionId})`,
}));

// User roles junction table
export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  grantedBy: integer('granted_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.userId}, ${table.roleId})`,
}));

// User attributes table - for ABAC condition evaluation
export const userAttributes = pgTable('user_attributes', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attributeKey: text('attribute_key').notNull(),
  attributeValue: text('attribute_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.userId}, ${table.attributeKey})`,
}));

// ABAC conditions DSL table - structured storage for high-performance rule evaluation
export const abacConditions = pgTable('abac_conditions', {
  id: uuid('id').primaryKey().defaultRandom(),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),

  conditionType: conditionTypeEnum('condition_type').notNull(),
  conditionKey: text('condition_key'), // Optional key for the condition
  operator: conditionOperatorEnum('operator').notNull(),
  valueText: text('value_text'), // For string values
  valueNumber: decimal('value_number'), // For numeric values
  valueJsonb: jsonb('value_jsonb'), // For complex values (arrays, objects)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

