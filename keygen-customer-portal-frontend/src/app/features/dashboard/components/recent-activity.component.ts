/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:21
 * Last Updated: 2025-12-22T08:50:21
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, ZardIconComponent],
  template: `
    <section
      id="activity"
      class="bg-card rounded-3xl p-8 border border-border shadow-lg"
      aria-labelledby="recent-activity-title"
      role="region"
    >
      <div class="flex items-center justify-between mb-6 min-h-[44px] min-w-[44px]">
        <h3
          id="recent-activity-title"
          class="text-2xl font-bold text-foreground flex items-center min-h-[44px]"
        >
          <div class="p-3 bg-primary/10 rounded-xl mr-3">
            <z-icon zType="zap" class="text-primary"></z-icon>
          </div>
          Recent Activity
        </h3>
        <div class="flex items-center space-x-2 min-h-[44px]">
          <div
            class="w-6 h-6 bg-primary rounded-full animate-pulse min-w-[24px] min-h-[24px]"
          ></div>
          <span class="text-base text-muted-foreground font-medium">Live Updates</span>
        </div>
      </div>

      <div class="space-y-6 selection-midnight-black">
        <!-- Today's Activity -->
        <div>
          <h4
            class="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center"
          >
            <div class="w-5 h-5 bg-gray-400 rounded-full mr-3 min-w-[20px] min-h-[20px]"></div>
            Today
          </h4>
          <div class="space-y-4">
            <div
              class="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-2xl border border-green-100"
            >
              <div class="p-3 bg-card rounded-xl flex-shrink-0">
                <z-icon zType="log-in" class="text-green-600"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-base font-bold text-foreground">Secure login successful</p>
                  <span
                    class="text-base text-muted-foreground bg-card px-3 py-2 rounded-full min-h-[32px] flex items-center"
                    >2h ago</span
                  >
                </div>
                <p class="text-base text-muted-foreground mb-2">
                  Logged in from Chrome on macOS • San Francisco, CA
                </p>
                <div class="flex items-center space-x-3">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-base font-medium bg-card text-primary"
                  >
                    <z-icon zType="shield" class="mr-1"></z-icon>
                    Verified
                  </span>
                  <button
                    class="text-sm text-primary hover:text-primary/80 font-medium touch-none min-h-[44px] px-3 py-2 min-w-[48px] rounded-md hover:bg-primary/10 transition-colors"
                    role="button"
                    tabindex="0"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <div
              class="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl border border-primary/20"
            >
              <div class="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <z-icon zType="lock" class="text-primary"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-base font-bold text-foreground">Production API key created</p>
                  <span
                    class="text-base text-muted-foreground bg-card px-3 py-2 rounded-full min-h-[32px] flex items-center"
                    >4h ago</span
                  >
                </div>
                <p class="text-base text-muted-foreground mb-2">
                  Key:
                  <code class="bg-card px-2 py-1 rounded text-base">pk_prod_****abcd</code>
                </p>
                <div class="flex items-center space-x-3">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-base font-medium bg-primary/10 text-primary"
                  >
                    Production
                  </span>
                  <button
                    class="text-sm text-primary hover:text-primary/80 font-medium touch-none min-h-[44px] px-3 py-2 min-w-[48px] rounded-md hover:bg-primary/10 transition-colors"
                    role="button"
                    tabindex="0"
                  >
                    Manage Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Yesterday's Activity -->
        <div>
          <h4
            class="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center"
          >
            <div class="w-5 h-5 bg-gray-400 rounded-full mr-3 min-w-[20px] min-h-[20px]"></div>
            Yesterday
          </h4>
          <div class="space-y-4">
            <div
              class="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-2xl border border-purple-100"
            >
              <div class="p-3 bg-card rounded-xl flex-shrink-0">
                <z-icon zType="chevron-down" zSize="default" class="text-purple-600"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-base font-bold text-foreground">SDK downloaded</p>
                  <span
                    class="text-base text-muted-foreground bg-card px-3 py-2 rounded-full min-h-[32px] flex items-center"
                    >1d ago</span
                  >
                </div>
                <p class="text-base text-muted-foreground mb-2">
                  JavaScript SDK v2.1.4 for Node.js environment
                </p>
                <div class="flex items-center space-x-3">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-base font-medium bg-card text-secondary-foreground"
                  >
                    JavaScript
                  </span>
                  <button
                    class="text-sm text-primary hover:text-primary/80 font-medium touch-none min-h-[44px] px-3 py-2 min-w-[48px] rounded-md hover:bg-primary/10 transition-colors"
                    role="button"
                    tabindex="0"
                  >
                    Download Again
                  </button>
                </div>
              </div>
            </div>

            <div
              class="flex items-start space-x-4 p-4 bg-gradient-to-r from-card/50 to-transparent rounded-2xl border border-border"
            >
              <div class="p-3 bg-card rounded-xl flex-shrink-0">
                <z-icon zType="mail" class="text-muted-foreground"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-base font-bold text-foreground">Welcome email sent</p>
                  <span
                    class="text-base text-muted-foreground bg-card px-3 py-2 rounded-full min-h-[32px] flex items-center"
                    >1d ago</span
                  >
                </div>
                <p class="text-base text-muted-foreground mb-2">
                  Account setup guide and getting started resources
                </p>
                <div class="flex items-center space-x-3">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-base font-medium bg-card text-muted-foreground"
                  >
                    Automated
                  </span>
                  <button
                    class="text-sm text-primary hover:text-primary/80 font-medium touch-none min-h-[44px] px-3 py-2 min-w-[48px] rounded-md hover:bg-primary/10 transition-colors"
                    role="button"
                    tabindex="0"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class RecentActivityComponent {}
