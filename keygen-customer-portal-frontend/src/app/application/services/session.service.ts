/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-21T00:00:00
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth';
import { LoggingService } from '../../core/services/logging';

@Injectable({
  providedIn: 'root',
})
export class SessionService implements OnDestroy {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if token expires in less than 10 minutes (access tokens are shorter)

  private checkSubscription?: Subscription;
  private authService = inject(AuthService);
  private loggingService = inject(LoggingService);

  private sessionStatus$ = new BehaviorSubject<SessionStatus>({
    isActive: false,
    timeUntilExpiry: null,
    lastRefresh: null,
  });

  get sessionStatus() {
    return this.sessionStatus$.asObservable();
  }

  constructor() {
    console.log('[Session] SessionService constructor called, starting session monitoring');
    this.startSessionMonitoring();
  }

  ngOnDestroy(): void {
    this.stopSessionMonitoring();
  }

  private startSessionMonitoring(): void {
    console.log('[Session] Starting session monitoring with interval:', this.CHECK_INTERVAL, 'ms');
    this.loggingService.logAuthEvent('session_monitoring_started');

    // Check immediately and then every 5 minutes
    console.log('[Session] Performing initial session check');
    this.checkSession();

    console.log('[Session] Setting up periodic session monitoring');
    this.checkSubscription = interval(this.CHECK_INTERVAL)
      .pipe(switchMap(() => this.checkAndRefreshSession()))
      .subscribe();
  }

  private stopSessionMonitoring(): void {
    console.log('[Session] Stopping session monitoring');
    if (this.checkSubscription) {
      console.log('[Session] Unsubscribing from session check interval');
      this.checkSubscription.unsubscribe();
      this.checkSubscription = undefined;
    }
    this.loggingService.logAuthEvent('session_monitoring_stopped');
    console.log('[Session] Session monitoring stopped');
  }

  private async checkSession(): Promise<void> {
    console.log('[Session] checkSession() called');
    const token = this.getToken();
    console.log('[Session] Token present:', !!token, token ? 'token exists' : 'no token');

    if (!token) {
      console.log('[Session] No token found, setting session as inactive');
      this.updateSessionStatus({
        isActive: false,
        timeUntilExpiry: null,
        lastRefresh: null,
      });
      return;
    }

    try {
      console.log('[Session] Attempting to decode token');
      const payload = this.decodeToken(token);
      console.log('[Session] Token decoded:', !!payload);

      if (!payload) {
        console.log('[Session] Failed to decode token, setting session as inactive');
        this.updateSessionStatus({
          isActive: false,
          timeUntilExpiry: null,
          lastRefresh: null,
        });
        return;
      }

      const now = Date.now();
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = expiryTime - now;

      console.log('[Session] Token expiry calculation:', {
        now: new Date(now).toISOString(),
        expiryTime: new Date(expiryTime).toISOString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60), // minutes
        isActive: timeUntilExpiry > 0,
      });

      this.updateSessionStatus({
        isActive: timeUntilExpiry > 0,
        timeUntilExpiry: Math.max(0, timeUntilExpiry),
        lastRefresh: this.getLastRefreshTime(),
      });

      // If token is expired, logout
      if (timeUntilExpiry <= 0) {
        console.log('[Session] Token is expired, initiating logout');
        this.loggingService.logAuthEvent('token_expired_during_check');
        await this.authService.logout();
      }
    } catch (error) {
      console.log('[Session] Error checking session:', error);
      this.loggingService.error('Error checking session', error as Error, 'session');
      this.updateSessionStatus({
        isActive: false,
        timeUntilExpiry: null,
        lastRefresh: null,
      });
    }
  }

  private async checkAndRefreshSession(): Promise<void> {
    console.log('[Session] checkAndRefreshSession() called (periodic check)');
    const token = this.getToken();
    if (!token) {
      console.log('[Session] No token for periodic refresh check');
      return;
    }

    try {
      const payload = this.decodeToken(token);
      if (!payload) {
        console.log('[Session] Failed to decode token for periodic check');
        return;
      }

      const now = Date.now();
      const expiryTime = payload.exp * 1000;
      const timeUntilExpiry = expiryTime - now;

      console.log(
        '[Session] Periodic check - time until expiry:',
        Math.round(timeUntilExpiry / 1000 / 60),
        'minutes'
      );

      // Refresh if token expires in less than threshold
      if (timeUntilExpiry < this.REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        console.log('[Session] Token expires soon, initiating refresh');
        this.loggingService.logAuthEvent('token_refresh_initiated');
        await this.refreshToken();
      } else {
        console.log('[Session] Token still valid, no refresh needed');
      }
    } catch (error) {
      console.log('[Session] Error during session refresh check:', error);
      this.loggingService.error('Error during session refresh check', error as Error, 'session');
    }
  }

  private async refreshToken(): Promise<void> {
    console.log('[Session] refreshToken() called');
    try {
      // Use AuthService's refresh method which handles V2 API
      console.log('[Session] Calling AuthService.refreshToken()');
      await this.authService.refreshToken();
      localStorage.setItem('last_token_refresh', Date.now().toString());

      console.log('[Session] Token refresh successful, updating last refresh time');
      this.loggingService.logAuthEvent('token_refresh_success_v2');

      // Update session status
      console.log('[Session] Updating session status after refresh');
      this.checkSession();
    } catch (error) {
      console.log('[Session] Token refresh failed:', error);
      this.loggingService.error('Token refresh failed', error as Error, 'session');

      // If refresh fails, logout user
      console.log('[Session] Logging out user due to refresh failure');
      await this.authService.logout();
    }
  }

  private decodeToken(token: string): any {
    try {
      console.log('[Session] Decoding JWT token');
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      console.log('[Session] Token decoded successfully, exp:', decoded.exp);
      return decoded;
    } catch (error) {
      console.log('[Session] Failed to decode token:', error);
      return null;
    }
  }

  private getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private getLastRefreshTime(): number | null {
    const time = localStorage.getItem('last_token_refresh');
    return time ? parseInt(time, 10) : null;
  }

  private getApiUrl(): string {
    // Hardcoded for now - in a real app, inject environment or use injection token
    return 'http://localhost:3000';
  }

  private updateSessionStatus(status: SessionStatus): void {
    console.log('[Session] Updating session status:', {
      isActive: status.isActive,
      timeUntilExpiry: status.timeUntilExpiry
        ? Math.round(status.timeUntilExpiry / 1000 / 60) + ' minutes'
        : null,
      lastRefresh: status.lastRefresh ? new Date(status.lastRefresh).toISOString() : null,
    });
    this.sessionStatus$.next(status);
  }

  // Public method to manually refresh session
  async manualRefresh(): Promise<void> {
    console.log('[Session] manualRefresh() called - manual token refresh requested');
    await this.refreshToken();
    console.log('[Session] Manual refresh completed');
  }
}

interface SessionStatus {
  isActive: boolean;
  timeUntilExpiry: number | null;
  lastRefresh: number | null;
}
