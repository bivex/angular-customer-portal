/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component } from '@angular/core';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'label[z-label]',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZLabelComponent {
  protected computedClass(): string {
    return mergeClasses(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    );
  }
}
