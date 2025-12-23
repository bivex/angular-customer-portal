/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Provider } from '@angular/core';
import { EVENT_MANAGER_PLUGINS } from '@angular/platform-browser';
import { ZardDebounceEventManagerPlugin } from './event-manager-plugins/zard-debounce-event-manager-plugin';
import { ZardEventManagerPlugin } from './event-manager-plugins/zard-event-manager-plugin';

export function provideZard(): Provider[] {
  return [
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: ZardDebounceEventManagerPlugin,
      multi: true,
    },
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: ZardEventManagerPlugin,
      multi: true,
    },
  ];
}
