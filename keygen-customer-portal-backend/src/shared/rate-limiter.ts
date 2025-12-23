/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:00:00
 * Last Updated: 2025-12-22T00:01:03
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

export type RateLimitAlgorithm = 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  algorithm?: RateLimitAlgorithm; // Rate limiting algorithm to use
  burstAllowance?: number; // Additional burst requests allowed (for token bucket)
  refillRate?: number; // Tokens per second (for token bucket/leaky bucket)
  skipSuccessfulRequests?: boolean; // Skip rate limiting on successful requests
  skipFailedRequests?: boolean; // Skip rate limiting on failed requests
  dynamicScaling?: boolean; // Enable dynamic scaling based on load
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
  tokens?: number; // For token bucket algorithm
  lastRefill?: number; // Last token refill timestamp
  windowStart?: number; // For sliding window algorithm
  requestTimes?: number[]; // For sliding window algorithm
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private systemLoad = 1.0; // System load multiplier (1.0 = normal)

  constructor(private cleanupIntervalMs: number = 60000) { // Default cleanup every minute
    this.startCleanupInterval();
  }

  /**
   * Update system load for dynamic rate limiting
   */
  updateSystemLoad(load: number): void {
    this.systemLoad = Math.max(0.1, Math.min(5.0, load)); // Clamp between 0.1 and 5.0
  }

  /**
   * Check if a request should be rate limited using the specified algorithm
   * @param key - Unique identifier (e.g., IP address + endpoint)
   * @param config - Rate limiting configuration
   * @returns Object indicating if request is allowed and remaining requests
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const algorithm = config.algorithm || 'fixed-window';
    const now = Date.now();

    // Apply dynamic scaling if enabled
    const effectiveMaxRequests = config.dynamicScaling
      ? Math.floor(config.maxRequests / this.systemLoad)
      : config.maxRequests;

    switch (algorithm) {
      case 'token-bucket':
        return this.checkTokenBucket(key, config, effectiveMaxRequests, now);
      case 'sliding-window':
        return this.checkSlidingWindow(key, config, effectiveMaxRequests, now);
      case 'leaky-bucket':
        return this.checkLeakyBucket(key, config, effectiveMaxRequests, now);
      case 'fixed-window':
      default:
        return this.checkFixedWindow(key, config, effectiveMaxRequests, now);
    }
  }

  private checkFixedWindow(key: string, config: RateLimitConfig, effectiveMaxRequests: number, now: number): { allowed: boolean; remaining: number; resetTime: number } {
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        lastRequest: now,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: effectiveMaxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= effectiveMaxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: effectiveMaxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private checkSlidingWindow(key: string, config: RateLimitConfig, effectiveMaxRequests: number, now: number): { allowed: boolean; remaining: number; resetTime: number } {
    const entry = this.store.get(key) || {
      count: 0,
      resetTime: now + config.windowMs,
      lastRequest: now,
      windowStart: now,
      requestTimes: [],
    };

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    entry.requestTimes = entry.requestTimes?.filter(time => time > windowStart) || [];

    if (entry.requestTimes.length >= effectiveMaxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Add current request
    entry.requestTimes.push(now);
    entry.count = entry.requestTimes.length;
    entry.lastRequest = now;
    entry.resetTime = now + config.windowMs;

    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: effectiveMaxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private checkTokenBucket(key: string, config: RateLimitConfig, effectiveMaxRequests: number, now: number): { allowed: boolean; remaining: number; resetTime: number } {
    const entry = this.store.get(key);
    const burstAllowance = config.burstAllowance || Math.floor(effectiveMaxRequests * 1.5); // Default burst is 1.5x normal rate
    const refillRate = config.refillRate || (effectiveMaxRequests / (config.windowMs / 1000));

    if (!entry) {
      // First request - allow burst
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        lastRequest: now,
        tokens: burstAllowance - 1,
        lastRefill: now,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: burstAllowance - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Refill tokens based on time passed with more precise calculation
    const timePassed = now - (entry.lastRefill || now);
    const tokensToAdd = timePassed / 1000 * refillRate;
    entry.tokens = Math.min(burstAllowance, (entry.tokens || 0) + tokensToAdd);
    entry.lastRefill = now;

    // Check if we have tokens available
    if ((entry.tokens || 0) < 1) {
      // Calculate when next token will be available
      const tokensNeeded = 1 - (entry.tokens || 0);
      const waitTimeMs = (tokensNeeded / refillRate) * 1000;

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + Math.ceil(waitTimeMs),
      };
    }

    // Consume token with fractional precision for smoother rate limiting
    entry.tokens!--;
    entry.count++;
    entry.lastRequest = now;
    entry.resetTime = now + config.windowMs;

    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      resetTime: entry.resetTime,
    };
  }

  private checkLeakyBucket(key: string, config: RateLimitConfig, effectiveMaxRequests: number, now: number): { allowed: boolean; remaining: number; resetTime: number } {
    // Leaky bucket is similar to token bucket but with different semantics
    return this.checkTokenBucket(key, config, effectiveMaxRequests, now);
  }

  /**
   * Record a request result for potential skip logic
   * @param key - Unique identifier
   * @param success - Whether the request was successful
   * @param config - Rate limiting configuration
   */
  recordResult(key: string, success: boolean, config: RateLimitConfig): void {
    if (config.skipSuccessfulRequests && success) {
      // For successful requests, we remove them from rate limiting
      const entry = this.store.get(key);
      if (entry) {
        if (config.algorithm === 'token-bucket' && entry.tokens !== undefined) {
          // Refund a token for token bucket
          entry.tokens = Math.min(
            (config.burstAllowance || config.maxRequests),
            (entry.tokens || 0) + 1
          );
        } else if (config.algorithm === 'sliding-window' && entry.requestTimes) {
          // Remove the last request timestamp for sliding window
          entry.requestTimes.pop();
          entry.count = entry.requestTimes.length;
        } else {
          // Reduce count for other algorithms
          entry.count = Math.max(0, entry.count - 1);
        }
        this.store.set(key, entry);
      }
    } else if (config.skipFailedRequests && !success) {
      // Remove failed requests from rate limiting
      this.store.delete(key);
    }
  }

  /**
   * Get current rate limit status for a key
   */
  getStatus(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const entry = this.store.get(key);
    if (!entry) return config.maxRequests;

    const now = Date.now();
    const algorithm = config.algorithm || 'fixed-window';

    switch (algorithm) {
      case 'token-bucket':
        return entry.tokens || 0;
      case 'sliding-window':
        const windowStart = now - config.windowMs;
        const validRequests = entry.requestTimes?.filter(time => time > windowStart).length || 0;
        return Math.max(0, config.maxRequests - validRequests);
      default:
        if (now > entry.resetTime) return config.maxRequests;
        return Math.max(0, config.maxRequests - entry.count);
    }
  }

  /**
   * Check if a key is currently rate limited
   */
  isRateLimited(key: string, config: RateLimitConfig): boolean {
    const result = this.check(key, config);
    return !result.allowed;
  }

  /**
   * Get statistics about the rate limiter
   */
  getStats(): {
    totalKeys: number;
    totalEntries: number;
    systemLoad: number;
    algorithmDistribution: Record<RateLimitAlgorithm, number>;
  } {
    const algorithmDistribution: Record<RateLimitAlgorithm, number> = {
      'fixed-window': 0,
      'sliding-window': 0,
      'token-bucket': 0,
      'leaky-bucket': 0,
    };

    // Note: This is a simplified stats - in a real implementation,
    // you'd want to track which algorithm each key is using
    // For now, we'll just return basic stats

    return {
      totalKeys: this.store.size,
      totalEntries: this.store.size,
      systemLoad: this.systemLoad,
      algorithmDistribution,
    };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }
}

