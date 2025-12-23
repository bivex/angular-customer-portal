/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { AuthService, AuthState, User } from '@/app/application/services/auth';
import { environment } from '../../environments/environment';
import { of, Observable } from 'rxjs';

// Mock HttpClient interface for testing
interface MockHttpClient {
  post: jest.MockedFunction<(url: string, body: unknown) => Observable<unknown>>;
  get: jest.MockedFunction<(url: string) => Observable<unknown>>;
}

// Mock the LoggingService
class MockLoggingService {
  log = vi.fn();
  logAuthEvent = vi.fn();
  error = vi.fn();
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  logUserAction = vi.fn();
  logApiCall = vi.fn();
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockLoggingService: MockLoggingService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  };

  const mockAuthResponse = {
    user: mockUser,
    token: 'jwt-token-123',
  };

  const mockAuthState: AuthState = {
    isAuthenticated: true,
    user: mockUser,
    isLoading: false,
  };

  // Helper function to create mock auth service
  function createMockAuthService(): AuthService {
    const mockHttpClient: MockHttpClient = {
      post: vi.fn().mockReturnValue(of(mockAuthResponse)),
      get: vi.fn().mockReturnValue(of(mockUser)),
    };

    return new AuthService(mockHttpClient as unknown as HttpClient, mockLoggingService);
  }

  beforeEach(() => {
    mockLoggingService = new MockLoggingService();

    service = createMockAuthService();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should start with correct initial state', () => {
      expect(service.isAuthenticated).toBe(false);
      expect(service.user).toBe(null);
      // Note: isLoading may be true during async initialization
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    it('should login successfully and update auth state', async () => {
      const loginPromise = service.login(loginCredentials);

      await loginPromise;

      expect(service.isAuthenticated).toBe(true);
      expect(service.user).toEqual(mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('login_success', '1');
    });

    it('should handle login failure with invalid credentials', async () => {
      // Create service with error mock that returns HttpErrorResponse
      const httpError = new HttpErrorResponse({
        error: { error: { message: 'Invalid email or password.' } },
        status: 401,
        statusText: 'Unauthorized',
      });

      const errorHttpClient = {
        post: vi.fn().mockReturnValue(
          new Observable((subscriber) => {
            subscriber.error(httpError);
          })
        ),
        get: vi.fn(),
      };
      const errorService = new AuthService(
        errorHttpClient as unknown as HttpClient,
        mockLoggingService
      );

      let thrownError: unknown;
      try {
        await errorService.login(loginCredentials);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.message).toBe('Invalid email or password.');
      expect(errorService.isAuthenticated).toBe(false);
      expect(errorService.user).toBe(null);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should handle network error during login', async () => {
      // Create service with network error mock
      const networkErrorHttpClient = {
        post: vi.fn().mockReturnValue(
          new Observable((subscriber) => {
            subscriber.error({
              status: 0,
              statusText: 'Unknown Error',
            });
          })
        ),
        get: vi.fn(),
      };
      const networkErrorService = new AuthService(
        networkErrorHttpClient as unknown as HttpClient,
        mockLoggingService
      );

      let thrownError: unknown;
      try {
        await networkErrorService.login(loginCredentials);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.message).toBe('Authentication failed (0).');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerData = {
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should register successfully and update auth state', async () => {
      const registerPromise = service.register(
        registerData.name,
        registerData.email,
        registerData.password
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);

      req.flush(mockAuthResponse);

      await registerPromise;

      expect(service.isAuthenticated).toBe(true);
      expect(service.user).toEqual(mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('register_success', '1');
    });

    it('should handle registration failure', async () => {
      const errorResponse = {
        error: {
          message: 'User with this email already exists',
        },
      };

      let thrownError: unknown;
      try {
        const registerPromise = service.register(
          registerData.name,
          registerData.email,
          registerData.password
        );
        const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
        req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
        await registerPromise;
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.message).toBe('User with this email already exists');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const result = service.getCurrentUser();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      expect(req.request.method).toBe('GET');

      req.flush(mockUser);

      const user = await result;
      expect(user).toEqual(mockUser);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('get_current_user_success', '1');
    });

    it('should handle getCurrentUser failure', async () => {
      let thrownError: unknown;
      try {
        const result = service.getCurrentUser();
        const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
        req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
        await result;
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.message).toBe('Access denied.');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      service.setTestAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });
    });

    it('should logout successfully and clear auth state', async () => {
      // Set initial authenticated state
      service.setTestAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });

      // Mock token in localStorage
      localStorage.getItem = vi.fn().mockReturnValue('jwt-token-123');

      const logoutPromise = service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token-123');

      req.flush({ message: 'Logged out successfully' });

      await logoutPromise;

      expect(service.isAuthenticated).toBe(false);
      expect(service.user).toBe(null);
      expect(service.isLoading).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('logout_attempt', '1');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('logout_success', '1');
    });

    it('should handle logout failure gracefully', async () => {
      // Set initial authenticated state
      service.setTestAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });

      // Mock token in localStorage
      localStorage.getItem = vi.fn().mockReturnValue('jwt-token-123');

      const logoutPromise = service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token-123');

      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      await logoutPromise;

      // Should still clear local state even if server call fails
      expect(service.isAuthenticated).toBe(false);
      expect(service.user).toBe(null);
      expect(service.isLoading).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('logout_attempt', '1');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    it('should handle logout when user is null', async () => {
      // Reset auth state to have null user
      service.setTestAuthState({
        isAuthenticated: true,
        user: null,
        isLoading: false,
      });

      // Mock token in localStorage
      localStorage.getItem = vi.fn().mockReturnValue('jwt-token-123');

      const logoutPromise = service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ message: 'Logged out successfully' });

      await logoutPromise;

      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('logout_attempt', undefined);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('logout_success', undefined);
    });

    it('should handle logout when no token in localStorage', async () => {
      // Mock no token in localStorage
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const logoutPromise = service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.headers.get('Authorization')).toBeNull();

      req.flush({ message: 'Logged out successfully' });

      await logoutPromise;

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle network error during logout', async () => {
      // Set initial authenticated state
      service.setTestAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });

      // Mock token in localStorage
      localStorage.getItem = vi.fn().mockReturnValue('jwt-token-123');

      const logoutPromise = service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.error(new ErrorEvent('network error'));

      await logoutPromise;

      // Should still clear local state even if network fails
      expect(service.isAuthenticated).toBe(false);
      expect(service.user).toBe(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLoggingService.error).toHaveBeenCalled();
    });

    // Auth state changes are tested in other logout tests
  });

  describe('token management', () => {
    it('should get token from localStorage', () => {
      localStorage.getItem = vi.fn().mockReturnValue('stored-token');

      const token = service.getToken();

      expect(token).toBe('stored-token');
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when no token in localStorage', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const token = service.getToken();

      expect(token).toBe(null);
    });

    it('should return auth headers with token', () => {
      localStorage.getItem = vi.fn().mockReturnValue('test-token');

      const headers = service.getAuthHeaders();

      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should return empty headers when no token', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const headers = service.getAuthHeaders();

      expect(headers.get('Authorization')).toBe(null);
    });
  });

  describe('auth state management', () => {
    it('should emit auth state changes', async () => {
      // Create a fresh service instance that hasn't been initialized
      const freshService = new AuthService(TestBed.inject(HttpClient), mockLoggingService);

      const states: AuthState[] = [];

      freshService.authState.subscribe((state) => {
        states.push(state);
      });

      // Initialize and then change state
      await freshService.initialize();
      freshService.setTestAuthState(mockAuthState);

      // Wait for state emission
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(states.length).toBeGreaterThanOrEqual(3);
      expect(states[0].isLoading).toBe(true); // Initial loading state
      expect(states[1].isLoading).toBe(false); // After initialization
      expect(states[2]).toEqual(mockAuthState); // Updated state
    });

    it('should update isAuthenticated getter', () => {
      service.setTestAuthState({ isAuthenticated: true, user: mockUser, isLoading: false });
      expect(service.isAuthenticated).toBe(true);

      service.setTestAuthState({ isAuthenticated: false, user: null, isLoading: false });
      expect(service.isAuthenticated).toBe(false);
    });

    it('should update user getter', () => {
      service.setTestAuthState({ isAuthenticated: true, user: mockUser, isLoading: false });
      expect(service.user).toEqual(mockUser);

      service.setTestAuthState({ isAuthenticated: false, user: null, isLoading: false });
      expect(service.user).toBe(null);
    });

    it('should detect re-authentication requirement from error responses', () => {
      // Test requiresReauth flag
      const errorWithFlag = new HttpErrorResponse({
        error: { message: 'Some error', requiresReauth: true },
        status: 401,
        statusText: 'Unauthorized',
      });

      // Access private method through type assertion
      const isReauthRequired = (service as any).isReauthRequired.bind(service);
      expect(isReauthRequired(errorWithFlag)).toBe(true);

      // Test error message detection
      const errorWithMessage = new HttpErrorResponse({
        error: { message: 'Session expired. Please re-authenticate.' },
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(isReauthRequired(errorWithMessage)).toBe(true);

      // Test signing key error
      const errorWithKeyMessage = new HttpErrorResponse({
        error: {
          message:
            'Refresh token verification failed: signing key not found. Please re-authenticate.',
        },
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(isReauthRequired(errorWithKeyMessage)).toBe(true);

      // Test regular error (should not require reauth)
      const regularError = new HttpErrorResponse({
        error: { message: 'Invalid email or password.' },
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(isReauthRequired(regularError)).toBe(false);
    });

    it('should clear all stored data when re-authentication is required', async () => {
      // Set up some stored data
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem('session_id', 'test-session');
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('last_token_refresh', '1234567890');

      // Access private method through type assertion
      const clearAllStoredData = (service as any).clearAllStoredData.bind(service);
      clearAllStoredData();

      // Check that all data was cleared
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
      expect(localStorage.getItem('session_id')).toBe(null);
      expect(localStorage.getItem('remember_me')).toBe(null);
      expect(localStorage.getItem('last_token_refresh')).toBe(null);
    });

    it('should handle re-authentication requirement during token refresh', async () => {
      const refreshError = new HttpErrorResponse({
        error: { message: 'Session expired. Please re-authenticate.', requiresReauth: true },
        status: 401,
        statusText: 'Unauthorized',
      });

      // Mock the HTTP client to return the refresh error
      const mockHttpClient = {
        post: vi.fn().mockReturnValue(of({ throwError: () => refreshError })),
      };

      // Replace the http client temporarily
      const originalHttp = (service as any).http;
      (service as any).http = mockHttpClient;

      // Set up some initial auth state
      service.setTestAuthState({ isAuthenticated: true, user: mockUser, isLoading: false });

      // Store some tokens
      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh-token');

      // Attempt refresh - should clear tokens and throw reauth error
      await expect(service.refreshToken()).rejects.toThrow(
        'Session expired. Please re-authenticate.'
      );

      // Verify tokens were cleared
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);

      // Verify auth state was reset
      expect(service.isAuthenticated).toBe(false);
      expect(service.user).toBe(null);

      // Restore original http client
      (service as any).http = originalHttp;
    });

    it('should update isLoading getter', () => {
      service.setTestAuthState({ isAuthenticated: false, user: null, isLoading: true });
      expect(service.isLoading).toBe(true);

      service.setTestAuthState({ isAuthenticated: false, user: null, isLoading: false });
      expect(service.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    // HttpErrorResponse handling is tested indirectly through login/register tests

    it('should handle network errors', () => {
      const networkError = {
        name: 'HttpErrorResponse',
        message: 'Http failure response for /api/auth/login: 0 Unknown Error',
      };

      const errorMessage = service['handleAuthError'](networkError);

      expect(errorMessage).toBe('Unable to connect to the server. Please check your connection.');
    });

    it('should handle unknown errors', () => {
      const unknownError = {
        message: 'Something went wrong',
      };

      const errorMessage = service['handleAuthError'](unknownError);

      expect(errorMessage).toBe('Something went wrong');
    });
  });
});
