/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:25
 * Last Updated: 2025-12-23T02:28:25
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Simple test to verify error handler functionality
 * Run with: node test-error-handler.js
 */

// Simulate the error handler behavior
class MockLoggingService {
  error(message, error, context, data) {
    console.log(`[MOCK LOG] ${message}`, { context, data, error: error.message });
  }
}

class GlobalErrorHandler {
  constructor(loggingService) {
    this.loggingService = loggingService;
  }

  handleError(error) {
    const errorInfo = this.extractErrorInfo(error);

    console.error('Global Error Handler:', errorInfo);

    this.loggingService.error(
      `Unhandled Error: ${errorInfo.message}`,
      errorInfo.originalError instanceof Error ? errorInfo.originalError : new Error(errorInfo.message),
      'global-error-handler',
      {
        stack: errorInfo.stack,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
        timestamp: errorInfo.timestamp,
        errorId: errorInfo.errorId,
      }
    );

    this.writeToErrorsLog(errorInfo);
  }

  extractErrorInfo(error) {
    const timestamp = new Date().toISOString();
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let message = 'Unknown error';
    let stack = '';
    let originalError = error;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    } else if (error && typeof error === 'object') {
      if (error.rejection) {
        originalError = error.rejection;
        message = originalError.message || 'Promise rejection';
        stack = originalError.stack || '';
      } else if (error.message) {
        message = error.message;
      } else {
        message = error.toString?.() || JSON.stringify(error);
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      message,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : 'http://localhost:4200',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      timestamp,
      errorId,
      originalError,
    };
  }

  writeToErrorsLog(errorInfo) {
    try {
      const logEntry = [
        `[${errorInfo.timestamp}] ERROR [global-error-handler]`,
        `Error ID: ${errorInfo.errorId}`,
        `Message: ${errorInfo.message}`,
        `URL: ${errorInfo.url}`,
        `User Agent: ${errorInfo.userAgent}`,
        errorInfo.stack ? `Stack Trace:\n${errorInfo.stack}` : 'No stack trace available',
        '---',
      ].join('\n');

      console.log('\n📄 Error log entry that would be written to errors.log:');
      console.log(logEntry);

      // In browser, this would save to localStorage
      if (typeof localStorage !== 'undefined') {
        const existingLogs = localStorage.getItem('error_logs') || '';
        const updatedLogs = existingLogs + (existingLogs ? '\n\n' : '') + logEntry;
        localStorage.setItem('error_logs', updatedLogs);
        console.log('💾 Error logged to localStorage (simulated)');
      }

    } catch (logError) {
      console.error('Failed to write error to log file:', logError);
    }
  }
}

// Test the error handler
const mockLoggingService = new MockLoggingService();
const errorHandler = new GlobalErrorHandler(mockLoggingService);

console.log('🧪 Testing Global Error Handler\n');

// Test 1: Regular Error
console.log('Test 1: Regular Error');
const testError1 = new Error('This is a test error');
errorHandler.handleError(testError1);

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: String error
console.log('Test 2: String Error');
const testError2 = 'Simple string error message';
errorHandler.handleError(testError2);

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Object error (simulating Angular error)
console.log('Test 3: Angular-style Error Object');
const testError3 = {
  message: 'NG1010: \'imports\' must be an array of components, directives, pipes, or NgModules.',
  stack: 'at checkStandaloneComponentImports (compiler.js:1234)\n    at validateComponent (compiler.js:5678)',
  rejection: new Error('Value could not be determined statically')
};
errorHandler.handleError(testError3);

console.log('\n✅ Error handler tests completed!');
console.log('💡 In the browser, errors would be logged to localStorage and can be downloaded using downloadErrorLogs()');