/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T00:00:00
 * Last Updated: 2025-12-22T00:00:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'z-button-group',
  standalone: true,
  template: `
    <div class="flex gap-2">
      <ng-content></ng-content>
    </div>
  `,
})
export class ZButtonGroupComponent {}
