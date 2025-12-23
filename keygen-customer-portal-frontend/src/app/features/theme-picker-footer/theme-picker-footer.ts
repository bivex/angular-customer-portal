/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T19:50:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../application/services/theme.service';

@Component({
  selector: 'app-theme-picker-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-picker-footer.html',
})
export class ThemePickerFooter {
  private themeService = inject(ThemeService);

  protected isOpen = signal(false);
  protected themes = this.themeService.themes;

  get currentTheme(): Theme {
    return this.themeService.currentTheme();
  }

  togglePicker(): void {
    this.isOpen.update((open) => !open);
  }

  selectTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.isOpen.set(false);
  }

  isCurrentTheme(themeId: string): boolean {
    return this.themeService.getCurrentThemeId() === themeId;
  }
}
