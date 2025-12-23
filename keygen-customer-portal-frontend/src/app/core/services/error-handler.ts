/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T12:00:00
 * Last Updated: 2025-12-22T01:48:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoggingService } from './logging';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly http = inject(HttpClient);

  constructor(private loggingService: LoggingService) {}

  handleError(error: any): void {
    // Extract error information
    const errorInfo = this.extractErrorInfo(error);

    // Log to console and logging service
    console.error('Global Error Handler:', errorInfo);

    // Log structured error to logging service
    this.loggingService.error(
      `Unhandled Error: ${errorInfo.message}`,
      errorInfo.originalError instanceof Error
        ? errorInfo.originalError
        : new Error(errorInfo.message),
      'global-error-handler',
      {
        stack: errorInfo.stack,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
        timestamp: errorInfo.timestamp,
        errorId: errorInfo.errorId,
      }
    );

    // Write to errors.log file
    this.writeToErrorsLog(errorInfo);

    // Re-throw the error in development
    if (!this.isProduction()) {
      throw error;
    }
  }

  private extractErrorInfo(error: any): {
    message: string;
    stack: string;
    url: string;
    userAgent: string;
    timestamp: string;
    errorId: string;
    originalError: any;
  } {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();

    let message = 'Unknown error';
    let stack = '';
    let originalError = error;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    } else if (error && typeof error === 'object') {
      // Handle Angular error objects
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
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp,
      errorId,
      originalError,
    };
  }

  private writeToErrorsLog(errorInfo: any): void {
    try {
      // Send error to backend API for centralized logging
      const errorPayload = {
        errorId: errorInfo.errorId,
        message: errorInfo.message,
        stack: errorInfo.stack,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
        timestamp: errorInfo.timestamp,
        sessionId: this.getSessionId(),
        userId: this.getUserId(),
      };

      // Send to backend error logging endpoint
      this.http.post(`${environment.apiUrl}/errors`, errorPayload).subscribe({
        next: (response) => {
          console.log('✅ Error logged to backend:', response);
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Failed to send error to backend:', error);
          // Fallback: store in localStorage for later retry
          this.storeErrorLocally(errorPayload);
        },
      });
    } catch (logError) {
      console.error('Failed to send error to backend:', logError);
      // Fallback: store locally
      this.storeErrorLocally(errorInfo);
    }
  }

  private storeErrorLocally(errorInfo: any): void {
    try {
      // Fallback: store in localStorage for debugging when backend is unavailable
      const errorKey = `error_${errorInfo.errorId}`;
      localStorage.setItem(errorKey, JSON.stringify(errorInfo));
      console.log('Error stored locally for later retry:', errorInfo.errorId);
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  private getSessionId(): string | undefined {
    try {
      // Try to get session ID from localStorage or sessionStorage
      return localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId') || undefined;
    } catch {
      return undefined;
    }
  }

  private getUserId(): string | undefined {
    try {
      // Try to get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id?.toString() || user?.userId?.toString();
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  }
}

// Helper function to retry sending locally stored errors to backend
export function retryLocalErrors(): void {
  try {
    const http = inject(HttpClient);
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('error_'));

    if (keys.length === 0) {
      console.log('No local errors to retry');
      return;
    }

    console.log(`Retrying ${keys.length} locally stored errors...`);

    keys.forEach((key) => {
      try {
        const errorData = JSON.parse(localStorage.getItem(key)!);
        http.post(`${environment.apiUrl}/errors`, errorData).subscribe({
          next: () => {
            localStorage.removeItem(key);
            console.log(`✅ Retried error ${errorData.errorId} successfully`);
          },
          error: (error) => {
            console.error(`❌ Failed to retry error ${errorData.errorId}:`, error);
          },
        });
      } catch (error) {
        console.error(`Failed to parse local error ${key}:`, error);
        localStorage.removeItem(key); // Remove corrupted data
      }
    });
  } catch (error) {
    console.error('Failed to retry local errors:', error);
  }
}

// Make retryLocalErrors available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).retryLocalErrors = retryLocalErrors;
}
