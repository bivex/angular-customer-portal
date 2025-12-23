/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:27
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

export function isTemplateRef(value: any): value is TemplateRef<any> {
  return value instanceof TemplateRef;
}

interface StringTemplateContext {
  $implicit: string;
}

interface GenericTemplateContext {
  $implicit?: any;
}

@Directive({
  selector: '[zStringTemplateOutlet]',
  standalone: true,
})
export class StringTemplateOutletDirective {
  private _stringTemplateOutlet?: string | TemplateRef<any> | null;

  @Input()
  set zStringTemplateOutlet(value: string | TemplateRef<any> | null) {
    if (value !== this._stringTemplateOutlet) {
      this._stringTemplateOutlet = value;
      this.updateView();
    }
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {}

  private updateView(): void {
    this.viewContainer.clear();

    if (this._stringTemplateOutlet instanceof TemplateRef) {
      this.viewContainer.createEmbeddedView(this._stringTemplateOutlet);
    } else if (typeof this._stringTemplateOutlet === 'string') {
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: this._stringTemplateOutlet,
      });
    } else if (this._stringTemplateOutlet === null || this._stringTemplateOutlet === undefined) {
      // Don't render anything for null/undefined values
      return;
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

// Alias for backward compatibility
export const ZardStringTemplateOutletDirective = StringTemplateOutletDirective;
