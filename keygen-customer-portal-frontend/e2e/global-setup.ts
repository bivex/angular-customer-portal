/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T02:51:24
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Create browser context for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Set viewport for consistent screenshots
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    console.log('🔐 Setting up global authentication...');

    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill login form
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for successful login - check if we're redirected to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify we're logged in by checking for dashboard content
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });

    console.log('✅ Authentication successful, saving session state...');

    // Save signed-in state to storageState file
    await context.storageState({ path: './e2e/.auth/user.json' });

    console.log('💾 Session state saved successfully');

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;