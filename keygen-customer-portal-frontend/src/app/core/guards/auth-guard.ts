/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T21:52:27
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { filter, take, map } from 'rxjs/operators';
import { AuthService } from '../../application/services/auth';
import { AngularDIOperationsService } from '../../infrastructure/services/angular-di-operations.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const angularDI = inject(AngularDIOperationsService);

  return authService.authState.pipe(
    // Wait for initialization to complete (isLoading becomes false)
    filter((state) => !state.isLoading),
    take(1),
    map((state) => {
      if (state.isAuthenticated) {
        // User is authenticated (has valid tokens)
        // User data may still be loading in background, but that's okay
        console.log('[AUTH_GUARD] Authenticated access granted');
        return true;
      } else {
        // User is not authenticated, redirect to login
        console.log('[AUTH_GUARD] Authentication required, redirecting to login');
        angularDI.navigate(['/login'], { replaceUrl: true });
        return false;
      }
    })
  );
};
