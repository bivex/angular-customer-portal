/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:12
 * Last Updated: 2025-12-22T08:50:12
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, ThemeToggle, ZardIconComponent],
  template: `
    <div class="mb-8 flex items-center justify-between min-h-[48px]">
      <div class="selection-elite-black">
        <h1 class="text-3xl font-bold text-foreground mb-3 tracking-tight">
          {{ dashboardTitle() }}
        </h1>
        <p class="text-lg text-muted-foreground leading-relaxed">
          Welcome back! Here's your account overview and quick actions.
        </p>
      </div>
      <div class="flex items-center space-x-4 min-h-[48px]">
        <app-theme-toggle class="h-11 w-11 min-h-[44px] min-w-[44px]"></app-theme-toggle>
        <button
          class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm min-h-[48px] min-w-[48px] text-base"
        >
          Quick Actions
        </button>
      </div>
    </div>

    <!-- Dashboard Section Navigation -->
    <nav class="mb-8" aria-label="Dashboard sections">
      <div class="flex flex-wrap items-center gap-3">
        <a
          href="#overview"
          class="inline-flex items-center px-6 py-3 rounded-lg transition-colors font-medium min-h-[48px] min-w-[48px] text-base touch-none"
          [class]="
            activeSection() === 'overview'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-card text-muted-foreground hover:bg-card/80'
          "
          (click)="$event.preventDefault(); sectionClick.emit('overview')"
        >
          <z-icon
            zType="layout-dashboard"
            zSize="default"
            class="mr-3 min-w-[16px] min-h-[16px]"
          ></z-icon>
          Overview
        </a>
        <a
          href="#insights"
          class="inline-flex items-center px-6 py-3 rounded-lg transition-colors font-medium min-h-[48px] min-w-[48px] text-base touch-none"
          [class]="
            activeSection() === 'insights'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-card text-muted-foreground hover:bg-card/80'
          "
          (click)="$event.preventDefault(); sectionClick.emit('insights')"
        >
          <z-icon zType="arrow-up" zSize="default" class="mr-3 min-w-[16px] min-h-[16px]"></z-icon>
          Insights
        </a>
        <a
          href="#actions"
          class="inline-flex items-center px-6 py-3 rounded-lg transition-colors font-medium min-h-[48px] min-w-[48px] text-base touch-none"
          [class]="
            activeSection() === 'actions'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-card text-muted-foreground hover:bg-card/80'
          "
          (click)="$event.preventDefault(); sectionClick.emit('actions')"
        >
          <z-icon zType="zap" zSize="default" class="mr-3 min-w-[16px] min-h-[16px]"></z-icon>
          Actions
        </a>
        <a
          href="#activity"
          class="inline-flex items-center px-6 py-3 rounded-lg transition-colors font-medium min-h-[48px] min-w-[48px] text-base touch-none"
          [class]="
            activeSection() === 'activity'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-card text-muted-foreground hover:bg-card/80'
          "
          (click)="$event.preventDefault(); sectionClick.emit('activity')"
        >
          <z-icon zType="clock" zSize="default" class="mr-3 min-w-[16px] min-h-[16px]"></z-icon>
          Activity
        </a>
      </div>
    </nav>
  `,
})
export class DashboardHeaderComponent {
  dashboardTitle = input.required<string>();
  activeSection = input.required<string>();
  sectionClick = output<string>();
}
