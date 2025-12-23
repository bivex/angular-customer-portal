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
import { ICallTraceDumper, CallTrace } from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class CallTraceDumperService implements ICallTraceDumper {
  private callTraces: CallTrace[] = [];
  private isTracing = false;

  /**
   * Enable call tracing for architecture analysis
   */
  enableTracing(): void {
    this.isTracing = true;
    console.log('🔍 Architecture tracing enabled');
  }

  /**
   * Disable call tracing
   */
  disableTracing(): void {
    this.isTracing = false;
    console.log('🔍 Architecture tracing disabled');
  }

  /**
   * Add a call trace entry
   */
  addTrace(
    functionName: string,
    file: string,
    line: number,
    args?: unknown[],
    result?: unknown
  ): void {
    if (!this.isTracing) return;

    this.callTraces.push({
      function: functionName,
      functionName,
      file,
      line,
      timestamp: Date.now(),
      args,
      result,
    });
  }

  /**
   * Dump call traces
   */
  dumpCallTraces(): void {
    console.group('📊 Call Traces');

    if (this.callTraces.length === 0) {
      console.log('No call traces recorded. Enable tracing first.');
    } else {
      console.log(`Total traces: ${this.callTraces.length}`);

      // Group by file
      const tracesByFile = this.callTraces.reduce(
        (acc, trace) => {
          if (!acc[trace.file]) acc[trace.file] = [];
          acc[trace.file].push(trace);
          return acc;
        },
        {} as Record<string, CallTrace[]>
      );

      Object.entries(tracesByFile).forEach(([file, traces]) => {
        console.group(`📁 ${file} (${traces.length} calls)`);
        traces.forEach((trace) => {
          console.log(
            `  🔍 ${trace.function}:${trace.line} (${new Date(trace.timestamp).toLocaleTimeString()})`
          );
        });
        console.groupEnd();
      });
    }

    console.groupEnd();
  }

  /**
   * Clear all traces
   */
  clearTraces(): void {
    this.callTraces = [];
    console.log('🧹 Call traces cleared');
  }

  getCallTracesData(): CallTrace[] {
    return this.callTraces;
  }
}
