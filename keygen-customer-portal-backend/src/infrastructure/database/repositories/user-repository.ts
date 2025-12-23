/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users } from '../schema';
import type { User } from '../../../domain/models/user';
import { monitoring } from '../../../shared/monitoring';

// Repository interface (part of infrastructure contracts)
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByAuth0Id(auth0Id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: number, user: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

// Repository implementation
export class UserRepository implements IUserRepository {
  private async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'users', duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordDatabaseQuery(operation, 'users', duration, false);
      monitoring.recordDatabaseError(operation, 'users', error as Error);
      throw error;
    }
  }

  async findById(id: number): Promise<User | null> {
    return this.executeQuery('findById', async () => {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.executeQuery('findByAuth0Id', async () => {
      const result = await db.select().from(users).where(eq(users.auth0Id, auth0Id)).limit(1);
      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.executeQuery('findByEmail', async () => {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.executeQuery('create', async () => {
      const result = await db.insert(users).values({
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        isActive: userData.isActive,
      }).returning();

      return this.mapToDomain(result[0]);
    });
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    return this.executeQuery('update', async () => {
      const result = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return result[0] ? this.mapToDomain(result[0]) : null;
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.executeQuery('delete', async () => {
      const result = await db.delete(users).where(eq(users.id, id));
      return (result as any) > 0;
    });
  }

  private mapToDomain(dbUser: any): User {
    return {
      id: dbUser.id,
      auth0Id: dbUser.auth0Id,
      email: dbUser.email,
      name: dbUser.name,
      password: dbUser.password,
      isActive: dbUser.isActive,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }
}

