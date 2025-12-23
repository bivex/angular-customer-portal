/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:22:42
 * Last Updated: 2025-12-22T00:22:42
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, afterEach, vi, mock } from 'bun:test';
import { KeyManager, keyManager } from './key-manager';
import path from 'path';
import fs from 'fs';

// Mock the file system and logger
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('../../shared/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
  },
}));

describe('KeyManager - Key Persistence and Rotation', () => {
  let testKeyManager: KeyManager;
  const testKeyStorePath = '/tmp/test-keys';

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh instance for each test
    testKeyManager = new KeyManager();
    // Override the key store path for testing
    (testKeyManager as any).keyStorePath = testKeyStorePath;
    (testKeyManager as any).keyPairs = new Map();
    (testKeyManager as any).activeKeyId = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Key Persistence', () => {
    it('should save keys to disk with proper format', async () => {
      const mockKeyPair = {
        keyId: 'test-key-123',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
        algorithm: 'PS256' as const,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        expiresAt: new Date('2026-01-01T00:00:00Z'),
        isActive: true,
      };

      // Mock Bun.file for reading
      const mockBunFile = {
        exists: vi.fn().mockResolvedValue(true),
        json: vi.fn().mockResolvedValue(mockKeyPair),
      };

      (global as any).Bun = {
        file: vi.fn().mockReturnValue(mockBunFile),
        write: vi.fn().mockResolvedValue(undefined),
      };

      await testKeyManager.persistKeyPair(mockKeyPair);

      expect((global as any).Bun.write).toHaveBeenCalledWith(
        path.join(testKeyStorePath, `${mockKeyPair.keyId}.json`),
        JSON.stringify(mockKeyPair, null, 2)
      );
    });

    it('should load keys from disk during initialization', async () => {
      const mockKeyPair1 = {
        keyId: 'key-1',
        privateKey: 'priv1',
        publicKey: 'pub1',
        algorithm: 'PS256' as const,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      };

      const mockKeyPair2 = {
        keyId: 'key-2',
        privateKey: 'priv2',
        publicKey: 'pub2',
        algorithm: 'PS256' as const,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        isActive: false,
      };

      // Mock file system
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['key-1.json', 'key-2.json', 'invalid.txt']);

      // Mock Bun for file reading
      const mockBunFile1 = {
        exists: vi.fn().mockResolvedValue(true),
        json: vi.fn().mockResolvedValue(mockKeyPair1),
      };

      const mockBunFile2 = {
        exists: vi.fn().mockResolvedValue(true),
        json: vi.fn().mockResolvedValue(mockKeyPair2),
      };

      (global as any).Bun = {
        file: vi.fn(),
        write: vi.fn(),
        Glob: vi.fn().mockReturnValue({
          scan: vi.fn().mockReturnValue(['key-1.json', 'key-2.json']),
        }),
      };

      (global as any).Bun.file
        .mockReturnValueOnce(mockBunFile1)
        .mockReturnValueOnce(mockBunFile2);

      await (testKeyManager as any).loadKeys();

      expect(testKeyManager.getActiveKey()).toEqual(mockKeyPair1);
      expect(testKeyManager.getVerificationKey('key-2')).toEqual(mockKeyPair2);
    });

    it('should handle corrupted key files gracefully', async () => {
      const { logger } = require('../../shared/logger');

      // Mock file system
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['valid.json', 'corrupted.json']);

      // Mock Bun for file reading
      const mockValidFile = {
        exists: vi.fn().mockResolvedValue(true),
        json: vi.fn().mockResolvedValue({
          keyId: 'valid-key',
          privateKey: 'priv',
          publicKey: 'pub',
          algorithm: 'PS256',
          createdAt: new Date(),
          isActive: true,
        }),
      };

      const mockCorruptedFile = {
        exists: vi.fn().mockResolvedValue(true),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      (global as any).Bun = {
        file: vi.fn(),
        write: vi.fn(),
        Glob: vi.fn().mockReturnValue({
          scan: vi.fn().mockReturnValue(['valid.json', 'corrupted.json']),
        }),
      };

      (global as any).Bun.file
        .mockReturnValueOnce(mockValidFile)
        .mockReturnValueOnce(mockCorruptedFile);

      await (testKeyManager as any).loadKeys();

      expect(logger.error).toHaveBeenCalledWith('Failed to load key file', {
        file: 'corrupted.json',
        error: expect.any(Error),
      });

      // Should still have loaded the valid key
      expect(testKeyManager.getActiveKey()?.keyId).toBe('valid-key');
    });
  });

  describe('Key Reactivation Logic', () => {
    it('should reactivate the most recent valid key when no active key exists', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const keys = [
        {
          keyId: 'old-key',
          algorithm: 'RS256' as const,
          createdAt: lastWeek,
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          isActive: false,
        },
        {
          keyId: 'recent-key',
          algorithm: 'PS256' as const,
          createdAt: yesterday,
          expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          isActive: false,
        },
      ];

      // Add keys to the manager
      keys.forEach(key => {
        (testKeyManager as any).keyPairs.set(key.keyId, {
          ...key,
          privateKey: 'priv',
          publicKey: 'pub',
        });
      });

      // Mock generateKeyPair to avoid actual key generation
      const mockGenerateKeyPair = vi.fn().mockResolvedValue({
        keyId: 'new-key',
        privateKey: 'priv',
        publicKey: 'pub',
        algorithm: 'PS256',
        createdAt: now,
        isActive: true,
      });

      testKeyManager.generateKeyPair = mockGenerateKeyPair;

      // Mock persistKeyPair
      testKeyManager.persistKeyPair = vi.fn();

      await testKeyManager.initialize();

      // Should have reactivated the recent PS256 key instead of generating new one
      expect(testKeyManager.getActiveKey()?.keyId).toBe('recent-key');
      expect(mockGenerateKeyPair).not.toHaveBeenCalled();
    });

    it('should prefer PS256 keys over older algorithms', async () => {
      const now = new Date();
      const keys = [
        {
          keyId: 'ps256-key',
          algorithm: 'PS256' as const,
          createdAt: new Date(now.getTime() - 1000),
          expiresAt: new Date(now.getTime() + 86400000),
          isActive: false,
        },
        {
          keyId: 'rs256-key',
          algorithm: 'RS256' as const,
          createdAt: new Date(now.getTime() - 2000), // Older but RS256
          expiresAt: new Date(now.getTime() + 86400000),
          isActive: false,
        },
      ];

      // Add keys to the manager
      keys.forEach(key => {
        (testKeyManager as any).keyPairs.set(key.keyId, {
          ...key,
          privateKey: 'priv',
          publicKey: 'pub',
        });
      });

      const mockGenerateKeyPair = vi.fn();
      testKeyManager.generateKeyPair = mockGenerateKeyPair;
      testKeyManager.persistKeyPair = vi.fn();

      await testKeyManager.initialize();

      // Should prefer PS256 key even though it's slightly older
      expect(testKeyManager.getActiveKey()?.keyId).toBe('ps256-key');
      expect(mockGenerateKeyPair).not.toHaveBeenCalled();
    });

    it('should skip expired keys during reactivation', async () => {
      const now = new Date();
      const keys = [
        {
          keyId: 'expired-key',
          algorithm: 'PS256' as const,
          createdAt: new Date(now.getTime() - 86400000),
          expiresAt: new Date(now.getTime() - 3600000), // Expired 1 hour ago
          isActive: false,
        },
        {
          keyId: 'valid-key',
          algorithm: 'PS256' as const,
          createdAt: new Date(now.getTime() - 43200000), // 12 hours ago
          expiresAt: new Date(now.getTime() + 86400000), // Valid for 24 more hours
          isActive: false,
        },
      ];

      // Add keys to the manager
      keys.forEach(key => {
        (testKeyManager as any).keyPairs.set(key.keyId, {
          ...key,
          privateKey: 'priv',
          publicKey: 'pub',
        });
      });

      const mockGenerateKeyPair = vi.fn();
      testKeyManager.generateKeyPair = mockGenerateKeyPair;
      testKeyManager.persistKeyPair = vi.fn();

      await testKeyManager.initialize();

      // Should skip expired key and reactivate valid one
      expect(testKeyManager.getActiveKey()?.keyId).toBe('valid-key');
      expect(mockGenerateKeyPair).not.toHaveBeenCalled();
    });

    it('should generate new key when no suitable existing keys found', async () => {
      // No keys in the manager
      const mockNewKey = {
        keyId: 'fresh-key',
        privateKey: 'priv',
        publicKey: 'pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      };

      const mockGenerateKeyPair = vi.fn().mockResolvedValue(mockNewKey);
      testKeyManager.generateKeyPair = mockGenerateKeyPair;
      testKeyManager.persistKeyPair = vi.fn();

      await testKeyManager.initialize();

      expect(mockGenerateKeyPair).toHaveBeenCalled();
      expect(testKeyManager.getActiveKey()?.keyId).toBe('fresh-key');
    });
  });

  describe('Key Rotation', () => {
    it('should properly rotate keys and mark old keys for grace period', async () => {
      const mockOldKey = {
        keyId: 'old-active',
        privateKey: 'old-priv',
        publicKey: 'old-pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        isActive: true,
      };

      const mockNewKey = {
        keyId: 'new-active',
        privateKey: 'new-priv',
        publicKey: 'new-pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        isActive: true,
      };

      // Set up initial state
      (testKeyManager as any).activeKeyId = mockOldKey.keyId;
      (testKeyManager as any).keyPairs.set(mockOldKey.keyId, mockOldKey);

      // Mock key generation
      testKeyManager.generateKeyPair = vi.fn().mockResolvedValue(mockNewKey);
      testKeyManager.persistKeyPair = vi.fn();

      await testKeyManager.rotateKey();

      // Old key should be marked inactive and have grace period
      const oldKeyAfterRotation = (testKeyManager as any).keyPairs.get(mockOldKey.keyId);
      expect(oldKeyAfterRotation.isActive).toBe(false);
      expect(oldKeyAfterRotation.gracePeriodUntil).toBeInstanceOf(Date);

      // New key should be active
      expect(testKeyManager.getActiveKey()?.keyId).toBe(mockNewKey.keyId);
    });

    it('should allow verification of keys within grace period', () => {
      const now = new Date();
      const gracePeriodKey = {
        keyId: 'grace-key',
        privateKey: 'priv',
        publicKey: 'pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        isActive: false,
        gracePeriodUntil: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      };

      (testKeyManager as any).keyPairs.set(gracePeriodKey.keyId, gracePeriodKey);

      const result = testKeyManager.getVerificationKey(gracePeriodKey.keyId);

      expect(result).toEqual(gracePeriodKey);
    });

    it('should reject verification of keys past grace period', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const expiredGraceKey = {
        keyId: 'expired-grace-key',
        privateKey: 'priv',
        publicKey: 'pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        isActive: false,
        gracePeriodUntil: past,
      };

      (testKeyManager as any).keyPairs.set(expiredGraceKey.keyId, expiredGraceKey);

      const result = testKeyManager.getVerificationKey(expiredGraceKey.keyId);

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const { logger } = require('../../shared/logger');

      // Mock loadKeys to throw
      (testKeyManager as any).loadKeys = vi.fn().mockRejectedValue(new Error('Disk error'));

      // Should not throw, but log error
      await expect(testKeyManager.initialize()).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith('Failed to initialize KeyManager', {
        error: expect.any(Error),
      });
    });

    it('should handle key persistence errors', async () => {
      const { logger } = require('../../shared/logger');

      (global as any).Bun = {
        write: vi.fn().mockRejectedValue(new Error('Write failed')),
      };

      const keyPair = {
        keyId: 'test-key',
        privateKey: 'priv',
        publicKey: 'pub',
        algorithm: 'PS256',
        createdAt: new Date(),
        isActive: true,
      };

      await expect(testKeyManager.persistKeyPair(keyPair)).rejects.toThrow('Write failed');
    });
  });
});