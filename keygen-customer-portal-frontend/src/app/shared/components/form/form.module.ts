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

import { NgModule } from '@angular/core';

import {
  ZardFormControlComponent,
  ZardFormFieldComponent,
  ZardFormLabelComponent,
  ZardFormMessageComponent,
} from './form.component';

const FORM_COMPONENTS = [
  ZardFormFieldComponent,
  ZardFormLabelComponent,
  ZardFormControlComponent,
  ZardFormMessageComponent,
];

@NgModule({
  imports: [...FORM_COMPONENTS],
  exports: [...FORM_COMPONENTS],
})
export class ZardFormModule {}
