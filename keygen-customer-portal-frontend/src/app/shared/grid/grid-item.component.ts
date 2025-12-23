/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:56:00
 * Last Updated: 2025-12-19T10:33:21
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-grid-item',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'block min-w-0 flex-grow', // Tailwind classes for display: block and min-width: 0 and flex-grow
    '[style.grid-column]': 'gridColumn()',
  },
})
export class GridItemComponent {
  span = input(1);
  start = input<number | null>(null);
  end = input<number | null>(null);

  gridColumn = computed(() => {
    if (this.start() && this.end()) {
      return `${this.start()} / ${this.end()}`;
    } else if (this.span()) {
      return `span ${this.span()}`;
    }
    return 'auto';
  });
}
