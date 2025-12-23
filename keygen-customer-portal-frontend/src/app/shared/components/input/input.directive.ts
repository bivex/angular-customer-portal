/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-22T01:04:10
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Directive, ElementRef, inject } from '@angular/core';
import { mergeClasses } from '../../utils/merge-classes';

@Directive({
  selector: 'input[z-input], textarea[z-input]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZInputDirective {
  private readonly elementRef = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);

  size = {
    set: (size: string) => {
      // Size handling can be implemented if needed
    },
  };

  disable(disabled: boolean) {
    if (disabled) {
      this.elementRef.nativeElement.setAttribute('disabled', '');
    } else {
      this.elementRef.nativeElement.removeAttribute('disabled');
    }
  }

  setDataSlot(slot: string) {
    this.elementRef.nativeElement.setAttribute('data-slot', slot);
  }

  getType(): 'default' | 'textarea' | null | undefined {
    const tagName = this.elementRef.nativeElement.tagName.toLowerCase();
    if (tagName === 'textarea') {
      return 'textarea';
    }
    return 'default';
  }

  protected computedClass(): string {
    return mergeClasses(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 autofill:bg-background autofill:text-foreground'
    );
  }
}

// Alias for backward compatibility
export const ZardInputDirective = ZInputDirective;
