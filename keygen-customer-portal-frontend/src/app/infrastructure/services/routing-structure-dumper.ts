/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:57
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { IRoutingStructureDumper } from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class RoutingStructureDumperService implements IRoutingStructureDumper {
  constructor(private router: Router) {}

  /**
   * Dump routing structure
   */
  dumpRoutingStructure(): void {
    console.group('🛣️ Routing Structure');

    try {
      const routes = this.router.config;
      this.analyzeRoutes(routes, '', 0);
    } catch (error) {
      console.error('Error dumping routing structure:', error);
    }

    console.groupEnd();
  }

  /**
   * Analyze routes recursively
   */
  private analyzeRoutes(routes: Routes, parentPath = '', level = 0): void {
    const indent = '  '.repeat(level);

    routes.forEach((route) => {
      const fullPath = parentPath + (route.path || '');
      const routeType = route.component
        ? 'Component'
        : route.loadComponent
          ? 'Lazy Component'
          : route.loadChildren
            ? 'Lazy Module'
            : route.redirectTo
              ? 'Redirect'
              : 'Unknown';

      console.log(`${indent}🛤️ ${fullPath || '/'} (${routeType})`);

      if (route.component) {
        console.log(`${indent}   📦 Component: ${route.component.name}`);
      }

      if (route.canActivate) {
        console.log(
          `${indent}   🛡️ Guards: ${route.canActivate.map((g) => (typeof g === 'function' ? g.name : typeof g === 'string' ? g : 'Unknown')).join(', ')}`
        );
      }

      if (route.children) {
        this.analyzeRoutes(route.children, fullPath + '/', level + 1);
      }
    });
  }

  getRoutingStructureData(): Routes {
    return this.router.config;
  }
}
