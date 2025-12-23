/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T02:51:24
 * Last Updated: 2025-12-22T03:11:46
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
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
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
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Use persistent context for session persistence */
        contextOptions: {
          /* Persist storage state between tests */
          storageState: './e2e/.auth/user.json',
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        /* Use persistent context for session persistence */
        contextOptions: {
          storageState: './e2e/.auth/user.json',
        },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        /* Use persistent context for session persistence */
        contextOptions: {
          storageState: './e2e/.auth/user.json',
        },
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          storageState: './e2e/.auth/user.json',
        },
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Dev server should be started manually before running tests */

  /* Global setup for authentication - disabled for auth tests */
  // globalSetup: require.resolve('./e2e/global-setup'),
});