/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T00:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="alertClasses" role="alert">
      <div class="flex items-center gap-2">
        <ng-content select="z-icon"></ng-content>
        <div class="flex-1">
          <ng-content select="z-alert-title"></ng-content>
          <ng-content select="z-alert-description"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .alert {
        @apply relative w-full rounded-lg border p-4;
      }
      .alert-destructive {
        @apply text-red-600 dark:border-red-500;
        border-color: rgb(239 68 68 / 0.5);
      }
    `,
  ],
})
export class ZAlertComponent {
  @Input() variant: 'default' | 'destructive' = 'default';

  get alertClasses(): string {
    return `alert alert-${this.variant}`;
  }
}

@Component({
  selector: 'z-alert-title',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        @apply mb-1 font-medium leading-none tracking-tight;
      }
    `,
  ],
})
export class ZAlertTitleComponent {}

@Component({
  selector: 'z-alert-description',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        @apply text-sm opacity-90;
      }
    `,
  ],
})
export class ZAlertDescriptionComponent {}
