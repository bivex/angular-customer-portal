/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-22T01:39:05
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'z-button, button[z-button], a[z-button]',
  standalone: true,
  imports: [CommonModule],
  template: ` <ng-content></ng-content> `,
  host: {
    role: 'button',
    '[class]': 'computedClass()',
    '[attr.disabled]': 'disabled || loading || null',
    '[attr.type]': 'type',
    '[attr.aria-disabled]': 'disabled || loading',
  },
})
export class ZButtonComponent {
  @Input() variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' =
    'default';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  // Backward compatibility aliases
  @Input() set zType(
    value: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  ) {
    this.variant = value;
  }

  @Input() set zSize(value: 'default' | 'sm' | 'lg' | 'icon') {
    this.size = value;
  }

  @Input() set zDisabled(value: boolean) {
    this.disabled = value;
  }

  @Input() set zLoading(value: boolean) {
    this.loading = value;
  }

  protected computedClass(): string {
    const isDisabled = this.disabled || this.loading;

    return mergeClasses(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      isDisabled && 'pointer-events-none opacity-50',
      !isDisabled && 'active:scale-[0.98] cursor-pointer',
      this.loading && 'cursor-wait',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md':
          this.variant === 'default',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md':
          this.variant === 'destructive',
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm':
          this.variant === 'outline',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm':
          this.variant === 'secondary',
        'hover:bg-accent hover:text-accent-foreground': this.variant === 'ghost',
        'text-primary underline-offset-4 hover:underline hover:text-primary/80':
          this.variant === 'link',
      },
      {
        'h-10 px-4 py-2': this.size === 'default',
        'h-9 rounded-md px-3 text-xs': this.size === 'sm',
        'h-12 rounded-md px-8 text-base': this.size === 'lg',
        'h-10 w-10': this.size === 'icon',
      }
    );
  }
}

// Alias for backward compatibility
export const ZardButtonComponent = ZButtonComponent;