// Default rate limit configurations with advanced algorithms
export const DEFAULT_RATE_LIMITS = {
  // Stricter limits for authentication endpoints
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5000, // 5000 attempts per 15 minutes
    algorithm: 'sliding-window' as RateLimitAlgorithm, // More accurate than fixed window
    skipSuccessfulRequests: true, // Don't count successful logins against rate limit
    skipFailedRequests: false,
    dynamicScaling: true, // Scale based on system load
  } as RateLimitConfig,

  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
    algorithm: 'fixed-window' as RateLimitAlgorithm,
    skipSuccessfulRequests: true, // Don't count successful registrations
    skipFailedRequests: false,
  } as RateLimitConfig,

  AUTH_GET_CURRENT_USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 10, // Allow bursts of up to 10 requests
    refillRate: 0.5, // 0.5 tokens per second
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,

  // More lenient limits for general endpoints
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 20, // Allow bursts of up to 20 requests
    refillRate: 1.67, // ~1.67 tokens per second (100 per minute)
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    dynamicScaling: true,
  } as RateLimitConfig,

  // API endpoints with different limits based on resource cost
  API_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 read requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 50,
    refillRate: 3.33, // ~3.33 tokens per second
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,

  API_WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 write requests per minute (more expensive)
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 10,
    refillRate: 0.83, // ~0.83 tokens per second
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    dynamicScaling: true,
  } as RateLimitConfig,

  // Admin endpoints with higher limits
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute for admin
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 100,
    refillRate: 8.33, // ~8.33 tokens per second
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
} as const;

