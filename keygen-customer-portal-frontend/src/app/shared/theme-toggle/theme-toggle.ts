/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T02:42:33
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideMoon, lucidePalette } from '../icons';
import { ZButtonComponent } from '../components/button/button.component';
import { ZardIconComponent } from '../components/icon/icon.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [ZButtonComponent, ZardIconComponent],
  templateUrl: './theme-toggle.html',
  providers: [provideIcons({ lucideSun, lucideMoon, lucidePalette })],
})
export class ThemeToggle {
  isDark = signal(false);

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Only initialize DOM-related code if document is available
      if (typeof document !== 'undefined' && document.documentElement) {
        // Check initial theme
        this.isDark.set(document.documentElement.classList.contains('dark'));

        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
              this.isDark.set(document.documentElement.classList.contains('dark'));
            }
          });
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
      }
    }
  }

  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof document !== 'undefined' && document.documentElement) {
        const isDark = document.documentElement.classList.toggle('dark');
        this.isDark.set(isDark);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
      }
    }
  }
}
