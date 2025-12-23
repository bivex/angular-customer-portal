/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:56:00
 * Last Updated: 2025-12-19T10:03:35
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, input, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-grid',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    '[style.--grid-gap]': 'gridGap()',
    '[class]': 'gridClasses()',
  },
})
export class GridComponent {
  cols = input(1);
  gap = input('1rem');
  responsive = input(false);

  gridGap = computed(() => this.gap());

  gridClasses = computed(() => {
    const classes = [];

    if (this.responsive()) {
      classes.push('grid-cols-1'); // Mobile default
      classes.push('grid-cols-sm-2'); // Small screens
      classes.push('grid-cols-md-3'); // Medium screens
      classes.push('grid-cols-lg-4'); // Large screens
    } else {
      classes.push(`grid-cols-${this.cols()}`);
    }

    return classes.join(' ');
  });
}
