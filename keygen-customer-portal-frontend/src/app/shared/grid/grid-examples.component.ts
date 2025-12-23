/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T08:05:00
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent, GridItemComponent, GridService } from './index';

@Component({
  selector: 'app-grid-examples',
  standalone: true,
  imports: [CommonModule, GridComponent, GridItemComponent],
  template: `
    <div class="p-6 space-y-8">
      <h2 class="text-2xl font-bold mb-4">Grid System Examples</h2>

      <!-- Basic Grid -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Basic Grid (3 columns)</h3>
        <app-grid [cols]="3" gap="1rem">
          <app-grid-item>
            <div class="bg-blue-100 p-4 rounded">Column 1</div>
          </app-grid-item>
          <app-grid-item>
            <div class="bg-strong-sky-100 p-4 rounded">Column 2</div>
          </app-grid-item>
          <app-grid-item>
            <div class="bg-red-100 p-4 rounded">Column 3</div>
          </app-grid-item>
        </app-grid>
      </section>

      <!-- Responsive Grid -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Responsive Grid</h3>
        <app-grid [responsive]="true" gap="0.5rem">
          <app-grid-item>
            <div class="bg-purple-100 p-4 rounded">Item 1</div>
          </app-grid-item>
          <app-grid-item>
            <div class="bg-pink-100 p-4 rounded">Item 2</div>
          </app-grid-item>
          <app-grid-item>
            <div class="bg-indigo-100 p-4 rounded">Item 3</div>
          </app-grid-item>
          <app-grid-item>
            <div class="bg-yellow-100 p-4 rounded">Item 4</div>
          </app-grid-item>
        </app-grid>
      </section>

      <!-- Spanning Grid -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Grid with Spanning (12-column system)</h3>
        <app-grid [cols]="12" gap="0.5rem">
          <app-grid-item [span]="6">
            <div class="bg-cyan-100 p-4 rounded">Span 6</div>
          </app-grid-item>
          <app-grid-item [span]="3">
            <div class="bg-orange-100 p-4 rounded">Span 3</div>
          </app-grid-item>
          <app-grid-item [span]="3">
            <div class="bg-teal-100 p-4 rounded">Span 3</div>
          </app-grid-item>
          <app-grid-item [span]="4">
            <div class="bg-ocean-journey-100 p-4 rounded">Span 4</div>
          </app-grid-item>
          <app-grid-item [span]="4">
            <div class="bg-emerald-100 p-4 rounded">Span 4</div>
          </app-grid-item>
          <app-grid-item [span]="4">
            <div class="bg-violet-100 p-4 rounded">Span 4</div>
          </app-grid-item>
        </app-grid>
      </section>

      <!-- Complex Layout -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Complex Layout Example</h3>
        <app-grid [cols]="12" gap="1rem">
          <!-- Header spanning full width -->
          <app-grid-item [span]="12">
            <div class="bg-gray-200 p-4 rounded text-center font-semibold">Header (Full Width)</div>
          </app-grid-item>

          <!-- Sidebar -->
          <app-grid-item [span]="3">
            <div class="bg-blue-50 p-4 rounded min-h-[200px]">
              <h4 class="font-semibold mb-2">Sidebar</h4>
              <ul class="space-y-1 text-sm">
                <li>Menu Item 1</li>
                <li>Menu Item 2</li>
                <li>Menu Item 3</li>
              </ul>
            </div>
          </app-grid-item>

          <!-- Main Content -->
          <app-grid-item [span]="9">
            <app-grid [cols]="2" gap="0.5rem">
              <app-grid-item>
                <div class="bg-strong-sky-50 p-4 rounded min-h-[150px]">
                  <h4 class="font-semibold mb-2">Content A</h4>
                  <p class="text-sm">Main content area</p>
                </div>
              </app-grid-item>
              <app-grid-item>
                <div class="bg-yellow-50 p-4 rounded min-h-[150px]">
                  <h4 class="font-semibold mb-2">Content B</h4>
                  <p class="text-sm">Another content area</p>
                </div>
              </app-grid-item>
            </app-grid>
          </app-grid-item>

          <!-- Footer -->
          <app-grid-item [span]="12">
            <div class="bg-gray-100 p-4 rounded text-center text-sm">Footer (Full Width)</div>
          </app-grid-item>
        </app-grid>
      </section>
    </div>
  `,
})
export class GridExamplesComponent {}
