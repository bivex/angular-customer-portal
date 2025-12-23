/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T23:39:08
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { JWTPayload } from './infrastructure/auth/jwt-service';

// Extend Request interface to include startTime
declare global {
  interface Request {
    startTime?: number;
  }
}

// Extend Elysia context to include user information and authenticate function
declare module 'elysia' {
  interface Context {
    user?: JWTPayload;
    authenticate(): Promise<{ user: JWTPayload }>;
  }
}
