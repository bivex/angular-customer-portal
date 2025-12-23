/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T21:47:26
 * Last Updated: 2025-12-19T10:03:37
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../../shared/config';

export interface Auth0User {
  sub: string; // Auth0 user ID
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface IAuthService {
  validateToken(token: string): Promise<Auth0User>;
  getUserIdFromToken(token: string): Promise<string>;
}

// Auth0 service implementation
export class Auth0Service implements IAuthService {
  private jwksClient = jwksClient({
    jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
  });

  async validateToken(token: string): Promise<Auth0User> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid JWT token');
      }

      const key = await this.getSigningKey(decoded.header.kid);

      const verified = jwt.verify(token, key, {
        audience: config.auth0.audience,
        issuer: `https://${config.auth0.domain}/`,
        algorithms: ['RS256'],
      }) as Auth0User;

      return verified;
    } catch (error) {
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserIdFromToken(token: string): Promise<string> {
    const user = await this.validateToken(token);
    return user.sub;
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key?.getPublicKey();
          if (!signingKey) {
            reject(new Error('Unable to retrieve signing key'));
          } else {
            resolve(signingKey);
          }
        }
      });
    });
  }
}