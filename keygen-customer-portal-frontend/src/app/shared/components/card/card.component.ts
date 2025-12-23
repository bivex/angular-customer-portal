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

import { Component } from '@angular/core';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'z-card',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZCardComponent {
  protected computedClass(): string {
    return mergeClasses('rounded-lg border bg-card text-card-foreground shadow-sm');
  }
}

@Component({
  selector: 'z-card-header',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZCardHeaderComponent {
  protected computedClass(): string {
    return mergeClasses('flex flex-col space-y-1.5 p-6');
  }
}

@Component({
  selector: 'z-card-title',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZCardTitleComponent {
  protected computedClass(): string {
    return mergeClasses('text-2xl font-semibold leading-none tracking-tight');
  }
}

@Component({
  selector: 'z-card-content',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZCardContentComponent {
  protected computedClass(): string {
    return mergeClasses('p-6 pt-0');
  }
}

@Component({
  selector: 'z-card-description',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  host: {
    '[class]': 'computedClass()',
  },
})
export class ZCardDescriptionComponent {
  protected computedClass(): string {
    return mergeClasses('text-sm text-muted-foreground');
  }
}
