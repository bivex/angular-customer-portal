/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:16
 * Last Updated: 2025-12-22T08:50:16
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GridComponent, GridItemComponent } from '../../../shared/grid';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';
import { User } from '../../../application/services/auth';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

@Component({
  selector: 'app-dashboard-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, GridComponent, GridItemComponent, ZardIconComponent],
  template: `
    <section
      id="overview"
      class="bg-gradient-to-br from-background via-card to-muted rounded-3xl p-8 mb-8 border border-border shadow-lg relative overflow-hidden"
      aria-labelledby="dashboard-welcome-title"
      role="banner"
    >
      <!-- Background decoration -->
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -translate-y-16 translate-x-16"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/40 to-transparent rounded-full translate-y-12 -translate-x-12"
      ></div>

      <div class="relative z-10 selection-luxury-black">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div class="flex-1 mb-6 lg:mb-0">
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-3 bg-primary/10 rounded-2xl shadow-sm">
                <z-icon [zType]="getTimeBasedIcon()" zSize="xl" class="text-primary"></z-icon>
              </div>
              <div>
                <h2
                  id="dashboard-welcome-title"
                  class="text-3xl font-bold text-foreground mb-1 leading-tight"
                >
                  {{ getWelcomeMessage(authState().user) }}
                </h2>
                <p class="text-lg text-muted-foreground font-medium">
                  {{ motivationalMessage() }}
                </p>
              </div>
            </div>

            <!-- Quick status indicators -->
            <div class="flex flex-wrap items-center gap-6 mt-4">
              <div
                class="flex items-center space-x-3 bg-card/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-primary/20 shadow-sm min-h-[48px] min-w-[160px]"
              >
                <div
                  class="w-5 h-5 bg-primary rounded-full animate-pulse min-w-[20px] min-h-[20px]"
                ></div>
                <span class="text-base font-semibold text-primary">Account Active</span>
              </div>
              <div
                class="flex items-center space-x-3 bg-card/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-secondary/20 shadow-sm min-h-[48px] min-w-[180px]"
              >
                <z-icon
                  zType="shield"
                  zSize="default"
                  class="text-secondary min-w-[20px] min-h-[20px]"
                ></z-icon>
                <span class="text-base font-semibold text-secondary">Secure Connection</span>
              </div>
              <div
                class="flex items-center space-x-3 bg-card/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-border shadow-sm min-h-[48px] min-w-[200px]"
              >
                <z-icon
                  zType="clock"
                  zSize="default"
                  class="text-muted-foreground min-w-[20px] min-h-[20px]"
                ></z-icon>
                <span class="text-base font-medium text-foreground">{{
                  authState().user?.lastLogin | date: 'short'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Quick navigation buttons -->
          <div class="lg:ml-8 flex flex-col sm:flex-row gap-4">
            <button
              class="inline-flex items-center px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 touch-none min-h-[56px] min-w-[48px] text-base"
              aria-label="View detailed analytics"
              (click)="sectionClick.emit('insights')"
            >
              <z-icon zType="arrow-up" zSize="default" class="mr-3"></z-icon>
              <span class="hidden sm:inline">View Analytics</span>
              <span class="sm:hidden">Analytics</span>
            </button>

            <button
              class="inline-flex items-center px-8 py-4 bg-card hover:bg-card/80 text-card-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 touch-none min-h-[56px] min-w-[48px] text-base"
              aria-label="Manage profile"
              routerLink="/user/profile"
            >
              <z-icon zType="user" zSize="default" class="mr-3"></z-icon>
              <span class="hidden sm:inline">Manage Profile</span>
              <span class="sm:hidden">Profile</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Stats Grid -->
      <app-grid
        [cols]="statsGridCols()"
        gap="2rem"
        class="mt-8"
        role="region"
        aria-labelledby="stats-section-title"
      >
        <h3 id="stats-section-title" class="sr-only">Account Statistics</h3>
        <!-- API Usage Card -->
        <app-grid-item>
          <div
            class="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full group cursor-pointer touch-none min-h-[200px]"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl group-hover:from-primary/20 group-hover:to-primary/10 transition-colors"
              >
                <z-icon zType="sun" class="text-primary"></z-icon>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-foreground">2,847</p>
                <p class="text-base text-muted-foreground uppercase tracking-wide">This Month</p>
              </div>
            </div>
            <div>
              <p class="text-base font-semibold text-foreground mb-2">API Requests</p>
              <div class="w-full bg-border rounded-full h-2 mb-2">
                <div
                  class="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                  style="width: 68%"
                ></div>
              </div>
              <p class="text-base text-muted-foreground">68% of monthly limit</p>
            </div>
          </div>
        </app-grid-item>

        <!-- Account Health Card -->
        <app-grid-item>
          <div
            class="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full group cursor-pointer touch-none min-h-[160px]"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-xl group-hover:from-green-200 group-hover:to-green-100 transition-colors"
              >
                <z-icon zType="shield" class="text-green-600"></z-icon>
              </div>
              <div class="text-right">
                <div class="flex items-center space-x-2">
                  <div
                    class="w-5 h-5 bg-primary rounded-full animate-pulse min-w-[20px] min-h-[20px]"
                  ></div>
                  <span class="text-base font-semibold text-primary">Excellent</span>
                </div>
                <p class="text-base text-muted-foreground font-medium mt-1">Health Score</p>
              </div>
            </div>
            <div>
              <p class="text-base font-semibold text-foreground mb-3">Account Status</p>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-base min-h-[44px]">
                  <span class="text-muted-foreground font-medium">Security</span>
                  <span class="font-semibold text-primary">98%</span>
                </div>
                <div class="flex items-center justify-between text-base min-h-[44px]">
                  <span class="text-muted-foreground font-medium">Compliance</span>
                  <span class="font-semibold text-primary">95%</span>
                </div>
                <div class="flex items-center justify-between text-base min-h-[44px]">
                  <span class="text-muted-foreground font-medium">Activity</span>
                  <span class="font-semibold text-primary">87%</span>
                </div>
              </div>
            </div>
          </div>
        </app-grid-item>

        <!-- Recent Activity Card -->
        <app-grid-item>
          <div
            class="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full group cursor-pointer touch-none min-h-[160px]"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl group-hover:from-purple-200 group-hover:to-purple-100 transition-colors"
              >
                <z-icon zType="zap" class="text-purple-600"></z-icon>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-foreground">24</p>
                <p class="text-base text-muted-foreground uppercase tracking-wide">Last 7 Days</p>
              </div>
            </div>
            <div>
              <p class="text-base font-semibold text-foreground mb-2">Active Sessions</p>
              <div class="flex items-center space-x-2 mb-2">
                <div class="flex -space-x-1">
                  <div
                    class="w-11 h-11 bg-primary rounded-full border-2 border-card min-w-[44px] min-h-[44px]"
                  ></div>
                  <div
                    class="w-11 h-11 bg-secondary rounded-full border-2 border-card min-w-[44px] min-h-[44px]"
                  ></div>
                  <div
                    class="w-11 h-11 bg-accent rounded-full border-2 border-card min-w-[44px] min-h-[44px]"
                  ></div>
                  <div
                    class="w-11 h-11 bg-muted rounded-full border-2 border-white flex items-center justify-center min-w-[44px] min-h-[44px]"
                  >
                    <span class="text-base text-white font-bold">+</span>
                  </div>
                </div>
                <span class="text-base text-muted-foreground font-medium">3 active devices</span>
              </div>
              <p class="text-base text-muted-foreground font-medium">Last seen: 2 min ago</p>
            </div>
          </div>
        </app-grid-item>
      </app-grid>
    </section>
  `,
})
export class DashboardWelcomeComponent {
  authState = input.required<AuthState>();
  motivationalMessage = input.required<string>();
  statsGridCols = input.required<number>();
  sectionClick = output<string>();

  getWelcomeMessage(user: User | null): string {
    if (!user) return '';

    const hour = new Date().getHours();
    let greetingKey = 'dashboard.welcome.morning';

    if (hour >= 12 && hour < 17) {
      greetingKey = 'dashboard.welcome.afternoon';
    } else if (hour >= 17 || hour < 5) {
      greetingKey = 'dashboard.welcome.evening';
    }

    return `Good ${greetingKey.split('.')[2]}, ${user.name || user.email.split('@')[0]}!`;
  }

  getTimeBasedIcon(): any {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) return 'sun';
    return 'moon';
  }
}
