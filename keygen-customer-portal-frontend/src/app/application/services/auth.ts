/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:03
 * Last Updated: 2025-12-22T04:57:29
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggingService } from '../../core/services/logging';

export interface User {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  securityLevel?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterV2Request extends RegisterRequest {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface RegisterV2Response {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// V2 API interfaces for enterprise-hardened backend
export interface LoginV2Request extends LoginRequest {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface LoginV2Response {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LogoutRequest {
  sessionId?: string;
  revokeAllSessions?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  sessionsRevoked: number;
  message: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActivity: string;
  current: boolean;
  ipAddress?: string;
  userAgent?: string;
  riskScore: number;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authState$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly SESSION_ID_KEY = 'session_id';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  private initialized = false;
  private refreshInProgress: Promise<void> | null = null;

  private http = inject(HttpClient);
  private loggingService = inject(LoggingService);

  get authState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.authState$.value.isAuthenticated;
  }

  get user(): User | null {
    return this.authState$.value.user;
  }

  get isLoading(): boolean {
    return this.authState$.value.isLoading;
  }

  async initialize(): Promise<void> {
    console.log('[Auth] initialize() called, initialized:', this.initialized);
    if (!this.initialized) {
      console.log('[Auth] Starting initialization...');
      this.initialized = true;
      await this.initializeAuthState();
      console.log('[Auth] Initialization completed');
    } else {
      console.log('[Auth] Already initialized, skipping');
    }
  }

  private async ensureInitialized(): Promise<void> {
    console.log('[Auth] ensureInitialized() called, initialized:', this.initialized);
    if (!this.initialized) {
      console.log('[Auth] ensureInitialized: Starting initialization...');
      this.initialized = true;
      await this.initializeAuthState();
      console.log('[Auth] ensureInitialized: Initialization completed');
    } else {
      console.log('[Auth] ensureInitialized: Already initialized, skipping');
    }
  }

  private async initializeAuthState(): Promise<void> {
    try {
      this.loggingService.logAuthEvent('auth_initialization_started');

      // Check if there's a stored token pair
      const token = this.getToken();
      const refreshToken = this.getRefreshToken();

      if (token && refreshToken) {
        this.loggingService.logAuthEvent('token_found_on_init_v2');
        // Set initial state as authenticated
        // User data will be loaded by components as needed (e.g., SessionsComponent)
        // This prevents race conditions and avoids calling /auth/me which doesn't support V2 tokens
        this.setAuthState({ isAuthenticated: true, user: null, isLoading: false });
      } else {
        this.loggingService.logAuthEvent('no_token_found_on_init_v2');
        this.setAuthState({ isAuthenticated: false, user: null, isLoading: false });
      }
    } finally {
      this.initialized = true;
      this.loggingService.logAuthEvent('auth_initialization_completed');
    }
  }

  private handleAuthError(error: unknown): string {
    console.log('[Auth] handleAuthError called with error:', error);
    if (error instanceof HttpErrorResponse) {
      console.log('[Auth] Handling HttpErrorResponse:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
      });
      // Handle HTTP error responses
      if (error.error && error.error.error && error.error.error.message) {
        return error.error.error.message;
      }

      // Check for custom error messages from the backend
      if (error.error && error.error.message) {
        // If it's a session expiry or key-related error, return the message as-is
        if (
          error.error.message.includes('Session expired') ||
          error.error.message.includes('signing key not found') ||
          error.error.message.includes('re-authenticate') ||
          error.error.message.includes('invalid algorithm')
        ) {
          return error.error.message;
        }
        return error.error.message;
      }

      // Handle common HTTP status codes
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Invalid email or password.';
        case 403:
          return 'Access denied.';
        case 404:
          return 'Service not found.';
        case 422:
          return 'Validation failed. Please check your input.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Authentication failed (${error.status}).`;
      }
    }

    // Handle other errors with proper type checking
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { message: string; name?: string };
      // Handle network errors
      if (
        errorObj.name === 'HttpErrorResponse' &&
        errorObj.message.includes('Http failure response')
      ) {
        return 'Unable to connect to the server. Please check your connection.';
      }
      // Handle other errors
      const finalMessage = errorObj.message || 'An unexpected error occurred.';
      console.log('[Auth] Returning error message:', finalMessage);
      return finalMessage;
    }

