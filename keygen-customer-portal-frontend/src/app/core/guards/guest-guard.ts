/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { filter, take, map } from 'rxjs/operators';
import { AuthService } from '../../application/services/auth';
import { AngularDIOperationsService } from '../../infrastructure/services/angular-di-operations.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const angularDI = inject(AngularDIOperationsService);

  return authService.authState.pipe(
    // Wait for initialization to complete (isLoading becomes false)
    filter((state) => !state.isLoading),
    take(1),
    map((state) => {
      if (state.user && state.isAuthenticated) {
        // User is authenticated with valid user data, redirect to dashboard
        console.log('[GUEST_GUARD] Authenticated user detected, redirecting to dashboard');
        angularDI.navigate(['/dashboard'], { replaceUrl: true });
        return false;
      } else {
        // User is not authenticated or user data is not loaded, allow access to guest routes
        console.log('[GUEST_GUARD] Guest access allowed');
        return true;
      }
    })
  );
};
