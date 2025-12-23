/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T19:09:59
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain interfaces for architecture dumping functionality
 * These interfaces provide abstractions for debugging operations
 */

// Type definitions for architecture data
export interface ComponentMetadata {
  name: string;
  type: string;
  dependencies?: string[];
  children?: ComponentMetadata[];
  selectors?: string[];
  filePath?: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'component' | 'service' | 'directive' | 'pipe';
  metadata?: unknown;
  children?: ArchitectureNode[];
}

export interface ServiceMetadata {
  name: string;
  type: string;
  providedIn: string;
  dependencies?: string[];
  instance?: unknown;
}

export interface CallTrace {
  function: string;
  functionName: string;
  file: string;
  line: number;
  args?: unknown[];
  result?: unknown;
  timestamp: number;
}

export interface IArchitectureDumper {
  dumpArchitecture(): void;
  exportArchitecture(): string;
}

export interface IComponentTreeDumper {
  dumpComponentTree(): void;
  getComponentTreeData(): { components: ComponentMetadata[] };
}

export interface IServiceDependencyDumper {
  dumpServiceDependencies(): void;
  getServiceDependenciesData(): ServiceMetadata[];
}

export interface IRoutingStructureDumper {
  dumpRoutingStructure(): void;
  getRoutingStructureData(): unknown; // Routes type from @angular/router
}

export interface ICallTraceDumper {
  enableTracing(): void;
  disableTracing(): void;
  addTrace(
    functionName: string,
    file: string,
    line: number,
    args?: unknown[],
    result?: unknown
  ): void;
  dumpCallTraces(): void;
  clearTraces(): void;
  getCallTracesData(): CallTrace[];
}

export interface IDependencyInjectionTreeDumper {
  dumpDependencyInjectionTree(): void;
}

export interface IPerformanceMetricsDumper {
  dumpPerformanceMetrics(): void;
  getPerformanceMetricsData(): { timing?: PerformanceTiming; memory?: unknown };
}
