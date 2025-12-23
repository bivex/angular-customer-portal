/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:37
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Directive } from '@angular/core';
import { mergeClasses } from '../../shared/utils/merge-classes';

@Directive({
  selector: 'input[hlmInput], textarea[hlmInput]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
})
export class HlmInputDirective {
  protected computedClass(): string {
    return mergeClasses(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    );
  }
}
