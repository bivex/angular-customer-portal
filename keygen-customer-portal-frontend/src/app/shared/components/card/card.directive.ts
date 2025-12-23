/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:39
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[zCard]',
  standalone: true,
})
export class ZCardDirective {
  @HostBinding('class')
  readonly elementClass =
    'relative z-10 space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/40 transition-all duration-300';
}
