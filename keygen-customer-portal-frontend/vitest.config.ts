/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T02:14:35
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/test.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Angular-specific test configuration
    testTimeout: 10000,
    // Configure file transformations for Angular templates
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
});
