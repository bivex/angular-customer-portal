/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T19:08:00
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AngularDIOperationsService {
  private router = inject(Router);

  navigate(commands: any[], extras?: any): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }

  getCurrentUrl(): string {
    return this.router.url;
  }

  subscribeToNavigation(callback: (url: string) => void): () => void {
    const subscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        callback(event.urlAfterRedirects);
      });

    return () => subscription.unsubscribe();
  }
}
