/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-21T22:44:02
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { eq, and, or, like } from 'drizzle-orm';
import { db } from '../connection';
import { permissions } from '../schema';
import { monitoring } from '../../../shared/monitoring';

// Permission entity
export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions: any | null;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionInput {
  resource: string;
  action: string;
  conditions?: any;
  description?: string;
  isSystemPermission?: boolean;
}

export interface UpdatePermissionInput {
  conditions?: any;
  description?: string;
}

// Repository interface
export interface IPermissionRepository {
  create(input: CreatePermissionInput): Promise<Permission>;
  findById(id: string): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  findByResource(resource: string): Promise<Permission[]>;
  findByResourceAndAction(resource: string, action: string): Promise<Permission | null>;
  findByResources(resources: string[]): Promise<Permission[]>;
  update(id: string, input: UpdatePermissionInput): Promise<Permission>;
  delete(id: string): Promise<void>;
}

// Repository implementation
export class PermissionRepository implements IPermissionRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'permissions', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'permissions', duration, false);
      monitoring.recordDatabaseError(operation, 'permissions', error as Error);
      throw error;
    }
  }

  async create(input: CreatePermissionInput): Promise<Permission> {
    return this.executeQuery('create', async () => {
      const result = await db.insert(permissions).values({
        resource: input.resource,
        action: input.action,
        conditions: input.conditions || null,
        description: input.description || null,
        isSystemPermission: input.isSystemPermission || false,
      }).returning();

      return this.mapToDomain(result[0]);
    });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.executeQuery('findById', async () => {
      const result = await db
        .select()
        .from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.executeQuery('findAll', async () => {
      const result = await db
        .select()
        .from(permissions)
        .orderBy(permissions.resource, permissions.action);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.executeQuery('findByResource', async () => {
      const result = await db
        .select()
        .from(permissions)
        .where(eq(permissions.resource, resource))
        .orderBy(permissions.action);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission | null> {
    return this.executeQuery('findByResourceAndAction', async () => {
      const result = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.resource, resource),
            eq(permissions.action, action)
          )
        )
        .limit(1);

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByResources(resources: string[]): Promise<Permission[]> {
    return this.executeQuery('findByResources', async () => {
      const conditions = resources.map(resource => eq(permissions.resource, resource));
      const result = await db
        .select()
        .from(permissions)
        .where(or(...conditions))
        .orderBy(permissions.resource, permissions.action);

      return result.map(row => this.mapToDomain(row));
    });
  }

  async update(id: string, input: UpdatePermissionInput): Promise<Permission> {
    return this.executeQuery('update', async () => {
      const result = await db
        .update(permissions)
        .set({
          conditions: input.conditions,
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(permissions.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Permission with id ${id} not found`);
      }

      return this.mapToDomain(result[0]);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executeQuery('delete', async () => {
      await db
        .delete(permissions)
        .where(eq(permissions.id, id));
    });
  }

  private mapToDomain(dbPermission: any): Permission {
    return {
      id: dbPermission.id,
      resource: dbPermission.resource,
      action: dbPermission.action,
      conditions: dbPermission.conditions,
      description: dbPermission.description,
      isSystemPermission: dbPermission.isSystemPermission,
      createdAt: dbPermission.createdAt,
      updatedAt: dbPermission.updatedAt,
    };
  }
}