/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T03:14:09
 * Last Updated: 2025-12-20T22:05:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ApplicationConfig, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideRouter, Router, withEnabledBlockingInitialNavigation } from '@angular/router';
import { Routes } from '@angular/router';
import { Observable } from 'rxjs';
import {
  TranslateLoader,
  TranslateService,
  provideTranslateService,
  TranslateModule,
} from '@ngx-translate/core';
// import { provideFileLoggingMicroSentry } from '../../../micro-sentry/projects/angular/src/public-api';
// import { sentryConfig } from './sentry.config';
import { provideZard } from '@/shared/core/provider/provideZard';

// HTTP Interceptors
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Guards
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

// Services
import { AuthService } from './application/services/auth';
import { SessionService } from './application/services/session.service';

// Router debugging utilities
import { RouterDebugUtils } from './core/utils/router-debug';

// Architecture dumper
import {
  ArchitectureDumperService,
  initializeArchitectureDumper,
} from './core/utils/architecture-dumper';

// Error handler
import { GlobalErrorHandler } from './core/services/error-handler';

// Custom translate loader for ngx-translate
class CustomTranslateHttpLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

// ngx-translate loader factory
export function HttpLoaderFactory(http: HttpClient): CustomTranslateHttpLoader {
  return new CustomTranslateHttpLoader(http);
}

// Translation initializer - optimized for faster loading
export function initializeTranslations(translate: TranslateService): () => Promise<void> {
  return () => {
    // Set English as default for faster loading, then switch to Russian
    translate.setDefaultLang('en');
    translate.use('en');

    // Load Russian translations asynchronously without blocking app initialization
    setTimeout(() => {
      translate.use('ru');
    }, 100);

    return Promise.resolve();
  };
}

// Routes configuration
const routes: Routes = [
  // Public routes (no authentication required)
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/theme-showcase/theme-showcase').then((m) => m.ThemeShowcase),
  },
  // Guest-only routes (redirect to dashboard if authenticated)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  // Protected routes (authentication required)
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'themes',
        loadComponent: () =>
          import('./features/theme-picker/theme-picker').then((m) => m.ThemePickerComponent),
      },
      {
        path: 'user',
        children: [
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/user/profile/profile').then((m) => m.ProfileComponent),
          },
          {
            path: 'change-password',
            loadComponent: () =>
              import('./features/user/change-password/change-password').then(
                (m) => m.ChangePasswordComponent
              ),
          },
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/sessions/sessions').then((m) => m.SessionsComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // Fallback - redirect unknown routes to dashboard
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

// Auth service initializer
export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => authService.initialize();
}

// Session service initializer
export function initializeSession(sessionService: SessionService): () => void {
  return () => {
    // Session service initializes itself in constructor
    console.log('🚀 Session monitoring initialized');
  };
}

// Router debugging initializer
export function initializeRouterDebug(router: Router): () => void {
  return () => {
    // Enable enhanced router debugging
    RouterDebugUtils.enable(router);
    RouterDebugUtils.logNavigationPerformance(router);

    console.log('🚀 Router debug tracing initialized with enhanced logging');
  };
}

// Architecture dumper initializer
export function initializeArchitectureDumperService(): () => void {
  return () => {
    // Architecture dumper disabled for production
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptorsFromDi()),
    provideBrowserGlobalErrorListeners(),
    // ...provideFileLoggingMicroSentry(sentryConfig),
    provideZard(),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSession,
      deps: [SessionService],
      multi: true,
    },
    // Router debug disabled - comment out to re-enable
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeRouterDebug,
    //   deps: [Router],
    //   multi: true,
    // },
    // Architecture dumper disabled - comment out to re-enable
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeArchitectureDumperService,
    //   multi: true,
    // },
    // Translation providers
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      fallbackLang: 'en',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslateService],
      multi: true,
    },
  ],
};
