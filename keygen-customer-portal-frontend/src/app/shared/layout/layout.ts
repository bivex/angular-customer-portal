/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T00:30:00
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../application/services/auth';
import { LangPicker } from '../../features/lang-picker/lang-picker';
import { ThemePickerFooter } from '../../features/theme-picker-footer/theme-picker-footer';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LangPicker, ThemePickerFooter, TranslatePipe],
  templateUrl: './layout.html',
})
export class Layout implements OnInit, OnDestroy {
  protected readonly title = signal('Keygen Customer Portal');
  protected sidebarOpen = signal(false);
  protected isMobile = signal(false);

  private authService = inject(AuthService);
  protected router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();

  protected readonly isDashboardActive = computed(() => this.router.url === '/dashboard');
  protected readonly isPaletteDemoActive = computed(() => this.router.url === '/palette-demo');
  protected readonly isThemesActive = computed(() => this.router.url === '/themes');
  protected readonly isSessionsActive = computed(() => this.router.url === '/sessions');
  protected readonly isProfileActive = computed(() => this.router.url.startsWith('/user/profile'));

  protected readonly currentPageName = computed(() => {
    const url = this.router.url;
    if (url === '/dashboard') return 'Dashboard';
    if (url === '/palette-demo') return 'Palette Demo';
    if (url === '/themes') return 'Themes';
    if (url === '/sessions') return 'Sessions';
    if (url.startsWith('/user/profile')) return 'Profile';
    if (url.startsWith('/user/change-password')) return 'Change Password';
    return 'Dashboard';
  });

  ngOnInit(): void {
    // Monitor screen size changes
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const wasMobile = this.isMobile();
        this.isMobile.set(result.matches);

        // Auto-close sidebar when switching from mobile to desktop
        if (!result.matches && wasMobile && this.sidebarOpen()) {
          this.sidebarOpen.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  // Handle keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.sidebarOpen()) {
      this.closeSidebar();
    }
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    // Redirect to login page after logout
    this.router.navigate(['/login']);
  }
}
