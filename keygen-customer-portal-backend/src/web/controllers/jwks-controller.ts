/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22
 * Last Updated: 2025-12-22
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Elysia } from 'elysia';
import { keyManager } from '../../infrastructure/crypto/key-manager';
import { logger } from '../../shared/logger';

/**
 * JWKS Controller - JSON Web Key Set endpoint
 *
 * Exposes public keys for JWT verification
 * Standard endpoint: /.well-known/jwks.json
 *
 * Clients use this to verify RS256 JWT signatures without needing the private key
 */
export const createJWKSController = () => {
  return new Elysia({ prefix: '/.well-known' })
    .get('/jwks.json', async ({ set }) => {
      try {
        const jwks = keyManager.getJWKS();

        logger.info('JWKS requested', { keyCount: jwks.keys.length });

        // Set cache headers (public keys can be cached)
        set.headers['Cache-Control'] = 'public, max-age=3600'; // Cache for 1 hour
        set.headers['Content-Type'] = 'application/json';

        return jwks;
      } catch (error) {
        logger.error('Failed to get JWKS', { error });

        set.status = 500;
        return {
          error: 'Failed to retrieve JWKS',
        };
      }
    });
};
