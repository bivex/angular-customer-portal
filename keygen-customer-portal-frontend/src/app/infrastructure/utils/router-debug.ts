/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:19:30
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import {
  Router,
  RouterEvent,
  Event,
  NavigationStart,
  NavigationEnd,
  RoutesRecognized,
  GuardsCheckStart,
  GuardsCheckEnd,
  ResolveStart,
  ResolveEnd,
  NavigationCancel,
  NavigationError,
  NavigationSkipped,
  ChildActivationStart,
  ChildActivationEnd,
  ActivationStart,
  ActivationEnd,
} from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Enhanced router debugging utility
 * Provides detailed logging of all router lifecycle events
 */
export class RouterDebugUtils {
  private static isEnabled = false;

  /**
   * Enable router debug tracing
   */
  static enable(router: Router): void {
    if (this.isEnabled) {
      console.warn('Router debug tracing is already enabled');
      return;
    }

    this.isEnabled = true;
    console.log('🔍 Router Debug Tracing Enabled');

    // Subscribe to all router events
    router.events.subscribe((event) => {
      this.logRouterEvent(event);
    });
  }

  /**
   * Disable router debug tracing
   */
  static disable(): void {
    this.isEnabled = false;
    console.log('🔍 Router Debug Tracing Disabled');
  }

  /**
   * Log individual router events with detailed information
   */
  private static logRouterEvent(event: Event): void {
    if (!this.isEnabled) return;

    // Only process RouterEvent instances
    if (!(event instanceof RouterEvent)) {
      console.log(
        `🔄 [${new Date().toISOString()}] Non-router event:`,
        event.constructor.name,
        event
      );
      return;
    }

    const timestamp = new Date().toISOString();

    // Use instanceof checks for proper type narrowing
    if (event instanceof NavigationStart) {
      console.log(`🚀 [${timestamp}] NavigationStart:`, {
        id: event.id,
        url: event.url,
        navigationTrigger: event.navigationTrigger,
        restoredState: event.restoredState,
      });
    } else if (event instanceof RoutesRecognized) {
      console.log(`🛤️ [${timestamp}] RoutesRecognized:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
        state: event.state,
      });
    } else if (event instanceof GuardsCheckStart) {
      console.log(`🛡️ [${timestamp}] GuardsCheckStart:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
      });
    } else if (event instanceof GuardsCheckEnd) {
      console.log(`✅ [${timestamp}] GuardsCheckEnd:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
        shouldActivate: event.shouldActivate,
      });
    } else if (event instanceof ResolveStart) {
      console.log(`🔍 [${timestamp}] ResolveStart:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
      });
    } else if (event instanceof ResolveEnd) {
      console.log(`✨ [${timestamp}] ResolveEnd:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
      });
    } else if (event instanceof NavigationEnd) {
      console.log(`🏁 [${timestamp}] NavigationEnd:`, {
        id: event.id,
        url: event.url,
        urlAfterRedirects: event.urlAfterRedirects,
      });
    } else if (event instanceof NavigationCancel) {
      console.log(`❌ [${timestamp}] NavigationCancel:`, {
        id: event.id,
        url: event.url,
        reason: event.reason,
      });
    } else if (event instanceof NavigationError) {
      console.error(`💥 [${timestamp}] NavigationError:`, {
        id: event.id,
        url: event.url,
        error: event.error,
      });
    } else if (event instanceof ChildActivationStart) {
      const childActivationStart = event as ChildActivationStart;
      console.log(`🌱 [${timestamp}] ChildActivationStart:`, {
        path: childActivationStart.snapshot?.routeConfig?.path || 'unknown',
      });
    } else if (event instanceof ActivationStart) {
      const activationStart = event as ActivationStart;
      console.log(`🎯 [${timestamp}] ActivationStart:`, {
        path: activationStart.snapshot?.routeConfig?.path || 'unknown',
      });
    } else if (event instanceof ActivationEnd) {
      const activationEnd = event as ActivationEnd;
      console.log(`🎉 [${timestamp}] ActivationEnd:`, {
        path: activationEnd.snapshot?.routeConfig?.path || 'unknown',
      });
    } else if (event instanceof ChildActivationEnd) {
      const childActivationEnd = event as ChildActivationEnd;
      console.log(`🌿 [${timestamp}] ChildActivationEnd:`, {
        path: childActivationEnd.snapshot?.routeConfig?.path || 'unknown',
      });
    } else {
      console.log(`❓ [${timestamp}] Unknown Router Event:`, event.constructor.name, event);
    }
  }

  /**
   * Log navigation performance metrics
   */
  static logNavigationPerformance(router: Router): void {
    if (!this.isEnabled) return;

    let navigationStart: number;

    router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      navigationStart = performance.now();
    });

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const duration = performance.now() - navigationStart;
        console.log(`⚡ [${new Date().toISOString()}] Navigation Performance:`, {
          url: event.url,
          urlAfterRedirects: event.urlAfterRedirects,
          duration: `${duration.toFixed(2)}ms`,
        });
      });
  }

  /**
   * Create a router event summary for debugging
   */
  static createEventSummary(
    router: Router
  ): Promise<{ type: string; timestamp: string; data: RouterEvent }[]> {
    return new Promise((resolve) => {
      const events: { type: string; timestamp: string; data: RouterEvent }[] = [];
      const subscription = router.events.subscribe((event) => {
        // Only collect RouterEvent instances
        if (!(event instanceof RouterEvent)) {
          return;
        }

        events.push({
          type: event.constructor.name,
          timestamp: new Date().toISOString(),
          data: event,
        });

        // Stop collecting after NavigationEnd
        if (event instanceof NavigationEnd) {
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(events);
          }, 100);
        }
      });
    });
  }
}
