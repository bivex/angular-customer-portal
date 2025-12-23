/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:20:28
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  // Configure Vite to suppress warnings
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress the specific warning about unsupported dynamic imports in HMR
        if (
          warning.message.includes('unsupported-dynamic-import') ||
          warning.message.includes('@vite-ignore')
        ) {
          return;
        }
        // Suppress class-variance-authority package.json condition warnings
        if (
          warning.message.includes('class-variance-authority') &&
          warning.message.includes('condition') &&
          warning.message.includes('types')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  // Optimize dependencies for Angular
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/router',
      '@angular/platform-browser',
      '@angular/forms',
      'rxjs',
      'zone.js',
    ],
  },
  // Configure server for better HMR experience
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Reduce log verbosity to hide DEBUG warnings
  logLevel: 'warn',
});
