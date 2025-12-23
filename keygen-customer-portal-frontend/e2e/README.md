# End-to-End Testing with Playwright

This directory contains Playwright e2e tests for the Keygen Customer Portal frontend with session persistence and authentication testing.

## Features

- 🔐 **Session Persistence**: Tests maintain authentication state between test runs
- 🎭 **Multiple Browsers**: Support for Chromium, Firefox, WebKit, and Mobile Chrome
- 📱 **Responsive Testing**: Mobile viewport testing included
- 🔄 **Global Setup**: Automated authentication setup before test execution
- 📊 **Rich Reporting**: HTML reports with screenshots and videos on failure
- 🧩 **Custom Fixtures**: Reusable authentication and session management helpers

## Project Structure

```
e2e/
├── auth-fixtures.ts          # Authentication fixtures and helpers
├── global-setup.ts           # Global authentication setup
├── tests/
│   ├── auth-session.spec.ts      # Authentication and session tests
│   └── protected-routes.spec.ts  # Protected route functionality tests
├── .auth/                    # Authentication state storage
│   └── user.json            # Saved session state
└── README.md                 # This file
```

## Quick Start

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Install Playwright browsers:
   ```bash
   pnpm run e2e:setup
   ```

3. Start the development server:
   ```bash
   pnpm start
   ```

### Environment Variables

Create a `.env` file or set environment variables for test users:

```bash
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=user123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
TEST_GUEST_EMAIL=guest@example.com
TEST_GUEST_PASSWORD=guest123
```

### Running Tests

Run all e2e tests:
```bash
pnpm run e2e
```

Run specific test suites:
```bash
# Authentication tests
pnpm run e2e:auth

# Protected routes tests
pnpm run e2e:protected
```

Run tests in different browsers:
```bash
# Chromium (default)
pnpm run e2e:chromium

# Firefox
pnpm run e2e:firefox

# WebKit (Safari)
pnpm run e2e:webkit

# Mobile Chrome
pnpm run e2e:mobile
```

### Debug Mode

Run tests with debugging:
```bash
# Debug mode (step-by-step)
pnpm run e2e:debug

# Headed mode (visible browser)
pnpm run e2e:headed

# UI mode (Playwright UI)
pnpm run e2e:ui
```

### Code Generation

Generate test code by interacting with the application:
```bash
pnpm run e2e:codegen
```

### Reports

View test reports:
```bash
pnpm run e2e:report
```

## Test Structure

### Authentication Session Tests (`auth-session.spec.ts`)

- ✅ Login functionality and session persistence
- 🔄 Session maintenance across page reloads
- 🧭 Navigation with session preservation
- 🚪 Logout and session cleanup
- ⏰ Session expiration handling
- 🚫 Protected route access control
- 🌐 Public route accessibility
- ❌ Invalid credential handling
- 🔄 **Complete User Journey**: Registration → Login → Profile → 3 Page Reloads → Route Navigation → Logout
  - Creates a unique test user with timestamp-based email
  - Tests full registration flow with form validation
  - Verifies login functionality after registration
  - Accesses user profile and validates content
  - Performs 3 page reloads to test session persistence
  - Navigates between multiple protected routes
  - Completes with proper logout and cleanup

### Protected Routes Tests (`protected-routes.spec.ts`)

- 📊 Dashboard functionality and user info display
- 👤 User profile viewing and editing
- 🔐 Session management interface
- 🎨 Theme picker functionality
- 🔑 Password change workflow
- 🧭 Cross-route navigation with session maintenance
- 🔄 Complex user interactions with session persistence
- 🔄 Browser refresh session maintenance

## Session Persistence

The tests use Playwright's `storageState` feature to persist authentication state between test runs:

1. **Global Setup**: `global-setup.ts` performs initial login and saves session state
2. **Test Fixtures**: `auth-fixtures.ts` provides authenticated page contexts
3. **State Storage**: Session data is stored in `e2e/.auth/user.json`

### Manual Session Management

You can manually manage authentication state:

```typescript
import { AuthHelper } from './e2e/auth-fixtures';

// Save current session
await AuthHelper.saveAuthState(page);

// Load existing session
const hasSession = await AuthHelper.loadAuthState();

// Clear session
await AuthHelper.clearAuthState();
```

## Custom Fixtures

### Authenticated Page Fixture

```typescript
test('my test', async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  // Page is already authenticated
  await page.goto('/dashboard');
  // ... test logic
});
```

### Auth Helper Functions

```typescript
import { AuthHelper } from './e2e/auth-fixtures';

// Login
await AuthHelper.login(page, user);

// Logout
await AuthHelper.logout(page);

// Ensure authenticated
await AuthHelper.ensureAuthenticated(page);

// Wait for auth state
await AuthHelper.waitForAuthState(page, true);
```

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:4200`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome
- **Timeouts**: 10s actions, 30s navigation
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Fully parallel execution
- **Artifacts**: Screenshots, videos, traces on failure

### Test Data

Test users are defined in `auth-fixtures.ts`:

```typescript
export const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  user: { email: 'user@example.com', password: 'user123' },
  guest: { email: 'guest@example.com', password: 'guest123' },
};
```

## Troubleshooting

### Common Issues

1. **"Browser not found"**: Run `pnpm run e2e:setup`
2. **"Connection refused"**: Ensure dev server is running on port 4200
3. **"Authentication failed"**: Check environment variables and backend availability
4. **"Session expired"**: Clear auth state with `AuthHelper.clearAuthState()`

### Debug Tips

1. Use `--debug` flag for step-by-step execution
2. Use `--headed` flag to see browser actions
3. Check `playwright-report/index.html` for detailed results
4. Use `page.pause()` in test code for manual debugging

### Performance

- Tests run in parallel for faster execution
- Session state reduces login overhead
- Global setup runs once before all tests
- Screenshots/videos only captured on failures

## CI/CD Integration

For CI environments, ensure:

1. Set `CI=true` environment variable
2. Use `--project=chromium` for faster execution
3. Configure artifact upload for reports
4. Set test user credentials as secrets

Example GitHub Actions workflow:
```yaml
- name: Run E2E Tests
  run: pnpm run e2e:chromium
  env:
    CI: true
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Contributing

When adding new tests:

1. Use the existing fixtures and helpers
2. Follow the naming convention: `*.spec.ts`
3. Add appropriate `data-testid` attributes to components for reliable selection
4. Include both positive and negative test cases
5. Document complex test scenarios

## License

This test suite is part of the Keygen Customer Portal and follows the same MIT license.