    console.log('[Auth] Returning generic error message for unknown error type');
    return 'An unexpected error occurred.';
  }

  async login(credentials: LoginRequest): Promise<void> {
    console.log('[Auth] login() called with credentials:', {
      email: credentials.email,
      rememberMe: credentials.rememberMe,
      hasPassword: !!credentials.password,
    });
    this.loggingService.logAuthEvent('login_attempt');

    try {
      // Use V2 API for enterprise-hardened authentication
      console.log('[Auth] Preparing V2 login credentials...');
      const v2Credentials: LoginV2Request = {
        ...credentials,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        deviceFingerprint: this.getDeviceFingerprint(),
      };
      console.log(
        '[Auth] V2 credentials prepared, making API call to:',
        `${environment.apiUrl}/auth/v2/login`
      );

      const response = await lastValueFrom(
        this.http.post<LoginV2Response>(`${environment.apiUrl}/auth/v2/login`, v2Credentials, {
          headers: this.getDefaultHeaders(),
        })
      );
      console.log('[Auth] Login API response received:', {
        hasUser: !!response.user,
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        hasSessionId: !!response.sessionId,
        userId: response.user?.id,
      });

      if (response) {
        // Store token pair and session info
        console.log('[Auth] Storing tokens after login:', {
          accessToken: response.accessToken
            ? response.accessToken.substring(0, 50) + '...'
            : 'null',
          refreshToken: response.refreshToken
            ? response.refreshToken.substring(0, 50) + '...'
            : 'null',
          sessionId: response.sessionId,
        });

        // Validate tokens before storing
        if (!response.accessToken || response.accessToken === 'undefined') {
          throw new Error('Invalid access token received from server');
        }
        if (!response.refreshToken || response.refreshToken === 'undefined') {
          throw new Error('Invalid refresh token received from server');
        }

        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(this.SESSION_ID_KEY, response.sessionId);
        localStorage.setItem(this.REMEMBER_ME_KEY, credentials.rememberMe ? 'true' : 'false');

        // Update auth state
        console.log('[Auth] Updating auth state after successful login');
        this.setAuthState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
        });

        this.loggingService.logAuthEvent('login_success_v2', response.user.id.toString());
        console.log('[Auth] Login completed successfully');
      }
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Login failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    console.log('[Auth] register() called with:', { name, email, hasPassword: !!password });
    this.loggingService.logAuthEvent('register_attempt');

    try {
      // Use V2 API for enterprise-hardened registration
      console.log('[Auth] Preparing V2 registration credentials...');
      const v2Credentials: RegisterV2Request = {
        name,
        email,
        password,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        deviceFingerprint: this.getDeviceFingerprint(),
      };
      console.log(
        '[Auth] V2 registration credentials prepared, making API call to:',
        `${environment.apiUrl}/auth/register`
      );

      const response = await lastValueFrom(
        this.http.post<RegisterV2Response>(`${environment.apiUrl}/auth/register`, v2Credentials, {
          headers: this.getDefaultHeaders(),
        })
      );
      console.log('[Auth] Registration API response received:', {
        hasUser: !!response.user,
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        hasSessionId: !!response.sessionId,
        userId: response.user?.id,
      });

      if (response) {
        // Store token pair and session info
        console.log('[Auth] Storing registration tokens');
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(this.SESSION_ID_KEY, response.sessionId);

        console.log('[Auth] Updating auth state after successful registration');
        this.setAuthState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
        });

