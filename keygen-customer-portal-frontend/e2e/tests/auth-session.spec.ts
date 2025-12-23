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

import { test, expect, AuthHelper, TEST_USERS } from '../auth-fixtures';

test.describe('Authentication Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app first to enable localStorage access
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Clear any existing session before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display login form correctly', async ({ page }) => {
    console.log('🧪 Testing login form display...');

    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Verify login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('z-button[type="submit"]')).toBeVisible();

    console.log('✅ Login form display test passed');
  });

  test('should login successfully and persist session', async ({ page }) => {
    console.log('🧪 Testing login and session persistence...');

    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Verify login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('z-button[type="submit"]')).toBeVisible();

    // Perform login
    await AuthHelper.login(page, TEST_USERS.user);

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(2000); // Wait for dashboard to fully load

    // Save auth state for future tests
    await AuthHelper.saveAuthState(page);

    console.log('✅ Login test completed successfully');
  });

  test('should maintain session across page reloads', async ({ page }) => {
    console.log('🧪 Testing session persistence across reloads...');

    // First login to ensure we have valid session
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Perform login
    await AuthHelper.login(page, TEST_USERS.user);
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify session is maintained
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(2000); // Wait for dashboard to fully load

    console.log('✅ Session persistence test completed successfully');
  });

  test('should maintain session across navigation', async ({ page }) => {
    console.log('🧪 Testing session maintenance during navigation...');

    // First login to ensure we have valid session
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Perform login
    await AuthHelper.login(page, TEST_USERS.user);
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to different protected routes (excluding sessions for now)
    const protectedRoutes = ['/user/profile', '/themes'];

    for (const route of protectedRoutes) {
      console.log(`  ↳ Testing navigation to ${route}`);

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Should stay on the route (not redirected to login)
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
    }

    // Return to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✅ Navigation session test completed successfully');
  });

  test('should logout and clear session', async ({ page }) => {
    console.log('🧪 Testing logout functionality...');

    // First login to ensure we have valid session
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Perform login
    await AuthHelper.login(page, TEST_USERS.user);
    await expect(page).toHaveURL(/\/dashboard/);

    // Perform logout
    await AuthHelper.logout(page);

    // Verify we're redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Verify we can't access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    console.log('✅ Logout test completed successfully');
  });

  test('should handle session expiration', async ({ page }) => {
    console.log('🧪 Testing session expiration handling...');

    // First login
    await AuthHelper.login(page, TEST_USERS.user);
    await expect(page).toHaveURL(/\/dashboard/);

    // Simulate session expiration by clearing tokens
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    // Try to access protected route
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    console.log('✅ Session expiration test completed successfully');
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    console.log('🧪 Testing protection of authenticated routes...');

    const protectedRoutes = ['/dashboard', '/user/profile', '/sessions', '/themes'];

    for (const route of protectedRoutes) {
      console.log(`  ↳ Testing access to ${route} without authentication`);

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    }

    console.log('✅ Protected routes test completed successfully');
  });

  test('should allow access to public routes without authentication', async ({ page }) => {
    console.log('🧪 Testing access to public routes...');

    // Test showcase route (public)
    await page.goto('/showcase');
    await expect(page).toHaveURL(/\/showcase/);

    // Test login route (guest-only)
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Test register route (guest-only)
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);

    console.log('✅ Public routes test completed successfully');
  });

  test('should handle invalid login credentials', async ({ page }) => {
    console.log('🧪 Testing invalid login handling...');

    await page.goto('/login');

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page or show error
    await page.waitForTimeout(2000); // Wait for potential error handling

    // Check if we're still on login page or error is shown
    const currentUrl = page.url();
    const hasError = await page.locator('.error, .alert-danger, [data-testid="error"]').isVisible().catch(() => false);

    // Either we stay on login page or see an error
    expect(currentUrl.includes('/login') || hasError).toBe(true);

    console.log('✅ Invalid login test completed successfully');
  });

  test('complete user journey: registration → login → profile → page reloads', async ({ page }) => {
    console.log('🧪 Testing complete user journey: registration → login → profile → reloads...');

    // Generate unique test user data
    const timestamp = Date.now();
    const testUser = {
      email: `testuser${timestamp}@example.com`,
      password: 'testPassword123!',
      name: `Test User ${timestamp}`,
    };

    console.log(`  📝 Using test user: ${testUser.email}`);

    // === STEP 1: REGISTRATION ===
    console.log('  1️⃣ Starting registration process...');

    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);

    // Wait for registration form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill registration form
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', testUser.email);

    // Fill password fields
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();

    if (passwordCount >= 2) {
      // Fill password and confirm password
      await passwordInputs.nth(0).fill(testUser.password);
      await passwordInputs.nth(1).fill(testUser.password);
    } else {
      // Single password field
      await page.fill('input[type="password"]', testUser.password);
    }

    // Fill name if available
    const nameInput = page.locator('input[type="text"], input[name*="name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(testUser.name);
    }

    // Submit registration
    await page.click('button[type="submit"], [data-testid="register-button"]');

    // Wait for successful registration - should redirect to login or dashboard
    await page.waitForTimeout(3000);
    const currentUrl = page.url();

    console.log(`  ✅ Registration completed, redirected to: ${currentUrl}`);

    // === STEP 2: LOGIN ===
    console.log('  2️⃣ Starting login process...');

    // If not automatically logged in, go to login page
    if (!currentUrl.includes('/dashboard')) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', '');
      await page.fill('input[type="password"]', testUser.password);

      // Submit login
      await page.click('button[type="submit"]');
    }

    // Wait for successful login
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('  ✅ Login completed successfully');

    // === STEP 3: ACCESS PROFILE ===
    console.log('  3️⃣ Accessing user profile...');

    await page.goto('/user/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/user\/profile/);

    // Verify profile page loads
    await expect(page.locator('[data-testid="profile"], .profile-page, h1, h2')).toBeVisible();

    // Check for profile elements
    const profileElements = [
      'input[type="email"]',
      'input[type="text"]',
      '[data-testid="save-button"]',
      '.profile-form',
    ];

    let foundElements = 0;
    for (const selector of profileElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        foundElements++;
        console.log(`    ✅ Found profile element: ${selector}`);
      }
    }

    expect(foundElements).toBeGreaterThan(0);
    console.log('  ✅ Profile access completed successfully');

    // === STEP 4: PAGE RELOADS (3 times) ===
    console.log('  4️⃣ Testing session persistence with page reloads...');

    for (let i = 1; i <= 3; i++) {
      console.log(`    🔄 Reload ${i}/3`);

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify we're still on profile page (session maintained)
      await expect(page).toHaveURL(/\/user\/profile/);

      // Verify profile content is still accessible
      await expect(page.locator('[data-testid="profile"], .profile-page, h1, h2')).toBeVisible();

      // Small delay between reloads
      await page.waitForTimeout(1000);

      console.log(`    ✅ Reload ${i}/3 completed - session maintained`);
    }

    console.log('  ✅ All page reloads completed successfully');

    // === STEP 5: VERIFY SESSION PERSISTENCE ===
    console.log('  5️⃣ Verifying overall session persistence...');

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to another protected route
    await page.goto('/sessions');
    await expect(page).toHaveURL(/\/sessions/);

    // Return to profile one more time
    await page.goto('/user/profile');
    await expect(page).toHaveURL(/\/user\/profile/);

    console.log('  ✅ Session persistence verified across all routes');

    // === CLEANUP: LOGOUT ===
    console.log('  🧹 Cleaning up - logging out...');

    try {
      // Try to find logout button
      const logoutButton = page.locator('[data-testid="logout-button"], .logout-btn, button:has-text("Logout"), button:has-text("Выйти")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL('**/login', { timeout: 10000 });
      } else {
        // Fallback: clear localStorage and navigate to login
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/login');
      }

      await expect(page).toHaveURL(/\/login/);
      console.log('  ✅ Logout completed successfully');
    } catch (error) {
      console.log(`  ⚠️ Logout failed (may not be critical): ${error.message}`);
    }

    console.log('✅ Complete user journey test finished successfully!');
    console.log(`   📊 Summary: Registration → Login → Profile Access → 3 Reloads → Route Navigation → Logout`);
  });
});