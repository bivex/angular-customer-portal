/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T22:00:00
 * Last Updated: 2025-12-22T22:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZBadgeComponent {
  @Input() variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  protected computedClass(): string {
    const baseClasses =
      'inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

    const variantClasses = {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive:
        'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'text-foreground',
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}

// Alias for backward compatibility
export const ZardBadgeComponent = ZBadgeComponent;
