/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:37
 * Last Updated: 2025-12-23T02:28:37
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkMenu } from '@angular/cdk/menu';
import { computed, Directive, inject, input, type OnInit } from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '@/shared/utils/merge-classes';

import { menuContentVariants } from './menu.variants';

@Directive({
  selector: '[z-menu-content]',
  host: {
    '[class]': 'classes()',
    tabindex: '0',
  },
  hostDirectives: [CdkMenu, CdkTrapFocus],
})
export class ZardMenuContentDirective implements OnInit {
  private cdkTrapFocus = inject(CdkTrapFocus);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(menuContentVariants(), this.class()));

  ngOnInit(): void {
    this.cdkTrapFocus.enabled = true;
    this.cdkTrapFocus.autoCapture = true;
  }
}
