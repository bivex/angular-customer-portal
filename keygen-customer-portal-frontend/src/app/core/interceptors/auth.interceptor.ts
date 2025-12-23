/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';
import { RxJSOperationsService } from '../../infrastructure/services/rxjs-operations.service';
import { MicroSentryService } from '@micro-sentry/angular';
import { AuthService } from '../../application/services/auth';

interface HttpErrorWithContext extends Error {
  url: string;
  method: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string | null>;
  responseHeaders?: Record<string, string | null>;
  responseError: unknown;
  timestamp: string;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private microSentry = inject(MicroSentryService);
  private rxjsOps = inject(RxJSOperationsService);
  private authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('[Auth Interceptor] Intercepting request:', request.method, request.url);

    // Add authorization header if we have an access token and it's not already set
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    console.log(
      '[Auth Interceptor] Token available:',
      !!token,
      'Auth header present:',
      request.headers.has('Authorization')
    );

    if (token && !request.headers.has('Authorization')) {
      console.log('[Auth Interceptor] Adding authorization header to request');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return this.rxjsOps.catchError(next.handle(request), (error: HttpErrorResponse) => {
      console.log('[Auth Interceptor] HTTP error caught:', {
        status: error.status,
        statusText: error.statusText,
        url: request.url,
        method: request.method,
      });

      // Handle rate limit errors (429 status)
      if (error.status === 429) {
        const retryAfter = error.headers.get('Retry-After');
        const rateLimitRemaining = error.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = error.headers.get('X-RateLimit-Reset');

        console.warn('[Rate Limit] Request blocked by rate limiting', {
          url: request.url,
          retryAfter,
          remaining: rateLimitRemaining,
          reset: rateLimitReset,
        });
      }

      // If error is 401 and we have a token, try to refresh it
      // But don't attempt refresh if the error indicates re-authentication is required
      const requiresReauth = error.error && error.error.requiresReauth === true;
      console.log('[Auth Interceptor] Checking 401 error conditions:', {
        is401: error.status === 401,
        hasToken: !!token,
        isRefreshUrl: request.url.includes('/auth/v2/refresh'),
        requiresReauthFlag: requiresReauth,
      });

      if (
        error.status === 401 &&
        token &&
        !request.url.includes('/auth/v2/refresh') &&
        !requiresReauth
      ) {
        console.log('[Auth Interceptor] 401 error detected, attempting token refresh', {
          url: request.url,
          hasToken: !!token,
          requiresReauth,
        });
        return this.handle401Error(request, next);
      }

      // If re-authentication is required, logout immediately
      if (requiresReauth) {
        console.warn(
          '[Auth Interceptor] Explicit re-authentication required by backend, logging out'
        );
        this.authService.logout();
        return throwError(() => new Error('Session expired. Please re-authenticate.'));
      }

      console.error(
        '[Auth Interceptor] Unhandled HTTP error:',
        error.status,
        error.statusText,
        request.url,
        error
      );

      // Create a custom error with HTTP context for MicroSentry
      const httpError: HttpErrorWithContext = new Error(
        `HTTP ${error.status} ${error.statusText}: ${request.method} ${request.url}`
      ) as HttpErrorWithContext;
      httpError.name = 'HttpError';
      console.log('[Auth Interceptor] Preparing error for MicroSentry', httpError.message);

      // Add extra context to the error
      httpError.url = request.url;
      httpError.method = request.method;
      httpError.status = error.status;
      httpError.statusText = error.statusText;
      httpError.requestHeaders = this.extractHeaders(request.headers);
      httpError.responseHeaders = this.extractHeaders(error.headers);
      httpError.responseError = error.error;
      httpError.timestamp = new Date().toISOString();

      // Report to MicroSentry with additional context
      this.microSentry.setExtras({
        url: request.url,
        method: request.method,
        status: error.status,
        statusText: error.statusText,
        requestHeaders: this.extractHeaders(request.headers),
        responseHeaders: this.extractHeaders(error.headers),
        error: error.error,
        timestamp: new Date().toISOString(),
      });

      this.microSentry.setTags({
        interceptor: 'auth',
        http_status: error.status.toString(),
        http_method: request.method,
        url: request.url,
      });

      // Report the error
      this.microSentry.report(httpError);

      // Re-throw the error so it can be handled by the calling code
      console.log('[Auth Interceptor] Re-throwing error:', error);
      return throwError(() => error);
    });
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    console.log('[Auth Interceptor] handle401Error() called for URL:', request.url);

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      console.log(
        '[Auth Interceptor] Not refreshing, setting isRefreshing to true and emitting null to refreshTokenSubject'
      );
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          console.log('[Auth Interceptor] Token refresh result:', success);
          if (success) {
            // Retry the original request with new access token
            const newToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
            console.log(
              '[Auth Interceptor] Token refresh successful, retrying original request with new token (first attempt)'
            );
            const newRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            this.refreshTokenSubject.next(newToken);
            return next.handle(newRequest);
          } else {
            // Refresh failed, logout
            console.error('[Auth Interceptor] Token refresh failed, logging out user');
            this.authService.logout();
            this.refreshTokenSubject.next(null);
            return throwError(() => new Error('Token refresh failed'));
          }
        })
      );
    } else {
      console.log(
        '[Auth Interceptor] Refresh already in progress, waiting for refreshTokenSubject to emit a new token'
      );
      // If refresh is already in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap(() => {
          const newToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
          console.log(
            '[Auth Interceptor] Refresh completed, retrying original request with new token (subsequent attempt)'
          );
          const newRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next.handle(newRequest);
        })
      );
    }
  }

  private refreshToken(): Observable<boolean> {
    console.log('[Auth Interceptor] Starting token refresh...');
    return new Observable((observer) => {
      // Use AuthService's refresh method for V2 API
      this.authService
        .refreshToken()
        .then(() => {
          console.log('[Auth Interceptor] Token refresh successful');
          localStorage.setItem('last_token_refresh', Date.now().toString());
          observer.next(true);
          observer.complete();
        })
        .catch((error) => {
          console.log('[Auth Interceptor] Token refresh failed:', error);
          // Check if the error indicates re-authentication is required
          const errorMessage = error?.message || '';
          const requiresReauth =
            errorMessage.includes('Session expired') ||
            errorMessage.includes('signing key not found') ||
            errorMessage.includes('re-authenticate') ||
            errorMessage.includes('invalid algorithm');

          console.log(
            '[Auth Interceptor] Requires reauth:',
            requiresReauth,
            'Error:',
            errorMessage
          );

          if (requiresReauth) {
            this.authService.logout();
          }

          observer.next(false);
          observer.complete();
        });
    });
  }

  private getApiUrl(): string {
    // Hardcoded for now - in a real app, inject environment
    return 'http://localhost:3000';
  }

  private extractHeaders(headers: HttpHeaders): Record<string, string | null> {
    const headerObj: Record<string, string | null> = {};
    headers.keys().forEach((key: string) => {
      headerObj[key] = headers.get(key);
    });
    return headerObj;
  }
}
