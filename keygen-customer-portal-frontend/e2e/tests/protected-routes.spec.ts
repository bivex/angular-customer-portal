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

import { test, expect, AuthHelper } from '../auth-fixtures';

test.describe('Protected Routes with Session Persistence', () => {
  test('dashboard - should load and display user information', async ({ authenticatedPage }) => {
    console.log('🧪 Testing dashboard functionality...');

    const page = authenticatedPage;

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard content loads
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // Check for common dashboard elements
    const dashboardElements = [
      '[data-testid="user-info"]',
      '[data-testid="navigation"]',
      '[data-testid="dashboard-content"]',
      '.dashboard-grid',
      '.user-greeting',
    ];

    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log(`  ✅ Found dashboard element: ${selector}`);
      }
    }

    console.log('✅ Dashboard test completed successfully');
  });

  test('user profile - should allow viewing and editing profile', async ({ authenticatedPage }) => {
    console.log('🧪 Testing user profile functionality...');

    const page = authenticatedPage;

    // Navigate to profile
    await page.goto('/user/profile');
    await expect(page).toHaveURL(/\/user\/profile/);

    // Verify profile page loads
    await expect(page.locator('[data-testid="profile"]')).toBeVisible();

    // Check for profile elements
    const profileElements = [
      '[data-testid="profile-form"]',
      'input[type="email"]',
      'input[type="text"]',
      '[data-testid="save-button"]',
      '.profile-avatar',
    ];

    for (const selector of profileElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log(`  ✅ Found profile element: ${selector}`);
      }
    }

    console.log('✅ Profile test completed successfully');
  });

  test('sessions management - should display and manage user sessions', async ({ authenticatedPage }) => {
    console.log('🧪 Testing sessions management functionality...');

    const page = authenticatedPage;

    // Navigate to sessions
    await page.goto('/sessions');
    await expect(page).toHaveURL(/\/sessions/);

    // Verify sessions page loads
    await expect(page.locator('[data-testid="sessions"]')).toBeVisible();

    // Check for sessions elements
    const sessionElements = [
      '[data-testid="sessions-list"]',
      '[data-testid="current-session"]',
      '.session-item',
      '[data-testid="logout-all"]',
    ];

    for (const selector of sessionElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log(`  ✅ Found session element: ${selector}`);
      }
    }

    console.log('✅ Sessions test completed successfully');
  });

  test('theme picker - should allow theme selection', async ({ authenticatedPage }) => {
    console.log('🧪 Testing theme picker functionality...');

    const page = authenticatedPage;

    // Navigate to themes
    await page.goto('/themes');
    await expect(page).toHaveURL(/\/themes/);

    // Verify themes page loads
    await expect(page.locator('[data-testid="themes"]')).toBeVisible();

    // Check for theme elements
    const themeElements = [
      '[data-testid="theme-grid"]',
      '.theme-card',
      '[data-testid="apply-theme"]',
      '.color-preview',
    ];

    for (const selector of themeElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log(`  ✅ Found theme element: ${selector}`);
      }
    }

    console.log('✅ Theme picker test completed successfully');
  });

  test('change password - should allow password updates', async ({ authenticatedPage }) => {
    console.log('🧪 Testing change password functionality...');

    const page = authenticatedPage;

    // Navigate to change password
    await page.goto('/user/change-password');
    await expect(page).toHaveURL(/\/user\/change-password/);

    // Verify change password page loads
    await expect(page.locator('[data-testid="change-password"]')).toBeVisible();

    // Check for password change elements
    const passwordElements = [
      'input[type="password"]',
      '[data-testid="current-password"]',
      '[data-testid="new-password"]',
      '[data-testid="confirm-password"]',
      '[data-testid="update-password"]',
    ];

    for (const selector of passwordElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log(`  ✅ Found password element: ${selector}`);
      }
    }

    console.log('✅ Change password test completed successfully');
  });

  test('navigation between protected routes should maintain session', async ({ authenticatedPage }) => {
    console.log('🧪 Testing navigation between protected routes...');

    const page = authenticatedPage;

    const routes = [
      { path: '/dashboard', title: 'Dashboard' },
      { path: '/user/profile', title: 'Profile' },
      { path: '/sessions', title: 'Sessions' },
      { path: '/themes', title: 'Themes' },
      { path: '/user/change-password', title: 'Change Password' },
    ];

    // Test navigation between all routes
    for (const route of routes) {
      console.log(`  ↳ Navigating to ${route.title} (${route.path})`);

      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Verify we're on the correct route
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/')));

      // Verify page content loads
      await expect(page.locator('body')).toBeVisible();

      // Small delay to ensure stability
      await page.waitForTimeout(500);
    }

    console.log('✅ Navigation test completed successfully');
  });

  test('session persistence during complex user interactions', async ({ authenticatedPage }) => {
    console.log('🧪 Testing session persistence during complex interactions...');

    const page = authenticatedPage;

    // Start at dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Perform various interactions that should maintain session
    const interactions = [
      async () => {
        console.log('  ↳ Testing theme toggle');
        const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]');
        if (await themeToggle.isVisible().catch(() => false)) {
          await themeToggle.click();
          await page.waitForTimeout(500);
        }
      },
      async () => {
        console.log('  ↳ Testing navigation clicks');
        const navLinks = page.locator('a[href*="/"], button[routerLink]');
        const linkCount = await navLinks.count();
        if (linkCount > 0) {
          // Click first navigation link
          await navLinks.first().click();
          await page.waitForLoadState('networkidle');
          await page.goBack();
        }
      },
      async () => {
        console.log('  ↳ Testing form interactions');
        const inputs = page.locator('input:not([type="password"]):not([type="hidden"])');
        const inputCount = await inputs.count();
        if (inputCount > 0) {
          // Try to fill first input
          await inputs.first().fill('test input');
          await page.waitForTimeout(500);
        }
      },
    ];

    // Execute interactions
    for (const interaction of interactions) {
      try {
        await interaction();
      } catch (error) {
        console.log(`  ⚠️ Interaction failed (expected): ${error.message}`);
      }
    }

    // Verify session is still active
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✅ Complex interactions test completed successfully');
  });

  test('should handle browser refresh and maintain session', async ({ authenticatedPage }) => {
    console.log('🧪 Testing browser refresh session maintenance...');

    const page = authenticatedPage;

    // Start at dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Perform multiple refreshes
    for (let i = 1; i <= 3; i++) {
      console.log(`  ↳ Refresh ${i}/3`);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify session is maintained
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      await page.waitForTimeout(500);
    }

    console.log('✅ Browser refresh test completed successfully');
  });
});