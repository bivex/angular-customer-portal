/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-22T00:03:47
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Required environment variables - no defaults for security
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  HOST: z.string().optional().default('localhost'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a valid number').optional().default('3000'),

  // Optional environment variables with defaults
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  JWT_EXPIRES_IN: z.string().optional().default('24h'),
  SENTRY_DSN: z.string().url().optional(),

  // JWT v2 configuration (RS256)
  JWT_ACCESS_TOKEN_TTL: z.string().regex(/^\d+$/).optional().default('900'), // 15 minutes in seconds
  JWT_REFRESH_TOKEN_TTL: z.string().regex(/^\d+$/).optional().default('604800'), // 7 days in seconds
  JWT_ISSUER: z.string().optional().default('keygen-portal'),
  JWT_AUDIENCE: z.string().optional().default('keygen-portal-api'),
  JWT_ALGORITHM: z.enum(['HS256', 'RS256']).optional().default('RS256'),
  JWT_CLOCK_SKEW_TOLERANCE: z.string().regex(/^\d+$/).optional().default('60'), // 60 seconds

  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).optional().default('1000'),
});

// Validate environment variables at startup
const env = envSchema.parse(process.env);

const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
  host: z.string(),
  port: z.number(),
  environment: z.enum(['development', 'test', 'production']),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string(),
    accessTokenTTL: z.number().optional(),
    refreshTokenTTL: z.number().optional(),
    issuer: z.string().optional(),
    audience: z.string().optional(),
    algorithm: z.enum(['HS256', 'RS256']).optional(),
  }),
  monitoring: z.object({
    sentryDsn: z.string().optional(),
  }),
  rateLimit: z.object({
    windowMs: z.number(),
    maxRequests: z.number(),
  }),
});

type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse({
  database: {
    url: env.DATABASE_URL,
  },
  host: env.HOST,
  port: parseInt(env.PORT, 10),
  environment: env.NODE_ENV,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    accessTokenTTL: parseInt(env.JWT_ACCESS_TOKEN_TTL, 10),
    refreshTokenTTL: parseInt(env.JWT_REFRESH_TOKEN_TTL, 10),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithm: env.JWT_ALGORITHM,
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
});

