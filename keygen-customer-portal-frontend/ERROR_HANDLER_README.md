# Frontend Error Handler

This document describes the global error handling system implemented in the Keygen Customer Portal frontend.

## Overview

The frontend now includes a comprehensive global error handler that captures unhandled errors and logs them to an `errors.log` file format similar to the backend logging system.

## Features

- **Global Error Catching**: Captures all unhandled JavaScript errors, promise rejections, and Angular errors
- **Structured Logging**: Logs errors with timestamps, error IDs, stack traces, URLs, and user agents
- **File Logging**: Saves error logs to browser storage (localStorage) with download capability
- **Integration**: Works with the existing LoggingService for consistent logging across the application
- **Development Support**: Includes global `downloadErrorLogs()` function for easy debugging

## Implementation

### GlobalErrorHandler Service

Located at: `src/app/core/services/error-handler.ts`

The `GlobalErrorHandler` implements Angular's `ErrorHandler` interface and:

1. Extracts comprehensive error information (message, stack, URL, user agent, timestamp, unique error ID)
2. Logs errors through the existing LoggingService
3. Formats error logs in a structured format similar to backend logs
4. Saves logs to localStorage for persistence
5. Provides download functionality for error logs

### Error Log Format

Errors are logged in the following format:

```
[2025-12-22T00:57:10.563Z] ERROR [global-error-handler]
Error ID: err_1766365030564_tnsh0zelx
Message: This is a test error
URL: http://localhost:4200
User Agent: Node.js/22
Stack Trace:
Error: This is a test error
    at Object.<anonymous> (/Users/password9090/lserv/keygen-customer-portal/keygen-customer-portal-frontend/test-error-handler.js:112:20)
    ...
---
```

### Configuration

The error handler is configured in `src/app/app.config.ts`:

```typescript
{
  provide: ErrorHandler,
  useClass: GlobalErrorHandler,
}
```

## Usage

### Automatic Error Handling

The error handler automatically captures:
- JavaScript runtime errors
- Unhandled promise rejections
- Angular component errors
- Template binding errors

### Manual Error Download

In the browser console (development), you can download accumulated error logs:

```javascript
downloadErrorLogs();
```

This function is globally available and will:
1. Create a downloadable `errors.log` file
2. Include all errors logged since the last download/clear

### Testing

A test script is available at `test-error-handler.js` to verify functionality:

```bash
node test-error-handler.js
```

This demonstrates how the error handler processes different types of errors.

## Browser Compatibility

- **Modern Browsers**: Uses File System Access API when available for direct file saving
- **Fallback**: Uses localStorage + blob download for older browsers
- **Node.js**: Compatible with server-side testing

## Error Types Handled

1. **Standard Errors**: `new Error('message')`
2. **String Errors**: `'error message'`
3. **Angular Errors**: Objects with `rejection` property (promise rejections)
4. **Complex Objects**: Any object with `message` property

## Integration with Existing Systems

- **LoggingService**: Errors are also logged through the existing logging service
- **Sentry**: Works alongside MicroSentry for error reporting
- **Console**: Errors are still logged to browser console for development

## Development Notes

- Errors are re-thrown in development mode for debugging
- Production mode suppresses error re-throwing to prevent app crashes
- Error logs persist in localStorage until manually cleared

## Future Enhancements

- Server-side error log upload
- Error analytics and reporting
- Error categorization and filtering
- Performance impact monitoring