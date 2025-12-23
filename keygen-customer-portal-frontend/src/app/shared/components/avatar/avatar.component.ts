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
import { NgClass } from '@angular/common';

@Component({
  selector: 'z-avatar',
  standalone: true,
  imports: [NgClass],
  template: `
    <div [ngClass]="avatarClasses" class="avatar">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .avatar {
        @apply relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full;
      }
      .avatar-xl {
        @apply h-16 w-16;
      }
    `,
  ],
})
export class ZAvatarComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get avatarClasses(): string {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'avatar-xl',
    };
    return sizeClasses[this.size];
  }
}
