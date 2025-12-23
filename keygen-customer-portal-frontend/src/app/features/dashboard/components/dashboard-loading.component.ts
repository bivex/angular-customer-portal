/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:14
 * Last Updated: 2025-12-22T08:50:15
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent, GridItemComponent } from '../../../shared/grid';

@Component({
  selector: 'app-dashboard-loading',
  standalone: true,
  imports: [CommonModule, GridComponent, GridItemComponent],
  template: `
    <div class="animate-pulse">
      <!-- Header Skeleton -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex-1">
          <div class="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div class="h-6 bg-muted rounded w-1/2"></div>
        </div>
        <div class="flex items-center space-x-3">
          <div class="h-10 bg-muted rounded-lg w-24"></div>
        </div>
      </div>

      <!-- Welcome Section Skeleton -->
      <div
        class="bg-gradient-to-br from-background to-card rounded-3xl p-8 mb-8 border border-border shadow-sm"
      >
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div class="flex-1 mb-6 lg:mb-0">
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-3 bg-muted rounded-2xl"></div>
              <div>
                <div class="h-8 bg-muted rounded w-64 mb-2"></div>
                <div class="h-5 bg-muted rounded w-48"></div>
              </div>
            </div>

            <!-- Status indicators skeleton -->
            <div class="flex flex-wrap items-center gap-4 mt-4">
              <div class="h-8 bg-muted rounded-xl w-32"></div>
              <div class="h-8 bg-muted rounded-xl w-36"></div>
              <div class="h-8 bg-muted rounded-xl w-28"></div>
            </div>
          </div>

          <div class="lg:ml-8">
            <div class="h-12 bg-muted rounded-xl w-40"></div>
          </div>
        </div>

        <!-- Stats Grid Skeleton -->
        <app-grid [cols]="statsGridCols()" gap="2rem" class="mt-8">
          <app-grid-item>
            <div class="bg-card border border-border p-6 rounded-2xl shadow-sm h-full">
              <div class="flex items-start justify-between mb-4">
                <div class="p-3 bg-muted rounded-xl"></div>
                <div class="text-right">
                  <div class="h-6 bg-muted rounded w-16 mb-1"></div>
                  <div class="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
              <div>
                <div class="h-4 bg-muted rounded w-24 mb-2"></div>
                <div class="w-full bg-muted rounded-full h-2 mb-2"></div>
                <div class="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
          </app-grid-item>

          <app-grid-item>
            <div class="bg-card border border-border p-6 rounded-2xl shadow-sm h-full">
              <div class="flex items-start justify-between mb-4">
                <div class="p-3 bg-muted rounded-xl"></div>
                <div class="text-right">
                  <div class="h-5 bg-muted rounded w-16 mb-1"></div>
                  <div class="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
              <div>
                <div class="h-4 bg-muted rounded w-28 mb-3"></div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <div class="h-3 bg-muted rounded w-16"></div>
                    <div class="h-3 bg-muted rounded w-8"></div>
                  </div>
                  <div class="flex justify-between">
                    <div class="h-3 bg-muted rounded w-20"></div>
                    <div class="h-3 bg-muted rounded w-8"></div>
                  </div>
                  <div class="flex justify-between">
                    <div class="h-3 bg-muted rounded w-14"></div>
                    <div class="h-3 bg-muted rounded w-8"></div>
                  </div>
                </div>
              </div>
            </div>
          </app-grid-item>

          <app-grid-item>
            <div class="bg-card border border-border p-6 rounded-2xl shadow-sm h-full">
              <div class="flex items-start justify-between mb-4">
                <div class="p-3 bg-muted rounded-xl"></div>
                <div class="text-right">
                  <div class="h-6 bg-muted rounded w-12 mb-1"></div>
                  <div class="h-4 bg-muted rounded w-24"></div>
                </div>
              </div>
              <div>
                <div class="h-4 bg-muted rounded w-32 mb-2"></div>
                <div class="flex items-center justify-between">
                  <div class="h-4 bg-muted rounded w-16"></div>
                  <div class="h-4 bg-muted rounded w-12"></div>
                </div>
              </div>
            </div>
          </app-grid-item>
        </app-grid>
      </div>

      <!-- Insights Skeleton -->
      <div class="bg-card rounded-3xl p-8 border border-border shadow-sm mb-8">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center">
            <div class="p-2 bg-muted rounded-xl mr-3"></div>
            <div class="h-6 bg-muted rounded w-32"></div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="h-8 bg-muted rounded-lg w-24"></div>
            <div class="h-8 bg-muted rounded-lg w-20"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-muted/50 p-6 rounded-2xl">
            <div class="h-6 bg-muted rounded w-48 mb-6"></div>
            <div class="h-48 bg-muted rounded-lg"></div>
          </div>
          <div class="bg-muted/50 p-6 rounded-2xl">
            <div class="h-6 bg-muted rounded w-40 mb-6"></div>
            <div class="h-48 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>

      <!-- Actions & Activity Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-card rounded-3xl p-8 border border-border shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center">
              <div class="p-2 bg-muted rounded-xl mr-3"></div>
              <div class="h-6 bg-muted rounded w-28"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="bg-muted p-5 rounded-2xl h-32"></div>
            }
          </div>
        </div>

        <div class="bg-card rounded-3xl p-8 border border-border shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <div class="p-2 bg-muted rounded-xl mr-3"></div>
              <div class="h-6 bg-muted rounded w-32"></div>
            </div>
          </div>

          <div class="space-y-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="flex items-start space-x-4 p-4 bg-muted/50 rounded-2xl">
                <div class="p-3 bg-muted rounded-xl"></div>
                <div class="flex-1">
                  <div class="h-4 bg-muted rounded w-48 mb-2"></div>
                  <div class="h-3 bg-muted rounded w-32"></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardLoadingComponent {
  statsGridCols = input(3);
}
