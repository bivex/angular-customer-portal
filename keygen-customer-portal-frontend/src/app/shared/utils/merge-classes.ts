/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function mergeClasses(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = 'id'): string {
  // Use crypto.getRandomValues for more secure random ID generation
  const array = new Uint8Array(9);
  crypto.getRandomValues(array);
  const randomString = Array.from(array, (byte) => byte.toString(36))
    .join('')
    .slice(0, 9);
  return `${prefix}-${randomString}`;
}

export function transform<T>(value: T): T {
  return value;
}

export function noopFn(): void {
  // No operation
}
