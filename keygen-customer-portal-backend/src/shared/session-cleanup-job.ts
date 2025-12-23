/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import type { ISessionRepository } from '../infrastructure/database/repositories/session-repository';
import { logger } from './logger';
import { monitoring } from './monitoring';
import { config } from './config';

/**
 * Session cleanup job - removes expired sessions periodically
 *
 * Runs every SESSION_CLEANUP_INTERVAL milliseconds (default: 1 hour)
 * Removes sessions that have expired (expiresAt < now)
 */
export class SessionCleanupJob {
  private intervalId?: NodeJS.Timeout;
  private readonly cleanupInterval: number;

  constructor(
    private readonly sessionRepository: ISessionRepository,
  ) {
    // Default to 1 hour if not configured
    this.cleanupInterval = config.sessions?.cleanupInterval || 60 * 60 * 1000;
  }

  /**
   * Start the periodic cleanup job
   */
  start(): void {
    logger.info('Starting session cleanup job', {
      interval: this.cleanupInterval,
      intervalMinutes: this.cleanupInterval / (60 * 1000),
    });

    // Run cleanup immediately on start
    this.runCleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop the periodic cleanup job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Session cleanup job stopped');
    }
  }

  /**
   * Run cleanup manually (for testing or immediate cleanup)
   */
  async runCleanup(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Running session cleanup');

      const deletedCount = await this.sessionRepository.cleanupExpiredSessions();

      const duration = Date.now() - startTime;

      monitoring.recordBusinessEvent('session_cleanup_completed', {
        deletedCount: deletedCount.toString(),
        duration: duration.toString(),
      });

      logger.info('Session cleanup completed', {
        deletedCount,
        duration,
      });

      // Log if we deleted many sessions (potential issue)
      if (deletedCount > 1000) {
        logger.warn('Large number of expired sessions cleaned up', {
          deletedCount,
          duration,
        });

        monitoring.recordBusinessEvent('session_cleanup_large_batch', {
          deletedCount: deletedCount.toString(),
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      monitoring.recordBusinessEvent('session_cleanup_failed', {
        error: errorMessage,
        duration: duration.toString(),
      });

      logger.error('Session cleanup failed', {
        error: errorMessage,
        duration,
      });
    }
  }

  /**
   * Get job status
   */
  getStatus(): {
    running: boolean;
    cleanupInterval: number;
    nextRunIn?: number;
  } {
    return {
      running: this.intervalId !== undefined,
      cleanupInterval: this.cleanupInterval,
      nextRunIn: this.intervalId ? this.cleanupInterval : undefined,
    };
  }
}

// Global instance for the application
let globalSessionCleanupJob: SessionCleanupJob | null = null;

/**
 * Initialize and start the global session cleanup job
 */
export const initializeSessionCleanupJob = (sessionRepository: ISessionRepository): SessionCleanupJob => {
  if (globalSessionCleanupJob) {
    logger.warn('Session cleanup job already initialized');
    return globalSessionCleanupJob;
  }

  globalSessionCleanupJob = new SessionCleanupJob(sessionRepository);
  globalSessionCleanupJob.start();

  return globalSessionCleanupJob;
};

/**
 * Get the global session cleanup job instance
 */
export const getSessionCleanupJob = (): SessionCleanupJob | null => {
  return globalSessionCleanupJob;
};

/**
 * Stop the global session cleanup job
 */
export const stopSessionCleanupJob = (): void => {
  if (globalSessionCleanupJob) {
    globalSessionCleanupJob.stop();
    globalSessionCleanupJob = null;
  }
};