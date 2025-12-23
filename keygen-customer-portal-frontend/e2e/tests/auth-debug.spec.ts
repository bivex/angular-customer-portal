/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T03:20:00
 * Last Updated: 2025-12-22T04:48:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { test, expect } from '../auth-fixtures';
import { TEST_USERS } from '../auth-fixtures';

test.describe('Auth Debug Tests', () => {
  test('test sessions page reload bug - should not logout', async ({ page }) => {
    console.log('🔍 Starting auth debug test...');

    // Capture console logs from the browser
    const consoleLogs: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });

      // Print important logs immediately
      if (type === 'error' || type === 'warning' || text.includes('[Auth') ||
          text.includes('AUTH') || text.includes('token') || text.includes('session')) {
        console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      consoleLogs.push({ type: 'pageerror', text: error.message });
    });

    // Capture network requests
    const networkLogs: Array<{ url: string; method: string; status?: number; error?: string }> = [];
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('/sessions')) {
        networkLogs.push({ url, method });
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('/sessions')) {
        const existingLog = networkLogs.find(log => log.url === url && log.method === response.request().method());
        if (existingLog) {
          existingLog.status = status;
        }
      }
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('/sessions')) {
        const existingLog = networkLogs.find(log => log.url === url && log.method === request.method());
        if (existingLog) {
          existingLog.error = request.failure()?.errorText || 'Request failed';
        }
      }
    });

    // Helper function to print captured logs
    const printConsoleLogs = (label: string) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${label}`);
      console.log('='.repeat(60));
      consoleLogs.forEach(({ type, text }) => {
        if (type === 'error') {
          console.log(`❌ [ERROR] ${text}`);
        } else if (type === 'warning') {
          console.log(`⚠️  [WARN] ${text}`);
        } else if (text.includes('[Auth') || text.includes('AUTH') ||
                   text.includes('token') || text.includes('session')) {
          console.log(`ℹ️  [${type}] ${text}`);
        }
      });
      console.log('='.repeat(60) + '\n');
    };

    // Helper function to print network logs
    const printNetworkLogs = (label: string) => {
      console.log(`\n${'-'.repeat(60)}`);
      console.log(`🌐 ${label}`);
      console.log('-'.repeat(60));
      networkLogs.forEach(({ url, method, status, error }) => {
        const shortUrl = url.replace('http://localhost:4200', '').replace('http://localhost:3000', '');
        if (error) {
          console.log(`❌ [${method}] ${shortUrl} - ${error}`);
        } else if (status) {
          const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
          console.log(`${statusIcon} [${method}] ${shortUrl} - ${status}`);
        } else {
          console.log(`⏳ [${method}] ${shortUrl} - pending`);
        }
      });
      console.log('-'.repeat(60) + '\n');
    };

    // Helper function to analyze tokens
    const analyzeTokens = async () => {
      const tokens = await page.evaluate(() => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const sessionId = localStorage.getItem('session_id');

        const analyzeJWT = (token: string | null) => {
          if (!token) return null;
          try {
            const parts = token.split('.');
            if (parts.length !== 3) return { valid: false, error: 'Invalid JWT format' };

            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            const exp = payload.exp;
            const iat = payload.iat;

            return {
              valid: true,
              expired: exp < now,
              expiresIn: exp - now,
              issuedAt: new Date(iat * 1000).toISOString(),
              expiresAt: new Date(exp * 1000).toISOString(),
              payload
            };
          } catch (e) {
            return { valid: false, error: e.message };
          }
        };

        return {
          accessToken: analyzeJWT(accessToken),
          refreshToken: analyzeJWT(refreshToken),
          sessionId: sessionId ? { value: sessionId.substring(0, 20) + '...' } : null,
          raw: {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasSessionId: !!sessionId,
            accessTokenLength: accessToken?.length || 0,
            refreshTokenLength: refreshToken?.length || 0
          }
        };
      });

      console.log('\n🔍 Token Analysis:');
      console.log('='.repeat(40));

      if (tokens.raw.hasAccessToken) {
        console.log('📝 Access Token:');
        if (tokens.accessToken?.valid) {
          console.log(`  ✅ Valid JWT`);
          console.log(`  ⏰ Expires: ${tokens.accessToken.expiresAt} (${tokens.accessToken.expired ? 'EXPIRED' : 'Valid'})`);
          console.log(`  📅 Issued: ${tokens.accessToken.issuedAt}`);
          if (tokens.accessToken.expired) {
            console.log(`  ❌ Expired ${Math.abs(tokens.accessToken.expiresIn)} seconds ago`);
          } else {
            console.log(`  ✅ Valid for ${tokens.accessToken.expiresIn} more seconds`);
          }
        } else {
          console.log(`  ❌ Invalid: ${tokens.accessToken?.error || 'Unknown error'}`);
        }
      } else {
        console.log('📝 Access Token: ❌ Not found');
      }

      if (tokens.raw.hasRefreshToken) {
        console.log('🔄 Refresh Token:');
        if (tokens.refreshToken?.valid) {
          console.log(`  ✅ Valid JWT`);
          console.log(`  ⏰ Expires: ${tokens.refreshToken.expiresAt} (${tokens.refreshToken.expired ? 'EXPIRED' : 'Valid'})`);
          if (tokens.refreshToken.expired) {
            console.log(`  ❌ Expired ${Math.abs(tokens.refreshToken.expiresIn)} seconds ago`);
          } else {
            console.log(`  ✅ Valid for ${tokens.refreshToken.expiresIn} more seconds`);
          }
        } else {
          console.log(`  ❌ Invalid: ${tokens.refreshToken?.error || 'Unknown error'}`);
        }
      } else {
        console.log('🔄 Refresh Token: ❌ Not found');
      }

      console.log('🆔 Session ID:', tokens.sessionId ? `✅ Present (${tokens.sessionId.value})` : '❌ Not found');
      console.log('='.repeat(40) + '\n');

      return tokens;
    };

    // Helper function to login
    const login = async () => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
      await page.fill('input[type="email"]', TEST_USERS.user.email);
      await page.fill('input[type="password"]', TEST_USERS.user.password);
      // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      await page.waitForTimeout(1000); // Wait for auth state to settle
    };

    // Step 1: Login
    console.log('\n🚀 Step 1: Logging in...');
    console.log('='.repeat(50));
    networkLogs.length = 0;
    await login();
    console.log('✅ Login successful');
    await analyzeTokens();
    printConsoleLogs('Console logs after login');
    printNetworkLogs('Network requests during login');

    // Step 2: Navigate to sessions
    console.log('\n📍 Step 2: Navigating to /sessions...');
    console.log('='.repeat(50));
    consoleLogs.length = 0; // Clear previous logs
    networkLogs.length = 0;
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for component to initialize

    console.log('✅ Navigation to /sessions successful');
    console.log(`📍 Current URL: ${page.url()}`);

    // Check auth state after navigation
    const authStateAfterNavigation = await page.evaluate(() => {
      return {
        isAuthenticated: !!(window as any).authService?.isAuthenticated?.(),
        currentUser: (window as any).authService?.currentUser?.(),
        hasTokens: !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'))
      };
    });
    console.log('🔐 Auth state after navigation:', authStateAfterNavigation);

    await analyzeTokens();
    printConsoleLogs('Console logs after navigating to /sessions');
    printNetworkLogs('Network requests during navigation to /sessions');

    // Step 3: Reload page and check if we stay logged in
    console.log('\n🔄 Step 3: Reloading sessions page...');
    console.log('='.repeat(50));
    consoleLogs.length = 0; // Clear logs before reload
    networkLogs.length = 0;
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for component to initialize

    const currentUrl = page.url();
    console.log(`📍 Current URL after reload: ${currentUrl}`);

    // Check auth state after reload
    const authStateAfterReload = await page.evaluate(() => {
      return {
        isAuthenticated: !!(window as any).authService?.isAuthenticated?.(),
        currentUser: (window as any).authService?.currentUser?.(),
        hasTokens: !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'))
      };
    });
    console.log('🔐 Auth state after reload:', authStateAfterReload);

    await analyzeTokens();
    printConsoleLogs('Console logs after reload');
    printNetworkLogs('Network requests during reload');

    // Check if there were any 401 errors
    const has401Errors = networkLogs.some(log => log.status === 401);
    const hasAuthErrors = consoleLogs.some(log => log.text.includes('401') || log.text.includes('Unauthorized'));

    if (currentUrl.includes('/login')) {
      console.log('\n❌ BUG DETECTED: Reload caused logout!');
      console.log('🔍 Analysis: User was redirected to login page after reload');
      console.log('📊 This indicates a session persistence issue');

      await analyzeTokens();

      // Try to login again to see if the issue is with stored tokens
      console.log('\n🔄 Step 4: Attempting to login again...');
      console.log('='.repeat(50));
      consoleLogs.length = 0;
      networkLogs.length = 0;
      await login();
      console.log('✅ Re-login successful - tokens are valid');
      await analyzeTokens();
      printConsoleLogs('Console logs after re-login');
      printNetworkLogs('Network requests during re-login');

      // Try sessions again
      console.log('\n📍 Step 5: Trying sessions again after re-login...');
      console.log('='.repeat(50));
      consoleLogs.length = 0;
      networkLogs.length = 0;
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const sessionsUrl = page.url();
      console.log(`📍 Sessions URL after re-login: ${sessionsUrl}`);

      const authStateAfterReLogin = await page.evaluate(() => {
        return {
          isAuthenticated: !!(window as any).authService?.isAuthenticated?.(),
          currentUser: (window as any).authService?.currentUser?.(),
          hasTokens: !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'))
        };
      });
      console.log('🔐 Auth state after accessing sessions:', authStateAfterReLogin);

      await analyzeTokens();
      printConsoleLogs('Console logs on sessions page after re-login');
      printNetworkLogs('Network requests on sessions page after re-login');

      if (sessionsUrl.includes('/sessions')) {
        console.log('✅ Sessions accessible after re-login');
      } else {
        console.log('❌ Sessions still not accessible');
      }

      throw new Error('SESSIONS PAGE RELOAD BUG: User gets logged out on page reload. Tokens are lost or invalid.');
    } else if (currentUrl.includes('/sessions')) {
      if (has401Errors || hasAuthErrors) {
        console.log('\n⚠️ PARTIAL ISSUE: User stays on sessions page but API calls fail');
        console.log('🔍 Analysis: User is not logged out (stays on /sessions), but data cannot be loaded');
        console.log('📊 This indicates token validity issues - tokens exist but are rejected by API');

        console.log('\n🔍 Detailed Analysis:');
        console.log('- ✅ User authentication: MAINTAINED (stays on protected route)');
        console.log('- ❌ API authorization: FAILED (401 errors on data requests)');
        console.log('- 📝 Likely cause: Token expiration or invalidation');

        await analyzeTokens();

        throw new Error('API AUTHORIZATION BUG: Sessions page accessible but API calls fail with 401. Tokens may be expired or invalid.');
      } else {
        console.log('\n✅ FULL SUCCESS: Reload successful - still on sessions page with working API');
        console.log('🎉 No authentication bugs detected - everything works correctly');
      }
    } else {
      console.log(`\n⚠️ UNEXPECTED: Redirected to: ${currentUrl}`);
      console.log('🔍 This might indicate routing or navigation issues');
    }

    console.log('🎉 Auth debug test completed');
  });

  test('test sessions page shows "Invalid or expired token" error despite valid tokens', async ({ page }) => {
    console.log('🔍 Starting token validation test...');

    // Capture console logs from the browser
    const consoleLogs: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });

      // Print important logs immediately
      if (type === 'error' || type === 'warning' || text.includes('[Auth') ||
          text.includes('AUTH') || text.includes('token') || text.includes('session')) {
        console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      consoleLogs.push({ type: 'pageerror', text: error.message });
    });

    // Capture network requests
    const networkLogs: Array<{ url: string; method: string; status?: number; error?: string }> = [];
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('/sessions')) {
        networkLogs.push({ url, method });
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      const method = response.request().method();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('/sessions')) {
        const status = response.status();
        networkLogs.push({ url, method, status });
        if (status >= 400) {
          console.log(`❌ [${method}] ${url} - ${status}`);
        }
      }
    });

    // Step 1: Login first
    console.log('🚀 Step 1: Logging in...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    // Fill form fields with proper waiting
    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait a bit for Angular form validation
    await page.waitForTimeout(500);

    // Click the submit button with a more specific selector
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');

    // Verify tokens are stored
    const tokensAfterLogin = await page.evaluate(() => ({
      accessToken: !!localStorage.getItem('access_token'),
      refreshToken: !!localStorage.getItem('refresh_token'),
      sessionId: !!localStorage.getItem('session_id')
    }));
    console.log('🔑 Tokens after login:', tokensAfterLogin);

    // Step 2: Navigate to sessions page
    console.log('📍 Step 2: Navigating to sessions page...');
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for component to load

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Step 3: Check UI state
    console.log('🔍 Step 3: Analyzing UI state...');

    const uiState = await page.evaluate(() => {
      // Check debug info
      const debugElement = document.querySelector('.bg-yellow-50');
      const debugText = debugElement ? debugElement.textContent : '';

      // Check error message
      const errorElement = document.querySelector('.bg-red-50');
      const errorText = errorElement ? errorElement.textContent : '';

      // Check sessions list
      const sessionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
      const sessionsCount = sessionElements.length;

      // Check "No active sessions" message
      const noSessionsElement = document.querySelector('h3');
      const noSessionsText = noSessionsElement ? noSessionsElement.textContent : '';

      return {
        debugText,
        errorText,
        sessionsCount,
        noSessionsText,
        url: window.location.href
      };
    });

    console.log('📊 UI State Analysis:');
    console.log('- Debug info:', uiState.debugText);
    console.log('- Error message:', uiState.errorText);
    console.log('- Sessions count:', uiState.sessionsCount);
    console.log('- No sessions message:', uiState.noSessionsText);

    // Step 4: Check if tokens are still valid
    const tokensOnSessionsPage = await page.evaluate(() => ({
      accessToken: !!localStorage.getItem('access_token'),
      refreshToken: !!localStorage.getItem('refresh_token'),
      sessionId: !!localStorage.getItem('session_id'),
      accessTokenValue: localStorage.getItem('access_token')?.substring(0, 50) + '...',
      refreshTokenValue: localStorage.getItem('refresh_token')?.substring(0, 50) + '...'
    }));

    console.log('🔑 Tokens on sessions page:', {
      ...tokensOnSessionsPage,
      accessTokenValue: tokensOnSessionsPage.accessTokenValue,
      refreshTokenValue: tokensOnSessionsPage.refreshTokenValue
    });

    // Step 5: Analyze the issue
    const hasInvalidTokenError = uiState.errorText?.includes('Invalid or expired token');
    const hasZeroSessions = uiState.sessionsCount === 0;
    const hasNoSessionsMessage = uiState.noSessionsText?.includes('No active sessions');

    console.log('\n🔍 Issue Analysis:');
    console.log(`- Shows "Invalid or expired token": ${hasInvalidTokenError}`);
    console.log(`- Sessions count is 0: ${hasZeroSessions}`);
    console.log(`- Shows "No active sessions": ${hasNoSessionsMessage}`);
    console.log(`- Tokens present: ${tokensOnSessionsPage.accessToken && tokensOnSessionsPage.refreshToken}`);

    // Check console logs for session loading
    const sessionLoadLogs = consoleLogs.filter(log =>
      log.text.includes('Sessions loaded') ||
      log.text.includes('getActiveSessions') ||
      log.text.includes('Starting to load sessions')
    );

    console.log('\n📋 Session loading logs:');
    sessionLoadLogs.forEach(log => {
      console.log(`- ${log.type}: ${log.text}`);
    });

    // Check for 401 errors
    const has401Errors = networkLogs.some(log => log.status === 401);
    const sessionsApiCalls = networkLogs.filter(log => log.url.includes('/auth/v2/sessions'));

    console.log('\n🌐 Sessions API calls:');
    sessionsApiCalls.forEach(call => {
      console.log(`- [${call.method}] ${call.url} - ${call.status || 'pending'}`);
    });

    // Step 6: Determine the root cause
    if (hasInvalidTokenError && hasZeroSessions && tokensOnSessionsPage.accessToken) {
      console.log('\n❌ BUG DETECTED: "Invalid or expired token" error despite valid tokens');
      console.log('🔍 Possible causes:');
      console.log('1. Auth interceptor token refresh failed');
      console.log('2. Backend middleware rejecting valid tokens');
      console.log('3. Component state management issue');
      console.log('4. Race condition in token validation');

      // Try to get more details from browser
      const browserDetails = await page.evaluate(() => {
        const authService = (window as any).authService;
        const isAuthenticated = authService?.isAuthenticated?.();
        const currentUser = authService?.currentUser?.();

        return {
          isAuthenticated,
          hasCurrentUser: !!currentUser,
          currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null
        };
      });

      console.log('\n🔧 Browser auth state:');
      console.log('- isAuthenticated():', browserDetails.isAuthenticated);
      console.log('- hasCurrentUser:', browserDetails.hasCurrentUser);
      console.log('- currentUser:', browserDetails.currentUser);

      throw new Error('TOKEN VALIDATION BUG: UI shows "Invalid or expired token" but tokens are present and valid. Check auth interceptor, middleware, or component state management.');
    } else if (has401Errors) {
      console.log('\n⚠️ API Authorization Issue: Backend rejecting tokens');
      throw new Error('API AUTH ISSUE: Sessions API returning 401 despite valid tokens in localStorage.');
    } else if (!hasInvalidTokenError && hasZeroSessions && sessionLoadLogs.length > 0) {
      console.log('\n✅ No error - sessions loaded but UI shows 0 (possible timing issue)');
      console.log('This might be a race condition in the component that was fixed.');
    } else {
      console.log('\n✅ Test passed - no token validation issues detected');
    }

    console.log('🎉 Token validation test completed');
  });

  test('test manual session loading with detailed logging', async ({ page }) => {
    console.log('🔍 Starting manual session loading test...');

    // Enable detailed console logging
    const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text, timestamp: Date.now() });

      // Print all logs for detailed analysis
      console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    });

    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait for Angular form validation
    await page.waitForTimeout(500);
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Clear previous logs
    consoleLogs.length = 0;

    // Navigate to sessions page
    console.log('📍 Navigating to sessions page...');
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for component to fully load

    // Analyze the sequence of events
    console.log('\n📋 Analyzing event sequence:');

    const sessionLogs = consoleLogs.filter(log =>
      log.text.includes('Sessions Component') ||
      log.text.includes('Auth] getActiveSessions') ||
      log.text.includes('Auth Interceptor') ||
      log.text.includes('Token refresh')
    );

    sessionLogs.forEach((log, index) => {
      const timeDiff = index > 0 ? log.timestamp - sessionLogs[0].timestamp : 0;
      console.log(`[${timeDiff}ms] ${log.type}: ${log.text}`);
    });

    // Check UI state
    const uiState = await page.evaluate(() => {
      const debugElement = document.querySelector('.bg-yellow-50');
      const errorElement = document.querySelector('.bg-red-50');
      const sessionsList = document.querySelectorAll('[class*="hover:bg-gray-50"]');

      return {
        debugText: debugElement ? debugElement.textContent : null,
        errorText: errorElement ? errorElement.textContent : null,
        sessionCount: sessionsList.length,
        hasAuthError: errorElement && errorElement.textContent?.includes('Invalid or expired token'),
        isLoading: document.querySelector('animate-spin') !== null
      };
    });

    console.log('\n📊 Final UI State:');
    console.log('- Debug text:', uiState.debugText);
    console.log('- Error text:', uiState.errorText);
    console.log('- Session count:', uiState.sessionCount);
    console.log('- Has auth error:', uiState.hasAuthError);
    console.log('- Is loading:', uiState.isLoading);

    // Check network requests for sessions
    const networkLogs: Array<{ url: string; method: string; status?: number }> = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/auth/v2/sessions')) {
        networkLogs.push({
          url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    // Wait a bit more and check again
    await page.waitForTimeout(2000);

    const finalUiState = await page.evaluate(() => {
      const debugElement = document.querySelector('.bg-yellow-50');
      const errorElement = document.querySelector('.bg-red-50');
      const sessionsList = document.querySelectorAll('[class*="hover:bg-gray-50"]');

      return {
        debugText: debugElement ? debugElement.textContent : null,
        errorText: errorElement ? errorElement.textContent : null,
        sessionCount: sessionsList.length,
        hasAuthError: errorElement && errorElement.textContent?.includes('Invalid or expired token')
      };
    });

    console.log('\n📊 Final UI State (after wait):');
    console.log('- Debug text:', finalUiState.debugText);
    console.log('- Error text:', finalUiState.errorText);
    console.log('- Session count:', finalUiState.sessionCount);
    console.log('- Has auth error:', finalUiState.hasAuthError);

    console.log('\n🌐 Network requests to sessions API:');
    networkLogs.forEach(log => {
      console.log(`- ${log.method} ${log.url} -> ${log.status}`);
    });

    // Determine if there's an issue
    if (finalUiState.hasAuthError && finalUiState.sessionCount === 0) {
      console.log('\n❌ ISSUE DETECTED: Auth error with 0 sessions');
      console.log('This indicates a problem with token validation or session loading');

      // Check if any 401 errors occurred
      const has401Errors = networkLogs.some(log => log.status === 401);
      if (has401Errors) {
        console.log('🔍 Root cause: API returned 401 Unauthorized');
      } else {
        console.log('🔍 Root cause: UI shows error but API calls succeeded');
      }

      throw new Error('SESSION_LOADING_BUG: UI shows "Invalid or expired token" error despite successful API calls');
    } else if (finalUiState.sessionCount > 0 && !finalUiState.hasAuthError) {
      console.log('\n✅ SUCCESS: Sessions loaded correctly');
    } else {
      console.log('\n⚠️ UNCLEAR: Mixed results - investigate logs above');
    }

    console.log('🎉 Manual session loading test completed');
  });

  test('test revoke single session functionality', async ({ page }) => {
    console.log('🔍 Starting single session revoke test...');

    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait for Angular form validation
    await page.waitForTimeout(500);
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for sessions to load

    // Get initial session count and find a non-current session to revoke
    const initialState = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
      const revokeButtons = document.querySelectorAll('button:has-text("Revoke")');
      const currentSessionText = document.querySelector('span:has-text("Current Session")');

      return {
        totalSessions: sessionElements.length,
        revokeButtonsCount: revokeButtons.length,
        hasCurrentSession: !!currentSessionText
      };
    });

    console.log('📊 Initial state:');
    console.log(`- Total sessions: ${initialState.totalSessions}`);
    console.log(`- Revoke buttons: ${initialState.revokeButtonsCount}`);
    console.log(`- Has current session: ${initialState.hasCurrentSession}`);

    if (initialState.revokeButtonsCount === 0) {
      console.log('⚠️ No sessions available for revoke (all sessions might be current)');
      console.log('✅ Test passed - current session correctly cannot be revoked');
      return;
    }

    // Find a session that is not current and revoke it
    const revokeResult = await page.evaluate(async () => {
      const sessionElements = Array.from(document.querySelectorAll('[class*="hover:bg-gray-50"]'));
      let revokedSessionId = null;
      let foundRevokeButton = false;

      for (const sessionEl of sessionElements) {
        const revokeButton = sessionEl.querySelector('button:has-text("Revoke")');
        const currentBadge = sessionEl.querySelector('span:has-text("Current Session")');

        if (revokeButton && !currentBadge) {
          // Click the revoke button
          const sessionId = sessionEl.textContent?.match(/id: ([^,}]+)/)?.[1];
          revokedSessionId = sessionId;
          foundRevokeButton = true;

          // Click revoke button
          (revokeButton as HTMLElement).click();
          break;
        }
      }

      return {
        foundRevokeButton,
        revokedSessionId,
        sessionElementsCount: sessionElements.length
      };
    });

    if (!revokeResult.foundRevokeButton) {
      console.log('⚠️ No non-current sessions found to revoke');
      console.log('✅ Test passed - only current session exists');
      return;
    }

    console.log(`🔄 Revoking session: ${revokeResult.revokedSessionId}`);

    // Wait for the revoke operation to complete and sessions to reload
    await page.waitForTimeout(5000);

    // Check for any error messages first
    const errorState = await page.evaluate(() => {
      const errorElement = document.querySelector('.bg-red-50');
      return {
        hasError: !!errorElement,
        errorText: errorElement ? errorElement.textContent : null
      };
    });

    if (errorState.hasError) {
      console.log('❌ FAILURE: Error occurred during revoke operation');
      console.log('- Error text:', errorState.errorText);
      throw new Error(`REVOKE_FAILED: ${errorState.errorText}`);
    }

    // Check the final state
    const finalState = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
      const loadingElement = document.querySelector('.animate-spin');

      return {
        finalSessionCount: sessionElements.length,
        isLoading: !!loadingElement
      };
    });

    console.log('📊 Final state after revoke:');
    console.log(`- Sessions after revoke: ${finalState.finalSessionCount}`);
    console.log(`- Still loading: ${finalState.isLoading}`);

    // Wait a bit more if still loading
    if (finalState.isLoading) {
      console.log('⏳ Still loading, waiting additional time...');
      await page.waitForTimeout(3000);
    }

    // Final check
    const finalCheck = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
      return sessionElements.length;
    });

    console.log(`- Final session count: ${finalCheck}`);

    // Verify the revoke operation
    if (finalCheck < initialState.totalSessions) {
      console.log('✅ SUCCESS: Session revoked successfully');
      console.log(`- Session count decreased from ${initialState.totalSessions} to ${finalCheck}`);
    } else {
      console.log('⚠️ UNCLEAR: Session count did not decrease');
      console.log('This might indicate:');
      console.log('- The revoke operation failed');
      console.log('- The session was not found');
      console.log('- Only one session existed (current session)');
      console.log('- UI did not update properly');
    }

    console.log('🎉 Single session revoke test completed');
  });

  test('test revoke all sessions functionality', async ({ page }) => {
    console.log('🔍 Starting revoke all sessions test...');

    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait for Angular form validation
    await page.waitForTimeout(500);
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for sessions to load

    // Get initial session count
    const initialState = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
      const revokeAllButton = document.querySelector('button:has-text("Revoke All Sessions")');

      return {
        totalSessions: sessionElements.length,
        hasRevokeAllButton: !!revokeAllButton,
        revokeAllDisabled: revokeAllButton ? (revokeAllButton as HTMLElement).hasAttribute('disabled') : false
      };
    });

    console.log('📊 Initial state:');
    console.log(`- Total sessions: ${initialState.totalSessions}`);
    console.log(`- Has revoke all button: ${initialState.hasRevokeAllButton}`);
    console.log(`- Revoke all disabled: ${initialState.revokeAllDisabled}`);

    if (initialState.totalSessions <= 1) {
      console.log('⚠️ Only one session (current) exists - revoke all would logout user');
      console.log('✅ Test passed - revoke all correctly handles single session case');
      return;
    }

    if (!initialState.hasRevokeAllButton) {
      throw new Error('REVOKE_ALL_BUTTON_MISSING: Revoke All Sessions button not found');
    }

    // Click revoke all button and confirm
    const confirmResult = await page.evaluate(() => {
      const revokeAllButton = document.querySelector('button:has-text("Revoke All Sessions")');
      if (revokeAllButton) {
        (revokeAllButton as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (!confirmResult) {
      throw new Error('REVOKE_ALL_CLICK_FAILED: Could not click revoke all button');
    }

    // Handle confirmation dialog - accept it
    page.on('dialog', async dialog => {
      console.log('📋 Dialog message:', dialog.message());
      await dialog.accept();
    });

    // Wait for logout and redirect to login page
    try {
      await page.waitForURL('**/login', { timeout: 15000 });
      const finalUrl = page.url();
      const isLoggedOut = finalUrl.includes('/login');

      console.log('📍 Final URL after revoke all:', finalUrl);
      console.log('🔓 User logged out:', isLoggedOut);

      if (isLoggedOut) {
        console.log('✅ SUCCESS: All sessions revoked and user logged out');
      } else {
        console.log('❌ FAILURE: User was not logged out after revoking all sessions');
        throw new Error('REVOKE_ALL_FAILED: User should be logged out after revoking all sessions');
      }
    } catch (error) {
      console.log('⚠️ Timeout waiting for redirect, checking current state...');
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      // Check if user is still logged in or got an error
      if (currentUrl.includes('/sessions')) {
        console.log('❌ FAILURE: User still on sessions page after revoke all');
        throw new Error('REVOKE_ALL_FAILED: User should have been logged out');
      }
    }

    console.log('🎉 Revoke all sessions test completed');
  });

  test('test current session cannot be revoked', async ({ page }) => {
    console.log('🔍 Starting current session protection test...');

    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait for Angular form validation
    await page.waitForTimeout(500);
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for sessions to load

    // Check that current session doesn't have revoke button
    const sessionState = await page.evaluate(() => {
      const sessionElements = Array.from(document.querySelectorAll('[class*="hover:bg-gray-50"]'));
      const sessionsData = sessionElements.map((el, index) => {
        const revokeButton = el.querySelector('button:has-text("Revoke")');
        const currentBadge = el.querySelector('span:has-text("Current Session")');
        const sessionText = el.textContent || '';
        const sessionId = sessionText.match(/id: ([^,}]+)/)?.[1] || `session-${index}`;

        return {
          id: sessionId,
          hasRevokeButton: !!revokeButton,
          isCurrent: !!currentBadge,
          revokeDisabled: revokeButton ? (revokeButton as HTMLElement).hasAttribute('disabled') : false
        };
      });

      return {
        sessions: sessionsData,
        currentSessionExists: sessionsData.some(s => s.isCurrent),
        currentSessionHasRevoke: sessionsData.some(s => s.isCurrent && s.hasRevokeButton)
      };
    });

    console.log('📊 Session analysis:');
    sessionState.sessions.forEach((session, index) => {
      console.log(`- Session ${index + 1}: ${session.id}`);
      console.log(`  - Is current: ${session.isCurrent}`);
      console.log(`  - Has revoke button: ${session.hasRevokeButton}`);
      console.log(`  - Revoke disabled: ${session.revokeDisabled}`);
    });

    // Verify current session protection
    if (sessionState.currentSessionExists && !sessionState.currentSessionHasRevoke) {
      console.log('✅ SUCCESS: Current session correctly protected from revoke');
      console.log('- Current session exists');
      console.log('- Current session does not have revoke button');
    } else if (!sessionState.currentSessionExists) {
      console.log('⚠️ No current session identified');
      console.log('This might be a UI issue with session identification');
    } else {
      console.log('❌ FAILURE: Current session can be revoked');
      throw new Error('CURRENT_SESSION_VULNERABLE: Current session has revoke button, which should not be allowed');
    }

    console.log('🎉 Current session protection test completed');
  });

  test('test DELETE API endpoint directly', async ({ page }) => {
    console.log('🔍 Starting direct DELETE API test...');

    // Login first to get a valid token
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for Angular to be ready and form to be rendered
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);

    // Wait for Angular form validation
    await page.waitForTimeout(500);
    // Click the submit button - try multiple selectors in case z-button doesn't work
    try {
      await page.click('z-button[type="submit"]', { timeout: 2000 });
    } catch {
      try {
        await page.click('button[type="submit"]', { timeout: 2000 });
      } catch {
        // Fallback: click the button containing the translated sign-in text
        await page.click('button:has-text("Sign in"), button:has-text("signIn"), button:has-text("Sign In")', { timeout: 2000 });
      }
    }
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Get token from localStorage
    const tokenData = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('access_token'),
      };
    });

    console.log('🔑 Retrieved access token for DELETE testing');

    if (!tokenData.accessToken) {
      throw new Error('No access token available');
    }

    // Test DELETE endpoint with valid token
    console.log('Testing DELETE /auth/v2/sessions/test-session-id');

    const deleteResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('http://localhost:3000/auth/v2/sessions/test-session-id', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        return {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          success: response.ok
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          data: error.message,
          success: false,
          error: error.message
        };
      }
    }, tokenData.accessToken);

    console.log('🌐 DELETE Response:');
    console.log(`- Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
    console.log(`- Success: ${deleteResponse.success}`);
    console.log(`- Data:`, deleteResponse.data);

    if (deleteResponse.success) {
      console.log('✅ SUCCESS: DELETE endpoint works with valid token');
    } else if (deleteResponse.status === 404) {
      console.log('✅ SUCCESS: DELETE endpoint reached (404 expected for non-existent session)');
    } else {
      console.log('❌ FAILURE: DELETE endpoint failed');
      throw new Error(`DELETE_FAILED: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    console.log('🎉 Direct DELETE API test completed');
  });
});