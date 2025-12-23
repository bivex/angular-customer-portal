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

import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { ZardDropdownService } from './dropdown.service';
import { dropdownItemVariants, type ZardDropdownItemVariants } from './dropdown.variants';

import { mergeClasses } from '@/shared/utils/merge-classes';

@Component({
  selector: 'z-dropdown-menu-item, [z-dropdown-menu-item]',
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.data-disabled]': 'disabled() || null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-inset]': 'inset() || null',
    '[attr.aria-disabled]': 'disabled()',
    '(click.prevent-with-stop)': 'onClick()',
    role: 'menuitem',
    tabindex: '-1',
  },
  exportAs: 'zDropdownMenuItem',
})
export class ZardDropdownMenuItemComponent {
  private readonly dropdownService = inject(ZardDropdownService);

  readonly variant = input<ZardDropdownItemVariants['variant']>('default');
  readonly inset = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  onClick() {
    if (this.disabled()) {
      return;
    }

    // Fechar dropdown após click
    setTimeout(() => {
      this.dropdownService.close();
    }, 0);
  }

  protected readonly classes = computed(() =>
    mergeClasses(
      dropdownItemVariants({
        variant: this.variant(),
        inset: this.inset(),
      }),
      this.class()
    )
  );
}
