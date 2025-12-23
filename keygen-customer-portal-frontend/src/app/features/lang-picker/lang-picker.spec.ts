/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T12:30:00
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { LangPicker } from './lang-picker';

describe('LangPicker', () => {
  let component: LangPicker;
  let translateService: any;
  let langChangeSubject: Subject<any>;

  beforeEach(() => {
    langChangeSubject = new Subject();
    const translateServiceSpy = {
      use: vi.fn().mockReturnValue(of({})),
      currentLang: 'en',
      defaultLang: 'en',
      onLangChange: langChangeSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: translateServiceSpy }],
    });

    // Create component instance manually to avoid template loading issues
    component = new LangPicker(translateServiceSpy);
    translateService = translateServiceSpy;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default language', () => {
    component.ngOnInit();
    expect(component.currentLang()).toBe('en');
  });

  it('should return correct current language object', () => {
    component.ngOnInit();
    const currentLang = component.getCurrentLanguage();
    expect(currentLang.code).toBe('en');
    expect(currentLang.name).toBe('English');
    expect(currentLang.flag).toBe('🇺🇸');
  });

  it('should toggle dropdown', () => {
    expect(component.dropdownOpen()).toBe(false);
    component.toggleDropdown();
    expect(component.dropdownOpen()).toBe(true);
    component.toggleDropdown();
    expect(component.dropdownOpen()).toBe(false);
  });

  it('should select language and close dropdown', () => {
    component.dropdownOpen.set(true);

    component.selectLanguage('es');

    expect(translateService.use).toHaveBeenCalledWith('es');
    expect(component.dropdownOpen()).toBe(false);
  });

  it('should handle language switch error gracefully', () => {
    translateService.use.mockImplementation(() => {
      throw new Error('Translation error');
    });
    component.dropdownOpen.set(true);

    expect(() => component.selectLanguage('es')).not.toThrow();
    expect(component.dropdownOpen()).toBe(false);
  });

  it('should close dropdown', () => {
    component.dropdownOpen.set(true);
    component.closeDropdown();
    expect(component.dropdownOpen()).toBe(false);
  });

  it('should have three supported languages', () => {
    expect(component.languages).toHaveLength(3);
    expect(component.languages.map((l) => l.code)).toEqual(['en', 'es', 'ru']);
  });

  it('should update current language on service change', () => {
    component.ngOnInit();

    // Simulate language change
    langChangeSubject.next({ lang: 'es' });

    expect(component.currentLang()).toBe('es');
  });
});
