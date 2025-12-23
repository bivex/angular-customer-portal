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

import { Injectable } from '@angular/core';

@Injectable()
export class ZardEventManagerPlugin {
  supports(eventName: string): boolean {
    return eventName.startsWith('zard.');
  }

  addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: Event) => void
  ): () => void {
    const [prefix, realEventName] = eventName.split('.');

    const wrappedHandler = (event: Event) => {
      // Add any custom zard-specific event handling logic here
      handler(event);
    };

    element.addEventListener(realEventName, wrappedHandler);

    return () => {
      element.removeEventListener(realEventName, wrappedHandler);
    };
  }
}
