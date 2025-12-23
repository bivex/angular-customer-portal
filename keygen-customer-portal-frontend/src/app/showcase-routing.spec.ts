/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T14:44:50
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Test file to diagnose showcase route navigation issues
 * This test will help identify why /showcase redirects to /login
 */

import { TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './application/services/auth';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

// Import routes from app.config.ts
const routes: Routes = [
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/theme-showcase/theme-showcase').then((m) => m.ThemeShowcase),
  },
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

describe('Showcase Route Navigation Tests', () => {
  let router: Router;
  let location: Location;
  let authService: jasmine.SpyObj<AuthService>;
  let authStateSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create a mock auth state
    authStateSubject = new BehaviorSubject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Create mock AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      authState: authStateSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  describe('Guest User (Not Authenticated)', () => {
    beforeEach(() => {
      // Set auth state to NOT authenticated
      authStateSubject.next({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it('should navigate to /showcase without redirect', async () => {
      console.log('[TEST] Navigating to /showcase as guest');
      await router.navigate(['/showcase']);

      console.log('[TEST] Current URL:', location.path());
      console.log('[TEST] Router URL:', router.url);

      expect(location.path()).toBe('/showcase');
    });

    it('should NOT redirect to /login when accessing /showcase', async () => {
      console.log('[TEST] Checking if /showcase redirects to /login');
      await router.navigate(['/showcase']);

      const finalUrl = location.path();
      console.log('[TEST] Final URL after navigation:', finalUrl);

      expect(finalUrl).not.toBe('/login');
      expect(finalUrl).toBe('/showcase');
    });

    it('should allow access to /showcase without authGuard interference', async () => {
      console.log('[TEST] Testing authGuard interference');

      // Navigate to showcase
      const navigationSuccessful = await router.navigate(['/showcase']);

      console.log('[TEST] Navigation successful:', navigationSuccessful);
      console.log('[TEST] Final location:', location.path());

      expect(navigationSuccessful).toBe(true);
      expect(location.path()).toBe('/showcase');
    });
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      // Set auth state to authenticated
      authStateSubject.next({
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('should navigate to /showcase even when authenticated', async () => {
      console.log('[TEST] Navigating to /showcase as authenticated user');
      await router.navigate(['/showcase']);

      console.log('[TEST] Current URL:', location.path());
      console.log('[TEST] Auth state:', authStateSubject.value);

      expect(location.path()).toBe('/showcase');
    });

    it('should NOT redirect authenticated users from /showcase', async () => {
      console.log('[TEST] Checking if authenticated users can access /showcase');
      await router.navigate(['/showcase']);

      const finalUrl = location.path();
      console.log('[TEST] Final URL:', finalUrl);

      expect(finalUrl).toBe('/showcase');
      expect(finalUrl).not.toBe('/dashboard');
    });
  });

  describe('Route Configuration', () => {
    it('should have /showcase route defined', () => {
      const showcaseRoute = router.config.find((route) => route.path === 'showcase');

      console.log('[TEST] Showcase route config:', showcaseRoute);

      expect(showcaseRoute).toBeDefined();
      expect(showcaseRoute?.path).toBe('showcase');
    });

    it('should NOT have canActivate guards on /showcase route', () => {
      const showcaseRoute = router.config.find((route) => route.path === 'showcase');

      console.log('[TEST] Showcase route guards:', showcaseRoute?.canActivate);

      expect(showcaseRoute?.canActivate).toBeUndefined();
    });

    it('should list all routes in correct order', () => {
      console.log('[TEST] All routes:');
      router.config.forEach((route, index) => {
        console.log(`  ${index}. path: "${route.path}", guards:`, route.canActivate || 'none');
      });

      const paths = router.config.map((r) => r.path);
      const showcaseIndex = paths.indexOf('showcase');
      const wildcardIndex = paths.indexOf('**');

      console.log('[TEST] Showcase index:', showcaseIndex);
      console.log('[TEST] Wildcard index:', wildcardIndex);

      expect(showcaseIndex).toBeGreaterThanOrEqual(0);
      expect(showcaseIndex).toBeLessThan(wildcardIndex);
    });
  });

  describe('Debugging Navigation Events', () => {
    it('should log all navigation events for /showcase', async () => {
      const events: any[] = [];

      router.events.subscribe((event) => {
        console.log('[ROUTER_EVENT]', event.constructor.name, event);
        events.push(event);
      });

      await router.navigate(['/showcase']);

      console.log('[TEST] Total navigation events:', events.length);
      console.log('[TEST] Final URL:', location.path());

      expect(location.path()).toBe('/showcase');
    });
  });
});
