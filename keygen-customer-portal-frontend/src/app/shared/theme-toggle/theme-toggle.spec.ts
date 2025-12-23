/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T02:14:48
 * Last Updated: 2025-12-20T22:05:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';

import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let component: ThemeToggle;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    // Create component instance manually to avoid template loading issues
    // We'll mock the platform check to avoid DOM manipulation
    component = new ThemeToggle('browser');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isDark signal initialized to false', () => {
    expect(component.isDark()).toBe(false);
  });

  it('should toggle theme when in browser environment', () => {
    // Mock DOM elements
    const mockClassList = {
      toggle: vi.fn().mockReturnValue(true),
    };
    Object.defineProperty(document, 'documentElement', {
      value: { classList: mockClassList },
      writable: true,
    });

    // Mock localStorage
    const mockLocalStorage = { setItem: vi.fn() };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    component.toggleTheme();

    expect(mockClassList.toggle).toHaveBeenCalledWith('dark');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(component.isDark()).toBe(true);
  });
});
