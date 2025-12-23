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

import { Component } from '@angular/core';
import { mergeClasses } from '../../shared/utils/merge-classes';

@Component({
  selector: 'label[hlmLabel]',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class HlmLabelComponent {
  protected computedClass(): string {
    return mergeClasses(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    );
  }
}
