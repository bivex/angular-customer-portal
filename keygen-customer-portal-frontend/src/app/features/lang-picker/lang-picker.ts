/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T12:00:00
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-lang-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-picker.html',
})
export class LangPicker implements OnInit {
  private translateService: TranslateService;

  constructor(translateService: TranslateService) {
    this.translateService = translateService;
  }

  protected readonly dropdownOpen = signal(false);
  protected readonly currentLang = signal<string>('en');

  protected readonly languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  ngOnInit(): void {
    // Get current language from translate service
    this.currentLang.set(
      this.translateService.currentLang || this.translateService.defaultLang || 'en'
    );

    // Subscribe to language changes
    this.translateService.onLangChange.subscribe((event) => {
      this.currentLang.set(event.lang);
    });
  }

  protected getCurrentLanguage(): Language {
    return this.languages.find((lang) => lang.code === this.currentLang()) || this.languages[0];
  }

  protected toggleDropdown(): void {
    this.dropdownOpen.update((open) => !open);
  }

  protected selectLanguage(langCode: string): void {
    try {
      this.translateService.use(langCode);
    } catch (error) {
      console.error('Failed to switch language:', error);
      // Component continues to work even if language switch fails
    } finally {
      // Always close the dropdown regardless of success or failure
      this.dropdownOpen.set(false);
    }
  }

  protected closeDropdown(): void {
    this.dropdownOpen.set(false);
  }
}
