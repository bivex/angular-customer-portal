/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:04
 * Last Updated: 2025-12-22T09:16:54
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../application/services/auth';
import { TranslateService } from '@ngx-translate/core';
import { TracingService } from '../../application/services/tracing.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { GridComponent, GridItemComponent, GridService } from '../../shared/grid';
import { DashboardLoadingComponent } from './components/dashboard-loading.component';
import { DashboardHeaderComponent } from './components/dashboard-header.component';
import { DashboardWelcomeComponent } from './components/dashboard-welcome.component';
import { UsageInsightsComponent } from './components/usage-insights.component';
import { QuickActionsComponent } from './components/quick-actions.component';
import { RecentActivityComponent } from './components/recent-activity.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    GridComponent,
    GridItemComponent,
    DashboardLoadingComponent,
    DashboardHeaderComponent,
    DashboardWelcomeComponent,
    UsageInsightsComponent,
    QuickActionsComponent,
    RecentActivityComponent,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  authState$: Observable<{ user: User | null; isLoading: boolean }>;
  isMobile = signal(false);
  motivationalMessage = signal('');
  activeSection = signal('overview');

  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private tracing = inject(TracingService);
  private gridService = inject(GridService);
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;

  // Responsive grid configuration
  statsGridCols = computed(() => {
    return this.isMobile() ? 1 : 3;
  });

  actionsGridCols = computed(() => {
    return this.isMobile() ? 1 : 2;
  });

  constructor() {
    this.authState$ = this.authService.authState;

    // Initialize motivational message once
    this.motivationalMessage.set(this.getMotivationalMessage());

    // Subscribe to mobile breakpoint changes
    this.gridService.isMobile().subscribe((isMobile) => {
      this.isMobile.set(isMobile);
    });
  }

  ngOnInit(): void {
    // Setup intersection observer for section navigation
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  get dashboardTitle(): string {
    return this.translate.instant('dashboard.title');
  }

  getWelcomeMessage(user: User | null): string {
    if (!user) return '';

    const hour = new Date().getHours();
    let greetingKey = 'dashboard.welcome.morning';

    if (hour >= 12 && hour < 17) {
      greetingKey = 'dashboard.welcome.afternoon';
    } else if (hour >= 17 || hour < 5) {
      greetingKey = 'dashboard.welcome.evening';
    }

    return this.translate.instant(greetingKey, { name: user.name || user.email.split('@')[0] });
  }

  getTimeBasedIcon(): any {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) return 'sun';
    return 'moon';
  }

  getMotivationalMessage(): string {
    const messages = [
      'dashboard.motivation.ready',
      'dashboard.motivation.productive',
      'dashboard.motivation.explore',
    ];
    // Using Math.random() for UI display purposes - not security-critical
    const randomIndex = Math.floor(Math.random() * messages.length);
    return this.translate.instant(messages[randomIndex]);
  }

  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }

  private setupIntersectionObserver(): void {
    const sections = ['overview', 'insights', 'actions', 'activity'];

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sections.includes(sectionId)) {
              this.activeSection.set(sectionId);
            }
          }
        });
      },
      {
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      }
    );

    // Observe all sections
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        this.intersectionObserver?.observe(element);
      }
    });
  }

  handleActionClick(action: string): void {
    // Handle different action clicks
    switch (action) {
      case 'create-api-key':
        this.router.navigate(['/api-keys/create']);
        break;
      case 'configure-webhooks':
        this.router.navigate(['/webhooks']);
        break;
      case 'api-playground':
        this.router.navigate(['/playground']);
        break;
      case 'security-settings':
        this.router.navigate(['/settings/security']);
        break;
      case 'download-sdk':
        this.router.navigate(['/downloads']);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
}
