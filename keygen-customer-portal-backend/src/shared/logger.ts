/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import pino from 'pino';
import { config } from './config';
import path from 'path';

export const logger = pino({
  level: 'debug', // Always use debug level to capture ALL logs
  formatters: {
    level: (label) => {
      return { level: label };
    },
    log: (obj) => {
      // Add process info to all logs
      return {
        ...obj,
        pid: process.pid,
        hostname: require('os').hostname(),
        env: config.environment,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Ensure all serializers are included
  serializers: pino.stdSerializers,
}, pino.multistream([
  // Console output - pretty printed for development
  {
    stream: config.environment === 'production'
      ? process.stdout
      : require('pino-pretty')({
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,env'
        })
  },
  // File output - JSON format for all environments
  {
    stream: pino.destination({
      dest: path.join(process.cwd(), 'backend.log'),
      sync: false, // async logging for better performance
      mkdir: true,
      append: true // append to existing file
    })
  }
]));

// Helper functions for consistent logging
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info({
    method,
    url,
    statusCode,
    duration,
    type: 'request'
  }, `${method} ${url} - ${statusCode} (${duration}ms)`);
};

export const logError = (error: Error, context?: string) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    context,
    type: 'error'
  }, `Error${context ? ` in ${context}` : ''}: ${error.message}`);
};

export const logAuth = (action: string, userId?: string, success: boolean = true) => {
  logger.info({
    action,
    userId,
    success,
    type: 'auth'
  }, `Auth ${action}${userId ? ` for user ${userId}` : ''}: ${success ? 'success' : 'failed'}`);
};

// Additional logging helpers for comprehensive logging
export const logDebug = (message: string, data?: any) => {
  logger.debug(data || {}, message);
};

export const logInfo = (message: string, data?: any) => {
  logger.info(data || {}, message);
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(data || {}, message);
};

export const logDatabase = (operation: string, table: string, duration?: number, success: boolean = true, error?: any) => {
  const level = success ? 'info' : 'error';
  const data: any = {
    operation,
    table,
    duration,
    success,
    type: 'database'
  };

  if (error) {
    data.error = error.message;
    data.stack = error.stack;
  }

  logger[level](data, `DB Query: ${operation} on ${table} - ${success ? 'success' : 'failed'}${duration ? ` (${duration}ms)` : ''}`);
};

export const logBusiness = (event: string, data?: any) => {
  logger.info({
    event,
    ...data,
    type: 'business'
  }, `Business event: ${event}`);
};

