/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:36
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ZardSheetComponent } from './sheet.component';
import { ZardSheetService } from './sheet.service';
import { ZardButtonComponent } from '@/shared/components/button/button.component';

@NgModule({
  imports: [CommonModule, ZardButtonComponent, ZardSheetComponent, OverlayModule, PortalModule],
  providers: [ZardSheetService],
})
export class ZardSheetModule {}
