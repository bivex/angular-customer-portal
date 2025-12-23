/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T08:50:18
 * Last Updated: 2025-12-22T08:50:20
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, ZardIconComponent],
  template: `
    <section
      id="actions"
      class="bg-card rounded-3xl p-8 border border-border shadow-lg"
      aria-labelledby="quick-actions-title"
      role="region"
    >
      <div class="flex items-center justify-between mb-8 min-h-[44px] min-w-[44px]">
        <h3
          id="quick-actions-title"
          class="text-2xl font-bold text-foreground flex items-center min-h-[44px]"
        >
          <div class="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mr-3">
            <z-icon zType="zap" class="text-primary"></z-icon>
          </div>
          Quick Actions
        </h3>
        <div class="flex items-center space-x-2 min-h-[44px]">
          <div class="w-6 h-6 bg-primary rounded-full animate-pulse"></div>
          <span class="text-base text-muted-foreground font-medium">Ready</span>
        </div>
      </div>

      <!-- Primary Actions Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 selection-premium-black"
      >
        <!-- Create API Key -->
        <button
          class="group relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary hover:via-primary hover:to-primary/80 text-primary-foreground p-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] touch-none min-h-[140px] min-w-[48px] w-full text-left"
          role="button"
          tabindex="0"
          (click)="actionClick.emit('create-api-key')"
        >
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4 min-h-[44px] min-w-[44px]">
              <div class="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <z-icon zType="lock" class="text-white"></z-icon>
              </div>
              <div
                class="px-2 py-1 bg-white/20 rounded-full text-base font-semibold backdrop-blur-sm"
              >
                New
              </div>
            </div>
            <div class="min-h-[44px]">
              <h4 class="text-xl font-bold mb-2 leading-tight">Create API Key</h4>
            </div>
            <p class="text-base opacity-90 leading-relaxed">
              Generate secure keys for your applications
            </p>
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          ></div>
          <div
            class="absolute -bottom-1 -right-1 w-8 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
        </button>

        <!-- Webhook Management -->
        <button
          class="group bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:border-purple-300 hover:from-purple-100 hover:to-purple-200 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] touch-none min-h-[140px] min-w-[48px] w-full text-left"
          role="button"
          tabindex="0"
          (click)="actionClick.emit('configure-webhooks')"
        >
          <div class="flex items-center justify-between mb-4 min-h-[44px] min-w-[44px]">
            <div
              class="p-3 bg-card rounded-xl group-hover:bg-card/80 transition-colors border border-border"
            >
              <z-icon zType="move-right" zSize="lg" class="text-purple-700"></z-icon>
            </div>
            <div
              class="px-2 py-1 bg-card text-secondary-foreground rounded-full text-base font-semibold min-h-[44px] min-w-[44px] border border-border"
            >
              Setup
            </div>
          </div>
          <div class="min-h-[44px]">
            <h4 class="text-xl font-bold text-foreground mb-2 leading-tight">Configure Webhooks</h4>
          </div>
          <p class="text-base text-muted-foreground leading-relaxed min-h-[44px] min-w-[44px]">
            Set up real-time notifications for your events
          </p>
        </button>

        <!-- API Testing -->
        <button
          class="group bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-300 hover:from-green-100 hover:to-green-200 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] touch-none min-h-[140px] min-w-[48px] w-full text-left"
          role="button"
          tabindex="0"
          (click)="actionClick.emit('api-playground')"
        >
          <div class="flex items-center justify-between mb-4 min-h-[44px] min-w-[44px]">
            <div class="p-3 bg-card rounded-xl group-hover:bg-card/80 transition-colors">
              <z-icon zType="arrow-right" class="text-primary"></z-icon>
            </div>
            <div
              class="px-2 py-1 bg-card text-accent-foreground rounded-full text-base font-semibold"
            >
              Test
            </div>
          </div>
          <div class="min-h-[44px]">
            <h4 class="text-xl font-bold text-foreground mb-2 leading-tight">API Playground</h4>
          </div>
          <p class="text-base text-muted-foreground leading-relaxed">
            Test your API endpoints in real-time
          </p>
        </button>
      </div>

      <!-- Secondary Actions -->
      <div class="space-y-3">
        <div class="flex items-center justify-between mb-4">
          <div class="min-h-[44px]">
            <h4 class="text-lg font-semibold text-foreground">More Options</h4>
          </div>
          <span class="text-base text-muted-foreground bg-card px-3 py-1 rounded-full"
            >Quick Access</span
          >
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            class="w-full flex items-center p-4 rounded-xl border border-border hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group touch-none min-h-[64px] min-w-[48px]"
            role="button"
            tabindex="0"
            (click)="actionClick.emit('security-settings')"
          >
            <div
              class="p-3 bg-card rounded-xl mr-4 group-hover:bg-card/80 transition-colors min-h-[44px] min-w-[44px]"
            >
              <z-icon
                zType="shield"
                class="text-muted-foreground group-hover:text-green-600"
              ></z-icon>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-foreground text-base">Security Settings</p>
              <p class="text-base text-muted-foreground font-medium">2FA & access controls</p>
            </div>
            <z-icon
              zType="chevron-right"
              zSize="default"
              class="text-muted-foreground group-hover:text-green-600 transition-colors"
            ></z-icon>
          </button>

          <button
            class="w-full flex items-center p-4 rounded-xl border border-border hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group touch-none min-h-[64px] min-w-[48px]"
            role="button"
            tabindex="0"
            (click)="actionClick.emit('download-sdk')"
          >
            <div
              class="p-3 bg-card rounded-xl mr-4 group-hover:bg-card/80 transition-colors min-h-[44px] min-w-[44px]"
            >
              <z-icon
                zType="chevron-down"
                zSize="default"
                class="text-muted-foreground group-hover:text-blue-600"
              ></z-icon>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-foreground text-base">Download SDK</p>
              <p class="text-base text-muted-foreground font-medium">JavaScript, Python, Go</p>
            </div>
            <z-icon
              zType="chevron-right"
              zSize="default"
              class="text-muted-foreground group-hover:text-blue-600 transition-colors"
            ></z-icon>
          </button>
        </div>
      </div>
    </section>
  `,
})
export class QuickActionsComponent {
  actionClick = output<string>();
}
