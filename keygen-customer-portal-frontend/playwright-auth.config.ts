/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T03:06:00
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for auth tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Single worker for auth tests
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each test */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* Bypass CSP and HTTPS errors for testing */
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  },

  /* No global setup for auth tests - they manage authentication themselves */

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-auth',
      testMatch: '**/auth-debug.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        /* No persistent context for auth tests - they manage auth themselves */
      },
    },
  ],

  /* Dev server should be started manually before running tests */

  /* No global setup for auth tests - they manage authentication themselves */
});