/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T16:15:00
 * Last Updated: 2025-12-22T04:57:50
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Theme {
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

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  private currentThemeId = signal<string>('vibrant-aura');

  // Available themes
  readonly themes: Theme[] = [
    {
      id: 'default',
      name: 'Default Theme',
      description: 'Clean and professional design',
      preview: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        accent: 'bg-accent',
        background: 'bg-background',
      },
      colors: {
        primary: 'hsl(222.2 47.4% 11.2%)',
        secondary: 'hsl(210 40% 96%)',
        accent: 'hsl(210 40% 96%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        muted: 'hsl(210 40% 96%)',
        border: 'hsl(214.3 31.8% 91.4%)',
      },
    },
    {
      id: 'ocean-vibe',
      name: '🌊 Ocean Vibe',
      description: 'Refreshing blue tones inspired by the ocean',
      preview: {
        primary: 'bg-ocean-vibe-500',
        secondary: 'bg-ocean-vibe-100',
        accent: 'bg-ocean-vibe-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.643 0.215 28.81)',
        secondary: 'oklch(0.894 0.056 19.64)',
        accent: 'oklch(0.766 0.139 22.94)',
        background: 'hsl(0 0% 100%)',
        foreground: 'oklch(0.281 0.108 31.42)',
        muted: 'oklch(0.928 0.037 19.95)',
        border: 'oklch(0.83 0.094 20.89)',
      },
    },
    {
      id: 'office-blue',
      name: '💼 Office Blue',
      description: 'Professional blue color scheme',
      preview: {
        primary: 'bg-office-blue-500',
        secondary: 'bg-office-blue-100',
        accent: 'bg-office-slate-200',
        background: 'bg-background',
      },
      colors: {
        primary: 'hsl(221.2 83.2% 53.3%)',
        secondary: 'hsl(210 40% 96%)',
        accent: 'hsl(214.3 31.8% 91.4%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        muted: 'hsl(210 40% 96%)',
        border: 'hsl(214.3 31.8% 91.4%)',
      },
    },
    {
      id: 'calm-energy',
      name: '⚡ Calm Energy',
      description: 'Balanced gray tones with calm energy',
      preview: {
        primary: 'bg-calm-energy-600',
        secondary: 'bg-calm-energy-100',
        accent: 'bg-calm-energy-300',
        background: 'bg-background',
      },
      colors: {
        primary: '#616161',
        secondary: '#d1d1d1',
        accent: 'oklch(0.765 0.175 62.57)',
        background: 'hsl(0 0% 100%)',
        foreground: '#1b1b1b',
        muted: '#dadada',
        border: 'oklch(0.813 0.055 63.25)',
      },
    },
    {
      id: 'deep-hue',
      name: '🎨 Deep Hue',
      description: 'Rich and deep color tones',
      preview: {
        primary: 'bg-deep-hue-600',
        secondary: 'bg-deep-hue-100',
        accent: 'bg-deep-hue-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.575 0.189 27.24)',
        secondary: 'oklch(0.915 0.012 17.51)',
        accent: 'oklch(0.777 0.085 20.1)',
        background: 'hsl(0 0% 100%)',
        foreground: 'oklch(0.341 0.052 21.9)',
        muted: 'oklch(0.948 0.003 17.75)',
        border: 'oklch(0.842 0.041 19.92)',
      },
    },
    {
      id: 'desert-vision-mix',
      name: '🏜️ Desert Vision Mix',
      description: 'Warm desert-inspired color palette',
      preview: {
        primary: 'bg-desert-vision-mix-600',
        secondary: 'bg-desert-vision-mix-100',
        accent: 'bg-desert-vision-mix-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.516 0.186 257.35)',
        secondary: 'oklch(0.889 0.054 272.56)',
        accent: 'oklch(0.746 0.13 267.7)',
        background: 'hsl(0 0% 100%)',
        foreground: 'oklch(0.271 0.098 257.45)',
        muted: 'oklch(0.925 0.036 273.72)',
        border: 'oklch(0.813 0.093 270.82)',
      },
    },
    {
      id: 'gentle-blend-series',
      name: '🌸 Gentle Blend Series',
      description: 'Soft and gentle color transitions',
      preview: {
        primary: 'bg-gentle-blend-series-600',
        secondary: 'bg-gentle-blend-series-100',
        accent: 'bg-gentle-blend-series-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.531 0.116 109.76)',
        secondary: 'oklch(0.933 0.203 109.76)',
        accent: 'oklch(0.77 0.168 109.76)',
        background: 'hsl(0 0% 100%)',
        foreground: 'oklch(0.284 0.062 109.76)',
        muted: 'oklch(0.977 0.131 108.58)',
        border: 'oklch(0.857 0.187 109.76)',
      },
    },
    {
      id: 'delicate-blend-collection',
      name: '🎨 Delicate Blend Collection Design Tokens',
      description: 'Elegant and delicate color palette with soft purple transitions',
      preview: {
        primary: 'bg-delicate-blend-collection-500',
        secondary: 'bg-delicate-blend-collection-100',
        accent: 'bg-delicate-blend-collection-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.614 0.215 281.6)',
        secondary: 'oklch(0.854 0.072 264.85)',
        accent: 'oklch(0.731 0.139 272.16)',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f8fafc',
        border: '#e2e8f0',
      },
    },
    {
      id: 'vibrant-aura',
      name: '✨ Vibrant Aura Design Tokens',
      description: 'Dynamic and vibrant color palette with energetic transitions',
      preview: {
        primary: 'bg-vibrant-aura-500',
        secondary: 'bg-vibrant-aura-100',
        accent: 'bg-vibrant-aura-300',
        background: 'bg-background',
      },
      colors: {
        primary: 'oklch(0.651 0.063 56.33)',
        secondary: 'oklch(0.829 0.009 34.42)',
        accent: 'oklch(0.79 0.067 55.23)',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f8fafc',
        border: '#e2e8f0',
      },
    },
    {
      id: 'dark',
      name: '🌙 Dark Theme',
      description: 'Easy on the eyes dark interface',
      preview: {
        primary: 'bg-neutral-800',
        secondary: 'bg-neutral-700',
        accent: 'bg-neutral-600',
        background: 'bg-neutral-900',
      },
      colors: {
        primary: 'hsl(222.2 84% 4.9%)',
        secondary: 'hsl(217.2 32.6% 17.5%)',
        accent: 'hsl(217.2 32.6% 17.5%)',
        background: 'hsl(222.2 84% 4.9%)',
        foreground: 'hsl(210 40% 98%)',
        muted: 'hsl(217.2 32.6% 17.5%)',
        border: 'hsl(217.2 32.6% 17.5%)',
      },
    },
  ];

  // Computed signals
  readonly currentTheme = computed(
    () => this.themes.find((t) => t.id === this.currentThemeId()) || this.themes[0]
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize from localStorage
      const savedTheme = localStorage.getItem('selected-theme') || 'vibrant-aura';
      this.setTheme(savedTheme);
    }
  }

  setTheme(themeId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const theme = this.themes.find((t) => t.id === themeId);
    if (!theme) return;

    this.currentThemeId.set(themeId);

    const root = document.documentElement;

    // Apply theme colors as CSS custom properties (without hsl() wrapper)
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Set both --theme-* and direct variables for flexibility
      root.style.setProperty(`--theme-${key}`, value);
      root.style.setProperty(`--${key}`, value);
    });

    // Handle special cases for dark theme
    if (themeId === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selected-theme', themeId);
    }

    // Emit theme change event
    window.dispatchEvent(
      new CustomEvent('theme-changed', {
        detail: { themeId, theme },
      })
    );
  }

  getTheme(themeId: string): Theme | undefined {
    return this.themes.find((t) => t.id === themeId);
  }

  getCurrentThemeId(): string {
    return this.currentThemeId();
  }
}
