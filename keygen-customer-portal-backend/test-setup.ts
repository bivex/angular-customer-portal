/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-22
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Global test setup for mocking shared dependencies

import { vi } from 'bun:test';

// Mock config globally
vi.mock('./src/shared/config', () => ({
  config: {
    database: {
      url: 'postgresql://test:test@localhost:5432/testdb'
    },
    host: 'localhost',
    port: 3000,
    environment: 'test',
    jwt: {
      secret: 'test-secret',
      expiresIn: '24h',
      accessTokenTTL: 900,
      refreshTokenTTL: 604800,
      issuer: 'test-issuer',
      audience: 'test-audience',
      algorithm: 'RS256',
      clockSkewTolerance: 60
    },
    monitoring: {
      sentryDsn: undefined
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100
    }
  }
}));

// Mock database connection globally
vi.mock('./src/infrastructure/database/connection', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Also mock drizzle functions that might be used
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  desc: vi.fn(),
  isNotNull: vi.fn(),
}));

// Mock monitoring globally
vi.mock('./src/shared/monitoring', () => ({
  monitoring: {
    recordDatabaseQuery: vi.fn(),
    recordDatabaseError: vi.fn(),
    recordBusinessEvent: vi.fn(),
    recordUserLogin: vi.fn(),
    recordUserLogout: vi.fn(),
    recordTokenRefresh: vi.fn(),
    recordSessionRevoked: vi.fn(),
  },
}));

// Mock crypto globally
vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mocked-hash'),
    }),
  },
}));