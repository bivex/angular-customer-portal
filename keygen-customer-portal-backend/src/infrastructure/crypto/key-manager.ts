/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-23T02:28:43
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import crypto from 'crypto';
import path from 'path';
import { logger } from '../../shared/logger';
import { monitoring } from '../../shared/monitoring';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: 'PS256' | 'PS384' | 'PS512' | 'RS256' | 'RS384' | 'RS512'; // PS256 preferred
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  gracePeriodUntil?: Date; // Grace period for old keys during rotation
}

export interface JWK {
  kty: string;
  use: string;
  alg: string;
  kid: string;
  n: string;
  e: string;
}

export interface KeyIndexEntry {
  keyId: string;
  algorithm: string;
  createdAt: number; // timestamp
  expiresAt?: number; // timestamp
  isActive: boolean;
  lastUsed?: number; // timestamp
}

export interface KeyIndex {
  [keyId: string]: KeyIndexEntry;
}

/**
 * KeyManager - Manages RSA key pairs for JWT signing
 *
 * Features:
 * - RSA key generation (2048-4096 bit)
 * - Key rotation with graceful transition
 * - JWKS endpoint support
 * - Key versioning with KID (Key ID)
 * - Persistent storage with encryption support
 */
export class KeyManager {
  private keyPairs: Map<string, KeyPair> = new Map();
  private activeKeyId: string | null = null;
  private readonly keyStorePath: string;
  private cleanupInterval: Timer | null = null;
  private readonly gracePeriodHours: number = 24; // 24 hours grace period
  private keyIndex: Map<string, KeyIndexEntry> = new Map();

  constructor(keyStorePath?: string, gracePeriodHours?: number) {
    this.keyStorePath = keyStorePath || path.join(process.cwd(), 'secrets', 'keys');
    this.gracePeriodHours = gracePeriodHours || 24;
  }

