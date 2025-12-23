/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T13:31:53
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ZardUI Components
import { ZButtonComponent } from '../../shared/components/button/button.component';
import { ZInputDirective } from '../../shared/components/input/input.directive';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';

// Services
import { ThemeService } from '../../application/services/theme.service';

// Icons
import { ZARD_ICONS } from '../../shared/components/icon/icons';

@Component({
  selector: 'app-theme-showcase',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZButtonComponent,
    ZInputDirective,
    ZardIconComponent,
    ZardCheckboxComponent,
  ],
  templateUrl: './theme-showcase.html',
  styleUrl: './theme-showcase.css',
})
export class ThemeShowcase {
  private platformId = inject(PLATFORM_ID);
  private themeService = inject(ThemeService);

  // Theme state
  isDark = false;

  // Form data
  formData = {
    email: '',
    password: '',
    rememberMe: false,
    selectedOption: '',
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize theme from ThemeService
      const currentThemeId = this.themeService.getCurrentThemeId();
      this.isDark = currentThemeId === 'dark';
    }
  }

  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Use ThemeService to toggle between light and dark themes
      const newTheme = this.isDark ? 'default' : 'dark';
      this.themeService.setTheme(newTheme);
      this.isDark = !this.isDark;
    }
  }

  onSubmit(): void {
    console.log('Form submitted:', this.formData);
    alert('Form submitted! Check console for data.');
  }

  // Color palette data
  colorPalette = [
    { name: 'Primary', bg: 'bg-primary', text: 'text-primary-foreground' },
    { name: 'Secondary', bg: 'bg-secondary', text: 'text-secondary-foreground' },
    { name: 'Accent', bg: 'bg-accent', text: 'text-accent-foreground' },
    { name: 'Muted', bg: 'bg-muted', text: 'text-muted-foreground' },
    { name: 'Destructive', bg: 'bg-destructive', text: 'text-destructive-foreground' },
    { name: 'Card', bg: 'bg-card', text: 'text-card-foreground' },
    { name: 'Popover', bg: 'bg-popover', text: 'text-popover-foreground' },
  ];

  matureBlendShades = [
    { shade: 50, bg: 'bg-mature-blend-50' },
    { shade: 100, bg: 'bg-mature-blend-100' },
    { shade: 200, bg: 'bg-mature-blend-200' },
    { shade: 300, bg: 'bg-mature-blend-300' },
    { shade: 400, bg: 'bg-mature-blend-400' },
    { shade: 500, bg: 'bg-mature-blend-500' },
    { shade: 600, bg: 'bg-mature-blend-600' },
    { shade: 700, bg: 'bg-mature-blend-700' },
    { shade: 800, bg: 'bg-mature-blend-800' },
    { shade: 900, bg: 'bg-mature-blend-900' },
    { shade: 950, bg: 'bg-mature-blend-950' },
  ];

  buttonVariants: {
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    label: string;
  }[] = [
    { variant: 'default', label: 'Default' },
    { variant: 'secondary', label: 'Secondary' },
    { variant: 'outline', label: 'Outline' },
    { variant: 'ghost', label: 'Ghost' },
    { variant: 'link', label: 'Link' },
    { variant: 'destructive', label: 'Destructive' },
  ];

  buttonSizes: { size: 'default' | 'sm' | 'lg' | 'icon'; label: string }[] = [
    { size: 'sm', label: 'Small' },
    { size: 'default', label: 'Default' },
    { size: 'lg', label: 'Large' },
  ];

  icons = [
    'user',
    'house',
    'settings',
    'search',
    'heart',
    'star',
    'check',
    'circle-x',
    'plus',
    'minus',
    'chevron-down',
    'chevron-right',
    'mail',
    'calendar',
    'clock',
  ] as const;
}
