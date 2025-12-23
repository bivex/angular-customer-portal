/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:38
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { NgModule } from '@angular/core';

import { ContentComponent } from './content.component';
import { FooterComponent } from './footer.component';
import { HeaderComponent } from './header.component';
import { LayoutComponent } from './layout.component';
import {
  SidebarGroupLabelComponent,
  SidebarGroupComponent,
  SidebarComponent,
} from './sidebar.component';

const LAYOUT_COMPONENTS = [
  LayoutComponent,
  HeaderComponent,
  FooterComponent,
  ContentComponent,
  SidebarComponent,
  SidebarGroupComponent,
  SidebarGroupLabelComponent,
];

@NgModule({
  imports: [LAYOUT_COMPONENTS],
  exports: [LAYOUT_COMPONENTS],
})
export class LayoutModule {}
