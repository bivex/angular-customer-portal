/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T23:10:30
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { logger } from './logger';
import * as Sentry from '@sentry/bun';

// Metrics storage
interface Metrics {
  requests: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    responseTimes: number[];
    errors: number;
  };
  database: {
    connections: number;
    queryCount: number;
    queryTimes: number[];
    errors: number;
  };
  business: {
    userRegistrations: number;
    userLogins: number;
    failedLogins: number;
    activeUsers: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    startTime: Date;
  };
}

class MonitoringService {
  private metrics: Metrics;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
        responseTimes: [],
        errors: 0,
      },
      database: {
        connections: 0,
        queryCount: 0,
        queryTimes: [],
        errors: 0,
      },
      business: {
        userRegistrations: 0,
        userLogins: 0,
        failedLogins: 0,
        activeUsers: 0,
      },
      system: {
        uptime: 0,
        memoryUsage: process.memoryUsage(),
        startTime: this.startTime,
      },
    };

    // Update system metrics every minute
    setInterval(() => this.updateSystemMetrics(), 60000);
  }

  // Request monitoring
  recordRequest(method: string, url: string, statusCode: number, duration: number) {
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byEndpoint[url] = (this.metrics.requests.byEndpoint[url] || 0) + 1;
    this.metrics.requests.responseTimes.push(duration);

    // Keep only last 1000 response times for memory efficiency
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
    }

    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    logger.info({
      method,
      url,
      statusCode,
      duration,
      type: 'request',
      avgResponseTime: this.getAverageResponseTime(),
    }, `Request: ${method} ${url} - ${statusCode} (${duration}ms)`);
  }

  recordRequestError(method: string, url: string, error: Error, duration?: number) {
    this.metrics.requests.errors++;
    this.metrics.requests.total++;

    logger.error({
      method,
      url,
      error: error.message,
      stack: error.stack,
      duration,
      type: 'request_error',
    }, `Request error: ${method} ${url} - ${error.message}`);

    // Send to Sentry in production
    Sentry.captureException(error, {
      tags: {
        type: 'request_error',
        method,
        url,
      },
      extra: {
        duration,
      },
    });
  }

  // Database monitoring
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean = true) {
    this.metrics.database.queryCount++;

    if (!success) {
      this.metrics.database.errors++;
    }

    this.metrics.database.queryTimes.push(duration);

    // Keep only last 1000 query times
    if (this.metrics.database.queryTimes.length > 1000) {
      this.metrics.database.queryTimes = this.metrics.database.queryTimes.slice(-1000);
    }

    logger.info({
      operation,
      table,
      duration,
      success,
      type: 'database',
      avgQueryTime: this.getAverageQueryTime(),
    }, `DB Query: ${operation} on ${table} - ${success ? 'success' : 'failed'} (${duration}ms)`);
  }

  recordDatabaseError(operation: string, table: string, error: Error) {
    this.metrics.database.errors++;

    logger.error({
      operation,
      table,
      error: error.message,
      stack: error.stack,
      type: 'database_error',
    }, `Database error: ${operation} on ${table} - ${error.message}`);

    Sentry.captureException(error, {
      tags: {
        type: 'database_error',
        operation,
        table,
      },
    });
  }

  // Business metrics
  recordUserRegistration(userId: string, email: string) {
    this.metrics.business.userRegistrations++;

    logger.info({
      userId,
      email,
      type: 'business',
      event: 'user_registration',
    }, `User registered: ${email} (ID: ${userId})`);
  }

  recordUserLogin(userId: string, email: string, success: boolean = true) {
    if (success) {
      this.metrics.business.userLogins++;
    } else {
      this.metrics.business.failedLogins++;
    }

    logger.info({
      userId,
      email,
      success,
      type: 'business',
      event: 'user_login',
    }, `User login ${success ? 'successful' : 'failed'}: ${email} (ID: ${userId})`);
  }

  recordBusinessEvent(event: string, data: Record<string, any>) {
    logger.info({
      event,
      ...data,
      type: 'business',
    }, `Business event: ${event}`);
  }

  // System metrics
  private updateSystemMetrics() {
    this.metrics.system.uptime = Date.now() - this.startTime.getTime();
    this.metrics.system.memoryUsage = process.memoryUsage();

    logger.debug({
      uptime: this.metrics.system.uptime,
      memoryUsage: this.metrics.system.memoryUsage,
      type: 'system',
    }, `System metrics updated`);
  }

  // Health check endpoint data
  getHealthData() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: '1.0.0',
      metrics: {
        requests: {
          total: this.metrics.requests.total,
          errors: this.metrics.requests.errors,
          averageResponseTime: this.getAverageResponseTime(),
        },
        database: {
          queryCount: this.metrics.database.queryCount,
          errors: this.metrics.database.errors,
          averageQueryTime: this.getAverageQueryTime(),
        },
        business: {
          ...this.metrics.business,
        },
      },
    };
  }

  // Metrics calculations
  private getAverageResponseTime(): number {
    if (this.metrics.requests.responseTimes.length === 0) return 0;
    const sum = this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.requests.responseTimes.length);
  }

  private getAverageQueryTime(): number {
    if (this.metrics.database.queryTimes.length === 0) return 0;
    const sum = this.metrics.database.queryTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.database.queryTimes.length);
  }

  // Performance alerts
  checkPerformanceThresholds() {
    const avgResponseTime = this.getAverageResponseTime();
    const avgQueryTime = this.getAverageQueryTime();

    // Alert on high response times
    if (avgResponseTime > 1000) { // 1 second threshold
      logger.warn({
        avgResponseTime,
        threshold: 1000,
        type: 'performance_alert',
      }, `High average response time: ${avgResponseTime}ms`);

      Sentry.captureMessage(`High average response time: ${avgResponseTime}ms`, 'warning');
    }

    // Alert on high query times
    if (avgQueryTime > 500) { // 500ms threshold
      logger.warn({
        avgQueryTime,
        threshold: 500,
        type: 'performance_alert',
      }, `High average query time: ${avgQueryTime}ms`);

      Sentry.captureMessage(`High average query time: ${avgQueryTime}ms`, 'warning');
    }

    // Alert on high error rates
    const errorRate = this.metrics.requests.total > 0 ?
      (this.metrics.requests.errors / this.metrics.requests.total) * 100 : 0;

    if (errorRate > 5) { // 5% error rate threshold
      logger.warn({
        errorRate: errorRate.toFixed(2),
        threshold: 5,
        type: 'error_rate_alert',
      }, `High error rate: ${errorRate.toFixed(2)}%`);

      Sentry.captureMessage(`High error rate: ${errorRate.toFixed(2)}%`, 'warning');
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export types
export type { Metrics };