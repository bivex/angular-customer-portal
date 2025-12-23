/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T16:15:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../application/services/theme.service';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
}

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-picker.html',
})
export class ThemePickerComponent {
  private themeService = inject(ThemeService);

  get currentTheme(): string {
    return this.themeService.getCurrentThemeId();
  }

  get themes(): Theme[] {
    return this.themeService.themes;
  }

  selectTheme(themeId: string): void {
    console.log('Selected theme:', themeId);
    this.themeService.setTheme(themeId);
  }

  getCurrentTheme(): Theme | undefined {
    return this.themeService.currentTheme();
  }
}
