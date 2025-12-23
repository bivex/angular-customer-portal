/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-21T22:43:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import { userAttributes } from '../schema';
import { monitoring } from '../../../shared/monitoring';

// User attribute entity
export interface UserAttribute {
  userId: number;
  attributeKey: string;
  attributeValue: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAttributeInput {
  userId: number;
  attributeKey: string;
  attributeValue: string;
}

export interface UpdateUserAttributeInput {
  attributeValue: string;
}

// Repository interface
export interface IUserAttributesRepository {
  create(input: CreateUserAttributeInput): Promise<UserAttribute>;
  findByUserId(userId: number): Promise<UserAttribute[]>;
  findByUserAndKey(userId: number, attributeKey: string): Promise<UserAttribute | null>;
  update(userId: number, attributeKey: string, input: UpdateUserAttributeInput): Promise<UserAttribute>;
  delete(userId: number, attributeKey: string): Promise<void>;
  deleteAllForUser(userId: number): Promise<void>;
  upsert(input: CreateUserAttributeInput): Promise<UserAttribute>;
}

// Repository implementation
export class UserAttributesRepository implements IUserAttributesRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'user_attributes', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'user_attributes', duration, false);
      monitoring.recordDatabaseError(operation, 'user_attributes', error as Error);
      throw error;
    }
  }

  async create(input: CreateUserAttributeInput): Promise<UserAttribute> {
    return this.executeQuery('create', async () => {
      const result = await db.insert(userAttributes).values({
        userId: input.userId,
        attributeKey: input.attributeKey,
        attributeValue: input.attributeValue,
      }).returning();

      return this.mapToDomain(result[0]);
    });
  }

  async findByUserId(userId: number): Promise<UserAttribute[]> {
    return this.executeQuery('findByUserId', async () => {
      const result = await db
        .select()
        .from(userAttributes)
        .where(eq(userAttributes.userId, userId))
        .orderBy(userAttributes.attributeKey);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findByUserAndKey(userId: number, attributeKey: string): Promise<UserAttribute | null> {
    return this.executeQuery('findByUserAndKey', async () => {
      const result = await db
        .select()
        .from(userAttributes)
        .where(
          and(
            eq(userAttributes.userId, userId),
            eq(userAttributes.attributeKey, attributeKey)
          )
        )
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async update(userId: number, attributeKey: string, input: UpdateUserAttributeInput): Promise<UserAttribute> {
    return this.executeQuery('update', async () => {
      const result = await db
        .update(userAttributes)
        .set({
          attributeValue: input.attributeValue,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userAttributes.userId, userId),
            eq(userAttributes.attributeKey, attributeKey)
          )
        )
        .returning();

      if (!result[0]) {
        throw new Error(`User attribute ${attributeKey} not found for user ${userId}`);
      }

      return this.mapToDomain(result[0]);
    });
  }

  async delete(userId: number, attributeKey: string): Promise<void> {
    return this.executeQuery('delete', async () => {
      await db
        .delete(userAttributes)
        .where(
          and(
            eq(userAttributes.userId, userId),
            eq(userAttributes.attributeKey, attributeKey)
          )
        );
    });
  }

  async deleteAllForUser(userId: number): Promise<void> {
    return this.executeQuery('deleteAllForUser', async () => {
      await db
        .delete(userAttributes)
        .where(eq(userAttributes.userId, userId));
    });
  }

  async upsert(input: CreateUserAttributeInput): Promise<UserAttribute> {
    return this.executeQuery('upsert', async () => {
      const result = await db
        .insert(userAttributes)
        .values({
          userId: input.userId,
          attributeKey: input.attributeKey,
          attributeValue: input.attributeValue,
        })
        .onConflictDoUpdate({
          target: [userAttributes.userId, userAttributes.attributeKey],
          set: {
            attributeValue: input.attributeValue,
            updatedAt: new Date(),
          },
        })
        .returning();

      return this.mapToDomain(result[0]);
    });
  }

  private mapToDomain(dbAttribute: any): UserAttribute {
    return {
      userId: dbAttribute.userId,
      attributeKey: dbAttribute.attributeKey,
      attributeValue: dbAttribute.attributeValue,
      createdAt: dbAttribute.createdAt,
      updatedAt: dbAttribute.updatedAt,
    };
  }
}