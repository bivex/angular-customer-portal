/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T19:05:00
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import {
  Router,
  NavigationEnd,
  NavigationStart,
  NavigationError,
  NavigationCancel,
} from '@angular/router';
import { filter } from 'rxjs/operators';

export class RouterDebugUtils {
  private static enabled = false;

  static enable(router: Router): void {
    if (this.enabled) return;

    this.enabled = true;

    // Log navigation events
    router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        console.log('🧭 NavigationStart:', event.url);
      });

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('✅ NavigationEnd:', event.url);
      });

    router.events
      .pipe(filter((event) => event instanceof NavigationError))
      .subscribe((event: NavigationError) => {
        console.error('❌ NavigationError:', event.error, event.url);
      });

    router.events
      .pipe(filter((event) => event instanceof NavigationCancel))
      .subscribe((event: NavigationCancel) => {
        console.warn('⚠️ NavigationCancel:', event.reason, event.url);
      });
  }

  static logNavigationPerformance(router: Router): void {
    let startTime: number;

    router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      startTime = performance.now();
    });

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`⏱️ Navigation to ${event.url} took ${duration.toFixed(2)}ms`);
      });
  }
}
