/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:03
 * Last Updated: 2025-12-19T10:03:37
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Domain entity - represents business rules and invariants
export interface User {
  id: number;
  auth0Id?: string;
  email: string;
  name: string;
  password?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Domain service for user business logic
export class UserDomainService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  static canActivate(user: User): boolean {
    return user.isActive === false;
  }

  static canDeactivate(user: User): boolean {
    return user.isActive === true;
  }
}

