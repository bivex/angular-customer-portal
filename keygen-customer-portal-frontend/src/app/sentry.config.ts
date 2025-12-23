/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:03:31
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { environment } from '../environments/environment';

export const sentryConfig = {
  dsn: environment.sentry?.dsn || 'your-glitchtip-dsn-here',
  environment: environment.production ? 'production' : 'development',
  release: environment.version || '1.0.0',
};
