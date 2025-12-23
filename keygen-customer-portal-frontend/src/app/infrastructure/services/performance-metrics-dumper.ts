/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:58
 * Last Updated: 2025-12-20T22:05:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable } from '@angular/core';
import { IPerformanceMetricsDumper } from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class PerformanceMetricsDumperService implements IPerformanceMetricsDumper {
  /**
   * Dump performance metrics
   */
  dumpPerformanceMetrics(): void {
    console.group('⚡ Performance Metrics');

    try {
      if (performance.timing) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        console.log(`🚀 Page Load Time: ${loadTime}ms`);
        console.log(`📄 DOM Ready Time: ${domReady}ms`);
        console.log(
          `🔧 Navigation Start: ${new Date(timing.navigationStart).toLocaleTimeString()}`
        );
      }

      // Memory usage if available
      const perfWithMemory = performance as unknown as {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
      };
      if (perfWithMemory.memory) {
        const memory = perfWithMemory.memory;
        console.log(`💾 Memory Usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💾 Memory Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }

    console.groupEnd();
  }

  getPerformanceMetricsData(): { timing?: PerformanceTiming; memory?: unknown } {
    try {
      const perfWithMemory = performance as unknown as { memory?: unknown };
      return {
        timing: performance.timing,
        memory: perfWithMemory.memory,
      };
    } catch (e) {
      return {};
    }
  }
}
