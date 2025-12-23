/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:17:00
 * Last Updated: 2025-12-22T04:57:49
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { RxJSOperationsService } from '../../infrastructure/services/rxjs-operations.service';
import { AngularDIOperationsService } from '../../infrastructure/services/angular-di-operations.service';

@Injectable({
  providedIn: 'root',
})
export class TracingService {
  private currentRoute = '';
  private rxjsOps = inject(RxJSOperationsService);
  private angularDI = inject(AngularDIOperationsService);

  constructor() {
    this.initializeRouteTracing();
  }

  private initializeRouteTracing(): void {
    this.angularDI.subscribeToNavigation((url) => {
      const previousRoute = this.currentRoute;
      this.currentRoute = url;

      if (previousRoute) {
        console.log(`[Tracing] Navigation: ${previousRoute} → ${this.currentRoute}`, {
          navigation_trigger: 'router',
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  // Decorator for tracing component methods
  traceMethod(operationName?: string) {
    return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const methodName = operationName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = function (...args: unknown[]) {
        console.log(`[Tracing] Method: ${methodName}`);
        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }

  // Decorator for tracing async operations
  traceAsync(operationName?: string) {
    return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const methodName = operationName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = function (...args: unknown[]) {
        console.log(`[Tracing] Async operation: ${methodName}`);
        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }
}
