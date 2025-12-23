/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-21T12:00:00
 * Last Updated: 2025-12-21T12:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { config } from '../../shared/config';

/**
 * Security headers middleware for Elysia
 * Implements best practices for HTTP security headers
 */
export const securityHeadersMiddleware = () => {
  return new Elysia({ name: 'security-headers' })
    .onAfterResponse(({ set, request }) => {
      const url = new URL(request.url);
      const isApiRoute = url.pathname.startsWith('/auth') || url.pathname.startsWith('/health') || url.pathname.startsWith('/metrics');

      // Content Security Policy (CSP)
      if (config.environment === 'production') {
        set.headers['Content-Security-Policy'] = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://api.github.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');
      } else {
        // More permissive CSP for development
        set.headers['Content-Security-Policy'] = [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: localhost:* 127.0.0.1:*",
          "style-src 'self' 'unsafe-inline' http: https:",
          "font-src 'self' http: https:",
          "img-src 'self' data: http: https: blob:",
          "connect-src 'self' http: https: ws: wss: localhost:* 127.0.0.1:*",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');
      }

      // HTTP Strict Transport Security (HSTS)
      if (config.environment === 'production' && url.protocol === 'https:') {
        set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
      }

      // X-Frame-Options (redundant with CSP frame-ancestors but good fallback)
      set.headers['X-Frame-Options'] = 'DENY';

      // X-Content-Type-Options
      set.headers['X-Content-Type-Options'] = 'nosniff';

      // X-XSS-Protection (for older browsers)
      set.headers['X-XSS-Protection'] = '1; mode=block';

      // Referrer-Policy
      set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

      // Permissions-Policy (formerly Feature-Policy)
      set.headers['Permissions-Policy'] = [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'payment=()',
        'usb=()',
        'autoplay=()',
        'fullscreen=(self)',
        'accelerometer=()',
        'ambient-light-sensor=()',
        'bluetooth=()',
        'display-capture=()',
        'document-domain=()',
        'encrypted-media=()',
        'execution-while-not-rendered=()',
        'execution-while-out-of-viewport=()',
        'gyroscope=()',
        'keyboard-map=()',
        'magnetometer=()',
        'navigation-override=()',
        'picture-in-picture=()',
        'publickey-credentials-create=()',
        'publickey-credentials-get=()',
        'screen-wake-lock=()',
        'web-share=()',
        'xr-spatial-tracking=()'
      ].join(', ');

      // Cross-Origin-Embedder-Policy (COEP)
      set.headers['Cross-Origin-Embedder-Policy'] = 'credentialless';

      // Cross-Origin-Opener-Policy (COOP)
      set.headers['Cross-Origin-Opener-Policy'] = 'same-origin';

      // Cross-Origin-Resource-Policy (CORP)
      if (isApiRoute) {
        set.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
      } else {
        set.headers['Cross-Origin-Resource-Policy'] = 'same-origin';
      }

      // Remove server header for security (if not already removed by reverse proxy)
      if (set.headers['Server']) {
        delete set.headers['Server'];
      }

      // Add security headers specific to API routes
      if (isApiRoute) {
        // Cache control for API responses
        set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        set.headers['Pragma'] = 'no-cache';
        set.headers['Expires'] = '0';

        // Ensure proper content type for JSON responses
        if (!set.headers['Content-Type'] || !set.headers['Content-Type'].includes('application/json')) {
          set.headers['Content-Type'] = 'application/json; charset=utf-8';
        }
      }

      // Add X-Environment header for debugging (only in non-production)
      if (config.environment !== 'production') {
        set.headers['X-Environment'] = config.environment;
        set.headers['X-Timestamp'] = new Date().toISOString();
      }
    });
};