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

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../connection';
import { roles, userRoles, rolePermissions } from '../schema';
import { monitoring } from '../../../shared/monitoring';

// Role entity
export interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User role entity
export interface UserRole {
  userId: number;
  roleId: number;
  grantedAt: Date;
  grantedBy: number | null;
  expiresAt: Date | null;
  isActive: boolean;
}

// Role permission entity
export interface RolePermission {
  roleId: number;
  permissionId: string;
  createdAt: Date;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  isSystemRole?: boolean;
}

export interface UpdateRoleInput {
  description?: string;
}

export interface AssignRoleInput {
  userId: number;
  roleId: number;
  grantedBy?: number;
  expiresAt?: Date;
}

// Repository interface
export interface IRoleRepository {
  // Role CRUD
  create(input: CreateRoleInput): Promise<Role>;
  findById(id: number): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findSystemRoles(): Promise<Role[]>;
  update(id: number, input: UpdateRoleInput): Promise<Role>;
  delete(id: number): Promise<void>;

  // User role management
  assignRole(input: AssignRoleInput): Promise<UserRole>;
  revokeRole(userId: number, roleId: number): Promise<void>;
  findByUserId(userId: number): Promise<Role[]>;
  findUsersByRole(roleId: number): Promise<number[]>;
  updateRoleExpiration(userId: number, roleId: number, expiresAt: Date | null): Promise<void>;

  // Role permissions
  addPermission(roleId: number, permissionId: string): Promise<void>;
  removePermission(roleId: number, permissionId: string): Promise<void>;
  findPermissionsByRole(roleId: number): Promise<string[]>;
  findRolesByPermission(permissionId: string): Promise<number[]>;
}

// Repository implementation
export class RoleRepository implements IRoleRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'roles', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'roles', duration, false);
      monitoring.recordDatabaseError(operation, 'roles', error as Error);
      throw error;
    }
  }

  // Role CRUD operations
  async create(input: CreateRoleInput): Promise<Role> {
    return this.executeQuery('createRole', async () => {
      const result = await db.insert(roles).values({
        name: input.name,
        description: input.description || null,
        isSystemRole: input.isSystemRole || false,
      }).returning();

      return this.mapRoleToDomain(result[0]);
    });
  }

  async findById(id: number): Promise<Role | null> {
    return this.executeQuery('findRoleById', async () => {
      const result = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      return result[0] ? this.mapRoleToDomain(result[0]) : null;
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.executeQuery('findRoleByName', async () => {
      const result = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      return result[0] ? this.mapRoleToDomain(result[0]) : null;
    });
  }

  async findAll(): Promise<Role[]> {
    return this.executeQuery('findAllRoles', async () => {
      const result = await db
        .select()
        .from(roles)
        .orderBy(roles.name);

      return result.map(row => this.mapRoleToDomain(row));
    });
  }

  async findSystemRoles(): Promise<Role[]> {
    return this.executeQuery('findSystemRoles', async () => {
      const result = await db
        .select()
        .from(roles)
        .where(eq(roles.isSystemRole, true))
        .orderBy(roles.name);

      return result.map(row => this.mapRoleToDomain(row));
    });
  }

  async update(id: number, input: UpdateRoleInput): Promise<Role> {
    return this.executeQuery('updateRole', async () => {
      const result = await db
        .update(roles)
        .set({
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Role with id ${id} not found`);
      }

      return this.mapRoleToDomain(result[0]);
    });
  }

  async delete(id: number): Promise<void> {
    return this.executeQuery('deleteRole', async () => {
      await db
        .delete(roles)
        .where(eq(roles.id, id));
    });
  }

  // User role management
  async assignRole(input: AssignRoleInput): Promise<UserRole> {
    return this.executeQuery('assignRole', async () => {
      const result = await db.insert(userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        grantedBy: input.grantedBy || null,
        expiresAt: input.expiresAt || null,
        isActive: true,
      }).returning();

      return this.mapUserRoleToDomain(result[0]);
    });
  }

  async revokeRole(userId: number, roleId: number): Promise<void> {
    return this.executeQuery('revokeRole', async () => {
      await db
        .update(userRoles)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId),
            eq(userRoles.isActive, true)
          )
        );
    });
  }

  async findByUserId(userId: number): Promise<Role[]> {
    return this.executeQuery('findRolesByUserId', async () => {
      const result = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystemRole: roles.isSystemRole,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.isActive, true)
          )
        )
        .orderBy(roles.name);

      return result.map(row => this.mapRoleToDomain(row));
    });
  }

  async findUsersByRole(roleId: number): Promise<number[]> {
    return this.executeQuery('findUsersByRole', async () => {
      const result = await db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(
          and(
            eq(userRoles.roleId, roleId),
            eq(userRoles.isActive, true)
          )
        );

      return result.map(row => row.userId);
    });
  }

  async updateRoleExpiration(userId: number, roleId: number, expiresAt: Date | null): Promise<void> {
    return this.executeQuery('updateRoleExpiration', async () => {
      await db
        .update(userRoles)
        .set({
          expiresAt,
        })
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId)
          )
        );
    });
  }

  // Role permissions management
  async addPermission(roleId: number, permissionId: string): Promise<void> {
    return this.executeQuery('addRolePermission', async () => {
      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
      });
    });
  }

  async removePermission(roleId: number, permissionId: string): Promise<void> {
    return this.executeQuery('removeRolePermission', async () => {
      await db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId)
          )
        );
    });
  }

  async findPermissionsByRole(roleId: number): Promise<string[]> {
    return this.executeQuery('findPermissionsByRole', async () => {
      const result = await db
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      return result.map(row => row.permissionId);
    });
  }

  async findRolesByPermission(permissionId: string): Promise<number[]> {
    return this.executeQuery('findRolesByPermission', async () => {
      const result = await db
        .select({ roleId: rolePermissions.roleId })
        .from(rolePermissions)
        .where(eq(rolePermissions.permissionId, permissionId));

      return result.map(row => row.roleId);
    });
  }

  private mapRoleToDomain(dbRole: any): Role {
    return {
      id: dbRole.id,
      name: dbRole.name,
      description: dbRole.description,
      isSystemRole: dbRole.isSystemRole,
      createdAt: dbRole.createdAt,
      updatedAt: dbRole.updatedAt,
    };
  }

  private mapUserRoleToDomain(dbUserRole: any): UserRole {
    return {
      userId: dbUserRole.userId,
      roleId: dbUserRole.roleId,
      grantedAt: dbUserRole.grantedAt,
      grantedBy: dbUserRole.grantedBy,
      expiresAt: dbUserRole.expiresAt,
      isActive: dbUserRole.isActive,
    };
  }
}