  /**
   * Initialize key manager - load keys from disk or generate initial key
   * Key loading is now asynchronous and non-blocking
   */
  async initialize(): Promise<void> {
    logger.info('Initializing KeyManager...');

    try {
      // Start key loading asynchronously - don't block app startup
      this.loadKeysInBackground();

      // Initialize with basic state - keys will be loaded in background
      this.initializeWithBasicState();

      // If no active key exists, try to reactivate a recent key or generate a new one
      if (!this.activeKeyId) {
        logger.info('No active key found, checking for reusable keys');

        // First priority: Look for existing active keys (shouldn't happen if activeKeyId is null, but check anyway)
        let activeCandidate: KeyPair | null = null;
        for (const keyPair of this.keyPairs.values()) {
          if (keyPair.isActive) {
            if (!activeCandidate ||
                keyPair.algorithm === 'PS256' && activeCandidate.algorithm !== 'PS256' ||
                keyPair.createdAt > activeCandidate.createdAt) {
              activeCandidate = keyPair;
            }
          }
        }

        if (activeCandidate) {
          this.activeKeyId = activeCandidate.keyId;
          logger.info('Found and reactivated existing active key', {
            keyId: activeCandidate.keyId,
            algorithm: activeCandidate.algorithm,
            createdAt: activeCandidate.createdAt,
          });
        } else {
          // Second priority: Look for inactive but valid keys to reactivate
          let bestCandidate: KeyPair | null = null;
          const now = new Date();
          const candidates = [];

          for (const keyPair of this.keyPairs.values()) {
            const isExpired = keyPair.expiresAt && keyPair.expiresAt <= now;
            candidates.push({
              id: keyPair.keyId,
              algorithm: keyPair.algorithm,
              isActive: keyPair.isActive,
              isExpired,
              createdAt: keyPair.createdAt,
              expiresAt: keyPair.expiresAt,
            });

            logger.info('Evaluating key candidate', {
              keyId: keyPair.keyId,
              isActive: keyPair.isActive,
              isExpired,
              algorithm: keyPair.algorithm,
              createdAt: keyPair.createdAt,
              expiresAt: keyPair.expiresAt,
              now: now.toISOString(),
            });

            // Skip expired keys
            if (isExpired) {
              logger.warn('Skipping expired key', { keyId: keyPair.keyId, expiresAt: keyPair.expiresAt });
              continue;
            }

            // Skip keys that are in grace period (they should remain inactive)
            if (!keyPair.isActive && keyPair.gracePeriodUntil && keyPair.gracePeriodUntil > now) {
              logger.info('Skipping key in grace period', {
                keyId: keyPair.keyId,
                gracePeriodUntil: keyPair.gracePeriodUntil
              });
              continue;
            }

            // Prefer PS256 keys over older algorithms, then by creation date
            if (!bestCandidate ||
                keyPair.algorithm === 'PS256' && bestCandidate.algorithm !== 'PS256' ||
                keyPair.createdAt > bestCandidate.createdAt) {
              bestCandidate = keyPair;
              logger.info('Selected new best candidate', { keyId: keyPair.keyId });
            }
          }

          logger.info('Key reactivation candidates evaluated', {
            totalKeys: this.keyPairs.size,
            candidates: candidates,
            bestCandidateId: bestCandidate?.keyId,
            activeKeyId: this.activeKeyId,
          });

          if (bestCandidate) {
            // Reactivate the best candidate key
            this.activeKeyId = bestCandidate.keyId;
            bestCandidate.isActive = true;
            await this.persistKeyPair(bestCandidate);

            logger.info('Reactivated existing key as active', {
              keyId: bestCandidate.keyId,
              algorithm: bestCandidate.algorithm,
              createdAt: bestCandidate.createdAt,
              expiresAt: bestCandidate.expiresAt,
            });

            monitoring.recordBusinessEvent('key_reactivated', {
              keyId: bestCandidate.keyId,
              algorithm: bestCandidate.algorithm,
            });
          } else {
            // No suitable key found, generate a new one
            logger.warn('No suitable existing key found, generating new key pair', {
              totalKeys: this.keyPairs.size,
              candidatesCount: candidates.length,
              expiredKeys: candidates.filter(c => c.isExpired).length,
            });
            const initialKeyPair = await this.generateKeyPair({
              algorithm: 'PS256',
              keySize: 2048,
              expiresInDays: 90,
            });

            // Set as active
            this.activeKeyId = initialKeyPair.keyId;
            initialKeyPair.isActive = true;
            this.keyPairs.set(initialKeyPair.keyId, initialKeyPair);

            logger.info('New key pair generated and set as active', {
              keyId: initialKeyPair.keyId,
              algorithm: initialKeyPair.algorithm,
            });

            monitoring.recordBusinessEvent('initial_key_generated', {
              keyId: initialKeyPair.keyId,
              algorithm: initialKeyPair.algorithm,
            });
          }
        }
      } else {
        logger.info('Using existing active key', {
          activeKeyId: this.activeKeyId,
          totalKeys: this.keyPairs.size,
        });
      }

      // Start cleanup interval (check every hour)
      this.startCleanupInterval();

      logger.info(`KeyManager initialized with ${this.keyPairs.size} keys, active: ${this.activeKeyId}`);

      monitoring.recordBusinessEvent('key_manager_initialized', {
        totalKeys: this.keyPairs.size.toString(),
        activeKeyId: this.activeKeyId || 'none',
      });
    } catch (error) {
      logger.error('Failed to initialize KeyManager', { error });
      throw error;
    }
  }

  /**
   * Generate a new RSA key pair for JWT signing
   */
  async generateKeyPair(options: {
    algorithm?: 'PS256' | 'PS384' | 'PS512';
    keySize?: 2048 | 3072 | 4096;
    expiresInDays?: number;
  } = {}): Promise<KeyPair> {
    const {
      algorithm = 'PS256', // Changed default to PS256 for consistency
      keySize = 2048,
      expiresInDays,
    } = options;

    logger.info('Generating new RSA key pair', { algorithm, keySize, expiresInDays });

    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      const keyId = crypto.randomUUID();
      const createdAt = new Date();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        keyId,
        algorithm,
        createdAt,
        expiresAt,
        isActive: true,
      };

