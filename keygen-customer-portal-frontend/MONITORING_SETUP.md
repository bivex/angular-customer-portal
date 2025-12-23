# Frontend Monitoring Setup

This document outlines the comprehensive monitoring setup implemented for the Keygen Customer Portal frontend application.

## 🚀 Implemented Solutions

### 1. MicroSentry (Error Tracking)

**Package:** `@micro-sentry/angular` v7.2.0
**Features:**

- ✅ **Full Stack Traces**: Complete call stack with TypeScript source maps
- ✅ **Rich Context**: Local variables, user state, form data, API requests/responses
- ✅ **Breadcrumbs**: Complete user journey leading to errors
- ✅ **Automatic Error Capture**: All unhandled errors are captured
- ✅ **User Context**: User identification and session data

**Configuration:**

- **File:** `src/app/app-module.ts` (via MicroSentryModule.forRoot)
- **Integration:** Angular module-based configuration
- **Environment:** Both development and production
- **DSN:** Configured in `environment.ts` and `environment.prod.ts`
- **Bundle Size Impact:** ~60KB additional to bundle (much smaller than @sentry/angular)

**Enhanced Error Context:**

```typescript
// Automatic context added to all errors:
- Browser info (userAgent, language, platform)
- Application version and environment
- User session data
- Form state and validation errors
- API request/response details
- Component state and local variables

// Manual error reporting with context:
this.microSentry.setExtras({
  component: 'login',
  action: 'test_error',
  userAgent: navigator.userAgent,
  url: window.location.href
});

this.microSentry.setTags({
  component: 'login',
  operation: 'test_error',
  environment: 'development'
});

this.microSentry.report(error);
```

**Setup:**

```typescript
// app.module.ts - MicroSentry module configuration
import { MicroSentryModule } from '@micro-sentry/angular';
import { sentryConfig } from './sentry.config';

@NgModule({
  imports: [
    MicroSentryModule.forRoot(sentryConfig),
    // ... other imports
  ],
})
export class AppModule {}
```

**Configuration Object:**

```typescript
// src/app/sentry.config.ts
export const sentryConfig = {
  dsn: environment.sentry?.dsn,
  environment: environment.production ? 'production' : 'development',
  release: environment.version || '1.0.0',
};
```

### 3. Enhanced HTTP Error Handling

**Features:**

- ✅ Automatic error capturing for all HTTP requests via Sentry
- ✅ RxJS error handling with `catchError`
- ✅ Context-rich error reporting with request/response details
- ✅ Sensitive data sanitization

**Implementation:**

- **Interceptor:** `src/app/core/interceptors/auth.interceptor.ts`
- **Sentry Integration:** Uses `Sentry.withScope()` for rich context
- **Tags:** HTTP status, method, URL for categorization
- **Extras:** Request headers, response data, timestamps

### 4. Sentry Direct Integration

**Features:**

- ✅ Direct Sentry API usage for maximum flexibility
- ✅ Automatic error capture for unhandled errors
- ✅ Manual error reporting with rich context
- ✅ Performance monitoring (1% sample rate)
- ✅ User identification and session tracking

**Usage:**

```typescript
import * as Sentry from '@sentry/angular';

// Basic error capture
Sentry.captureException(error);

// Rich error tracking with context
Sentry.withScope((scope) => {
  scope.setTag('component', 'auth');
  scope.setTag('operation', 'login');
  scope.setExtras({
    userId: 123,
    formData: this.loginForm.value,
    apiResponse: responseData,
  });
  Sentry.captureException(error);
});

// User identification
Sentry.setUser({
  id: userId,
  email: user.email,
  username: user.username,
});

// Performance monitoring (automatic with tracesSampleRate)
```

## 🔧 Configuration

### Environment Variables

**Development (`environment.ts`):**

```typescript
export const environment = {
  production: false,
  sentry: { dsn: 'your-sentry-dsn-here' },
  logRocket: { appId: 'your-development-logrocket-app-id' },
};
```

**Production (`environment.prod.ts`):**

```typescript
export const environment = {
  production: true,
  sentry: { dsn: 'your-production-sentry-dsn-here' },
  logRocket: { appId: 'your-production-logrocket-app-id' },
};
```

### Source Maps for Production

**File:** `angular.json`

```json
"production": {
  "sourceMap": true,
  "outputHashing": "all"
}
```

## 📊 Monitoring Coverage

### Error Tracking

- ✅ **HTTP request failures** (with full request/response context via interceptor)
- ✅ **Authentication errors** (with user state, form data, operation type)
- ✅ **Component errors** (with local variables and component state)
- ✅ **Global uncaught errors** (automatic via Sentry)
- ✅ **Network failures** (with connection details and retry attempts)
- ✅ **Form validation errors** (with field errors and form state)
- ✅ **API errors** (with request/response data and timing)
- ✅ **User action errors** (with user journey and action context)

### Performance Monitoring

- ⚠️ **Not available** with @micro-sentry/angular
- 💡 **For performance monitoring**, use @sentry/angular instead
- 🔄 **Switch packages** if performance data is needed

### User Behavior

