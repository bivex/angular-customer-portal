/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:23
 * Last Updated: 2025-12-22T09:14:09
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent, GridItemComponent } from '../../../shared/grid';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-usage-insights',
  standalone: true,
  imports: [CommonModule, GridComponent, GridItemComponent, ZardIconComponent],
  template: `
    <section
      id="insights"
      class="bg-card rounded-3xl p-8 border border-border shadow-lg mb-8"
      aria-labelledby="usage-insights-title"
      role="region"
    >
      <div class="flex items-center justify-between mb-8">
        <h3 id="usage-insights-title" class="text-2xl font-bold text-foreground flex items-center">
          <div
            class="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mr-4 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <z-icon zType="arrow-up" zSize="lg" class="text-primary"></z-icon>
          </div>
          Usage Insights
        </h3>
        <div class="flex items-center space-x-4">
          <select
            class="text-base border border-border rounded-lg px-4 py-3 bg-card min-h-[48px] min-w-[160px] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
            aria-label="Select time period for usage insights"
          >
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 24 hours</option>
          </select>
          <button
            class="px-6 py-3 bg-primary text-primary-foreground text-base font-medium rounded-lg hover:bg-primary/90 focus:bg-primary/90 transition-colors min-h-[48px] min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
            role="button"
            tabindex="0"
            aria-label="Export usage data"
          >
            <span class="hidden sm:inline">Export Data</span>
            <span class="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      <app-grid [responsive]="true" gap="2rem">
        <!-- API Usage Chart -->
        <app-grid-item class="md:col-span-2">
          <div class="bg-gradient-to-br from-muted/50 to-card p-6 rounded-2xl border border-border">
            <div class="flex items-center justify-between mb-6">
              <div class="min-h-[48px] flex items-center">
                <h4 class="text-lg font-bold text-foreground">API Requests Over Time</h4>
              </div>
              <div class="flex items-center space-x-3 min-h-[44px] min-w-[44px]">
                <div class="w-6 h-6 bg-primary rounded-full min-w-[24px] min-h-[24px]"></div>
                <span class="text-base text-muted-foreground font-medium">Requests</span>
              </div>
            </div>
            <div
              class="h-48 flex items-end justify-between space-x-3"
              role="img"
              aria-label="API requests over the last 7 days"
            >
              <!-- Simple bar chart representation -->
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full min-w-[44px] bg-primary/20 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                  style="height: 40%"
                  tabindex="0"
                  aria-label="Monday: 40% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Mon</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full bg-primary/30 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                  style="height: 60%"
                  tabindex="0"
                  aria-label="Tuesday: 60% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Tue</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full bg-primary/40 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                  style="height: 80%"
                  tabindex="0"
                  aria-label="Wednesday: 80% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Wed</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full bg-primary rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                  style="height: 100%"
                  tabindex="0"
                  aria-label="Thursday: 100% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Thu</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full bg-primary/40 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                  style="height: 75%"
                  tabindex="0"
                  aria-label="Friday: 75% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Fri</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full bg-primary/30 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                  style="height: 55%"
                  tabindex="0"
                  aria-label="Saturday: 55% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Sat</span
                >
              </div>
              <div
                class="flex-1 flex flex-col items-center min-h-[48px] min-w-[48px] touch-none"
                role="presentation"
              >
                <div
                  class="w-full min-w-[44px] bg-primary/20 rounded-t-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                  style="height: 35%"
                  tabindex="0"
                  aria-label="Sunday: 35% of peak requests"
                ></div>
                <span
                  class="text-sm text-muted-foreground font-medium min-h-[16px] min-w-[32px] p-2"
                  >Sun</span
                >
              </div>
            </div>
          </div>
        </app-grid-item>

        <!-- Usage Breakdown -->
        <app-grid-item>
          <div class="bg-gradient-to-br from-muted/50 to-card p-6 rounded-2xl border border-border">
            <div class="min-h-[44px]">
              <h4 class="text-lg font-bold text-foreground mb-6">Request Types</h4>
            </div>
            <div class="space-y-6">
              <div class="flex items-center justify-between min-h-[48px]">
                <div class="flex items-center space-x-4 min-h-[48px] min-w-[48px]">
                  <div
                    class="w-12 h-12 bg-primary rounded-full flex items-center justify-center min-w-[48px] min-h-[48px] touch-none"
                  >
                    <span class="text-sm font-bold text-primary-foreground px-2 py-1">GET</span>
                  </div>
                  <span class="text-sm text-foreground font-medium px-2 py-1">GET</span>
                </div>
                <div class="text-right min-h-[48px] min-w-[48px]">
                  <p class="text-lg font-bold text-foreground mb-1">2,145</p>
                  <p class="text-sm text-muted-foreground">75%</p>
                </div>
              </div>
              <div class="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-6">
                <div class="bg-green-600 h-4 rounded-full" style="width: 75%"></div>
              </div>

              <div class="flex items-center justify-between min-h-[48px]">
                <div class="flex items-center space-x-4 min-h-[48px] min-w-[48px]">
                  <div
                    class="w-12 h-12 bg-secondary rounded-full flex items-center justify-center min-w-[48px] min-h-[48px] touch-none"
                  >
                    <span class="text-sm font-bold text-secondary-foreground px-2 py-1">POST</span>
                  </div>
                  <span class="text-sm text-foreground font-medium px-2 py-1">POST</span>
                </div>
                <div class="text-right min-h-[48px] min-w-[48px]">
                  <p class="text-lg font-bold text-foreground mb-1">543</p>
                  <p class="text-sm text-muted-foreground">19%</p>
                </div>
              </div>
              <div class="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-6">
                <div class="bg-primary h-4 rounded-full" style="width: 19%"></div>
              </div>

              <div class="flex items-center justify-between min-h-[48px]">
                <div class="flex items-center space-x-4 min-h-[48px] min-w-[48px]">
                  <div
                    class="w-12 h-12 bg-accent rounded-full flex items-center justify-center min-w-[48px] min-h-[48px] touch-none"
                  >
                    <span class="text-sm font-bold text-accent-foreground px-2 py-1">PUT</span>
                  </div>
                  <span class="text-sm text-foreground font-medium px-2 py-1">PUT</span>
                </div>
                <div class="text-right min-h-[48px] min-w-[48px]">
                  <p class="text-lg font-bold text-foreground mb-1">159</p>
                  <p class="text-sm text-muted-foreground">6%</p>
                </div>
              </div>
              <div class="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-6">
                <div class="bg-amber-500 h-4 rounded-full" style="width: 6%"></div>
              </div>
            </div>
          </div>
        </app-grid-item>

        <!-- Performance Metrics -->
        <app-grid-item>
          <div class="bg-gradient-to-br from-muted/50 to-card p-6 rounded-2xl border border-border">
            <div class="min-h-[44px]">
              <h4 class="text-lg font-bold text-foreground mb-6">Performance</h4>
            </div>
            <div class="space-y-6">
              <div class="text-center pt-12">
                <div class="relative w-20 h-20 mx-auto mb-3">
                  <svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      stroke-width="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      stroke-width="2"
                      stroke-dasharray="95, 100"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-lg font-bold text-foreground min-h-[44px] min-w-[44px]"
                      >95%</span
                    >
                  </div>
                </div>
                <p class="text-base text-muted-foreground font-medium min-h-[44px] min-w-[44px]">
                  Uptime
                </p>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-center min-h-[44px]">
                  <span class="text-base text-muted-foreground font-medium">Avg Response</span>
                  <span class="text-base font-bold text-primary">120ms</span>
                </div>
                <div class="flex justify-between items-center min-h-[44px]">
                  <span class="text-base text-muted-foreground font-medium">Error Rate</span>
                  <span class="text-base font-bold text-primary">0.02%</span>
                </div>
                <div class="flex justify-between items-center min-h-[44px]">
                  <span class="text-base text-muted-foreground font-medium">Success Rate</span>
                  <span class="text-base font-bold text-primary">99.98%</span>
                </div>
              </div>
            </div>
          </div>
        </app-grid-item>
      </app-grid>
    </section>
  `,
})
export class UsageInsightsComponent {}