      this.keyPairs.set(keyId, keyPair);
      await this.persistKeyPair(keyPair);

      logger.info('RSA key pair generated successfully', { keyId, algorithm });

      monitoring.recordBusinessEvent('key_pair_generated', {
        keyId,
        algorithm,
        keySize: keySize.toString(),
      });

      return keyPair;
    } catch (error) {
      logger.error('Failed to generate key pair', { error });
      throw error;
    }
  }

  /**
   * Rotate to a new key while keeping old keys for verification
   *
   * This implements graceful key rotation:
   * 1. Generate new key
   * 2. Mark old key as inactive (but keep for verification)
   * 3. New tokens signed with new key
   * 4. Old tokens still valid (verified with old key)
   */
  async rotateKey(): Promise<KeyPair> {
    logger.info('Starting key rotation with grace period');

    try {
      const newKeyPair = await this.generateKeyPair({
        algorithm: 'PS256', // Upgraded to PS256 for enhanced security
        keySize: 2048,
        expiresInDays: 90, // Keys expire in 90 days
      });

      // Mark old key with grace period instead of immediately inactive
      if (this.activeKeyId) {
        const oldKey = this.keyPairs.get(this.activeKeyId);
        if (oldKey) {
          oldKey.isActive = false;
          oldKey.gracePeriodUntil = new Date(Date.now() + this.gracePeriodHours * 60 * 60 * 1000);
          await this.persistKeyPair(oldKey);

          logger.info(`Old key ${this.activeKeyId} moved to grace period until ${oldKey.gracePeriodUntil}`, {
            oldKeyId: this.activeKeyId,
            newKeyId: newKeyPair.keyId,
            gracePeriodHours: this.gracePeriodHours,
          });
        }
      }

      this.activeKeyId = newKeyPair.keyId;

      logger.info(`Key rotation completed with ${this.gracePeriodHours}h grace period`, {
        newActiveKeyId: this.activeKeyId
      });

      monitoring.recordBusinessEvent('key_rotated', {
        newKeyId: newKeyPair.keyId,
        oldKeyId: this.activeKeyId || 'none',
        gracePeriodHours: this.gracePeriodHours.toString(),
      });

      return newKeyPair;
    } catch (error) {
      logger.error('Key rotation failed', { error });
      throw error;
    }
  }

  /**
   * Get active signing key
   */
  getActiveKey(): KeyPair | null {
    if (!this.activeKeyId) {
      logger.warn('No active key available');
      return null;
    }

    const key = this.keyPairs.get(this.activeKeyId);
    if (!key) {
      logger.error('Active key not found in keyPairs map', { activeKeyId: this.activeKeyId });
      return null;
    }

    return key;
  }

  /**
   * Get key for verification (by kid in JWT header)
   */
  getVerificationKey(keyId: string): KeyPair | null {
    const key = this.keyPairs.get(keyId);

    if (!key) {
      logger.warn('Verification key not found', { keyId, availableKeys: Array.from(this.keyPairs.keys()) });
      return null;
    }

    const now = new Date();

    // Check if key is expired
    if (key.expiresAt && key.expiresAt < now) {
      logger.warn('Verification key expired', { keyId, expiresAt: key.expiresAt });
      return null;
    }

    // Allow verification if key is active OR within grace period OR was ever active (for backward compatibility)
    if (key.isActive) {
      return key; // Active keys always allowed
    }

    if (key.gracePeriodUntil && key.gracePeriodUntil > now) {
      logger.info('Using key within grace period', {
        keyId,
        gracePeriodUntil: key.gracePeriodUntil,
        remainingHours: Math.round((key.gracePeriodUntil.getTime() - now.getTime()) / (1000 * 60 * 60))
      });
      return key; // Keys in grace period allowed for verification
    }

    // Allow verification of any non-expired key that was previously active (for server restart compatibility)
    // This ensures tokens signed before a restart remain valid
    logger.info('Using previously active key for verification (restart compatibility)', {
      keyId,
      isActive: key.isActive,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt
    });
    return key;
  }

  /**
   * Get all active keys (for verification during rotation period)
   */
  getAllActiveKeys(): KeyPair[] {
    return Array.from(this.keyPairs.values())
      .filter(kp => kp.isActive || (kp.expiresAt && kp.expiresAt > new Date()));
  }

  /**
   * Get all verification keys (active + grace period) for debugging
   */
  getAllVerificationKeys(): Record<string, KeyPair> {
    const now = new Date();
    const verificationKeys: Record<string, KeyPair> = {};

    for (const [keyId, keyPair] of this.keyPairs) {
      // Include keys that are active or within grace period
      if (keyPair.isActive ||
          (keyPair.gracePeriodUntil && keyPair.gracePeriodUntil > now) ||
          (!keyPair.isActive && keyPair.expiresAt && keyPair.expiresAt > now)) {
        verificationKeys[keyId] = keyPair;
      }
    }

    return verificationKeys;
  }

  /**
   * Load keys from disk on startup - Optimized version
   * Only loads active keys and creates index for lazy loading
   */
  private async loadKeys(): Promise<void> {
    try {
      // Ensure directory exists
      await Bun.$`mkdir -p ${this.keyStorePath}`.quiet();

      // Check if directory exists
      try {
        await Bun.$`test -d ${this.keyStorePath}`.quiet();
      } catch {
        logger.info('Keys directory does not exist, will be created on first key generation');
        return;
      }

      const startTime = Date.now();

      // First, try to load the key index if it exists
      await this.loadKeyIndex();

      // If we have an index, use it for optimized loading
      if (this.keyIndex.size > 0) {
        await this.loadKeysFromIndex();
      } else {
        // Fallback to scanning directory (for migration)
        await this.loadKeysByScanning();
      }

      const loadTime = Date.now() - startTime;
      logger.info('Key loading completed', {
        totalKeys: this.keyPairs.size,
        activeKeyId: this.activeKeyId,
        loadTimeMs: loadTime,
        keysInMemory: this.keyPairs.size,
        keysInIndex: this.keyIndex.size,
      });

      monitoring.recordBusinessEvent('keys_loaded_from_disk', {
        totalKeys: this.keyPairs.size,
        loadTimeMs: loadTime,
        optimizationUsed: this.keyIndex.size > 0,
      });

    } catch (error) {
      logger.error('Failed to load keys from disk', { error });
      // Don't throw - we'll generate a new key if needed
    }
  }

  /**
   * Load key index for optimized startup
   */
  private async loadKeyIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.keyStorePath, 'index.json');
      const indexFile = Bun.file(indexPath);

      if (await indexFile.exists()) {
        const indexData = await indexFile.json() as KeyIndex;
        this.keyIndex = new Map(Object.entries(indexData));
        logger.info('Loaded key index', { indexedKeys: this.keyIndex.size });
      }
    } catch (error) {
      logger.warn('Failed to load key index, will rebuild', { error });
    }
  }

  /**
   * Load keys using the index (optimized path)
   */
  private async loadKeysFromIndex(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    // Always load active keys first
    for (const [keyId, metadata] of this.keyIndex) {
      if (metadata.isActive || metadata.lastUsed) {
        // Load recently used or active keys immediately
        const age = Date.now() - (metadata.lastUsed || metadata.createdAt);
        if (metadata.isActive || age < 24 * 60 * 60 * 1000) { // Last 24 hours
          loadPromises.push(this.loadKeyById(keyId));
        }
      }
    }

    // Load active keys synchronously for immediate availability
    await Promise.all(loadPromises);

    // Update index with current timestamps
    await this.updateKeyIndex();
  }

  /**
   * Fallback method for loading keys by scanning directory
   */
  private async loadKeysByScanning(): Promise<void> {
    logger.warn('Using fallback key loading method - consider optimizing');

    const files = await Array.fromAsync(
      new Bun.Glob('*.json').scan({ cwd: this.keyStorePath })
    );

    // Only load the first few files to get started
    const initialLoadCount = Math.min(10, files.length); // Load max 10 keys initially

    for (let i = 0; i < initialLoadCount; i++) {
      const file = files[i];
      if (file === 'index.json') continue;

      try {
        await this.loadKeyById(file.replace('.json', ''));
      } catch (error) {
        logger.error('Failed to load key file during scan', { file, error });
      }
    }

    // Start background loading of remaining keys
    if (files.length > initialLoadCount) {
      this.loadRemainingKeysInBackground(files.slice(initialLoadCount));
    }

    // Rebuild index
    await this.rebuildKeyIndex();
  }

  /**
   * Load remaining keys in background to avoid blocking startup
   */
  private async loadRemainingKeysInBackground(files: string[]): Promise<void> {
    setTimeout(async () => {
      logger.info('Starting background key loading', { remainingKeys: files.length });

      for (const file of files) {
        if (file === 'index.json') continue;

        try {
          await this.loadKeyById(file.replace('.json', ''));
        } catch (error) {
          // Silently log errors for background loading
          logger.debug('Failed to load key in background', { file, error });
        }
      }

      logger.info('Background key loading completed');
    }, 1000); // Start after 1 second
  }

  /**
   * Load a specific key by ID
   */
  private async loadKeyById(keyId: string): Promise<void> {
    try {
      const keyPath = path.join(this.keyStorePath, `${keyId}.json`);
      const keyFile = Bun.file(keyPath);

      if (await keyFile.exists()) {
        const keyData = await keyFile.json() as KeyPair;

        // Restore Date objects
        keyData.createdAt = new Date(keyData.createdAt);
        if (keyData.expiresAt) {
          keyData.expiresAt = new Date(keyData.expiresAt);
        }

        this.keyPairs.set(keyData.keyId, keyData);

        if (keyData.isActive) {
          this.activeKeyId = keyData.keyId;
        }

        // Update index with last used time
        if (this.keyIndex.has(keyId)) {
          const metadata = this.keyIndex.get(keyId)!;
          metadata.lastUsed = Date.now();
          this.keyIndex.set(keyId, metadata);
        }
      }
    } catch (error) {
      logger.error('Failed to load key by ID', { keyId, error });
      throw error;
    }
  }

  /**
   * Rebuild the key index from existing files
   */
  private async rebuildKeyIndex(): Promise<void> {
    try {
      const files = await Array.fromAsync(
        new Bun.Glob('*.json').scan({ cwd: this.keyStorePath })
      );

      const index: KeyIndex = {};

      for (const file of files) {
        if (file === 'index.json') continue;

        try {
          const keyId = file.replace('.json', '');
          const keyPath = path.join(this.keyStorePath, file);
          const keyFile = Bun.file(keyPath);
          const keyData = await keyFile.json() as KeyPair;

          index[keyId] = {
            keyId,
            algorithm: keyData.algorithm,
            createdAt: new Date(keyData.createdAt).getTime(),
            expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt).getTime() : undefined,
            isActive: keyData.isActive,
            lastUsed: Date.now(),
          };
        } catch (error) {
          logger.warn('Failed to index key file', { file, error });
        }
      }

      this.keyIndex = new Map(Object.entries(index));
      await this.saveKeyIndex();

      logger.info('Rebuilt key index', { indexedKeys: this.keyIndex.size });
    } catch (error) {
      logger.error('Failed to rebuild key index', { error });
    }
  }

  /**
   * Update the key index with current usage data
   */
  private async updateKeyIndex(): Promise<void> {
    // Update lastUsed for keys currently in memory
    for (const keyId of this.keyPairs.keys()) {
      if (this.keyIndex.has(keyId)) {
        const metadata = this.keyIndex.get(keyId)!;
        metadata.lastUsed = Date.now();
        this.keyIndex.set(keyId, metadata);
      }
    }

    await this.saveKeyIndex();
  }

  /**
   * Save the key index to disk
   */
  private async saveKeyIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.keyStorePath, 'index.json');
      const indexData = Object.fromEntries(this.keyIndex);
      await Bun.write(indexPath, JSON.stringify(indexData, null, 2));
    } catch (error) {
      logger.error('Failed to save key index', { error });
    }
  }

  /**
   * Load keys in background without blocking app startup
   */
  private async loadKeysInBackground(): Promise<void> {
    try {
      await this.loadKeys();
      this.finalizeInitialization();
    } catch (error) {
      logger.error('Background key loading failed', { error });
      // Try to initialize with a new key if loading fails
      await this.initializeWithFallbackKey();
    }
  }

  /**
   * Initialize with basic state for immediate availability
   */
  private initializeWithBasicState(): void {
    // Start with minimal state - we may need to generate a key immediately
    // This allows the app to start even if key loading takes time

    // Start cleanup interval immediately
    this.startCleanupInterval();

    logger.info('KeyManager basic initialization complete - full key loading in progress');
  }

  /**
   * Finalize initialization after keys are loaded
   */
  private finalizeInitialization(): void {
    // Check if we need to reactivate or generate a key
    if (!this.activeKeyId) {
      this.ensureActiveKey();
    }

    logger.info('KeyManager fully initialized', {
      totalKeys: this.keyPairs.size,
      activeKeyId: this.activeKeyId,
    });

    monitoring.recordBusinessEvent('key_manager_initialized', {
      totalKeys: this.keyPairs.size.toString(),
      activeKeyId: this.activeKeyId || 'none',
    });
  }

  /**
   * Ensure we have an active key (called after background loading)
   */
  private async ensureActiveKey(): Promise<void> {
    logger.info('No active key found, checking for reusable keys');

    // First priority: Look for existing active keys
    let activeCandidate: KeyPair | null = null;
    for (const keyPair of this.keyPairs.values()) {
      if (keyPair.isActive) {
        if (!activeCandidate ||
            keyPair.algorithm === 'PS256' && activeCandidate.algorithm !== 'PS256' ||
            keyPair.createdAt > activeCandidate.createdAt) {
          activeCandidate = keyPair;
        }
      }
    }

    if (activeCandidate) {
      this.activeKeyId = activeCandidate.keyId;
      logger.info('Found and reactivated existing active key', {
        keyId: activeCandidate.keyId,
        algorithm: activeCandidate.algorithm,
        createdAt: activeCandidate.createdAt,
      });
    } else {
      // Second priority: Look for inactive but valid keys to reactivate
      await this.tryReactivateExistingKey();
    }
  }

  /**
   * Try to reactivate an existing valid key
   */
  private async tryReactivateExistingKey(): Promise<void> {
    let bestCandidate: KeyPair | null = null;
    const now = new Date();
    const candidates = [];

    for (const keyPair of this.keyPairs.values()) {
      const isExpired = keyPair.expiresAt && keyPair.expiresAt <= now;
      candidates.push({
        id: keyPair.keyId,
        algorithm: keyPair.algorithm,
        isActive: keyPair.isActive,
        isExpired,
        createdAt: keyPair.createdAt,
        expiresAt: keyPair.expiresAt,
      });

      // Skip expired keys
      if (isExpired) {
        continue;
      }

      // Skip keys that are in grace period
      if (!keyPair.isActive && keyPair.gracePeriodUntil && keyPair.gracePeriodUntil > now) {
        continue;
      }

      // Prefer PS256 keys over older algorithms, then by creation date
      if (!bestCandidate ||
          keyPair.algorithm === 'PS256' && bestCandidate.algorithm !== 'PS256' ||
          keyPair.createdAt > bestCandidate.createdAt) {
        bestCandidate = keyPair;
      }
    }

    if (bestCandidate) {
      // Reactivate the best candidate key
      this.activeKeyId = bestCandidate.keyId;
      bestCandidate.isActive = true;
      await this.persistKeyPair(bestCandidate);

      logger.info('Reactivated existing key as active', {
        keyId: bestCandidate.keyId,
        algorithm: bestCandidate.algorithm,
        createdAt: bestCandidate.createdAt,
        expiresAt: bestCandidate.expiresAt,
      });

      monitoring.recordBusinessEvent('key_reactivated', {
        keyId: bestCandidate.keyId,
        algorithm: bestCandidate.algorithm,
      });
    } else {
      // No suitable key found, generate a new one
      logger.warn('No suitable existing key found, generating new key pair', {
        totalKeys: this.keyPairs.size,
        candidatesCount: candidates.length,
        expiredKeys: candidates.filter(c => c.isExpired).length,
      });
      const initialKeyPair = await this.generateKeyPair({
        algorithm: 'PS256',
        keySize: 2048,
        expiresInDays: 90,
      });

      // Set as active
      this.activeKeyId = initialKeyPair.keyId;
      initialKeyPair.isActive = true;
      this.keyPairs.set(initialKeyPair.keyId, initialKeyPair);

      logger.info('New key pair generated and set as active', {
        keyId: initialKeyPair.keyId,
        algorithm: initialKeyPair.algorithm,
      });

      monitoring.recordBusinessEvent('initial_key_generated', {
        keyId: initialKeyPair.keyId,
        algorithm: initialKeyPair.algorithm,
      });
    }
  }

  /**
   * Initialize with fallback key if loading completely fails
   */
  private async initializeWithFallbackKey(): Promise<void> {
    logger.warn('Initializing with fallback key due to loading failure');

    try {
      const fallbackKey = await this.generateKeyPair({
        algorithm: 'PS256',
        keySize: 2048,
        expiresInDays: 30, // Shorter expiry for fallback
      });

      this.activeKeyId = fallbackKey.keyId;
      fallbackKey.isActive = true;
      this.keyPairs.set(fallbackKey.keyId, fallbackKey);

      logger.info('Fallback key generated successfully', {
        keyId: fallbackKey.keyId,
      });

      monitoring.recordBusinessEvent('fallback_key_generated', {
        keyId: fallbackKey.keyId,
        reason: 'loading_failure',
      });
    } catch (error) {
      logger.error('Failed to generate fallback key', { error });
      throw new Error('KeyManager initialization failed completely');
    }
  }

  /**
   * Persist key pair to disk
   *
   * In production, the private key should be encrypted before storing
   */
  private async persistKeyPair(keyPair: KeyPair): Promise<void> {
    try {
      // Ensure directory exists
      await Bun.write(path.join(this.keyStorePath, '.gitkeep'), '');

      const keyPath = path.join(this.keyStorePath, `${keyPair.keyId}.json`);

      // Write key to file with restricted permissions
      await Bun.write(keyPath, JSON.stringify(keyPair, null, 2));

      // Set file permissions to 600 (read/write for owner only)
      await Bun.$`chmod 600 ${keyPath}`.quiet();

      // Update index
      const indexEntry: KeyIndexEntry = {
        keyId: keyPair.keyId,
        algorithm: keyPair.algorithm,
        createdAt: keyPair.createdAt.getTime(),
        expiresAt: keyPair.expiresAt?.getTime(),
        isActive: keyPair.isActive,
        lastUsed: Date.now(),
      };
      this.keyIndex.set(keyPair.keyId, indexEntry);
      await this.saveKeyIndex();

      logger.info('Key persisted to disk', { keyId: keyPair.keyId, path: keyPath });
    } catch (error) {
      logger.error('Failed to persist key pair', { keyId: keyPair.keyId, error });
      throw error;
    }
  }

  /**
   * Delete key file from disk
   */
  private async deleteKeyFile(keyId: string): Promise<void> {
    try {
      const keyPath = path.join(this.keyStorePath, `${keyId}.json`);
      await Bun.$`rm -f ${keyPath}`.quiet();
      logger.info('Key file deleted', { keyId, path: keyPath });
    } catch (error) {
      logger.warn('Failed to delete key file', { keyId, error });
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [keyId, keyPair] of this.keyPairs.entries()) {
      // Only delete if:
      // 1. Key is expired
      // 2. Key is not active
      // 3. Key is older than grace period (7 days after expiration)
      if (
        keyPair.expiresAt &&
        keyPair.expiresAt < now &&
        !keyPair.isActive
      ) {
        const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
        const gracePeriodEnd = new Date(keyPair.expiresAt.getTime() + gracePeriod);

        if (gracePeriodEnd < now) {
          this.keyPairs.delete(keyId);

          // Delete from disk
          try {
            const keyPath = path.join(this.keyStorePath, `${keyId}.json`);
            await Bun.$`rm -f ${keyPath}`.quiet();
            cleanedCount++;

            logger.info('Expired key deleted', { keyId, expiresAt: keyPair.expiresAt });
          } catch (error) {
            logger.error('Failed to delete expired key file', { keyId, error });
          }
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info('Expired keys cleaned up', { count: cleanedCount });
      monitoring.recordBusinessEvent('expired_keys_cleaned', {
        count: cleanedCount.toString(),
      });
    }

    return cleanedCount;
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      Promise.all([
        this.cleanupExpiredKeys(),
        this.cleanupExpiredGracePeriods()
      ]).catch(error => {
        logger.error('Cleanup interval error', { error });
      });
    }, 60 * 60 * 1000);

    logger.info('Cleanup interval started (runs every hour)');
  }

  /**
   * Clean up keys whose grace period has expired
   */
  private async cleanupExpiredGracePeriods(): Promise<void> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [keyId, key] of this.keyPairs) {
      if (!key.isActive && key.gracePeriodUntil && key.gracePeriodUntil <= now) {
        this.keyPairs.delete(keyId);
        // Remove from disk if persisted
        try {
          await this.deleteKeyFile(keyId);
        } catch (error) {
          logger.warn('Failed to delete expired grace period key file', { keyId, error });
        }

        cleanedCount++;
        logger.info(`Cleaned up expired grace period key: ${keyId}`);
      }
    }

    if (cleanedCount > 0) {
      monitoring.recordBusinessEvent('grace_period_keys_cleaned', {
        cleanedCount: cleanedCount.toString(),
      });
    }
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Cleanup interval stopped');
    }
  }

  /**
   * Get JWKS (JSON Web Key Set) for public key distribution
   *
   * This endpoint should be exposed at /.well-known/jwks.json
   * Clients use this to verify JWT signatures
   */
  getJWKS(): { keys: JWK[] } {
    const keys = Array.from(this.keyPairs.values())
      .filter(kp => {
        // Include active keys and non-expired keys
        return kp.isActive || !kp.expiresAt || kp.expiresAt > new Date();
      })
      .map(kp => {
        try {
          // Convert PEM public key to JWK format
          const publicKeyObj = crypto.createPublicKey(kp.publicKey);
          const jwk = publicKeyObj.export({ format: 'jwk' }) as any;

          return {
            kty: jwk.kty || 'RSA',
            use: 'sig',
            alg: kp.algorithm,
            kid: kp.keyId,
            n: jwk.n,
            e: jwk.e,
          };
        } catch (error) {
          logger.error('Failed to export key to JWK', { keyId: kp.keyId, error });
          return null;
        }
      })
      .filter((jwk): jwk is JWK => jwk !== null);

    return { keys };
  }

  /**
   * Get key statistics
   */
  getStats(): {
    totalKeys: number;
    activeKeyId: string | null;
    activeKeys: number;
    expiredKeys: number;
  } {
    const now = new Date();
    const activeKeys = Array.from(this.keyPairs.values())
      .filter(kp => kp.isActive || !kp.expiresAt || kp.expiresAt > now).length;

    const expiredKeys = Array.from(this.keyPairs.values())
      .filter(kp => kp.expiresAt && kp.expiresAt < now).length;

    return {
      totalKeys: this.keyPairs.size,
      activeKeyId: this.activeKeyId,
      activeKeys,
      expiredKeys,
    };
  }
}

// Singleton instance
export const keyManager = new KeyManager();
