/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:02
 * Last Updated: 2025-12-22T01:53:26
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Import global styles
import './styles.css';

// Make error retry function available globally for debugging
import { retryLocalErrors } from './app/core/services/error-handler';
if (typeof window !== 'undefined') {
  (window as any).retryLocalErrors = retryLocalErrors;
  console.log('🔄 Local error retry available using: retryLocalErrors()');
}

bootstrapApplication(App, appConfig).catch((err: any) => console.error(err));