- ✅ **Session tracking** (automatic)
- ✅ **User identification** and context
- ✅ **Breadcrumb tracking** for user journeys
- ✅ **Authentication flows** monitoring

### Security

- ✅ **Sensitive data sanitization** (automatic)
- ✅ **Authorization header masking** (via interceptor)
- ✅ **Environment-based activation** (development + production)

## 🛠️ Usage Examples

### API Service with Performance Tracking

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private monitoring: MonitoringService
  ) {}

  getData(endpoint: string): Observable<any> {
    const startTime = performance.now();

    return this.http.get(endpoint).pipe(
      tap(() => {
        const duration = performance.now() - startTime;
        this.monitoring.trackPerformance('api_call_success', duration);
      }),
      catchError((error) => {
        const duration = performance.now() - startTime;
        this.monitoring.trackError(error, { endpoint, duration });
        return throwError(() => error);
      })
    );
  }
}
```

### Component Performance Tracking

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private loadStartTime: number;

  constructor(private monitoring: MonitoringService) {}

  ngOnInit(): void {
    this.loadStartTime = performance.now();
  }

  ngOnDestroy(): void {
    const loadTime = performance.now() - this.loadStartTime;
    this.monitoring.trackComponentLoad('dashboard', loadTime);
  }
}
```

## 🚀 Next Steps

1. **Configure DSNs:** Replace placeholder values in environment files
2. **Test Monitoring:** Deploy to staging and verify error capture
3. **Add Web Vitals:** Consider adding Core Web Vitals tracking
4. **New Relic Integration:** Optional additional performance monitoring
5. **Custom Alerts:** Set up alerts in Sentry dashboard

## 📚 Additional Resources

- [Sentry Angular Documentation](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [LogRocket Angular Integration](https://docs.logrocket.com/docs/angular)
- [Angular Performance Monitoring](https://angular.io/guide/service-worker-devops)
- [Web Vitals](https://web.dev/vitals/)

## 🔍 Enhanced Sentry Error Context Techniques

### Full Stack Traces with Rich Context

```typescript
// Instead of basic error capture:
Sentry.captureException(error);

// Use withScope for rich context:
Sentry.withScope((scope) => {
  scope.setTag('component', 'auth');
  scope.setTag('operation', 'login');

  // Add local variables and state
  scope.setExtras({
    userId: this.userId,
    formData: this.loginForm.value,
    userState: this.authState,
    apiResponse: responseData,
    timestamp: new Date().toISOString(),
  });

  // Add context objects
  scope.setContext('user_action', {
    action: 'login_attempt',
    formValid: this.loginForm.valid,
    rememberMe: this.loginForm.value.rememberMe,
  });

  scope.setContext('browser', {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
  });

  Sentry.captureException(error);
});
```

### Specialized Error Tracking Methods

**Form Validation Errors:**

```typescript
this.monitoring.trackFormError(
  'registrationForm',
  this.registrationForm.errors,
  this.registrationForm.value
);
```

**API Errors with Request/Response:**

```typescript
this.monitoring.trackApiError(
  error,
  {
    url: '/api/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    params: this.queryParams,
  },
  errorResponse
);
```

**User Action Errors:**

```typescript
this.monitoring.trackUserActionError(
  'checkout_process',
  error,
  { step: 'payment', amount: this.cartTotal },
  { userId: this.userId, cartItems: this.cartItems }
);
```

## 🛠️ Key Techniques for Frontend Debugging in Production

### Enable Source Maps for production builds:

```json
// angular.json
"configurations": {
  "production": {
    "sourceMap": true
  }
}
```

Sentry needs this to show original TypeScript lines instead of minified JS.

### Enhanced RxJS Error Handling:

```typescript
import { catchError } from 'rxjs/operators';
import { MonitoringService } from './monitoring.service';

this.http.get('/api/data').pipe(
  catchError((err) => {
    this.monitoring.trackApiError(err, {
      url: '/api/data',
      method: 'GET',
    });
    throw err;
  })
);
```

### Performance Monitoring:

- **Sentry Tracing**: Automatic performance tracking for API calls and page loads
- **Component Profiling**: Use Angular DevTools in development to identify slow components
- **Web Vitals**: Monitor Core Web Vitals (FCP, LCP, CLS, FID, TTFB)

## 🔒 Security Notes

- Monitoring services only activate in production with valid configuration
- Sensitive data is automatically sanitized
- User sessions are recorded only with consent (configure appropriately)
- Error data includes contextual information but no sensitive user data

## 📦 Package Choice

**Current:** `@micro-sentry/angular` v7.2.0

- ✅ **Small bundle size** (~60KB impact)
- ✅ **Easy configuration**
- ✅ **Full error tracking**
- ❌ **No performance monitoring**

**Alternative:** `@sentry/angular` v10.32.0

- ✅ **Performance monitoring** (1% sample rate)
- ✅ **Advanced features** (session replay, etc.)
- ❌ **Larger bundle size** (~287KB impact)
- ❌ **More complex setup**

Use `@micro-sentry/angular` for basic error tracking with minimal bundle impact. Switch to `@sentry/angular` only if performance monitoring is required.

