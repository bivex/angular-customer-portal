/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-23T02:28:44
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import * as Sentry from '@sentry/bun';
import { config } from './config';

export function initSentry() {
  if (config.environment === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || 'your-sentry-dsn-here',
      environment: config.environment,
      tracesSampleRate: 1.0,
    });
  }

  // Spotlight integration disabled due to compatibility issues
  // TODO: Re-enable when Spotlight supports current Sentry version
}