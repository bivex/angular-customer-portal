/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { JWTService } from './jwt-service';

// Mock the config module
vi.mock('../../shared/config', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret',
      expiresIn: '1h',
    },
  },
}));

describe('JWTService', () => {
  let jwtService: JWTService;

  beforeEach(() => {
    jwtService = new JWTService();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';

      const hashedPassword = await jwtService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';

      const hash1 = await jwtService.hashPassword(password);
      const hash2 = await jwtService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';

      const hashedPassword = await jwtService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await jwtService.hashPassword(password);

      const isValid = await jwtService.verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await jwtService.hashPassword(password);

      const isValid = await jwtService.verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = 'testPassword123';
      const hashedPassword = await jwtService.hashPassword(password);

      const isValid = await jwtService.verifyPassword('', hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should generate a valid JWT token', () => {
      const token = jwtService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should generate token with custom expiration', () => {
      const customExpiresIn = '7d';
      const token = jwtService.generateToken(payload, customExpiresIn);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate tokens that can be decoded correctly', () => {
      const token = jwtService.generateToken(payload);

      const decoded = jwtService.verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('verifyToken', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should verify a valid token and return payload', () => {
      const token = jwtService.generateToken(payload);
      const decoded = jwtService.verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
      expect(decoded).toHaveProperty('iat'); // issued at timestamp
      expect(decoded).toHaveProperty('exp'); // expiration timestamp
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => jwtService.verifyToken(invalidToken)).toThrow('Token validation failed');
    });

    it('should throw error for expired token', () => {
      // Generate token with very short expiration (1ms)
      const shortLivedToken = jwtService.generateToken(payload, '1ms');

      // Wait for token to expire
      setTimeout(() => {
        expect(() => jwtService.verifyToken(shortLivedToken)).toThrow('Token validation failed');
      }, 10);
    });

    it('should throw error for tampered token', () => {
      const token = jwtService.generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx'; // Tamper with the signature

      expect(() => jwtService.verifyToken(tamperedToken)).toThrow('Token validation failed');
    });

    it('should throw error for empty token', () => {
      expect(() => jwtService.verifyToken('')).toThrow('Token validation failed');
    });
  });

  describe('integration', () => {
    it('should hash password and verify it correctly', async () => {
      const password = 'integrationTestPassword!@#';

      // Hash the password
      const hashed = await jwtService.hashPassword(password);

      // Verify it
      const isValid = await jwtService.verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should generate token and verify it correctly', () => {
      const payload = {
        userId: 42,
        email: 'integration@test.com',
        name: 'Integration Test User',
      };

      // Generate token
      const token = jwtService.generateToken(payload);

      // Verify token
      const decoded = jwtService.verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
    });
  });
});
