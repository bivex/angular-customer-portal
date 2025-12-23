/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T20:17:30
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Sanitizes input to prevent XSS attacks by removing HTML tags
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates that the input doesn't contain potentially dangerous content
 */
export function validateSafeInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}