/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T13:00:00
 * Last Updated: 2025-12-22T13:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia, t } from 'elysia';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../../shared/logger';

// Error log entry schema
const errorLogSchema = t.Object({
  errorId: t.String(),
  message: t.String(),
  stack: t.Optional(t.String()),
  url: t.String(),
  userAgent: t.String(),
  timestamp: t.String(),
  sessionId: t.Optional(t.String()),
  userId: t.Optional(t.String()),
});

// Directory for error logs
const ERROR_LOGS_DIR = join(process.cwd(), 'error-logs');

// Ensure error logs directory exists
if (!existsSync(ERROR_LOGS_DIR)) {
  mkdirSync(ERROR_LOGS_DIR, { recursive: true });
}

export function createErrorController() {
  const app = new Elysia({ name: 'error-controller' });

  // Get current date in YYYY-MM-DD format for filename
  function getCurrentDateFile(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return join(ERROR_LOGS_DIR, `frontend-errors-${dateStr}.log`);
  }

  // Format error log entry
  function formatErrorLogEntry(errorData: typeof errorLogSchema.static): string {
    const lines = [
      `[${errorData.timestamp}] ERROR [frontend-error]`,
      `Error ID: ${errorData.errorId}`,
      `Message: ${errorData.message}`,
      `URL: ${errorData.url}`,
      `User Agent: ${errorData.userAgent}`,
      `Session ID: ${errorData.sessionId || 'N/A'}`,
      `User ID: ${errorData.userId || 'N/A'}`,
      errorData.stack ? `Stack Trace:\n${errorData.stack}` : 'No stack trace available',
      '---',
    ];

    return lines.join('\n') + '\n\n';
  }

  // POST /api/errors - Receive error logs from frontend
  app.post('/errors', async ({ body, request }) => {
    try {
      const errorData = body as typeof errorLogSchema.static;

      // Validate required fields
      if (!errorData.errorId || !errorData.message || !errorData.timestamp) {
        return {
          success: false,
          error: 'Missing required fields: errorId, message, timestamp'
        };
      }

      // Get log file path for current date
      const logFilePath = getCurrentDateFile();

      // Format the log entry
      const logEntry = formatErrorLogEntry(errorData);

      // Append to log file
      appendFileSync(logFilePath, logEntry, 'utf8');

      // Log to backend logger as well
      logger.error(`Frontend Error: ${errorData.message}`, {
        errorId: errorData.errorId,
        url: errorData.url,
        userAgent: errorData.userAgent,
        stack: errorData.stack,
        sessionId: errorData.sessionId,
        userId: errorData.userId,
      });

      return {
        success: true,
        message: 'Error logged successfully',
        errorId: errorData.errorId
      };

    } catch (error) {
      logger.error(error as Error, 'Failed to log frontend error');

      return {
        success: false,
        error: 'Failed to log error'
      };
    }
  }, {
    body: errorLogSchema,
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        errorId: t.String(),
      }),
      400: t.Object({
        success: t.Boolean(),
        error: t.String(),
      }),
    },
    detail: {
      summary: 'Log frontend error',
      description: 'Receives and stores error logs from the frontend application',
      tags: ['Error Logging'],
    },
  });

  // GET /api/errors - Get error logs (for debugging/admin purposes)
  app.get('/errors', async ({ query, set }) => {
    try {
      // Basic authentication check (in production, use proper auth middleware)
      // For now, allow access but log it
      logger.info('Error logs accessed', { query });

      const date = query.date || new Date().toISOString().split('T')[0];
      const logFilePath = join(ERROR_LOGS_DIR, `frontend-errors-${date}.log`);

      if (!existsSync(logFilePath)) {
        set.status = 404;
        return {
          success: false,
          error: 'No error logs found for the specified date'
        };
      }

      // Read and return the log file contents
      const fs = await import('fs/promises');
      const logContent = await fs.readFile(logFilePath, 'utf8');

      return {
        success: true,
        date,
        logs: logContent,
        filePath: logFilePath
      };

    } catch (error) {
      logger.error(error as Error, 'Failed to retrieve error logs');

      set.status = 500;
      return {
        success: false,
        error: 'Failed to retrieve error logs'
      };
    }
  }, {
    query: t.Object({
      date: t.Optional(t.String()), // YYYY-MM-DD format
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        date: t.String(),
        logs: t.String(),
        filePath: t.String(),
      }),
      404: t.Object({
        success: t.Boolean(),
        error: t.String(),
      }),
    },
    detail: {
      summary: 'Get error logs',
      description: 'Retrieve error logs for a specific date',
      tags: ['Error Logging'],
    },
  });

  return app;
}

