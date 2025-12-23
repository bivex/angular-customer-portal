/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T13:31:53
 * Last Updated: 2025-12-20T22:05:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';
import { LucideAngularModule } from 'lucide-angular';

import { iconVariants, type ZardIconVariants } from './icon.variants';
import { ZARD_ICONS, type ZardIcon } from './icons';

import { mergeClasses } from '@/shared/utils/merge-classes';

@Component({
  selector: 'z-icon, [z-icon]',
  imports: [LucideAngularModule],
  standalone: true,
  template: `
    <lucide-angular
      [img]="icon()"
      [strokeWidth]="zStrokeWidth()"
      [absoluteStrokeWidth]="zAbsoluteStrokeWidth()"
      [class]="classes()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {},
})
export class ZardIconComponent {
  readonly zType = input.required<ZardIcon>();
  readonly zSize = input<ZardIconVariants['zSize']>('default');
  readonly zStrokeWidth = input<number>(2);
  readonly zAbsoluteStrokeWidth = input<boolean>(false);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      iconVariants({ zSize: this.zSize() }),
      this.class(),
      this.zStrokeWidth() === 0 ? 'stroke-none' : ''
    )
  );

  protected readonly icon = computed(() => {
    const type = this.zType();
    if (typeof type === 'string') {
      return ZARD_ICONS[type];
    }

    return type;
  });
}
