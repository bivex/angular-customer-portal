/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T03:30:19
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, Injector } from '@angular/core';
import {
  IArchitectureDumper,
  IComponentTreeDumper,
  IServiceDependencyDumper,
  IRoutingStructureDumper,
  ICallTraceDumper,
  IDependencyInjectionTreeDumper,
  IPerformanceMetricsDumper,
  CallTrace,
} from '../../domain/interfaces/architecture-dumper.interface';
import { ComponentTreeDumperService } from '../../infrastructure/services/component-tree-dumper';
import { ServiceDependencyDumperService } from '../../infrastructure/services/service-dependency-dumper';
import { RoutingStructureDumperService } from '../../infrastructure/services/routing-structure-dumper';
import { CallTraceDumperService } from '../../infrastructure/services/call-trace-dumper';
import { DependencyInjectionTreeDumperService } from '../../infrastructure/services/dependency-injection-tree-dumper';
import { PerformanceMetricsDumperService } from '../../infrastructure/services/performance-metrics-dumper';

@Injectable({
  providedIn: 'root',
})
export class ArchitectureDumperService implements IArchitectureDumper {
  constructor(
    private injector: Injector,
    private componentTreeDumper: ComponentTreeDumperService,
    private serviceDependencyDumper: ServiceDependencyDumperService,
    private routingStructureDumper: RoutingStructureDumperService,
    public callTraceDumper: CallTraceDumperService,
    private dependencyInjectionTreeDumper: DependencyInjectionTreeDumperService,
    private performanceMetricsDumper: PerformanceMetricsDumperService
  ) {}

  /**
   * Dump complete application architecture
   */
  dumpArchitecture(): void {
    console.group('🏗️ Angular Application Architecture Dump');
    console.time('Architecture Analysis');

    try {
      // Component Tree
      this.componentTreeDumper.dumpComponentTree();

      // Service Dependencies
      this.serviceDependencyDumper.dumpServiceDependencies();

      // Routing Structure
      this.routingStructureDumper.dumpRoutingStructure();

      // Call Traces
      this.callTraceDumper.dumpCallTraces();

      // Dependency Injection Tree
      this.dependencyInjectionTreeDumper.dumpDependencyInjectionTree();

      // Performance Metrics
      this.performanceMetricsDumper.dumpPerformanceMetrics();
    } catch (error) {
      console.error('❌ Error during architecture dump:', error);
    }

    console.timeEnd('Architecture Analysis');
    console.groupEnd();
  }

  /**
   * Export architecture data as JSON
   */
  exportArchitecture(): string {
    const architecture = {
      timestamp: new Date().toISOString(),
      componentTree: this.getComponentTreeData(),
      serviceDependencies: this.getServiceDependenciesData(),
      routingStructure: this.getRoutingStructureData(),
      callTraces: this.callTraceDumper.getCallTracesData(),
      performanceMetrics: this.performanceMetricsDumper.getPerformanceMetricsData(),
    };

    return JSON.stringify(architecture, null, 2);
  }

  private getComponentTreeData(): unknown {
    return this.componentTreeDumper.getComponentTreeData();
  }

  private getServiceDependenciesData(): unknown {
    return this.serviceDependencyDumper.getServiceDependenciesData();
  }

  private getRoutingStructureData(): unknown {
    return this.routingStructureDumper.getRoutingStructureData();
  }
}

/**
 * Global utility functions for architecture dumping
 */
declare global {
  interface Window {
    dumpArchitecture: () => void;
    enableArchitectureTracing: () => void;
    disableArchitectureTracing: () => void;
    clearArchitectureTraces: () => void;
    exportArchitecture: () => string;
  }
}

/**
 * Initialize global architecture dumper functions
 */
export function initializeArchitectureDumper(injector: Injector): void {
  const dumper = injector.get(ArchitectureDumperService);

  window.dumpArchitecture = () => dumper.dumpArchitecture();
  window.enableArchitectureTracing = () => dumper.callTraceDumper.enableTracing();
  window.disableArchitectureTracing = () => dumper.callTraceDumper.disableTracing();
  window.clearArchitectureTraces = () => dumper.callTraceDumper.clearTraces();
  window.exportArchitecture = () => dumper.exportArchitecture();

  console.log('🏗️ Architecture dumper initialized. Available commands:');
  console.log('  dumpArchitecture() - Dump complete app architecture');
  console.log('  enableArchitectureTracing() - Enable call tracing');
  console.log('  disableArchitectureTracing() - Disable call tracing');
  console.log('  clearArchitectureTraces() - Clear all traces');
  console.log('  exportArchitecture() - Export architecture as JSON');
}
