/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-23T02:28:41
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './application/services/auth';
import { ThemeService } from './application/services/theme.service';
import { Icon } from './shared/icon/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterModule, TranslateModule, Icon],
})
export class App implements OnInit {
  protected readonly title = signal('keygen-customer-portal-frontend');
  isLoading = true;

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Initialize theme from ThemeService
    if (isPlatformBrowser(this.platformId)) {
      // Force theme initialization to ensure vibrant-aura is applied
      this.themeService.setTheme(this.themeService.getCurrentThemeId());
    }

    // Subscribe to auth state to handle loading
    this.authService.authState.subscribe((state) => {
      this.isLoading = state.isLoading;
    });
  }
}
