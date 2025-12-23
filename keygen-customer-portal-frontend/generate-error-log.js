/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T01:05:34
 * Last Updated: 2025-12-22T01:05:34
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Generate errors.log file by simulating the error handler logic
 */

// Mock browser environment
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value;
  },
  removeItem(key) {
    delete this.store[key];
  }
};

// Mock window
global.window = {
  location: { href: 'http://localhost:4200/dashboard' },
  navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
};

// Simplified error handler logic (based on our implementation)
class MockGlobalErrorHandler {
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
      url: global.window.location.href,
      userAgent: global.window.navigator.userAgent,
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

      const existingLogs = localStorage.getItem('error_logs') || '';
      const updatedLogs = existingLogs + (existingLogs ? '\n\n' : '') + logEntry;
      localStorage.setItem('error_logs', updatedLogs);

      console.log('💾 Error logged to localStorage');

    } catch (logError) {
      console.error('Failed to write error to log file:', logError);
    }
  }
}

// Mock logging service
const mockLoggingService = {
  error(message, error, context, data) {
    console.log(`[LOG] ${message}`, { context, data, error: error?.message });
  }
};

const errorHandler = new MockGlobalErrorHandler(mockLoggingService);

// Simulate different types of errors
console.log('🧪 Generating sample errors for errors.log...\n');

// Error 1: Angular compilation error (like the NG1010 you mentioned)
const angularError = {
  message: "NG1010: 'imports' must be an array of components, directives, pipes, or NgModules. Value could not be determined statically.",
  stack: `Error: NG1010: 'imports' must be an array of components, directives, pipes, or NgModules. Value could not be determined statically.
    at checkStandaloneComponentImports (compiler.js:1234)
    at validateComponent (compiler.js:5678)
    at compileComponent (compiler.js:9012)
    at Object.compile (main.ts:3456)
    at startup (main.ts:78)`,
  rejection: new Error("Value could not be determined statically")
};

console.log('1. Simulating Angular NG1010 error...');
errorHandler.handleError(angularError);

console.log('\n2. Simulating JavaScript runtime error...');
const jsError = new Error('Cannot read property \'map\' of undefined');
jsError.stack = `Error: Cannot read property 'map' of undefined
    at DashboardComponent.ngOnInit (dashboard.component.ts:45:12)
    at checkAndUpdateView (core.js:12345)
    at callWithDebugContext (core.js:67890)
    at Object.debugCheckAndUpdateView [as checkAndUpdateView] (core.js:11111)
    at ViewRef_.detectChanges (core.js:22222)
    at ApplicationRef.tick (core.js:33333)
    at startup (main.ts:89)`;
errorHandler.handleError(jsError);

console.log('\n3. Simulating promise rejection...');
const promiseError = {
  rejection: new Error('Network request failed'),
  promise: Promise.reject(new Error('Network request failed'))
};
errorHandler.handleError(promiseError);

// Generate the errors.log file
console.log('\n📄 Generating errors.log file...');

const fs = require('fs');
const path = require('path');
const errorLogs = localStorage.getItem('error_logs') || '';

if (errorLogs) {
  const errorsLogPath = path.join(__dirname, 'errors.log');
  fs.writeFileSync(errorsLogPath, errorLogs, 'utf8');
  console.log(`✅ errors.log file created at: ${errorsLogPath}`);
  console.log(`📊 File contains ${errorLogs.split('---').length - 1} error entries`);
} else {
  console.log('❌ No error logs found in localStorage');
}

// Display the contents
console.log('\n📋 errors.log contents:');
console.log('='.repeat(80));
console.log(errorLogs);
console.log('='.repeat(80));