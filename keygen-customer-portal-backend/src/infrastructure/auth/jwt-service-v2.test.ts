/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:22:42
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { JWTServiceV2 } from './jwt-service-v2';
import { KeyManager } from '../crypto/key-manager';

// Mock the key manager to control key behavior
vi.mock('../crypto/key-manager', () => ({
  keyManager: {
    getActiveKey: vi.fn(),
    getVerificationKey: vi.fn(),
    getAllVerificationKeys: vi.fn(),
    initialize: vi.fn(),
  },
}));

// Mock bcrypt and crypto
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(),
  createHash: vi.fn(),
}));

// Mock logger
vi.mock('../../shared/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock monitoring
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
  },
}));

describe('JWTServiceV2 - Key Management Integration', () => {
  let jwtService: JWTServiceV2;
  let mockKeyManager: any;

  const mockActiveKey = {
    keyId: 'active-key-123',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
    algorithm: 'PS256' as const,
    createdAt: new Date(),
    isActive: true,
  };

  const mockOldKey = {
    keyId: 'old-key-456',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest-old-private-key\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\ntest-old-public-key\n-----END PUBLIC KEY-----',
    algorithm: 'PS256' as const,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Import the mocked keyManager
    const { keyManager } = require('../crypto/key-manager');
    mockKeyManager = keyManager;

    // Setup default mocks
    mockKeyManager.getActiveKey.mockReturnValue(mockActiveKey);
    mockKeyManager.getVerificationKey.mockImplementation((keyId: string) => {
      if (keyId === mockActiveKey.keyId) return mockActiveKey;
      if (keyId === mockOldKey.keyId) return mockOldKey;
      return null;
    });
    mockKeyManager.getAllVerificationKeys.mockReturnValue({
      [mockActiveKey.keyId]: mockActiveKey,
      [mockOldKey.keyId]: mockOldKey,
    });

    jwtService = new JWTServiceV2();
  });

  describe('Token Verification with Key Management', () => {
    it('should successfully verify tokens signed with active key', async () => {
      // Mock successful token verification
      const mockVerify = vi.fn().mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        sid: 'session-123',
        jti: 'jti-123',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      // Mock jwt.verify
      const jwt = require('jsonwebtoken');
      jwt.verify = mockVerify;
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: mockActiveKey.keyId },
        payload: { type: 'access' },
      });

      const token = 'valid.jwt.token';
      const result = await jwtService.verifyAccessToken(token);

      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(mockKeyManager.getVerificationKey).toHaveBeenCalledWith(mockActiveKey.keyId);
      expect(mockVerify).toHaveBeenCalledWith(token, mockActiveKey.publicKey, expect.any(Object));
    });

    it('should handle tokens signed with unknown keys', async () => {
      // Mock token with unknown key ID
      const jwt = require('jsonwebtoken');
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: 'unknown-key-999' },
        payload: { type: 'access', userId: 1 },
      });

      mockKeyManager.getVerificationKey.mockReturnValue(null);
      mockKeyManager.getAllVerificationKeys.mockReturnValue({
        [mockActiveKey.keyId]: mockActiveKey,
      });

      const token = 'invalid.jwt.token';

      await expect(jwtService.verifyAccessToken(token)).rejects.toThrow(
        'Access token verification failed: signing key not found. Please re-authenticate.'
      );

      expect(mockKeyManager.getVerificationKey).toHaveBeenCalledWith('unknown-key-999');
    });

    it('should handle refresh tokens signed with unknown keys', async () => {
      // Mock token with unknown key ID
      const jwt = require('jsonwebtoken');
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: 'unknown-key-999' },
        payload: { type: 'refresh', userId: 1 },
      });

      mockKeyManager.getVerificationKey.mockReturnValue(null);
      mockKeyManager.getAllVerificationKeys.mockReturnValue({
        [mockActiveKey.keyId]: mockActiveKey,
      });

      const token = 'invalid.refresh.token';

      await expect(jwtService.verifyRefreshToken(token)).rejects.toThrow(
        'Refresh token verification failed: signing key not found. Please re-authenticate.'
      );

      expect(mockKeyManager.getVerificationKey).toHaveBeenCalledWith('unknown-key-999');
    });

    it('should provide detailed logging for unknown key errors', async () => {
      const { logger } = require('../../shared/logger');

      // Mock token with unknown key ID
      const jwt = require('jsonwebtoken');
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: 'unknown-key-999' },
        payload: { type: 'access', userId: 1, email: 'test@example.com' },
      });

      mockKeyManager.getVerificationKey.mockReturnValue(null);

      const token = 'invalid.jwt.token';

      await expect(jwtService.verifyAccessToken(token)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Unknown signing key requested',
        expect.objectContaining({
          requestedKid: 'unknown-key-999',
          algorithm: 'PS256',
          tokenType: 'access',
          availableKids: [mockActiveKey.keyId, mockOldKey.keyId],
          activeKeyId: mockActiveKey.keyId,
        })
      );
    });

    it('should support both PS256 and RS256 algorithms', async () => {
      const jwt = require('jsonwebtoken');
      const mockVerify = vi.fn().mockReturnValue({
        userId: 1,
        type: 'access',
      });

      jwt.verify = mockVerify;

      // Test PS256
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: mockActiveKey.keyId },
        payload: { type: 'access' },
      });

      await jwtService.verifyAccessToken('ps256.token');

      // Test RS256
      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'RS256', kid: mockActiveKey.keyId },
        payload: { type: 'access' },
      });

      await jwtService.verifyAccessToken('rs256.token');

      expect(mockVerify).toHaveBeenCalledTimes(2);
      expect(mockVerify).toHaveBeenCalledWith('ps256.token', mockActiveKey.publicKey, expect.any(Object));
      expect(mockVerify).toHaveBeenCalledWith('rs256.token', mockActiveKey.publicKey, expect.any(Object));
    });

    it('should reject unsupported algorithms', async () => {
      const jwt = require('jsonwebtoken');

      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'HS256', kid: mockActiveKey.keyId },
        payload: { type: 'access' },
      });

      await expect(jwtService.verifyAccessToken('hs256.token')).rejects.toThrow(
        'Access token verification failed: Unsupported token algorithm: HS256'
      );
    });

    it('should handle missing key ID in token header', async () => {
      const { logger } = require('../../shared/logger');
      const jwt = require('jsonwebtoken');

      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256' }, // Missing kid
        payload: { type: 'access' },
      });

      await expect(jwtService.verifyAccessToken('no-kid.token')).rejects.toThrow(
        'Access token verification failed: Missing key ID in token header'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Missing key ID in token header',
        expect.objectContaining({
          algorithm: 'PS256',
          tokenType: 'access',
        })
      );
    });
  });

  describe('Token Generation', () => {
    it('should generate tokens with PS256 algorithm', async () => {
      const jwt = require('jsonwebtoken');
      const mockSign = vi.fn().mockReturnValue('signed.jwt.token');

      jwt.sign = mockSign;

      const crypto = require('crypto');
      crypto.randomUUID.mockReturnValue('test-jti-123');
      crypto.createHash.mockReturnValue({
        update: vi.fn().mockReturnValue({
          digest: vi.fn().mockReturnValue('hashed-ip'),
        }),
      });

      const result = await jwtService.generateTokenPair({
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        sessionId: 'session-123',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('signed.jwt.token');
      expect(mockSign).toHaveBeenCalledTimes(2);

      // Check that PS256 algorithm is used
      expect(mockSign).toHaveBeenCalledWith(
        expect.any(Object),
        mockActiveKey.privateKey,
        expect.objectContaining({
          algorithm: 'PS256',
          keyid: mockActiveKey.keyId,
        })
      );
    });

    it('should handle key manager errors during token generation', async () => {
      mockKeyManager.getActiveKey.mockReturnValue(null);

      await expect(jwtService.generateTokenPair({
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        sessionId: 'session-123',
      })).rejects.toThrow('No active signing key available');
    });
  });

  describe('Token Information and Debugging', () => {
    it('should provide detailed token information', () => {
      const jwt = require('jsonwebtoken');

      const mockDecoded = {
        header: { alg: 'PS256', kid: 'test-key-123' },
        payload: {
          iat: 1640995200, // 2022-01-01 00:00:00
          exp: 1641081600, // 2022-01-02 00:00:00
          type: 'access',
        },
      };

      jwt.decode = vi.fn().mockReturnValue(mockDecoded);

      const info = jwtService.getTokenInfo('test.token');

      expect(info.algorithm).toBe('PS256');
      expect(info.keyId).toBe('test-key-123');
      expect(info.type).toBe('access');
      expect(info.issuedAt).toEqual(new Date(1640995200 * 1000));
      expect(info.expiresAt).toEqual(new Date(1641081600 * 1000));
    });

    it('should handle invalid tokens in getTokenInfo', () => {
      const jwt = require('jsonwebtoken');
      jwt.decode = vi.fn().mockReturnValue(null);

      const info = jwtService.getTokenInfo('invalid.token');

      expect(info.algorithm).toBeNull();
      expect(info.keyId).toBeNull();
      expect(info.expiresAt).toBeNull();
      expect(info.issuedAt).toBeNull();
      expect(info.type).toBeNull();
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log debug information during token verification', async () => {
      const { logger } = require('../../shared/logger');
      const jwt = require('jsonwebtoken');

      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: mockActiveKey.keyId },
        payload: { type: 'access', userId: 1, email: 'test@example.com' },
      });

      jwt.verify = vi.fn().mockReturnValue({
        userId: 1,
        type: 'access',
      });

      await jwtService.verifyAccessToken('test.token');

      expect(logger.debug).toHaveBeenCalledWith(
        'Attempting token verification',
        expect.objectContaining({
          kid: mockActiveKey.keyId,
          algorithm: 'PS256',
          tokenType: 'access',
          userId: 1,
        })
      );
    });

    it('should handle JWT verification errors gracefully', async () => {
      const { logger } = require('../../shared/logger');
      const jwt = require('jsonwebtoken');

      jwt.decode = vi.fn().mockReturnValue({
        header: { alg: 'PS256', kid: mockActiveKey.keyId },
        payload: { type: 'access' },
      });

      jwt.verify = vi.fn().mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(jwtService.verifyAccessToken('expired.token')).rejects.toThrow(
        'Access token verification failed: Token expired'
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Access token verification failed',
        'Token expired'
      );
    });
  });
});