// User tiers for different rate limiting levels
export enum UserTier {
  ANONYMOUS = 'anonymous',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

// Rate limit configurations by user tier
export const USER_TIER_LIMITS = {
  [UserTier.ANONYMOUS]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    algorithm: 'fixed-window' as RateLimitAlgorithm,
    burstAllowance: 5,
    refillRate: 0.5,
  },
  [UserTier.BASIC]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 20,
    refillRate: 1.67,
    dynamicScaling: true,
  },
  [UserTier.PREMIUM]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 50,
    refillRate: 5,
    dynamicScaling: true,
  },
  [UserTier.ADMIN]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute
    algorithm: 'token-bucket' as RateLimitAlgorithm,
    burstAllowance: 200,
    refillRate: 16.67,
  },
} as const;

/**
 * Get rate limit config based on user tier
 */
export function getUserTierConfig(tier: UserTier): RateLimitConfig {
  return USER_TIER_LIMITS[tier];
}

/**
 * Extract user tier from request context
 * Uses the JWT payload that was already decoded by the JWT middleware
 */
export function extractUserTier(context: any): UserTier {
  // Get user from store (set by JWT middleware)
  const user = context.store?.user;

  if (!user) {
    return UserTier.ANONYMOUS;
  }

  // If user is authenticated, return BASIC tier by default
  // In the future, you can add a 'role' or 'tier' field to the User model
  // and check it here: if (user.role === 'admin') return UserTier.ADMIN;
  return UserTier.BASIC;
}

/**
 * Extract user ID from request context for rate limiting
 * Returns null if user is not authenticated
 */
export function extractUserId(context: any): number | null {
  const user = context.store?.user;
  return user?.userId || null;
}

/**
 * Redis-based rate limiter for distributed systems
 */
export class RedisRateLimiter {
  constructor(
    private redisClient: any, // Redis client instance
    private cleanupIntervalMs: number = 60000
  ) {
    this.startCleanupInterval();
  }

  /**
   * Check if a request should be rate limited using Redis
   */
  async check(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const algorithm = config.algorithm || 'fixed-window';
    const now = Date.now();

    switch (algorithm) {
      case 'token-bucket':
        return this.checkTokenBucketRedis(key, config, now);
      case 'sliding-window':
        return this.checkSlidingWindowRedis(key, config, now);
      case 'leaky-bucket':
        return this.checkLeakyBucketRedis(key, config, now);
      case 'fixed-window':
      default:
        return this.checkFixedWindowRedis(key, config, now);
    }
  }

