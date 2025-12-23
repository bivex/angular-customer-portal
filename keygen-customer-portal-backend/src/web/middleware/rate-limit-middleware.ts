/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:15:00
 * Last Updated: 2025-12-20T22:06:07
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { rateLimiter, type RateLimitConfig, extractUserTier, extractUserId, getUserTierConfig, UserTier, DEFAULT_RATE_LIMITS } from '../../shared/rate-limiter';
import { monitoring } from '../../shared/monitoring';

export interface RateLimitMiddlewareConfig {
  keyGenerator?: (context: any) => string;
  skip?: (context: any) => boolean;
  onLimitExceeded?: (context: any, result: any) => Response;
  config: RateLimitConfig;
}

/**
 * Safely extract pathname from URL to prevent open redirect vulnerabilities
 *
 * This function validates that URLs are from trusted hosts before extracting pathnames.
 * It prevents potential open redirection attacks by ensuring only local/trusted hosts
 * are accepted for rate limiting purposes.
 */
function getSafePathname(urlString: string): string {
  try {
    // Validate input is a string
    if (typeof urlString !== 'string') {
      return '/unknown';
    }

    const url = new URL(urlString);

    // Validate that the URL is from an expected host to prevent open redirect
    // Only allow localhost, 127.0.0.1, and configured HOST (if set)
    const allowedHosts = ['localhost', '127.0.0.1'];
    if (process.env.HOST && process.env.HOST !== 'localhost') {
      allowedHosts.push(process.env.HOST);
    }

    // Check if hostname is in allowed list (exact match only for security)
    const isAllowedHost = allowedHosts.includes(url.hostname);

    if (!isAllowedHost) {
      return '/unknown';
    }

    // Validate pathname is safe (no protocol-relative URLs, no encoded tricks)
    const pathname = url.pathname;
    if (!pathname.startsWith('/')) {
      return '/unknown';
    }

    // Additional validation: pathname should not contain suspicious patterns
    if (pathname.includes('://') || pathname.includes('%2f') || pathname.includes('%5c')) {
      return '/unknown';
    }

    return pathname;
  } catch (error) {
    // If URL parsing fails for any reason, return a safe default
    return '/unknown';
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  if (!request) {
    return 'unknown';
  }

  // Check common headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) {
    return clientIP;
  }

  // Fallback to a default key for localhost/development
  return '127.0.0.1';
}

/**
 * Create rate limiting middleware for Elysia
 */