        this.loggingService.logAuthEvent('register_success', response.user.id.toString());
        console.log('[Auth] Registration completed successfully');
      }
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Registration failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<void> {
    this.loggingService.logAuthEvent('update_profile_attempt');

    try {
      const response = await lastValueFrom(
        this.http.put<User>(`${environment.apiUrl}/auth/me`, profileData, {
          headers: this.getAuthHeaders(),
        })
      );

      if (response) {
        // Update user data in auth state
        this.setAuthState({
          isAuthenticated: true,
          user: response,
          isLoading: false,
        });

        this.loggingService.logAuthEvent('update_profile_success', response.id.toString());
      }
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Update profile failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    this.loggingService.logAuthEvent('change_password_attempt');

    try {
      await lastValueFrom(
        this.http.post(`${environment.apiUrl}/auth/change-password`, passwordData, {
          headers: this.getAuthHeaders(),
        })
      );

      this.loggingService.logAuthEvent('change_password_success', this.user?.id?.toString());
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Change password failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  async getCurrentUser(): Promise<User> {
    console.log('[Auth] getCurrentUser() called');
    try {
      console.log('[Auth] Making API call to get current user...');
      const response = await lastValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/me`, {
          headers: this.getAuthHeaders(),
        })
      );
      console.log('[Auth] getCurrentUser API response received:', {
        hasResponse: !!response,
        userId: response?.id,
        userEmail: response?.email,
        userName: response?.name,
      });

      if (!response) {
        console.error('[Auth] No response from getCurrentUser API');
        throw new Error('No response from server');
      }

      this.loggingService.logAuthEvent('get_current_user_success', response.id.toString());
      console.log('[Auth] getCurrentUser completed successfully');
      return response;
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Get current user failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  async logout(sessionId?: string, revokeAllSessions?: boolean): Promise<void> {
    console.log('[Auth] logout() called with:', {
      sessionId,
      revokeAllSessions,
      currentUserId: this.user?.id,
    });
    this.loggingService.logAuthEvent('logout_attempt_v2', this.user?.id?.toString());

    try {
      const logoutRequest: LogoutRequest = {};
      if (sessionId) logoutRequest.sessionId = sessionId;
      if (revokeAllSessions) logoutRequest.revokeAllSessions = revokeAllSessions;

      console.log('[Auth] Logout request:', logoutRequest);

      // Call V2 logout endpoint
      const response = await lastValueFrom(
        this.http.post<LogoutResponse>(`${environment.apiUrl}/auth/v2/logout`, logoutRequest, {
          headers: this.getAuthHeaders(),
        })
      );

      console.log('[Auth] Logout response:', response);
      this.loggingService.logAuthEvent('logout_success_v2', this.user?.id?.toString(), true);
    } catch (error) {
      // Check if logout failed due to authentication issues
      const requiresReauth = this.isReauthRequired(error);

      if (requiresReauth) {
        this.loggingService.logAuthEvent('logout_failed_reauth_required');
      }

      // Even if backend call fails, we still want to logout locally
      this.loggingService.error(
        'Backend logout failed, proceeding with local logout',
        error as Error,
        'auth'
      );
    }

    // Clear stored tokens and session info
    console.log('[Auth] Clearing stored tokens and session info');
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);

    // Reset auth state
    console.log('[Auth] Resetting auth state to logged out');
    this.setAuthState({ isAuthenticated: false, user: null, isLoading: false });
    console.log('[Auth] Logout process completed');
  }

  async refreshToken(): Promise<void> {
    console.log('[Auth] refreshToken() called');
    // If refresh is already in progress, wait for it to complete
    if (this.refreshInProgress) {
      console.log('[Auth] Refresh already in progress, waiting...');
      this.loggingService.logAuthEvent('token_refresh_waiting_for_existing');
      return this.refreshInProgress;
    }

    const refreshToken = this.getRefreshToken();
    console.log('[Auth] Checking refresh token availability:', !!refreshToken);
    if (!refreshToken) {
      console.error('[Auth] No refresh token available');
      throw new Error('No refresh token available');
    }

    // Create a new refresh promise and store it
    console.log('[Auth] Starting refresh process...');
    this.refreshInProgress = this.performRefresh(refreshToken);

    try {
      await this.refreshInProgress;
    } finally {
      this.refreshInProgress = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<void> {
    console.log('[Auth] performRefresh() called with refresh token');
    try {
      this.loggingService.logAuthEvent('token_refresh_attempt');
      console.log('[Auth] Preparing refresh request...');

      const refreshRequest: RefreshTokenRequest = {
        refreshToken,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
      };
      console.log('[Auth] Making refresh API call to:', `${environment.apiUrl}/auth/v2/refresh`);

      const response = await lastValueFrom(
        this.http.post<RefreshTokenResponse>(
          `${environment.apiUrl}/auth/v2/refresh`,
          refreshRequest,
          {
            headers: this.getDefaultHeaders(),
          }
        )
      );
      console.log('[Auth] Refresh API response received:', {
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        accessTokenExpiresAt: response.accessTokenExpiresAt,
        refreshTokenExpiresAt: response.refreshTokenExpiresAt,
      });

      // Update tokens with rotated pair
      console.log('[Auth] Storing tokens after refresh:', {
        accessToken: response.accessToken ? response.accessToken.substring(0, 50) + '...' : 'null',
        refreshToken: response.refreshToken
          ? response.refreshToken.substring(0, 50) + '...'
          : 'null',
      });

      // Validate tokens before storing
      if (!response.accessToken || response.accessToken === 'undefined') {
        throw new Error('Invalid access token received from refresh');
      }
      if (!response.refreshToken || response.refreshToken === 'undefined') {
        throw new Error('Invalid refresh token received from refresh');
      }

      localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

      this.loggingService.logAuthEvent('token_refresh_success_v2');
      console.log('[Auth] Token refresh completed successfully');
    } catch (error) {
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Token refresh failed', new Error(errorMessage), 'auth');

      // Check if the error indicates we need full re-authentication
      const requiresReauth = this.isReauthRequired(error);

      if (requiresReauth) {
        console.log('[Auth] Refresh failed - reauthentication required, clearing all data');
        this.loggingService.logAuthEvent('token_refresh_requires_reauth');
        // Clear all tokens and session data immediately
        this.clearAllStoredData();
        // Reset auth state
        this.setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        throw new Error('Session expired. Please re-authenticate.');
      }

      // If refresh fails, logout
      await this.logout();
      throw new Error(errorMessage);
    }
  }

  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      console.log('[Auth] getActiveSessions called, checking token...');
      const token = this.getToken();
      console.log(
        '[Auth] Token present:',
        !!token,
        token ? token.substring(0, 50) + '...' : 'none'
      );
      const headers = this.getAuthHeaders();
      console.log(
        '[Auth] Headers:',
        headers.keys().map((k) => `${k}: ${k === 'authorization' ? '[HIDDEN]' : headers.get(k)}`)
      );

      const response = await lastValueFrom(
        this.http.get<SessionsResponse>(`${environment.apiUrl}/auth/v2/sessions`, {
          headers: headers,
        })
      );

      console.log('[Auth] getActiveSessions response received:', response);

      if (!response) {
        // If response is null, it likely means authentication failed and interceptor didn't throw
        throw new Error('Failed to load sessions. Please try again.');
      }

      if (!response.sessions) {
        console.error(
          '[Auth] Response missing sessions property. Full response:',
          JSON.stringify(response)
        );
        throw new Error('Invalid response format: missing sessions property');
      }

      return response.sessions;
    } catch (error) {
      // Check if this is an authentication error that requires logout
      const errorMessage = error instanceof Error ? error.message : '';
      const requiresReauth =
        errorMessage.includes('invalid algorithm') ||
        errorMessage.includes('Authentication failed') ||
        errorMessage.includes('Token refresh failed') ||
        errorMessage.includes('signing key not found');

      if (requiresReauth) {
        console.log(
          '[Auth] Token validation failed due to algorithm/key mismatch, clearing session'
        );
        this.logout();
        throw new Error('Your session has expired due to a security update. Please log in again.');
      }

      const handledErrorMessage = this.handleAuthError(error);
      this.loggingService.error('Get sessions failed', new Error(handledErrorMessage), 'auth');
      throw new Error(handledErrorMessage);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      console.log('[Auth] Revoking session:', sessionId);
      const response = await lastValueFrom(
        this.http.delete(`${environment.apiUrl}/auth/v2/sessions/${sessionId}`, {
          headers: this.getAuthHeaders(),
        })
      );
      console.log('[Auth] Revoke session response:', response);
      this.loggingService.logAuthEvent('session_revoked', sessionId);
    } catch (error) {
      console.log('[Auth] Revoke session error:', error);
      const errorMessage = this.handleAuthError(error);
      this.loggingService.error('Revoke session failed', new Error(errorMessage), 'auth');
      throw new Error(errorMessage);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    console.log('[Auth] getToken() called, token in localStorage:', token, 'type:', typeof token);

    // Handle corrupted tokens - if token is the string "undefined", treat as null
    if (token === 'undefined' || token === null || token === '') {
      console.log('[Auth] Token is invalid (undefined/null/empty), treating as null');
      return null;
    }

    return token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getSessionId(): string | null {
    return localStorage.getItem(this.SESSION_ID_KEY);
  }

  getDefaultHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = this.getDefaultHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Check if token is expired (this is a basic implementation - in production you might want to decode the JWT)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic check - if we can't get current user, token is likely expired
      // In production, decode JWT and check exp claim
      return false; // For now, rely on API calls to determine validity
    } catch {
      return true;
    }
  }

  // Refresh user data and validate session
  async refreshSession(): Promise<void> {
    console.log('[Auth] refreshSession() called');
    if (!this.getToken()) {
      console.error('[Auth] refreshSession: No token available');
      throw new Error('No token available');
    }

    try {
      console.log('[Auth] Setting loading state and refreshing user data...');
      this.setAuthState({ isLoading: true });
      const user = await this.getCurrentUser();
      console.log('[Auth] User data refreshed, updating auth state');
      this.setAuthState({ isAuthenticated: true, user, isLoading: false });
      this.loggingService.logAuthEvent('session_refreshed', user.id.toString());
      console.log('[Auth] Session refresh completed successfully');
    } catch (error) {
      console.error('[Auth] Session refresh failed, logging out:', error);
      // Token is invalid, logout
      this.logout();
      throw error;
    }
  }

  protected setAuthState(state: Partial<AuthState>): void {
    const currentState = this.authState$.value;
    const newState = { ...currentState, ...state };
    console.log('[Auth] Auth state changed:', {
      from: currentState,
      to: newState,
      changes: state,
    });
    this.authState$.next(newState);
  }

  // Get client IP (simplified - in production use proper IP detection)
  private getClientIP(): string {
    // This is a simplified implementation
    // In production, you might use a service to get the real client IP
    return '127.0.0.1'; // Localhost for development
  }

  // Generate device fingerprint (simplified)
  private getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const fingerprint = canvas.toDataURL();

    // Combine with basic browser info
    const info = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      fingerprint,
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < info.length; i++) {
      const char = info.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Check if error response indicates re-authentication is required
  private isReauthRequired(error: unknown): boolean {
    console.log('[Auth] isReauthRequired() checking error:', error);
    if (error instanceof HttpErrorResponse && error.error) {
      // Check for the new requiresReauth flag
      if (error.error.requiresReauth === true) {
        return true;
      }

      // Check for specific error messages in different response formats
      const errorMessage = error.error.message || (error.error.error && error.error.error.message);

      if (
        errorMessage &&
        (errorMessage.includes('signing key not found') ||
          errorMessage.includes('Session expired') ||
          errorMessage.includes('re-authenticate'))
      ) {
        console.log(
          '[Auth] isReauthRequired() found matching error message in response, returning true'
        );
        return true;
      }
    }

    // Also check if it's a regular Error object with the right message
    if (
      error instanceof Error &&
      (error.message.includes('Session expired') ||
        error.message.includes('signing key not found') ||
        error.message.includes('re-authenticate'))
    ) {
      console.log(
        '[Auth] isReauthRequired() found matching error message in Error object, returning true'
      );
      return true;
    }

    console.log('[Auth] isReauthRequired() returning false');
    return false;
  }

  // Clear all stored authentication data
  private clearAllStoredData(): void {
    console.log('[Auth] clearAllStoredData() called, clearing all auth data from localStorage');
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    localStorage.removeItem('last_token_refresh');
    console.log('[Auth] All auth data cleared from localStorage');
  }

  // Public method for testing purposes
  public setTestAuthState(state: Partial<AuthState>): void {
    this.setAuthState(state);
  }
}
