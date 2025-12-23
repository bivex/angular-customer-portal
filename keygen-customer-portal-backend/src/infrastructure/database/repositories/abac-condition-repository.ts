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

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { abacConditions } from '../schema';
import { monitoring } from '../../../shared/monitoring';
import { logger } from '../../../shared/logger';

// ABAC Condition types
export type ConditionType = 'time_window' | 'ip_range' | 'risk_score' | 'user_attribute' | 'geolocation' | 'device_fingerprint' | 'security_level';
export type ConditionOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'contains' | 'not_contains' | 'between' | 'regex_match';

// Structured ABAC condition
export interface AbacCondition {
  id: string;
  permissionId: number;
  conditionType: ConditionType;
  conditionKey?: string;
  operator: ConditionOperator;
  valueText?: string;
  valueNumber?: number;
  valueJsonb?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAbacConditionInput {
  permissionId: number;
  conditionType: ConditionType;
  conditionKey?: string;
  operator: ConditionOperator;
  valueText?: string;
  valueNumber?: number;
  valueJsonb?: any;
}

export interface UpdateAbacConditionInput {
  conditionKey?: string;
  operator?: ConditionOperator;
  valueText?: string;
  valueNumber?: number;
  valueJsonb?: any;
}

// Repository interface
export interface IAbacConditionRepository {
  create(input: CreateAbacConditionInput): Promise<AbacCondition>;
  findById(id: string): Promise<AbacCondition | null>;
  findByPermissionId(permissionId: string): Promise<AbacCondition[]>;
  findByPermissionIds(permissionIds: number[]): Promise<AbacCondition[]>;
  findByType(conditionType: ConditionType): Promise<AbacCondition[]>;
  update(id: string, input: UpdateAbacConditionInput): Promise<AbacCondition>;
  delete(id: string): Promise<void>;
  deleteByPermissionId(permissionId: string): Promise<void>;
}

// Repository implementation
export class AbacConditionRepository implements IAbacConditionRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'abac_conditions', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'abac_conditions', duration, false);
      monitoring.recordDatabaseError(operation, 'abac_conditions', error as Error);
      throw error;
    }
  }

  async create(input: CreateAbacConditionInput): Promise<AbacCondition> {
    return this.executeQuery('createAbacCondition', async () => {
      const result = await db.insert(abacConditions).values({
        permissionId: input.permissionId,
        conditionType: input.conditionType,
        conditionKey: input.conditionKey || null,
        operator: input.operator,
        valueText: input.valueText || null,
        valueNumber: input.valueNumber || null,
        valueJsonb: input.valueJsonb || null,
      }).returning();

      return this.mapToDomain(result[0]);
    });
  }

  async findById(id: string): Promise<AbacCondition | null> {
    return this.executeQuery('findAbacConditionById', async () => {
      const result = await db
        .select()
        .from(abacConditions)
        .where(eq(abacConditions.id, id))
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByPermissionId(permissionId: string): Promise<AbacCondition[]> {
    return this.executeQuery('findAbacConditionsByPermissionId', async () => {
      const result = await db
        .select()
        .from(abacConditions)
        .where(eq(abacConditions.permissionId, permissionId))
        .orderBy(abacConditions.conditionType, abacConditions.conditionKey);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findByPermissionIds(permissionIds: number[]): Promise<AbacCondition[]> {
    return this.executeQuery('findAbacConditionsByPermissionIds', async () => {
      try {
        const result = await db
          .select()
          .from(abacConditions)
          .where(inArray(abacConditions.permissionId, permissionIds))
          .orderBy(abacConditions.permissionId, abacConditions.conditionType);

        return result.map(row => this.mapToDomain(row));
      } catch (error: any) {
        // If table or enums don't exist, return empty array (ABAC not yet available)
        const errorMsg = error.message || '';
        if (errorMsg.includes('does not exist') ||
            errorMsg.includes('abac_conditions') ||
            error.code === '42P01' ||
            error.code === '42703' || // undefined_column
            error.code === '42883') { // undefined_function
          logger.warn('ABAC conditions table/enums not available, returning empty conditions', { error: errorMsg });
          return [];
        }
        logger.error('Unexpected error querying ABAC conditions', { error });
        throw error;
      }
    });
  }

  async findByType(conditionType: ConditionType): Promise<AbacCondition[]> {
    return this.executeQuery('findAbacConditionsByType', async () => {
      const result = await db
        .select()
        .from(abacConditions)
        .where(eq(abacConditions.conditionType, conditionType))
        .orderBy(abacConditions.conditionKey);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async update(id: string, input: UpdateAbacConditionInput): Promise<AbacCondition> {
    return this.executeQuery('updateAbacCondition', async () => {
      const result = await db
        .update(abacConditions)
        .set({
          conditionKey: input.conditionKey,
          operator: input.operator,
          valueText: input.valueText,
          valueNumber: input.valueNumber,
          valueJsonb: input.valueJsonb,
          updatedAt: new Date(),
        })
        .where(eq(abacConditions.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`ABAC condition with id ${id} not found`);
      }

      return this.mapToDomain(result[0]);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executeQuery('deleteAbacCondition', async () => {
      await db
        .delete(abacConditions)
        .where(eq(abacConditions.id, id));
    });
  }

  async deleteByPermissionId(permissionId: string): Promise<void> {
    return this.executeQuery('deleteAbacConditionsByPermissionId', async () => {
      await db
        .delete(abacConditions)
        .where(eq(abacConditions.permissionId, permissionId));
    });
  }

  private mapToDomain(dbCondition: any): AbacCondition {
    return {
      id: dbCondition.id,
      permissionId: dbCondition.permissionId,
      conditionType: dbCondition.conditionType,
      conditionKey: dbCondition.conditionKey,
      operator: dbCondition.operator,
      valueText: dbCondition.valueText,
      valueNumber: dbCondition.valueNumber,
      valueJsonb: dbCondition.valueJsonb,
      createdAt: dbCondition.createdAt,
      updatedAt: dbCondition.updatedAt,
    };
  }
}