  private async checkFixedWindowRedis(key: string, config: RateLimitConfig, now: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisKey = `ratelimit:${key}`;
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${redisKey}:${windowStart}`;

    const currentCount = parseInt(await this.redisClient.get(windowKey) || '0');

    if (currentCount >= config.maxRequests) {
      const resetTime = windowStart + config.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Increment count
    const newCount = await this.redisClient.incr(windowKey);

    // Set expiry on first request in window
    if (newCount === 1) {
      await this.redisClient.expire(windowKey, Math.ceil(config.windowMs / 1000));
    }

    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetTime: windowStart + config.windowMs,
    };
  }

  private async checkTokenBucketRedis(key: string, config: RateLimitConfig, now: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisKey = `ratelimit:${key}`;
    const tokensKey = `${redisKey}:tokens`;
    const lastRefillKey = `${redisKey}:lastRefill`;

    const burstAllowance = config.burstAllowance || config.maxRequests;
    const refillRate = config.refillRate || (config.maxRequests / (config.windowMs / 1000));

    // Get current tokens and last refill time
    const [currentTokens, lastRefill] = await Promise.all([
      this.redisClient.get(tokensKey),
      this.redisClient.get(lastRefillKey)
    ]);

    let tokens = parseFloat(currentTokens || burstAllowance.toString());
    const lastRefillTime = parseInt(lastRefill || now.toString());

    // Refill tokens
    const timePassed = now - lastRefillTime;
    const tokensToAdd = Math.floor(timePassed / 1000 * refillRate);
    tokens = Math.min(burstAllowance, tokens + tokensToAdd);

    if (tokens < 1) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + Math.ceil(1000 / refillRate),
      };
    }

    // Consume a token
    tokens--;

    // Update Redis
    await Promise.all([
      this.redisClient.set(tokensKey, tokens.toString()),
      this.redisClient.set(lastRefillKey, now.toString()),
      this.redisClient.expire(tokensKey, Math.ceil(config.windowMs / 1000)),
      this.redisClient.expire(lastRefillKey, Math.ceil(config.windowMs / 1000)),
    ]);

    return {
      allowed: true,
      remaining: Math.floor(tokens),
      resetTime: now + Math.ceil(config.windowMs / 1000),
    };
  }

  private async checkSlidingWindowRedis(key: string, config: RateLimitConfig, now: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisKey = `ratelimit:${key}`;
    const windowStart = now - config.windowMs;

    // Add current request timestamp
    await this.redisClient.zadd(redisKey, now, now.toString());

    // Remove old requests
    await this.redisClient.zremrangebyscore(redisKey, 0, windowStart);

    // Count requests in window
    const requestCount = await this.redisClient.zcount(redisKey, windowStart, now);

    // Set expiry on the sorted set
    await this.redisClient.expire(redisKey, Math.ceil(config.windowMs / 1000));

    if (requestCount > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.windowMs,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount,
      resetTime: now + config.windowMs,
    };
  }

  private checkLeakyBucketRedis(key: string, config: RateLimitConfig, now: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // Leaky bucket implementation (simplified to token bucket for Redis)
    return this.checkTokenBucketRedis(key, config, now);
  }

  /**
   * Record a request result
   */
  async recordResult(key: string, success: boolean, config: RateLimitConfig): Promise<void> {
    if (config.skipSuccessfulRequests && success) {
      // Could implement refund logic here for Redis
      return;
    }

    if (config.skipFailedRequests && !success) {
      // Remove failed request tracking
      const redisKey = `ratelimit:${key}`;
      await this.redisClient.del(redisKey);
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    await this.redisClient.del(redisKey);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{ totalKeys: number }> {
    // Redis doesn't provide easy way to count all keys with pattern
    // This is a simplified implementation
    return { totalKeys: 0 };
  }

  private startCleanupInterval(): void {
    // Redis handles expiry automatically, but we can add cleanup logic if needed
    setInterval(async () => {
      // Optional: Add any custom cleanup logic here
    }, this.cleanupIntervalMs);
  }
}

/**
 * Rate limiting analytics and monitoring
 */
export class RateLimitAnalytics {
  private events: Array<{
    timestamp: number;
    key: string;
    allowed: boolean;
    userTier?: UserTier;
    endpoint?: string;
    method?: string;
    algorithm: RateLimitAlgorithm;
    remaining: number;
    systemLoad?: number;
  }> = [];

  private maxEvents = 10000; // Keep last 10k events

  recordEvent(event: {
    key: string;
    allowed: boolean;
    userTier?: UserTier;
    endpoint?: string;
    method?: string;
    algorithm: RateLimitAlgorithm;
    remaining: number;
    systemLoad?: number;
  }): void {
    this.events.push({
      timestamp: Date.now(),
      ...event,
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getAnalytics(timeRangeMs: number = 3600000): { // Default 1 hour
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    topBlockedKeys: Array<{ key: string; count: number }>;
    algorithmUsage: Record<RateLimitAlgorithm, number>;
    userTierUsage: Record<UserTier, number>;
    averageSystemLoad: number;
    requestsPerMinute: number;
  } {
    const now = Date.now();
    const startTime = now - timeRangeMs;

    const relevantEvents = this.events.filter(e => e.timestamp >= startTime);

    const totalRequests = relevantEvents.length;
    const blockedRequests = relevantEvents.filter(e => !e.allowed).length;
    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;

    // Top blocked keys
    const blockedKeys = relevantEvents
      .filter(e => !e.allowed)
      .reduce((acc, e) => {
        acc[e.key] = (acc[e.key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topBlockedKeys = Object.entries(blockedKeys)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    // Algorithm usage
    const algorithmUsage = relevantEvents.reduce((acc, e) => {
      acc[e.algorithm] = (acc[e.algorithm] || 0) + 1;
      return acc;
    }, {} as Record<RateLimitAlgorithm, number>);

    // User tier usage
    const userTierUsage = relevantEvents.reduce((acc, e) => {
      if (e.userTier) {
        acc[e.userTier] = (acc[e.userTier] || 0) + 1;
      }
      return acc;
    }, {} as Record<UserTier, number>);

    // Average system load
    const loadEvents = relevantEvents.filter(e => e.systemLoad !== undefined);
    const averageSystemLoad = loadEvents.length > 0
      ? loadEvents.reduce((sum, e) => sum + (e.systemLoad || 0), 0) / loadEvents.length
      : 1.0;

    // Requests per minute
    const timeRangeMinutes = timeRangeMs / 60000;
    const requestsPerMinute = totalRequests / timeRangeMinutes;

    return {
      totalRequests,
      blockedRequests,
      blockRate,
      topBlockedKeys,
      algorithmUsage,
      userTierUsage,
      averageSystemLoad,
      requestsPerMinute,
    };
  }

  getRecentEvents(limit: number = 100): Array<{
    timestamp: number;
    key: string;
    allowed: boolean;
    userTier?: UserTier;
    endpoint?: string;
    method?: string;
    algorithm: RateLimitAlgorithm;
    remaining: number;
  }> {
    return this.events.slice(-limit);
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Burst configuration utilities
 */
export interface BurstConfig {
  normalRate: number; // Requests per second under normal conditions
  burstMultiplier: number; // How much burst allowance (e.g., 2.0 = 2x normal rate)
  refillDelayMs: number; // Delay before starting to refill after burst
  gradualRefill: boolean; // Whether to refill gradually or all at once
}

/**
 * Create a burst-aware rate limit configuration
 */
export function createBurstConfig(baseRate: number, burstConfig: Partial<BurstConfig>): RateLimitConfig {
  const config: BurstConfig = {
    normalRate: baseRate,
    burstMultiplier: 2.0,
    refillDelayMs: 1000,
    gradualRefill: true,
    ...burstConfig,
  };

  return {
    windowMs: 60000, // 1 minute window
    maxRequests: config.normalRate * 60, // Convert to requests per minute
    algorithm: 'token-bucket',
    burstAllowance: Math.floor(config.normalRate * 60 * config.burstMultiplier),
    refillRate: config.gradualRefill ? config.normalRate : config.normalRate * config.burstMultiplier,
  };
}

/**
 * Pre-configured burst configurations for common scenarios
 */
export const BURST_PRESETS = {
  // High burst for API endpoints that need to handle traffic spikes
  API_HIGH_BURST: createBurstConfig(10, { burstMultiplier: 5.0, gradualRefill: true }),

  // Moderate burst for general web traffic
  WEB_MODERATE: createBurstConfig(5, { burstMultiplier: 3.0, gradualRefill: true }),

  // Low burst for sensitive operations
  SENSITIVE_LOW: createBurstConfig(2, { burstMultiplier: 1.5, gradualRefill: false }),

  // Very high burst for static assets
  STATIC_ASSETS: createBurstConfig(50, { burstMultiplier: 10.0, gradualRefill: true }),
};

// Global analytics instance
export const rateLimitAnalytics = new RateLimitAnalytics();

/**
 * Enhanced rate limiter that includes analytics
 */
export class AnalyticsRateLimiter extends InMemoryRateLimiter {
  constructor(
    private analytics: RateLimitAnalytics = rateLimitAnalytics,
    cleanupIntervalMs: number = 60000
  ) {
    super(cleanupIntervalMs);
  }

  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const result = super.check(key, config);

    // Record analytics
    this.analytics.recordEvent({
      key,
      allowed: result.allowed,
      algorithm: config.algorithm || 'fixed-window',
      remaining: result.remaining,
      systemLoad: this.getSystemLoad(),
    });

    return result;
  }

  private getSystemLoad(): number {
    // Get current system load from the rate limiter
    return 1.0; // Placeholder - would need to access the actual load
  }
}

/**
 * Factory function to create appropriate rate limiter based on configuration
 */
export function createRateLimiter(config: {
  type: 'memory' | 'redis' | 'analytics';
  redisClient?: any;
  cleanupIntervalMs?: number;
  analytics?: RateLimitAnalytics;
}): InMemoryRateLimiter | RedisRateLimiter | AnalyticsRateLimiter {
  if (config.type === 'redis' && config.redisClient) {
    return new RedisRateLimiter(config.redisClient, config.cleanupIntervalMs);
  }

  if (config.type === 'analytics') {
    return new AnalyticsRateLimiter(config.analytics, config.cleanupIntervalMs);
  }

  return new InMemoryRateLimiter(config.cleanupIntervalMs);
}

// Global rate limiter instance (in-memory by default)
export const rateLimiter = new InMemoryRateLimiter();