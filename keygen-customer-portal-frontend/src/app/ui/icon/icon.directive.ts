/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Directive } from '@angular/core';
import { mergeClasses } from '../../shared/utils/merge-classes';

@Directive({
  selector: 'ng-icon[hlmIcon]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
})
export class HlmIconDirective {
  protected computedClass(): string {
    return mergeClasses('h-4 w-4');
  }
}
