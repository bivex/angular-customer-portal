/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T02:51:24
 * Last Updated: 2025-12-22T03:19:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { test as base, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export type TestUser = {
  email: string;
  password: string;
  name?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user?: TestUser;
  sessionExpiry?: Date;
};

// Test users configuration
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    name: 'Admin User',
  },
  user: {
    email: process.env.TEST_USER_EMAIL || 'user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'user123456',
    name: 'Regular User',
  },
  guest: {
    email: process.env.TEST_GUEST_EMAIL || 'guest@example.com',
    password: process.env.TEST_GUEST_PASSWORD || 'guest123',
    name: 'Guest User',
  },
};

// Default test user
export const DEFAULT_USER = TEST_USERS.user;

// Extend base test with authentication fixtures
export const test = base.extend<{
  authState: AuthState;
  testUser: TestUser;
}>({

  // Fixture for current authentication state
  authState: async ({ page }, use) => {
    const authState: AuthState = {
      isAuthenticated: false,
    };

    // Check if we're on a protected route and can access it
    try {
      await page.goto('/dashboard');
      const currentUrl = page.url();

      if (currentUrl.includes('/dashboard')) {
        authState.isAuthenticated = true;
        // Try to extract user info from localStorage or DOM
        authState.user = DEFAULT_USER;
      }
    } catch (error) {
      authState.isAuthenticated = false;
    }

    await use(authState);
  },

  // Fixture for test user
  testUser: [DEFAULT_USER, { option: true }],
});

// Authentication helper functions
export class AuthHelper {
  static async login(page: Page, user: TestUser = DEFAULT_USER): Promise<void> {
    console.log(`🔐 Logging in as ${user.email}...`);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Clear and fill form
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', user.email);

    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', user.password);

    // Submit form using z-button component
    await page.click('z-button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify login success - check for dashboard URL and wait for content to load
    await page.waitForTimeout(2000); // Wait for dashboard to fully load
    await expect(page).toHaveURL(/\/dashboard/);

    console.log(`✅ Successfully logged in as ${user.email}`);
  }

  static async logout(page: Page): Promise<void> {
    console.log('🚪 Logging out...');

    // Try to find logout button (adjust selector based on your UI)
    const logoutButton = page.locator('[data-testid="logout-button"], .logout-btn, [aria-label="Logout"]');

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Wait for redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
    } else {
      // Fallback: clear localStorage and navigate to login
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('/login');
    }

    console.log('✅ Successfully logged out');
  }

  static async ensureAuthenticated(page: Page, user: TestUser = DEFAULT_USER): Promise<void> {
    await page.goto('/dashboard');

    // Check if we're redirected to login (not authenticated)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await this.login(page, user);
    } else {
      // Verify we're authenticated
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    }
  }

  static async saveAuthState(page: Page, filePath: string = './e2e/.auth/user.json'): Promise<void> {
    const context = page.context();
    await context.storageState({ path: filePath });
    console.log(`💾 Auth state saved to ${filePath}`);
  }

  static async loadAuthState(filePath: string = './e2e/.auth/user.json'): Promise<boolean> {
    try {
      const statePath = path.resolve(filePath);
      return fs.existsSync(statePath);
    } catch {
      return false;
    }
  }

  static async clearAuthState(filePath: string = './e2e/.auth/user.json'): Promise<void> {
    try {
      const statePath = path.resolve(filePath);
      if (fs.existsSync(statePath)) {
        fs.unlinkSync(statePath);
        console.log(`🗑️ Auth state cleared from ${filePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to clear auth state: ${error}`);
    }
  }

  static async getCurrentUser(page: Page): Promise<TestUser | null> {
    try {
      // Try to extract user info from localStorage or DOM
      const userData = await page.evaluate(() => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          // Try to decode JWT token (basic implementation)
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            return {
              email: payload.email || payload.sub,
              name: payload.name,
            };
          } catch {
            // If JWT decoding fails, return basic user object
            return { email: 'authenticated-user' };
          }
        }
        return null;
      });

      return userData;
    } catch {
      return null;
    }
  }

  static async waitForAuthState(page: Page, expectedState: boolean, timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await page.goto('/dashboard');
      const currentUrl = page.url();
      const isAuthenticated = currentUrl.includes('/dashboard') && !currentUrl.includes('/login');

      if (isAuthenticated === expectedState) {
        return;
      }

      await page.waitForTimeout(500);
    }

    throw new Error(`Authentication state did not match expected state (${expectedState}) within ${timeout}ms`);
  }
}

// Export expect for convenience
export { expect };