/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T03:30:19
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, Injector, Type } from '@angular/core';
import { ComponentTreeDumperService } from './component-tree-dumper';
import { ServiceDependencyDumperService } from './service-dependency-dumper';
import { RoutingStructureDumperService } from './routing-structure-dumper';
import { CallTraceDumperService } from './call-trace-dumper';
import {
  ComponentMetadata,
  ArchitectureNode,
  ServiceMetadata,
  CallTrace,
} from '../../domain/interfaces/architecture-dumper.interface';
import { DependencyInjectionTreeDumperService } from './dependency-injection-tree-dumper';
import { PerformanceMetricsDumperService } from './performance-metrics-dumper';
import { Router, Routes } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ArchitectureDumperService {
  constructor(
    private injector: Injector,
    private router: Router,
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

  private getComponentTreeData(): { components: unknown[] } {
    return this.componentTreeDumper.getComponentTreeData();
  }

  private getServiceDependenciesData(): ServiceMetadata[] {
    return this.serviceDependencyDumper.getServiceDependenciesData();
  }

  private getRoutingStructureData(): Routes {
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
