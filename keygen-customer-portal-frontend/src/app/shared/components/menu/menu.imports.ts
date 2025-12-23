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

import { ZardContextMenuDirective } from '@/shared/components/menu/context-menu.directive';
import { ZardMenuContentDirective } from '@/shared/components/menu/menu-content.directive';
import { ZardMenuItemDirective } from '@/shared/components/menu/menu-item.directive';
import { ZardMenuLabelComponent } from '@/shared/components/menu/menu-label.component';
import { ZardMenuShortcutComponent } from '@/shared/components/menu/menu-shortcut.component';
import { ZardMenuDirective } from '@/shared/components/menu/menu.directive';

export const ZardMenuImports = [
  ZardContextMenuDirective,
  ZardMenuContentDirective,
  ZardMenuItemDirective,
  ZardMenuDirective,
  ZardMenuLabelComponent,
  ZardMenuShortcutComponent,
] as const;
