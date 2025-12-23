/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:58
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, Injector, Type, ComponentRef, ApplicationRef } from '@angular/core';
import {
  IComponentTreeDumper,
  ComponentMetadata,
} from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class ComponentTreeDumperService implements IComponentTreeDumper {
  constructor(private appRef: ApplicationRef) {}

  /**
   * Dump component hierarchy
   */
  dumpComponentTree(): void {
    console.group('🧩 Component Tree');

    try {
      const rootComponents = this.appRef.components;

      rootComponents.forEach((componentRef, index) => {
        console.group(`Root Component ${index + 1}: ${componentRef.componentType.name}`);
        this.analyzeComponent(componentRef);
        console.groupEnd();
      });

      if (rootComponents.length === 0) {
        console.log('No root components found');
      }
    } catch (error) {
      console.error('Error dumping component tree:', error);
    }

    console.groupEnd();
  }

  /**
   * Analyze a single component
   */
  private analyzeComponent(componentRef: ComponentRef<unknown>): void {
    const componentType = componentRef.componentType;
    const instance = componentRef.instance;

    console.log(`📦 Component: ${componentType.name}`);
    console.log(
      `🏷️  Selector: ${(componentType as unknown as { ɵcmp?: ComponentMetadata })['ɵcmp']?.selectors?.[0] || 'Unknown'}`
    );
    console.log(
      `📍 Location: ${(componentType as unknown as { ɵcmp?: ComponentMetadata })['ɵcmp']?.filePath || 'Unknown'}`
    );

    // Dependencies
    const deps = this.getComponentDependencies(componentType);
    if (deps.length > 0) {
      console.log(`🔗 Dependencies: ${deps.join(', ')}`);
    }

    // Child components (if any)
    this.analyzeChildComponents(instance);
  }

  /**
   * Get component dependencies
   */
  private getComponentDependencies(componentType: Type<unknown>): string[] {
    try {
      const cmp = (componentType as unknown as { ɵcmp?: unknown })['ɵcmp'];
      if (!cmp) return [];

      const deps: string[] = [];
      const type = (cmp as { type?: { ctorParameters?: unknown[] } }).type;

      // Check constructor parameters
      if (type && type.ctorParameters) {
        type.ctorParameters.forEach((param: unknown) => {
          const paramType = (param as { type?: { name?: string } }).type;
          if (paramType) {
            deps.push(paramType.name || 'Unknown');
          }
        });
      }

      return deps;
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze child components
   */
  private analyzeChildComponents(instance: unknown): void {
    // This is a simplified version - in a real implementation,
    // you'd need to traverse the component tree more thoroughly
    const childComponents = [];

    // Check for ViewChildren, ContentChildren, etc.
    if (instance && typeof instance === 'object' && instance !== null) {
      Object.keys(instance).forEach((key) => {
        const value = (instance as Record<string, unknown>)[key];
        if (value && typeof value === 'object' && value !== null) {
          const valueObj = value as { constructor?: { name?: string } };
          if (
            valueObj.constructor &&
            valueObj.constructor.name &&
            valueObj.constructor.name.includes('QueryList')
          ) {
            // This is likely a ViewChildren or ContentChildren
            console.log(`👶 Child Query found (QueryList)`);
          }
        }
      });
    }
  }

  getComponentTreeData(): { components: ComponentMetadata[] } {
    // Simplified implementation
    return { components: [] };
  }
}
