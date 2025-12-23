/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:02
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Production environment configuration
// IMPORTANT: These values should be injected at build time using environment variables
// Never commit actual secrets to version control!

export const environment = {
  production: true,
  apiUrl: '${API_URL}', // Will be replaced at build time
  version: '1.0.0',
  auth0: {
    domain: '${AUTH0_DOMAIN}', // Will be replaced at build time
    clientId: '${AUTH0_CLIENT_ID}', // Will be replaced at build time
    authorizationParams: {
      redirect_uri: '${AUTH0_REDIRECT_URI}', // Will be replaced at build time
      audience: '${AUTH0_AUDIENCE}', // Will be replaced at build time
    },
    errorPath: '/error',
  },
  sentry: {
    dsn: '${SENTRY_DSN}', // Will be replaced at build time
  },
};
