/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:00:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { describe, it, expect, beforeEach, vi, mock } from 'bun:test';
import { jwtMiddleware } from './jwt-middleware';
import { JWTService } from '../../infrastructure/auth/jwt-service';

// Extend Elysia context types to include user property
declare module 'elysia' {
  interface Context {
    user?: import('../../infrastructure/auth/jwt-service').JWTPayload;
  }
  interface Store {
    user?: import('../../infrastructure/auth/jwt-service').JWTPayload;
  }
}

// Mock the monitoring module
vi.mock('../../shared/monitoring', () => ({
  monitoring: {
    recordBusinessEvent: vi.fn(),
    recordJwtTokenInvalid: vi.fn(),
    recordJwtTokenValidated: vi.fn(),
    recordJwtNoTokenProvided: vi.fn(),
  },
}));

// Mock Elysia
const mockElysia = vi.fn().mockImplementation(() => ({
  decorate: vi.fn().mockReturnThis(),
  onRequest: vi.fn().mockReturnThis(),
}));

vi.mock('elysia', () => ({
  Elysia: mockElysia,
}));

describe('JWTMiddleware', () => {
  let mockJwtService: JWTService;

  beforeEach(() => {
    mockJwtService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
      generateToken: vi.fn(),
      verifyToken: vi.fn(),
    } as any;

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('jwtMiddleware function', () => {
    it('should create an Elysia instance', () => {
      const middleware = jwtMiddleware(mockJwtService);

      expect(mockElysia).toHaveBeenCalled();
      expect(middleware).toBeDefined();
    });

    it('should decorate with authenticate function', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn().mockReturnThis(),
      };
      mockElysia.mockReturnValueOnce(mockElysiaInstance);

      jwtMiddleware(mockJwtService);

      expect(mockElysiaInstance.decorate).toHaveBeenCalledWith(
        'authenticate',
        expect.any(Function)
      );
    });

    it('should register onRequest handler', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn().mockReturnThis(),
      };
      mockElysia.mockReturnValueOnce(mockElysiaInstance);

      jwtMiddleware(mockJwtService);

      expect(mockElysiaInstance.onRequest).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('authenticate decorator', () => {
    it('should return user when user exists in store', async () => {
      const mockElysiaInstance = {
        decorate: vi.fn(),
        onRequest: vi.fn().mockReturnThis(),
      };

      let authenticateFunction: any;
      mockElysiaInstance.decorate.mockImplementation((name: string, fn: any) => {
        if (name === 'authenticate') {
          authenticateFunction = fn;
        }
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const mockContext = {
        store: {
          user: { userId: 1, email: 'test@example.com', name: 'Test User' },
        },
      };

      const result = await authenticateFunction(mockContext);

      expect(result).toEqual({
        user: { userId: 1, email: 'test@example.com', name: 'Test User' },
      });
    });

    it('should throw error when no user in store', async () => {
      const mockElysiaInstance = {
        decorate: vi.fn(),
        onRequest: vi.fn().mockReturnThis(),
      };

      let authenticateFunction: any;
      mockElysiaInstance.decorate.mockImplementation((name: string, fn: any) => {
        if (name === 'authenticate') {
          authenticateFunction = fn;
        }
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const mockContext = {
        store: {}, // No user in store
      };

      expect(() => authenticateFunction(mockContext)).toThrow('Authentication required');
    });
  });

  describe('onRequest handler', () => {
    it('should extract and validate valid JWT token', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const validToken = 'valid.jwt.token';
      const decodedUser = { userId: 1, email: 'test@example.com', name: 'Test User' };

      mockJwtService.verifyToken = vi.fn().mockReturnValue(decodedUser);

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(`Bearer ${validToken}`),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockContext.request.headers.get).toHaveBeenCalledWith('authorization');
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(validToken);
      expect((mockContext.store as any).user).toEqual(decodedUser);
    });

    it('should handle missing authorization header', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(null),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect((mockContext.store as any).user).toBeUndefined();
    });

    it('should handle invalid authorization header format', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue('InvalidFormat token123'),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
      expect((mockContext.store as any).user).toBeUndefined();
    });

    it('should handle invalid JWT token', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const invalidToken = 'invalid.jwt.token';
      mockJwtService.verifyToken = vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(`Bearer ${invalidToken}`),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(invalidToken);
      expect((mockContext.store as any).user).toBeUndefined();
    });

    it('should handle expired JWT token', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const expiredToken = 'expired.jwt.token';
      mockJwtService.verifyToken = vi.fn().mockImplementation(() => {
        throw new Error('Token expired');
      });

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(`Bearer ${expiredToken}`),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(expiredToken);
      expect((mockContext.store as any).user).toBeUndefined();
    });

    it('should handle empty token', () => {
      const mockElysiaInstance = {
        decorate: vi.fn().mockReturnThis(),
        onRequest: vi.fn(),
      };

      let onRequestHandler: any;
      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue('Bearer '),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      onRequestHandler(mockContext);

      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('');
      expect((mockContext.store as any).user).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const mockElysiaInstance = {
        decorate: vi.fn(),
        onRequest: vi.fn(),
      };

      let authenticateFunction: any;
      let onRequestHandler: any;

      mockElysiaInstance.decorate.mockImplementation((name: string, fn: any) => {
        if (name === 'authenticate') {
          authenticateFunction = fn;
        }
        return mockElysiaInstance;
      });

      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      // Simulate request with valid token
      const validToken = 'valid.jwt.token';
      const decodedUser = { userId: 1, email: 'test@example.com', name: 'Test User' };
      mockJwtService.verifyToken = vi.fn().mockReturnValue(decodedUser);

      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(`Bearer ${validToken}`),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      // Process request
      onRequestHandler(mockContext);

      // Verify authentication
      const authResult = await authenticateFunction(mockContext);

      expect(authResult).toEqual({ user: decodedUser });
    });

    it('should handle authentication failure flow', () => {
      const mockElysiaInstance = {
        decorate: vi.fn(),
        onRequest: vi.fn(),
      };

      let authenticateFunction: any;
      let onRequestHandler: any;

      mockElysiaInstance.decorate.mockImplementation((name: string, fn: any) => {
        if (name === 'authenticate') {
          authenticateFunction = fn;
        }
        return mockElysiaInstance;
      });

      mockElysiaInstance.onRequest.mockImplementation((fn: any) => {
        onRequestHandler = fn;
        return mockElysiaInstance;
      });

      mockElysia.mockReturnValueOnce(mockElysiaInstance);
      jwtMiddleware(mockJwtService);

      // Simulate request without token
      const mockContext = {
        request: {
          headers: {
            get: vi.fn().mockReturnValue(null),
          },
          method: 'GET',
          url: 'http://localhost:3000/auth/me',
        },
        store: {},
      };

      // Process request
      onRequestHandler(mockContext);

      // Verify authentication fails
      expect(() => authenticateFunction(mockContext)).toThrow('Authentication required');
    });
  });
});