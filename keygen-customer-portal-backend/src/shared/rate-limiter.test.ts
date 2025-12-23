/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:45:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryRateLimiter, DEFAULT_RATE_LIMITS } from './rate-limiter';

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter(1000); // Short cleanup interval for testing
    limiter.clear(); // Clear any existing data
  });

  it('should allow requests within the limit', () => {
    const key = 'test-key';
    const config = DEFAULT_RATE_LIMITS.AUTH_LOGIN;

    // First request should be allowed
    const result1 = limiter.check(key, config);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(config.maxRequests - 1);

    // Second request should be allowed
    const result2 = limiter.check(key, config);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(config.maxRequests - 2);
  });

  it('should block requests over the limit', () => {
    const key = 'test-key';
    const config = { ...DEFAULT_RATE_LIMITS.AUTH_LOGIN, maxRequests: 2 };

    // Use up the allowed requests
    limiter.check(key, config);
    limiter.check(key, config);

    // Third request should be blocked
    const result = limiter.check(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    const key = 'test-key';
    const config = { windowMs: 100, maxRequests: 1 }; // Very short window

    // First request
    const result1 = limiter.check(key, config);
    expect(result1.allowed).toBe(true);

    // Second request should be blocked
    const result2 = limiter.check(key, config);
    expect(result2.allowed).toBe(false);

    // Wait for window to expire
    return new Promise(resolve => {
      setTimeout(() => {
        // Third request should be allowed after reset
        const result3 = limiter.check(key, config);
        expect(result3.allowed).toBe(true);
        resolve(void 0);
      }, 150);
    });
  });

  it('should skip successful requests when configured', () => {
    const key = 'test-key';
    const config = { ...DEFAULT_RATE_LIMITS.AUTH_LOGIN, skipSuccessfulRequests: true };

    // First request
    limiter.check(key, config);
    limiter.recordResult(key, true, config); // Mark as successful

    // Second request should be allowed (not counted)
    const result = limiter.check(key, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(config.maxRequests - 1); // Reset counter
  });

  it('should not skip failed requests when configured', () => {
    const key = 'test-key';
    const config = { ...DEFAULT_RATE_LIMITS.AUTH_LOGIN, skipSuccessfulRequests: true, maxRequests: 1 };

    // First request
    limiter.check(key, config);
    limiter.recordResult(key, false, config); // Mark as failed

    // Second request should be blocked (failed requests are counted)
    const result = limiter.check(key, config);
    expect(result.allowed).toBe(false);
  });

  it('should provide correct rate limit headers', () => {
    const key = 'test-key';
    const config = DEFAULT_RATE_LIMITS.AUTH_LOGIN;

    const result = limiter.check(key, config);

    expect(result.allowed).toBe(true);
    expect(typeof result.remaining).toBe('number');
    expect(result.remaining).toBe(config.maxRequests - 1);
    expect(typeof result.resetTime).toBe('number');
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should cleanup expired entries', () => {
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';
    const config = { windowMs: 100, maxRequests: 1 }; // Short window

    limiter.check(key1, config);
    limiter.check(key2, config);

    // Both should be present
    expect(limiter.getStats().totalKeys).toBe(2);

    // Fast-forward time by modifying the reset time
    const store = (limiter as any).store as Map<string, any>;
    for (const [key, entry] of store.entries()) {
      entry.resetTime = Date.now() - 1000; // Set to expired
    }

    // Trigger cleanup by calling private method via type assertion
    (limiter as any).cleanup();

    // Should be cleaned up
    expect(limiter.getStats().totalKeys).toBe(0);
  });
});