/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T21:59:47
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: unknown;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private isProduction = environment.production;

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, error?: Error, context?: string, data?: unknown): void {
    const errorData = {
      ...(data && typeof data === 'object' ? data : {}),
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    };
    this.log('error', message, context, errorData);
  }

  private log(level: LogEntry['level'], message: string, context?: string, data?: unknown): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    // In development, log to console with structured format
    if (!this.isProduction) {
      const consoleMethod =
        level === 'debug'
          ? 'debug'
          : level === 'info'
            ? 'info'
            : level === 'warn'
              ? 'warn'
              : 'error';

      console[consoleMethod](
        `[${logEntry.timestamp}] ${level.toUpperCase()}${context ? ` [${context}]` : ''}: ${message}`,
        data || ''
      );
    }

    // In production, you could send to external logging service
    if (this.isProduction) {
      // TODO: Send to logging service (e.g., Sentry, LogRocket, etc.)
      // this.sendToExternalService(logEntry);
    }
  }

  // Helper methods for common logging scenarios
  logUserAction(action: string, userId?: string, data?: unknown): void {
    this.info(`User action: ${action}`, 'user-action', {
      action,
      userId,
      ...(data && typeof data === 'object' ? data : {}),
    });
  }

  logApiCall(method: string, url: string, statusCode?: number, duration?: number): void {
    this.info(`API call: ${method} ${url}`, 'api-call', { method, url, statusCode, duration });
  }

  logAuthEvent(event: string, userId?: string, success = true): void {
    this.info(`Auth event: ${event}`, 'auth', { event, userId, success });
  }
}