export const createRateLimitMiddleware = (config: RateLimitMiddlewareConfig) => {
  return new Elysia({ name: 'rate-limit' })
    .onRequest((context) => {
      // Skip rate limiting if configured to do so
      if (config.skip && config.skip(context)) {
        return;
      }

      // Generate rate limit key
      const key = config.keyGenerator
        ? config.keyGenerator(context)
        : `${getClientIP(context.request)}:${context.request.method}:${getSafePathname(context.request.url)}`;

      // Validate key doesn't contain dangerous characters
      if (key.includes('\n') || key.includes('\r') || key.length > 200) {
        throw new Response(JSON.stringify({
          error: {
            message: 'Invalid request parameters',
            code: 'INVALID_REQUEST'
          }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // Check rate limit
      const result = rateLimiter.check(key, config.config);

      if (!result.allowed) {
        monitoring.recordBusinessEvent('rate_limit_exceeded', {
          key,
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        // Use custom handler or default response
        if (config.onLimitExceeded) {
          throw config.onLimitExceeded(context, result);
        }

        // Default rate limit exceeded response with standardized headers per RFC 6585
        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        throw new Response(JSON.stringify({
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
          }
        });
      }

      // Add rate limit headers to successful requests
      context.request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      context.request.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    })
    .onAfterResponse((context) => {
      // Skip if rate limiting was skipped
      if (config.skip && config.skip(context)) {
        return;
      }

      // Generate the same key as in onRequest
      const key = config.keyGenerator
        ? config.keyGenerator(context)
        : `${getClientIP(context.request)}:${context.request.method}:${getSafePathname(context.request.url)}`;

      // Determine if request was successful based on status code
      const response = context.response as any;
      const statusCode = response?.status || 200;
      const success = statusCode >= 200 && statusCode < 400;

      // Record result for potential skip logic
      rateLimiter.recordResult(key, success, config.config);
    });
};

/**
 * User-based rate limiting middleware that applies different limits based on user tier
 * Each authenticated user gets their own rate limit based on userId
 */
export const userBasedRateLimitMiddleware = (options: {
  endpointType?: 'read' | 'write' | 'admin';
  customTierMapping?: (context: any) => UserTier;
} = {}) => {
  return new Elysia({ name: 'user-rate-limit' })
    .onRequest((context) => {
      // Extract user tier and user ID
      const userTier = options.customTierMapping
        ? options.customTierMapping(context)
        : extractUserTier(context);

      const userId = extractUserId(context);

      // Get appropriate config based on user tier and endpoint type
      let config: RateLimitConfig;

      if (options.endpointType === 'admin' && userTier === UserTier.ADMIN) {
        config = getUserTierConfig(UserTier.ADMIN);
      } else if (options.endpointType === 'write') {
        // Stricter limits for write operations
        config = {
          ...getUserTierConfig(userTier),
          maxRequests: Math.floor(getUserTierConfig(userTier).maxRequests / 2),
          burstAllowance: Math.floor((getUserTierConfig(userTier).burstAllowance || 0) / 2),
        };
      } else {
        config = getUserTierConfig(userTier);
      }

      // Generate rate limit key (unique per user for authenticated, IP-based for anonymous)
      const safePathname = getSafePathname(context.request.url);
      const key = userId !== null
        ? `user:${userId}:${safePathname}`
        : `ip:${getClientIP(context.request)}:${safePathname}`;

      // Check rate limit
      const result = rateLimiter.check(key, config);

      if (!result.allowed) {
        monitoring.recordBusinessEvent('user_rate_limit_exceeded', {
          userTier,
          userId: userId?.toString() || 'anonymous',
          key,
          endpointType: options.endpointType || 'general',
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        throw new Response(JSON.stringify({
          error: {
            message: 'Rate limit exceeded for your user tier, please try again later',
            code: 'USER_RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
            userTier,
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
            'X-RateLimit-Tier': userTier,
          }
        });
      }

      // Add rate limit headers
      context.request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      context.request.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      context.request.headers.set('X-RateLimit-Tier', userTier);
    });
};

/**
 * Endpoint-specific rate limiting middleware
 */
export const endpointRateLimitMiddleware = (endpointRules: Array<{
  pattern: RegExp | string;
  methods?: string[];
  config: RateLimitConfig;
  keyGenerator?: (context: any) => string;
  onLimitExceeded?: (context: any, result: any) => Response;
}> = []) => {
  return new Elysia({ name: 'endpoint-rate-limit' })
    .onRequest((context) => {
      const pathname = getSafePathname(context.request.url);
      const method = context.request.method;

      // Find matching rule
      const rule = endpointRules.find(rule => {
        const patternMatches = rule.pattern instanceof RegExp
          ? rule.pattern.test(pathname)
          : pathname.startsWith(rule.pattern);

        const methodMatches = !rule.methods || rule.methods.includes(method);

        return patternMatches && methodMatches;
      });

      if (!rule) {
        // No specific rule found, skip rate limiting
        return;
      }

      // Generate rate limit key
      const key = rule.keyGenerator
        ? rule.keyGenerator(context)
        : `${getClientIP(context.request)}:${method}:${pathname}`;

      // Check rate limit
      const result = rateLimiter.check(key, rule.config);

      if (!result.allowed) {
        monitoring.recordBusinessEvent('endpoint_rate_limit_exceeded', {
          pattern: rule.pattern.toString(),
          method,
          pathname,
          key,
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        // Use custom handler or default response
        if (rule.onLimitExceeded) {
          throw rule.onLimitExceeded(context, result);
        }

        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        throw new Response(JSON.stringify({
          error: {
            message: 'Too many requests to this endpoint, please try again later',
            code: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': rule.config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
          }
        });
      }

      // Add rate limit headers
      context.request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      context.request.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    });
};

// Default endpoint rate limit rules
export const DEFAULT_ENDPOINT_RULES = [
  // API endpoints
  {
    pattern: '/api/',
    methods: ['GET'],
    config: DEFAULT_RATE_LIMITS.API_READ,
  },
  {
    pattern: '/api/',
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    config: DEFAULT_RATE_LIMITS.API_WRITE,
  },
  // Admin endpoints
  {
    pattern: '/admin/',
    config: DEFAULT_RATE_LIMITS.ADMIN,
  },
  // Static assets (more lenient)
  {
    pattern: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/,
    config: {
      windowMs: 60 * 1000,
      maxRequests: 1000, // Very high limit for static assets
      algorithm: 'fixed-window' as const,
    },
  },
];

/**
 * Dynamic rate limiting middleware that adjusts limits based on system load
 */
export const dynamicRateLimitMiddleware = (baseConfig: RateLimitConfig) => {
  return new Elysia({ name: 'dynamic-rate-limit' })
    .onRequest((context) => {
      // Get current system metrics (simplified - in real app, get from monitoring system)
      const systemLoad = getSystemLoad();

      // Update rate limiter with current system load
      rateLimiter.updateSystemLoad(systemLoad);

      // Apply dynamic config
      const dynamicConfig = {
        ...baseConfig,
        dynamicScaling: true,
      };

      const key = `${getClientIP(context.request)}:${context.request.method}:${getSafePathname(context.request.url)}`;
      const result = rateLimiter.check(key, dynamicConfig);

      if (!result.allowed) {
        monitoring.recordBusinessEvent('dynamic_rate_limit_exceeded', {
          systemLoad,
          key,
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        throw new Response(JSON.stringify({
          error: {
            message: 'Server is under high load, please try again later',
            code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
            systemLoad: systemLoad.toFixed(2),
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': baseConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
            'X-System-Load': systemLoad.toFixed(2),
          }
        });
      }

      // Add rate limit headers
      context.request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      context.request.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      context.request.headers.set('X-System-Load', systemLoad.toFixed(2));
    });
};

/**
 * Get current system load (simplified implementation)
 * In a real application, this would integrate with system monitoring
 */
function getSystemLoad(): number {
  // Placeholder implementation - in real app, calculate based on:
  // - CPU usage
  // - Memory usage
  // - Active connections
  // - Response times
  // - Error rates

  // For now, return a random load between 0.5 and 2.0
  // In production, replace with actual system metrics
  // Using crypto.getRandomValues for better randomness than Math.random()
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return 0.5 + ((array[0] || 0) / 0xFFFFFFFF) * 1.5;
}

/**
 * Rate limiting middleware for token validation endpoints (like /auth/me)
 * More lenient limits since these are called frequently during app initialization
 */
export const tokenValidationRateLimitMiddleware = () => {
  return new Elysia({ name: 'token-validation-rate-limit' })
    .use(createRateLimitMiddleware({
      config: {
        windowMs: 60 * 1000, // 1 minute (reduced window)
        maxRequests: 100, // 100 validation attempts per minute (increased limit)
        algorithm: 'sliding-window',
        skipSuccessfulRequests: true, // Don't count successful validations against rate limit
        skipFailedRequests: false,
        dynamicScaling: false, // Don't apply dynamic scaling to avoid blocking legitimate users
      },
      keyGenerator: (context) => {
        const ip = getClientIP(context.request);
        return `${ip}:token-validation`;
      },
      onLimitExceeded: (context, result) => {
        monitoring.recordBusinessEvent('token_validation_rate_limit_exceeded', {
          ip: getClientIP(context.request),
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        return new Response(JSON.stringify({
          error: {
            message: 'Too many token validation requests, please try again later',
            code: 'TOKEN_VALIDATION_RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': '50', // 50 validation attempts per 5 minutes
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
          }
        });
      }
    }));
};

/**
 * Pre-configured rate limiting middleware for authentication endpoints
 */
export const authRateLimitMiddleware = () => {
  return new Elysia({ name: 'auth-rate-limit' })
    .use(createRateLimitMiddleware({
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
        algorithm: 'sliding-window',
        skipSuccessfulRequests: true, // Don't count successful auth against rate limit
        skipFailedRequests: false,
        dynamicScaling: true,
      },
      keyGenerator: (context) => {
        const ip = getClientIP(context.request);
        const pathname = new URL(context.request.url).pathname;
        return `${ip}:auth:${pathname}`;
      },
      onLimitExceeded: (context, result) => {
        monitoring.recordBusinessEvent('auth_rate_limit_exceeded', {
          ip: getClientIP(context.request),
          pathname: new URL(context.request.url).pathname,
          remaining: result.remaining,
          resetTime: result.resetTime,
        });

        const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
        return new Response(JSON.stringify({
          error: {
            message: 'Too many authentication attempts, please try again later',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': '5', // 5 attempts per 15 minutes
            'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'X-RateLimit-Reset-After': retryAfterSeconds.toString(),
          }
        });
      }
    }));
};

/**
 * Comprehensive rate limiting middleware that combines multiple strategies
 * This provides layered protection with different limits for different scenarios
 */
export const comprehensiveRateLimitMiddleware = (options: {
  enableUserBased?: boolean;
  enableEndpointSpecific?: boolean;
  enableDynamic?: boolean;
  customEndpointRules?: typeof DEFAULT_ENDPOINT_RULES;
} = {}) => {
  const middlewares = [];

  // Always apply auth rate limiting for auth endpoints
  middlewares.push(authRateLimitMiddleware());

  // Apply user-based rate limiting if enabled
  if (options.enableUserBased !== false) {
    middlewares.push(userBasedRateLimitMiddleware());
  }

  // Apply endpoint-specific rate limiting if enabled
  if (options.enableEndpointSpecific !== false) {
    const endpointRules = options.customEndpointRules || DEFAULT_ENDPOINT_RULES;
    middlewares.push(endpointRateLimitMiddleware(endpointRules));
  }

  // Apply dynamic rate limiting if enabled
  if (options.enableDynamic) {
    middlewares.push(dynamicRateLimitMiddleware(DEFAULT_RATE_LIMITS.GENERAL));
  }

  // Combine all middlewares
  let combinedMiddleware = new Elysia({ name: 'comprehensive-rate-limit' });
  for (const middleware of middlewares) {
    combinedMiddleware = combinedMiddleware.use(middleware);
  }
  return combinedMiddleware;
};