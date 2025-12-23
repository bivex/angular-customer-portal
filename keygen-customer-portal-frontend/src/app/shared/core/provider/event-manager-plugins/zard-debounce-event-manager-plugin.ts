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

import { Injectable } from '@angular/core';

@Injectable()
export class ZardDebounceEventManagerPlugin {
  supports(eventName: string): boolean {
    return eventName.endsWith('.debounce');
  }

  addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: Event) => void
  ): () => void {
    const [realEventName] = eventName.split('.');
    let timeoutId: number;
    let lastEvent: Event;

    const debouncedHandler = (event: Event) => {
      lastEvent = event;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(lastEvent), 300);
    };

    element.addEventListener(realEventName, debouncedHandler);

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener(realEventName, debouncedHandler);
    };
  }
}
